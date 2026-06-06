#!/usr/bin/env node
/**
 * cleanup.js — deletes expired transcripts and attachments from disk and DB.
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
