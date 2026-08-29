import { NextResponse } from 'next/server';
import type Stripe      from 'stripe';
import type { ResultSetHeader } from 'mysql2';
import { queryOne, withTransaction } from '@/lib/db';
import {
  getStripe, resolveTierFromPrice, isActiveSubStatus,
  priceIdFromSubscription, periodEndFromSubscription,
  hasPaymentMethod, formatSubscriptionPrice,
} from '@/lib/stripe';
import { sendMail } from '@/lib/mail';
import { buildTrialEndingEmail, pickMailLang } from '@/lib/emails/trialEnding';
import { archiveHostedBot } from '@/lib/hostedBot';
import { teardownCustomDomain } from '@/lib/customDomain';
import { trustedGuildId }       from '@/lib/guildScope';
import { TIER_CONFIG, type Tier } from '@/lib/tiers';

// ── Stripe Webhook ───────────────────────────────────────────────────────────
//
// Configure in Stripe → Developers → Webhooks → https://www.msk-scripts.de/api/webhook/stripe
// Events: checkout.session.completed, customer.subscription.created/updated/deleted,
//         customer.subscription.trial_will_end,
//         invoice.payment_succeeded, invoice.payment_failed
// Secret → STRIPE_WEBHOOK_SECRET
//
// All handlers are idempotent ("set state to X", never incremental) because Stripe
// may deliver an event more than once.

interface GuildIdRow { guild_id: string }
interface GuildNameRow { guild_name: string | null }

/**
 * Resolve the subscription id referenced by an invoice. Its location differs
 * across Stripe API versions (top-level `subscription` vs. nested
 * `parent.subscription_details.subscription`), so check both defensively.
 */
function resolveInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = (invoice as unknown as { subscription?: unknown }).subscription;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'id' in raw) return (raw as { id: string }).id;
  const parent = (invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string | { id: string } } };
  }).parent;
  const sub = parent?.subscription_details?.subscription;
  if (typeof sub === 'string') return sub;
  if (sub && typeof sub === 'object' && 'id' in sub) return sub.id;
  return null;
}

/** Upsert the person ⇄ Stripe customer mapping and (optionally) mark the trial as used. */
async function upsertCustomer(
  conn: Parameters<Parameters<typeof withTransaction>[0]>[0],
  discordUserId: string | null | undefined,
  customerId:    string | null | undefined,
  markTrialUsed: boolean,
): Promise<void> {
  if (!discordUserId || !customerId) return;
  await conn.execute(
    `INSERT INTO ticketbot_customers (discord_user_id, stripe_customer_id, trial_used)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       stripe_customer_id = VALUES(stripe_customer_id),
       trial_used         = GREATEST(trial_used, VALUES(trial_used))`,
    [discordUserId, customerId, markTrialUsed ? 1 : 0],
  );
}

/**
 * Apply a subscription's current state to its guild. Grants the paid tier while
 * the subscription is active/trialing, and downgrades to basic (archiving any
 * hosted bot) once it reaches a terminal/non-paying state.
 */
async function applySubscription(sub: Stripe.Subscription): Promise<void> {
  const guildId       = sub.metadata?.guild_id;
  const discordUserId = sub.metadata?.discord_user_id;
  if (!guildId) {
    console.warn('[stripe] subscription without guild_id metadata:', sub.id);
    return;
  }

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;

  if (isActiveSubStatus(sub.status)) {
    const tier: Tier   = resolveTierFromPrice(priceIdFromSubscription(sub));
    const periodEndSec = periodEndFromSubscription(sub);
    const expiresAt    = periodEndSec ? new Date(periodEndSec * 1000) : null;

    await withTransaction(async (conn) => {
      await upsertCustomer(conn, discordUserId, customerId, true);
      await conn.execute(
        `UPDATE ticketbot_guilds
            SET tier = ?, active = TRUE, expires_at = ?,
                stripe_subscription_id = ?, stripe_customer_id = ?,
                stripe_status = ?
          WHERE guild_id = ?`,
        [tier, expiresAt, sub.id, customerId, sub.status, guildId],
      );
    });
    console.info(`[stripe] guild ${guildId} → ${tier} (status ${sub.status})`);
    return;
  }

  // Terminal / non-paying status → downgrade.
  await downgradeGuild(guildId);
}

/**
 * Three days before a trial ends, Stripe fires `customer.subscription.trial_will_end`.
 * Since the checkout stopped asking for a card, that is the moment the customer
 * has to be told: without a payment method the subscription does not convert, it
 * simply stops. The dashboard says the same, but nobody has to open it.
 *
 * Sending a mail is the one thing in this webhook that cannot be made idempotent
 * by "set state to X", so the DB column doubles as a lock: whoever flips
 * trial_reminder_sent_at from NULL sends, everyone else returns.
 */
async function handleTrialWillEnd(sub: Stripe.Subscription): Promise<void> {
  const guildId = sub.metadata?.guild_id;
  if (!guildId) {
    console.warn('[stripe] trial_will_end without guild_id metadata:', sub.id);
    return;
  }

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;
  if (!customerId) {
    console.warn('[stripe] trial_will_end without customer:', sub.id);
    return;
  }

  const customer = await getStripe().customers.retrieve(customerId);

  // A payment method is on file → the subscription converts on its own and a
  // "you are about to lose Premium" mail would simply be wrong.
  if (hasPaymentMethod(sub, customer)) return;

  if (customer.deleted) return;
  const to = customer.email;
  if (!to) {
    console.warn(`[stripe] trial ending for guild ${guildId} but the customer has no email.`);
    return;
  }

  // Claim the send. affectedRows === 0 means a redelivery of the same event (or a
  // parallel one) already sent it.
  const claimed = await withTransaction(async (conn) => {
    const [res] = await conn.execute(
      `UPDATE ticketbot_guilds
          SET trial_reminder_sent_at = NOW()
        WHERE guild_id = ? AND trial_reminder_sent_at IS NULL`,
      [guildId],
    );
    return (res as ResultSetHeader).affectedRows > 0;
  });
  if (!claimed) return;

  const lang        = pickMailLang(customer.preferred_locales);
  const row         = await queryOne<GuildNameRow>(
    'SELECT guild_name FROM ticketbot_guilds WHERE guild_id = ?',
    [guildId],
  );
  const trialEndSec = sub.trial_end ?? periodEndFromSubscription(sub);
  const mail = buildTrialEndingEmail({
    lang,
    guildLabel:  row?.guild_name || guildId,
    trialEndsAt: new Date((trialEndSec ?? Math.floor(Date.now() / 1000)) * 1000),
    price:       formatSubscriptionPrice(sub, lang),
  });

  try {
    const sent = await sendMail({ to, ...mail });
    if (!sent) {
      // Mail is not configured at all. Keep the lock set: retrying costs a Stripe
      // redelivery for something that cannot succeed until someone adds SMTP
      // credentials, and the dashboard notice still covers the customer.
      console.warn(`[stripe] trial reminder for guild ${guildId} not sent, SMTP unconfigured.`);
      return;
    }
    console.info(`[stripe] trial reminder sent for guild ${guildId} (${lang}).`);
  } catch (err) {
    // Release the lock and let the 500 below make Stripe retry. A second attempt
    // is worth more than a reminder silently lost to a temporary SMTP failure.
    await withTransaction(async (conn) => {
      await conn.execute(
        'UPDATE ticketbot_guilds SET trial_reminder_sent_at = NULL WHERE guild_id = ?',
        [guildId],
      );
    });
    throw err;
  }
}

/** Downgrade a guild to basic and archive its hosted bot (if any). */
async function downgradeGuild(guildId: string): Promise<void> {
  // basicDays is a hard-coded number from our own config, safe to inline.
  const basicDays = TIER_CONFIG.basic.storageDays;
  await withTransaction(async (conn) => {
    await conn.execute(
      `UPDATE ticketbot_guilds
          SET tier = 'basic', expires_at = NULL, stripe_subscription_id = NULL,
              stripe_status = NULL, trial_reminder_sent_at = NULL
        WHERE guild_id = ?`,
      [guildId],
    );
    // Clamp existing transcripts so paid-tier retention (e.g. 180d) never
    // outlives the paid membership, but grant a basic-length grace period from
    // the downgrade instant (NOW() + basic days), not from upload — so a customer
    // never loses transcripts the moment they cancel. LEAST() only ever shortens.
    await conn.execute(
      `UPDATE ticketbot_transcripts
          SET expires_at = LEAST(expires_at, NOW() + INTERVAL ${basicDays} DAY)
        WHERE guild_id = ?`,
      [guildId],
    );
  });
  console.info(`[stripe] guild ${guildId} → basic (subscription ended)`);
  // Reclaim premium-only resources: stop the hosted bot and tear down the custom
  // domain vhost/cert (custom_domain is kept but demoted to pending_dns so a later
  // re-subscribe restores it). Both are best-effort and never throw.
  // Die Id stammt aus `metadata.guild_id` eines Events, dessen Signatur gegen
  // STRIPE_WEBHOOK_SECRET geprueft wurde. Es gibt hier keine Nutzersession,
  // also wird die Herkunft explizit benannt statt stillschweigend angenommen.
  const scoped = trustedGuildId(guildId, 'stripe-webhook');
  await archiveHostedBot(scoped);
  await teardownCustomDomain(scoped);
}

export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  // Raw body is required for signature verification — read before any parsing.
  const rawBody   = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(rawBody, signature, secret);
  } catch (err) {
    console.warn('[stripe] Invalid webhook signature:', String(err));
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Map the person ⇄ customer + consume the trial eligibility.
        const customerId    = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        const discordUserId = session.metadata?.discord_user_id;
        await withTransaction(async (conn) => {
          await upsertCustomer(conn, discordUserId, customerId, true);
        });
        // Apply the subscription state immediately (don't wait for the separate event).
        if (typeof session.subscription === 'string') {
          const sub = await getStripe().subscriptions.retrieve(session.subscription);
          await applySubscription(sub);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub     = event.data.object as Stripe.Subscription;
        const guildId = sub.metadata?.guild_id;
        if (guildId) {
          await downgradeGuild(guildId);
        } else {
          // Fallback: locate the guild by its stored subscription id.
          const row = await queryOne<GuildIdRow>(
            'SELECT guild_id FROM ticketbot_guilds WHERE stripe_subscription_id = ?',
            [sub.id],
          );
          if (row) await downgradeGuild(row.guild_id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Renewal — roll the guild's expiry forward to the new period end. The
        // subscription reference lives in different places across Stripe API
        // versions, so resolve it defensively.
        const invoice = event.data.object as Stripe.Invoice;
        const subId   = resolveInvoiceSubscriptionId(invoice);
        if (subId) {
          const sub = await getStripe().subscriptions.retrieve(subId);
          await applySubscription(sub);
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Leave dunning to Stripe; the subscription will eventually move to a
        // terminal status and trigger a downgrade. Just log here.
        console.warn('[stripe] invoice.payment_failed:', (event.data.object as Stripe.Invoice).id);
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error('[stripe] Failed to process webhook:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
