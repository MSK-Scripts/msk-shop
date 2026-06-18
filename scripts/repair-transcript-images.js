#!/usr/bin/env node
/**
 * repair-transcript-images.js — one-off repair for already-stored transcripts.
 *
 * Background: older transcripts embedded message image/file attachments using the
 * raw Discord CDN URL (cdn.discordapp.com/attachments/…). Those URLs are signed
 * and expire ~24h after generation, so every such image is now broken. The bot
 * already uploaded a permanent copy of each attachment to this server
 * (attachments/<uuid>.<ext>), it was just never referenced by the HTML.
 *
 * This script rewrites the stored transcript.html files: it replaces every dead
 * Discord CDN attachment URL with the matching local copy, addressed by a RELATIVE
 * path (attachments/<uuid>.<ext>) so it resolves under both a custom domain and
 * the main site.
 *
 * Mapping: old transcripts don't store the Discord attachment id, so files are
 * matched by ORIGINAL FILENAME (present both in the Discord URL and in
 * ticketbot_attachments.original_name). Unique names → exact. Several files
 * sharing a name within one transcript (e.g. multiple "image.png") → matched
 * positionally in document order (best effort; logged as ambiguous).
 *
 * SAFE BY DEFAULT: dry-run unless --apply is passed. The rewrite is idempotent
 * (it only touches cdn.discordapp.com/media.discordapp.net attachment URLs that
 * map to a stored file), so re-running causes no further changes.
 *
 * Deployed with the repo at /opt/msk-shop/scripts/. Reads DB_* from the env but
 * does NOT load dotenv and requires mysql2 — run it like cleanup.js:
 *
 *   set -a; . /opt/msk-shop/.env.local; set +a; \
 *     NODE_PATH=/opt/msk-shop/node_modules /usr/bin/node \
 *     /opt/msk-shop/scripts/repair-transcript-images.js            # dry-run
 *
 *   …same… /opt/msk-shop/scripts/repair-transcript-images.js --apply   # write
 *
 * Recommended: snapshot the transcripts dir first, e.g.
 *   tar czf /root/transcripts-backup-$(date +%F).tgz -C /var/www/html transcripts
 *
 * Flags:
 *   --apply           actually write the files (default: dry-run, no writes)
 *   --guild <id>      only process transcripts of this guild_id
 *   --limit <n>       process at most n transcripts (useful for a test run)
 */

const { readFile, writeFile } = require('fs/promises');
const path  = require('path');
const mysql = require('mysql2/promise');

// Discord attachment URLs as embedded in the transcript HTML (raw, inside a
// src="" / href="" attribute). Both CDN hosts are matched defensively.
const DISCORD_URL_RE =
  /(["'])(https:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/attachments\/\d+\/\d+\/[^"']+)\1/g;

function parseArgs(argv) {
  const args = { apply: false, guild: null, limit: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply')      args.apply = true;
    else if (a === '--guild') args.guild = argv[++i] ?? null;
    else if (a === '--limit') args.limit = Number(argv[++i] ?? '') || null;
  }
  return args;
}

/** Filename segment of a Discord attachment URL, query stripped + percent-decoded. */
function filenameFromUrl(url) {
  const noQuery = url.split('?')[0];
  const last    = noQuery.substring(noQuery.lastIndexOf('/') + 1);
  try { return decodeURIComponent(last); } catch { return last; }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.apply ? 'APPLY' : 'DRY-RUN';

  const pool = mysql.createPool({
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER     ?? '',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME     ?? '',
  });

  console.log(`[repair] Starting (${mode}) at ${new Date().toISOString()}`);

  const where  = ['has_attachments = 1'];
  const params = [];
  if (args.guild) { where.push('guild_id = ?'); params.push(args.guild); }
  let sql = `SELECT id, file_path FROM ticketbot_transcripts WHERE ${where.join(' AND ')} ORDER BY created_at ASC`;
  if (args.limit) sql += ` LIMIT ${args.limit}`;

  const [transcripts] = await pool.execute(sql, params);
  console.log(`[repair] ${transcripts.length} transcript(s) with attachments to inspect`);

  let filesChanged = 0, urlsReplaced = 0, urlsUnmatched = 0, ambiguous = 0, errors = 0;

  for (const t of transcripts) {
    try {
      const [atts] = await pool.execute(
        `SELECT original_name, file_path FROM ticketbot_attachments WHERE transcript_id = ?`,
        [t.id],
      );
      if (atts.length === 0) continue;

      // Group local copies by original filename → list of relative URLs.
      const groups = new Map();   // name → ["attachments/<uuid>.<ext>", …]
      for (const a of atts) {
        const rel = `attachments/${path.basename(a.file_path)}`;
        if (!groups.has(a.original_name)) groups.set(a.original_name, []);
        groups.get(a.original_name).push(rel);
      }

      let html;
      try {
        html = await readFile(t.file_path, 'utf-8');
      } catch (err) {
        console.warn(`[repair] ${t.id}: cannot read ${t.file_path} (${err.code || err.message}) — skipped`);
        errors++;
        continue;
      }

      const cursor = new Map();   // name → next index into its group
      let replacedHere = 0, unmatchedHere = 0;

      const out = html.replace(DISCORD_URL_RE, (full, quote, url) => {
        const name = filenameFromUrl(url);
        const list = groups.get(name);
        const idx  = cursor.get(name) ?? 0;
        if (list && idx < list.length) {
          cursor.set(name, idx + 1);
          replacedHere++;
          return `${quote}${list[idx]}${quote}`;
        }
        unmatchedHere++;
        return full;   // no stored copy for this name → leave the (dead) link
      });

      // Flag transcripts where a name maps to >1 local file (positional guess).
      for (const [, list] of groups) if (list.length > 1) { ambiguous++; break; }

      urlsReplaced  += replacedHere;
      urlsUnmatched += unmatchedHere;

      if (out !== html) {
        filesChanged++;
        if (args.apply) {
          await writeFile(t.file_path, out, 'utf-8');
          console.log(`[repair] ${t.id}: replaced ${replacedHere} link(s)` + (unmatchedHere ? `, ${unmatchedHere} unmatched` : ''));
        } else {
          console.log(`[repair] ${t.id}: WOULD replace ${replacedHere} link(s)` + (unmatchedHere ? `, ${unmatchedHere} unmatched` : ''));
        }
      } else if (unmatchedHere) {
        console.log(`[repair] ${t.id}: 0 replaced, ${unmatchedHere} Discord link(s) without a stored copy`);
      }
    } catch (err) {
      console.error(`[repair] ${t.id}: error — ${err.message}`);
      errors++;
    }
  }

  await pool.end();
  console.log(
    `[repair] Done (${mode}). Files ${args.apply ? 'changed' : 'to change'}: ${filesChanged}, ` +
    `links replaced: ${urlsReplaced}, unmatched: ${urlsUnmatched}, ` +
    `transcripts with duplicate-name guesses: ${ambiguous}, errors: ${errors}`,
  );
  if (!args.apply && filesChanged > 0) {
    console.log('[repair] This was a DRY-RUN — re-run with --apply to write the changes.');
  }
}

main().catch(err => {
  console.error('[repair] Fatal error:', err);
  process.exit(1);
});
