#!/usr/bin/env node
/**
 * cleanup.js — daily housekeeping:
 *   1. deletes expired transcripts and attachments from disk and DB,
 *   2. auto-downgrades guilds whose paid membership has lapsed (expires_at in
 *      the past and no active premium sponsor backing them),
 *   3. prunes stale rate-limit rows.
 *
 * Deployed with the repo at /opt/msk-shop/scripts/cleanup.js and run daily via
 * a root cron.
 *
 * It reads DB_* from the environment but does NOT load dotenv itself, and it
 * requires mysql2 — so the cron must source .env.local and point NODE_PATH at
 * the app's node_modules:
 *
 *   0 3 * * * set -a; . /opt/msk-shop/.env.local; set +a; \
 *     NODE_PATH=/opt/msk-shop/node_modules /usr/bin/node /opt/msk-shop/scripts/cleanup.js \
 *     >> /var/log/msk-cleanup.log 2>&1
 */

const { rm } = require('fs/promises');
const mysql  = require('mysql2/promise');

// Basic-tier transcript retention in days. Keep in sync with
// lib/tiers.ts → TIER_CONFIG.basic.storageDays (this script is plain JS run via
// cron and cannot import the TS module).
const BASIC_STORAGE_DAYS = 30;

async function main() {
  const pool = mysql.createPool({
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER     ?? '',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME     ?? '',
  });

  console.log(`[cleanup] Starting at ${new Date().toISOString()}`);

  // Find all expired transcripts
  const [rows] = await pool.execute(
    `SELECT id, file_path FROM ticketbot_transcripts WHERE expires_at < NOW()`
  );

  console.log(`[cleanup] Found ${rows.length} expired transcript(s)`);

  let deleted = 0;
  let errors  = 0;

  for (const row of rows) {
    try {
      // Delete the entire transcript directory (includes attachments subfolder)
      const dir = require('path').dirname(row.file_path);
      await rm(dir, { recursive: true, force: true });

      // Delete DB records (attachments cascade via FK)
      await pool.execute(
        `DELETE FROM ticketbot_transcripts WHERE id = ?`, [row.id]
      );

      deleted++;
    } catch (err) {
      console.error(`[cleanup] Failed to delete transcript ${row.id}:`, err.message);
      errors++;
    }
  }

  // ── Enforce membership expiry (auto-downgrade) ───────────────────────────────
  // Time-based safety net for lapsed paid memberships. Stripe subscriptions are
  // primarily kept in sync by the webhook (+ stripe-reconcile.js); this only
  // catches guilds that have NO Stripe subscription on file yet still carry a
  // paid tier with a past expiry. A guild is downgraded only when ALL hold:
  //   • tier is not basic, AND
  //   • expires_at is in the past (NULL never counts as expired — the
  //     "freshly verified / basic" state), AND
  //   • there is no Stripe subscription bound to it (stripe_subscription_id IS
  //     NULL) — guilds WITH a subscription are owned by the webhook/reconcile and
  //     left untouched here so a missed webhook can never wrongly downgrade a
  //     paying customer.
  // Hosted bots are only flagged here — never auto-archived.
  const EXPIRED_GUILD_PREDICATE = `
    g.tier <> 'basic'
    AND g.expires_at IS NOT NULL
    AND g.expires_at < NOW()
    AND g.stripe_subscription_id IS NULL`;

  const [expiredGuilds] = await pool.execute(
    `SELECT g.guild_id, g.is_hosted, g.tier
       FROM ticketbot_guilds g
      WHERE ${EXPIRED_GUILD_PREDICATE}`
  );

  if (expiredGuilds.length > 0) {
    await pool.execute(
      `UPDATE ticketbot_guilds g
          SET g.tier = 'basic', g.expires_at = NULL
        WHERE ${EXPIRED_GUILD_PREDICATE}`
    );
    // Clamp the downgraded guilds' existing transcripts so paid-tier retention
    // never outlives the lapsed membership, granting a basic-length grace period
    // from the downgrade instant (NOW() + basic days), not from upload. LEAST()
    // only ever shortens; rows past the new expiry are removed on the next run.
    const ids          = expiredGuilds.map(g => g.guild_id);
    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(
      `UPDATE ticketbot_transcripts
          SET expires_at = LEAST(expires_at, NOW() + INTERVAL ${BASIC_STORAGE_DAYS} DAY)
        WHERE guild_id IN (${placeholders})`,
      ids,
    );
    for (const g of expiredGuilds) {
      console.log(`[cleanup] Membership expired → downgraded guild ${g.guild_id} (${g.tier} → basic)`);
      if (g.is_hosted) {
        console.warn(`[cleanup] ⚠ guild ${g.guild_id} is still HOSTED after downgrade — archive it manually or via the cancel webhook.`);
      }
    }
  }
  console.log(`[cleanup] Expired memberships downgraded: ${expiredGuilds.length}`);

  // Clean up old rate limit entries
  await pool.execute(
    `DELETE FROM ticketbot_rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 2 HOUR)`
  );

  await pool.end();
  console.log(`[cleanup] Done. Deleted: ${deleted}, Errors: ${errors}`);
}

main().catch(err => {
  console.error('[cleanup] Fatal error:', err);
  process.exit(1);
});
