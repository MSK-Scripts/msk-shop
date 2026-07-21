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

const { rm, readdir, stat } = require('fs/promises');
const { execFile }          = require('child_process');
const { promisify }         = require('util');
const path                  = require('path');
const mysql                 = require('mysql2/promise');

const execFileAsync = promisify(execFile);

// Basic-tier transcript retention in days. Keep in sync with
// lib/tiers.ts → TIER_CONFIG.basic.storageDays (this script is plain JS run via
// cron and cannot import the TS module). tests/basicStorageDays.test.ts guards
// against drift.
const BASIC_STORAGE_DAYS = 30;

// Archived hosted-bot directories (<guildId>_archived_<ts>) are hard-deleted
// after this many days. The Stripe cancel webhook only RENAMES the dir (keeping
// its .env secrets + ticket PII on disk); the privacy policy promises deletion
// within 14 days of cancellation, so this cron enforces it.
const ARCHIVE_MAX_AGE_DAYS = 14;

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
    `SELECT g.guild_id, g.is_hosted, g.tier, g.custom_domain, g.domain_status
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
        // Hosted-bot teardown (PM2 stop + dir archive) stays in the webhook: it
        // runs as the app user that owns the PM2 daemon, which this root cron
        // cannot manage. Flag it loudly so it can be reconciled.
        console.warn(`[cleanup] ⚠ guild ${g.guild_id} is still HOSTED after downgrade — archive it manually or via the cancel webhook.`);
      }
    }

    // Reclaim premium-only custom domains: tear down the vhost for any that were
    // active, then demote status to pending_dns (keep custom_domain so a later
    // re-subscribe restores it; the /api/domain/validate tier gate blocks any
    // re-activation while the guild is basic). Best-effort — never abort cleanup.
    for (const g of expiredGuilds) {
      if (g.domain_status === 'active' && g.custom_domain) {
        try {
          await execFileAsync('/opt/msk-shop/scripts/vhost-delete.sh', [g.custom_domain]);
          console.log(`[cleanup] Tore down custom domain vhost for guild ${g.guild_id} (${g.custom_domain})`);
        } catch (err) {
          console.error(`[cleanup] vhost teardown failed for guild ${g.guild_id}:`, err.message);
        }
      }
    }
    await pool.execute(
      `UPDATE ticketbot_guilds SET domain_status = 'pending_dns'
        WHERE guild_id IN (${placeholders}) AND custom_domain IS NOT NULL AND domain_status = 'active'`,
      ids,
    );
  }
  console.log(`[cleanup] Expired memberships downgraded: ${expiredGuilds.length}`);

  // Clean up old rate limit entries
  await pool.execute(
    `DELETE FROM ticketbot_rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 2 HOUR)`
  );

  // ── Purge archived hosted-bot directories past retention ─────────────────────
  // The Stripe cancel webhook renames a hosted bot's dir to <guildId>_archived_<ts>
  // (its .env secrets + ticket PII stay on disk). Hard-delete those once they are
  // older than ARCHIVE_MAX_AGE_DAYS so we honor the privacy policy's 14-day promise.
  const botBase = process.env.BOT_CONFIG_BASE_PATH;
  if (botBase) {
    let purged = 0;
    try {
      const entries = await readdir(botBase, { withFileTypes: true });
      const cutoff  = Date.now() - ARCHIVE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      for (const e of entries) {
        if (!e.isDirectory() || !e.name.includes('_archived_')) continue;
        const full = path.join(botBase, e.name);
        try {
          const st = await stat(full);
          if (st.mtimeMs < cutoff) {
            await rm(full, { recursive: true, force: true });
            purged++;
            console.log(`[cleanup] Purged archived bot dir: ${e.name}`);
          }
        } catch (err) {
          console.error(`[cleanup] Failed to purge ${e.name}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[cleanup] Could not scan BOT_CONFIG_BASE_PATH for archives:', err.message);
    }
    console.log(`[cleanup] Archived bot dirs purged: ${purged}`);
  }

  await pool.end();
  console.log(`[cleanup] Done. Deleted: ${deleted}, Errors: ${errors}`);
}

main().catch(err => {
  console.error('[cleanup] Fatal error:', err);
  process.exit(1);
});
