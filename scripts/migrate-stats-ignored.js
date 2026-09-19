#!/usr/bin/env node
/**
 * One-off: carry STATS_IGNORED_API_KEYS into ticketbot_guilds.stats_excluded.
 *
 * Until 19.09.2026 the keys excluded from the public figures lived in an env
 * variable, which meant a deploy to change them. They now live in a column
 * that the admin dashboard edits. Migration 002 adds the column with a default
 * of "counted", so without this script every previously hidden key reappears
 * on /ticketbot/stats at the next deploy.
 *
 * Migration 002 deliberately does not do this itself: `deploy.sh` runs the SQL
 * as root over the unix socket and never sources the application env, so the
 * list is simply not visible from there.
 *
 * Run once, after the deploy, on the server:
 *
 *   set -a; . /opt/msk-shop/.env.local; set +a; \
 *     NODE_PATH=/opt/msk-shop/node_modules /usr/bin/node \
 *     /opt/msk-shop/scripts/migrate-stats-ignored.js --apply
 *
 * Without --apply it only reports what it would do. Safe to run twice: the
 * UPDATE is idempotent, and a key that is already excluded is left alone.
 *
 * Afterwards the env variable can go. Nothing reads it any more.
 */

const mysql = require('mysql2/promise');

const APPLY = process.argv.includes('--apply');

function parseKeys() {
  return [...new Set(
    (process.env.STATS_IGNORED_API_KEYS ?? '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean),
  )];
}

async function main() {
  const keys = parseKeys();

  if (keys.length === 0) {
    console.log('[migrate-stats-ignored] STATS_IGNORED_API_KEYS is empty or unset, nothing to do.');
    return;
  }
  console.log(`[migrate-stats-ignored] ${keys.length} key(s) in the env list${APPLY ? '' : ' (DRY RUN)'}`);

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST ?? 'localhost',
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const placeholders = keys.map(() => '?').join(', ');
    const [rows] = await conn.execute(
      `SELECT guild_id, guild_name, api_key, stats_excluded
         FROM ticketbot_guilds
        WHERE api_key IN (${placeholders})`,
      keys,
    );

    // A key in the env list that matches no row is worth saying out loud: it is
    // either a typo or a guild that has since been deleted, and silently
    // ignoring it is how a test server ends up in the public figures.
    const found = new Set(rows.map(r => r.api_key));
    for (const key of keys) {
      if (!found.has(key)) {
        console.warn(`[migrate-stats-ignored] ⚠ no guild for key ending in …${key.slice(-6)}, skipping`);
      }
    }

    for (const row of rows) {
      const already = row.stats_excluded === 1;
      console.log(`  ${already ? 'already excluded' : 'will exclude    '}  ${row.guild_id}  ${row.guild_name ?? '(no name)'}`);
    }

    if (!APPLY) {
      console.log('[migrate-stats-ignored] Dry run, nothing written. Re-run with --apply.');
      return;
    }

    const [result] = await conn.execute(
      `UPDATE ticketbot_guilds
          SET stats_excluded = 1
        WHERE api_key IN (${placeholders})
          AND stats_excluded = 0`,
      keys,
    );
    console.log(`[migrate-stats-ignored] ${result.affectedRows} row(s) updated.`);
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('[migrate-stats-ignored] failed:', err);
  process.exit(1);
});
