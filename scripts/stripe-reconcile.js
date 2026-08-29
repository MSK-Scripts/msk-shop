#!/usr/bin/env node
/**
 * stripe-reconcile.js — keeps ticketbot_guilds in sync with the *current* state
 * of Stripe subscriptions.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Stripe webhook (/api/webhook/stripe) is the primary path and fires on every
 * relevant change (incl. monthly renewals via invoice.payment_succeeded). This
 * script is a SAFETY NET that catches missed/most webhooks by reconciling against
 * the Stripe API (the source of truth):
 *   • Active/trialing subscription → guild tier + expires_at + stripe ids refreshed,
 *                                    customer mapping upserted.
 *   • A guild bound to a subscription that is no longer active (terminal status or
 *     gone from Stripe) → downgraded to basic, subscription id cleared.
 *
 * It is precise (never a blanket mass-downgrade): a guild is only downgraded when
 * ITS specific subscription id is confirmed non-active in the data fetched from
 * Stripe. Any Stripe API failure aborts the run WITHOUT touching the DB.
 *
 * Hosted bots are NOT auto-archived here (that destructive PM2/FS work stays in
 * the webhook) — a downgrade of an is_hosted guild is logged loudly instead.
 *
 * DEPLOYMENT (same pattern as cleanup.js)
 * ---------------------------------------
 * Deployed with the repo at /opt/msk-shop/scripts/stripe-reconcile.js. Reads its
 * config from the environment but does NOT load dotenv itself, and it requires
 * mysql2 + stripe — so the cron must source .env.local and point NODE_PATH at the
 * app's node_modules.
 *
 *   0 4 * * * set -a; . /opt/msk-shop/.env.local; set +a; \
 *     NODE_PATH=/opt/msk-shop/node_modules /usr/bin/node \
 *     /opt/msk-shop/scripts/stripe-reconcile.js \
 *     >> /var/log/msk-stripe-reconcile.log 2>&1
 *
 * Required env: STRIPE_SECRET_KEY, STRIPE_PRICE_PREMIUM, STRIPE_PRICE_PREMIUM_PLUS.
 * Flags: --dry-run   log intended changes without writing to the DB.
 */

const mysql         = require('mysql2/promise');
const { execFile }  = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const DRY_RUN    = process.argv.includes('--dry-run');
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const PRICE_PREMIUM      = process.env.STRIPE_PRICE_PREMIUM;
const PRICE_PREMIUM_PLUS = process.env.STRIPE_PRICE_PREMIUM_PLUS;

/** Map a Stripe price id → internal tier. Mirrors lib/stripe.ts. */
function resolveTierFromPrice(priceId) {
  if (priceId && priceId === PRICE_PREMIUM)      return 'premium';
  if (priceId && priceId === PRICE_PREMIUM_PLUS) return 'premium_plus';
  return 'basic';
}

function isActiveStatus(status) {
  return status === 'active' || status === 'trialing';
}

async function main() {
  console.log(`[stripe-reconcile] Starting at ${new Date().toISOString()}${DRY_RUN ? ' (DRY RUN)' : ''}`);

  if (!STRIPE_KEY) {
    console.error('[stripe-reconcile] STRIPE_SECRET_KEY is not set — aborting without DB changes.');
    process.exit(1);
  }

  const stripe = require('stripe')(STRIPE_KEY);

  // 1. Source of truth — fetch ALL subscriptions BEFORE opening the DB so any
  //    Stripe failure means no writes. Build a map subId → details.
  const subsById = new Map();
  try {
    for await (const sub of stripe.subscriptions.list({ status: 'all', limit: 100 }).autoPagingEach()) {
      const item       = sub.items && sub.items.data && sub.items.data[0];
      const priceId    = item && item.price ? item.price.id : null;
      const periodEnd  = item ? item.current_period_end : null;
      const customerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer && sub.customer.id) || null;
      subsById.set(sub.id, {
        status:        sub.status,
        guildId:       sub.metadata && sub.metadata.guild_id,
        discordUserId: sub.metadata && sub.metadata.discord_user_id,
        tier:          resolveTierFromPrice(priceId),
        periodEnd,
        customerId,
      });
    }
  } catch (err) {
    console.error('[stripe-reconcile] Stripe API error — aborting without DB changes:', err.message ?? err);
    process.exit(1);
  }

  const activeSubs = [...subsById.entries()].filter(([, s]) => isActiveStatus(s.status));
  console.log(`[stripe-reconcile] Stripe reports ${subsById.size} subscription(s), ${activeSubs.length} active/trialing.`);

  const pool = mysql.createPool({
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER     ?? '',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME     ?? '',
  });

  let upserted   = 0;
  let downgraded = 0;

  try {
    // 2. Upsert every active/trialing subscription that is bound to a guild.
    for (const [subId, s] of activeSubs) {
      if (!s.guildId) continue;
      const expiresAt = s.periodEnd ? new Date(s.periodEnd * 1000) : null;

      if (DRY_RUN) {
        console.log(`[stripe-reconcile] would set guild ${s.guildId} → ${s.tier} (sub ${subId}, ${s.status})`);
      } else {
        if (s.discordUserId && s.customerId) {
          await pool.execute(
            `INSERT INTO ticketbot_customers (discord_user_id, stripe_customer_id, trial_used)
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE stripe_customer_id = VALUES(stripe_customer_id), trial_used = 1`,
            [s.discordUserId, s.customerId],
          );
        }
        await pool.execute(
          `UPDATE ticketbot_guilds
              SET tier = ?, active = TRUE, expires_at = ?,
                  stripe_subscription_id = ?, stripe_customer_id = ?,
                  stripe_status = ?
            WHERE guild_id = ?`,
          // stripe_status is carried here too. If a lost webhook left it at
          // 'trialing' after the trial had converted, the dashboard would keep
          // asking a paying customer for a payment method they long added.
          [s.tier, expiresAt, subId, s.customerId, s.status, s.guildId],
        );
      }
      upserted++;
    }

    // 3. Downgrade guilds bound to a subscription that is NOT active anymore.
    //    Precise per-subscription check → never a blanket mass-downgrade.
    const [boundGuilds] = await pool.execute(
      `SELECT guild_id, stripe_subscription_id, is_hosted, custom_domain, domain_status
         FROM ticketbot_guilds
        WHERE stripe_subscription_id IS NOT NULL AND tier <> 'basic'`,
    );

    for (const row of boundGuilds) {
      const subId = row.stripe_subscription_id;
      const sub   = subsById.get(subId);
      if (sub && isActiveStatus(sub.status)) continue; // still paying — leave alone

      if (DRY_RUN) {
        console.log(`[stripe-reconcile] would downgrade guild ${row.guild_id} → basic (sub ${subId} ${sub ? sub.status : 'missing'})`);
      } else {
        await pool.execute(
          `UPDATE ticketbot_guilds
              SET tier = 'basic', expires_at = NULL, stripe_subscription_id = NULL,
                  stripe_status = NULL, trial_reminder_sent_at = NULL
            WHERE guild_id = ?`,
          [row.guild_id],
        );
        // Reclaim the premium-only custom domain: tear down the active vhost and
        // demote status to pending_dns (keep custom_domain for a later re-sub;
        // the /api/domain/validate tier gate blocks re-activation while basic).
        if (row.domain_status === 'active' && row.custom_domain) {
          try {
            await execFileAsync('/opt/msk-shop/scripts/vhost-delete.sh', [row.custom_domain]);
            console.log(`[stripe-reconcile] Tore down custom domain vhost for guild ${row.guild_id} (${row.custom_domain})`);
          } catch (err) {
            console.error(`[stripe-reconcile] vhost teardown failed for guild ${row.guild_id}:`, err.message ?? err);
          }
          await pool.execute(
            `UPDATE ticketbot_guilds SET domain_status = 'pending_dns' WHERE guild_id = ?`,
            [row.guild_id],
          );
        }
      }
      downgraded++;
      console.log(`[stripe-reconcile] Downgraded guild ${row.guild_id} → basic (sub ${subId} ${sub ? sub.status : 'missing'}).`);

      if (row.is_hosted) {
        console.warn(`[stripe-reconcile] ⚠ guild ${row.guild_id} still HOSTED after downgrade — archive it manually or via the webhook.`);
      }
    }
  } finally {
    await pool.end();
  }

  console.log(`[stripe-reconcile] Done. Active upserted: ${upserted}, Downgraded: ${downgraded}${DRY_RUN ? ' (DRY RUN — no writes)' : ''}`);
}

main().catch(err => {
  console.error('[stripe-reconcile] Fatal error:', err.message ?? err);
  process.exit(1);
});
