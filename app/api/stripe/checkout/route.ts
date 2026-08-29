import { NextResponse }    from 'next/server';
import { authorizeGuild }  from '@/lib/dashboardAuth';
import { queryOne }        from '@/lib/db';
import { getStripe, priceIdForTier, TRIAL_DAYS } from '@/lib/stripe';

// ── Stripe Checkout ──────────────────────────────────────────────────────────
//
// Starts a subscription checkout for a specific guild. The purchase is bound to
// the guild via subscription metadata (guild_id); the resulting subscription /
// customer is written back to ticketbot_guilds by the Stripe webhook.
//
// Customer model: one Stripe customer per person (Discord user). If this person
// already has a customer (from an earlier purchase on any of their guilds), it is
// reused so name/address/email live in Stripe exactly once and all subscriptions
// sit under that one customer. Otherwise Stripe creates a new customer.
//
// Trial: 14 free days, but only for customers who never had a subscription
// (tracked via ticketbot_customers.trial_used — Stripe does not enforce this).

interface CustomerRow { stripe_customer_id: string; trial_used: number; }

export async function POST(req: Request): Promise<NextResponse> {
  // Parse body
  let guildId: string;
  let tier: string;
  try {
    const body = await req.json();
    guildId    = String(body.guildId ?? '').trim();
    tier       = String(body.tier ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Auth — the session's Discord user must own this guild
  const auth = await authorizeGuild(guildId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { discordUserId, guild } = auth;

  // Only the two paid tiers are purchasable
  if (tier !== 'premium' && tier !== 'premium_plus' && tier !== 'business') {
    return NextResponse.json({ error: 'Invalid tier.' }, { status: 400 });
  }

  const price = priceIdForTier(tier);
  if (!price) {
    console.error('[stripe/checkout] Price id not configured for tier', tier);
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 500 });
  }

  // One active subscription per guild. Without this, a double-click / two tabs
  // create two subscriptions both tagged with this guild_id; the webhook keeps
  // only the last one (last-writer-wins), so the other keeps billing invisibly.
  // If the guild already has a subscription on file that is still live, refuse a
  // second checkout and point the customer at the billing portal (for tier
  // changes / cancellation). A canceled/expired sub id is treated as stale and
  // does not block a fresh purchase.
  if (guild.stripe_subscription_id) {
    try {
      const existingSub = await getStripe().subscriptions.retrieve(guild.stripe_subscription_id);
      const LIVE = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];
      if (LIVE.includes(existingSub.status)) {
        return NextResponse.json(
          { error: 'This server already has a subscription. Manage or cancel it in the billing portal first.' },
          { status: 409 },
        );
      }
    } catch {
      // Subscription id not found in Stripe → stale reference, allow a fresh checkout.
    }
  }

  // Reuse an existing Stripe customer for this person (if any) + trial eligibility
  const customer = await queryOne<CustomerRow>(
    `SELECT stripe_customer_id, trial_used FROM ticketbot_customers WHERE discord_user_id = ?`,
    [discordUserId],
  );
  const trialEligible = !customer || customer.trial_used === 0;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';

  try {
    const stripe  = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode:        'subscription',
      line_items:  [{ price, quantity: 1 }],
      client_reference_id:        guildId,
      billing_address_collection: 'required',
      // No card for the free trial. `if_required` makes Stripe skip payment
      // details while the amount due today is 0. The address stays mandatory: it
      // costs far less friction than a card and keeps the first real invoice
      // legally complete.
      //
      // The price of dropping the card is that the trial can no longer convert
      // on its own, so it has to end cleanly instead of rolling into an invoice
      // nobody can pay. See `trial_settings` below.
      payment_method_collection: trialEligible ? 'if_required' : 'always',
      success_url: `${baseUrl}/ticketbot/dashboard?checkout=success`,
      cancel_url:  `${baseUrl}/ticketbot/dashboard?checkout=cancelled`,
      metadata:    { guild_id: guildId, discord_user_id: discordUserId },
      subscription_data: {
        metadata: { guild_id: guildId, discord_user_id: discordUserId },
        ...(trialEligible
          ? {
              trial_period_days: TRIAL_DAYS,
              // Trial over and still no payment method → cancel. The two other
              // options both end badly here: `create_invoice` produces an
              // invoice nobody agreed to pay (and Stripe dunning mails on top),
              // `pause` leaves a zombie subscription that the one-sub-per-guild
              // guard above would treat as live and that blocks a fresh
              // checkout forever. Cancelling fires
              // `customer.subscription.deleted`, which the webhook already
              // turns into a clean downgrade to basic.
              trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
            }
          : {}),
      },
      // Reuse the person's existing customer if we have one; otherwise Stripe
      // auto-creates a customer in subscription mode (customer_creation is only
      // valid in payment mode, so it must NOT be set here).
      ...(customer?.stripe_customer_id
        ? {
            customer:        customer.stripe_customer_id,
            customer_update: { address: 'auto', name: 'auto' },
          }
        : {}),
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Could not create checkout session.' }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/checkout] Failed to create session:', err);
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
  }
}
