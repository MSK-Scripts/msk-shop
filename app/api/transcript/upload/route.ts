import { NextResponse }               from 'next/server';
import { randomUUID }                  from 'crypto';
import { writeFile, mkdir, rm }        from 'fs/promises';
import path                            from 'path';
import sharp                           from 'sharp';
import { query, queryOne, withTransaction } from '@/lib/db';
import { TIER_CONFIG, getExpiresAt }   from '@/lib/tiers';
import type { Tier }                   from '@/lib/tiers';
import {
  UUID_RE, extractApiKey, safeAttachmentExt, isAllowedMime, IMAGE_EXTS,
} from '@/lib/transcriptGuards';

// ── Types ──────────────────────────────────────────────────────────────────────

interface GuildRow {
  guild_id:      string;
  tier:          Tier;
  active:        number;
  custom_domain: string | null;
  domain_status: string;
}

interface RateLimitRow {
  request_count: number;
}

interface RequestBody {
  ticketId:     number;
  transcriptHtml: string;
  attachments?: AttachmentInput[];
}

interface AttachmentInput {
  name:      string;   // original filename
  data:      string;   // base64-encoded file content
  mimeType:  string;
  id?:       string;   // optional bot-supplied UUID — lets the transcript HTML
                       // reference the stored file via a stable relative path
                       // (attachments/<id>.<ext>). Strictly validated below.
}

// ── Helpers ────────────────────────────────────────────────────────────────────
//
// The pure validation guards (UUID_RE, extractApiKey, safeAttachmentExt,
// isAllowedMime, IMAGE_EXTS) live in @/lib/transcriptGuards so they can be
// unit-tested independently of this route.

/** Validate that the guild was found and is active. */
function isValidGuild(guild: GuildRow | null): guild is GuildRow {
  return guild !== null && guild.active === 1;
}

/** Derive the base filesystem path where transcript files are stored. */
function transcriptBasePath(): string {
  return process.env.TRANSCRIPT_BASE_PATH ?? '/var/www/html/transcripts';
}

/**
 * Build the public URL prefix for a guild's transcript files.
 *
 * With an ACTIVE custom domain, the Apache vhost (vhost-create.sh) serves the
 * guild's transcript directory directly as its DocumentRoot, so files live at
 *   https://<custom_domain>/<transcriptId>/...
 * Without a custom domain they're served from the main site under
 *   <BASE_URL>/transcripts/<guild_id>/<transcriptId>/...
 * The returned prefix has NO trailing slash — callers append `/<transcriptId>/...`.
 */
function transcriptUrlPrefix(guild: GuildRow): string {
  if (guild.domain_status === 'active' && guild.custom_domain) {
    return `https://${guild.custom_domain}`;
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  return `${base}/transcripts/${guild.guild_id}`;
}

/** Enforce rate limiting – max N uploads per rolling 60-minute window per API key.
 *  Increments FIRST, then checks the window sum, so two concurrent uploads at the
 *  limit boundary cannot both read an under-limit count and both slip through
 *  (closes the check-then-act TOCTOU). The request that tips the window over is
 *  counted but rejected — the count self-heals as the window rolls forward. */
async function checkRateLimit(apiKey: string, maxPerHour: number): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - 60);

  // Record this request first (upsert into current minute bucket).
  const bucket = new Date();
  bucket.setSeconds(0, 0);
  await query(
    `INSERT INTO ticketbot_rate_limits (api_key, window_start, request_count)
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE request_count = request_count + 1`,
    [apiKey, bucket],
  );

  // Now read the window total INCLUDING this request. If it exceeds the cap,
  // reject — concurrent requests each increment before reading, so no batch of
  // parallel uploads can collectively overshoot the limit.
  const rows = await query<RateLimitRow>(
    `SELECT SUM(request_count) AS request_count
     FROM ticketbot_rate_limits
     WHERE api_key = ? AND window_start >= ?`,
    [apiKey, windowStart],
  );
  const count = Number(rows[0]?.request_count ?? 0);

  // Prune old buckets (keep DB clean).
  await query(
    `DELETE FROM ticketbot_rate_limits WHERE window_start < ?`,
    [windowStart],
  );

  return count <= maxPerHour;
}

/** Re-encode an image attachment. Throws if the bytes are not a decodable image
 *  → the caller rejects the upload. */
async function reencodeImage(ext: string, raw: Buffer): Promise<Buffer> {
  const animated = ext === 'gif' || ext === 'webp';
  const img = sharp(raw, { animated });
  switch (ext) {
    case 'png':  return img.png().toBuffer();
    case 'jpg':
    case 'jpeg':
    case 'jfif': return img.jpeg().toBuffer();   // .jfif is a JPEG under another name
    case 'webp': return img.webp().toBuffer();
    case 'gif':  return img.gif().toBuffer();
    default:     return raw;
  }
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // 1. Authenticate – API key from Authorization header
    const apiKey = extractApiKey(req.headers.get('authorization'));
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header.' }, { status: 401 });
    }

    // 2. Look up the guild – guild_id comes ONLY from DB, never from the request body
    const guild = await queryOne<GuildRow>(
      `SELECT guild_id, tier, active, custom_domain, domain_status FROM ticketbot_guilds WHERE api_key = ?`,
      [apiKey],
    );
    if (!isValidGuild(guild)) {
      return NextResponse.json({ error: 'Invalid API key or subscription inactive.' }, { status: 403 });
    }

    const tierCfg = TIER_CONFIG[guild.tier];

    // 3. Rate limiting
    const allowed = await checkRateLimit(apiKey, tierCfg.uploadsPerHour);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    // 4. Body-size ceiling BEFORE reading the body. This route is deliberately
    //    exempt from the proxy body cap (large Premium+ uploads), and an
    //    App Router handler has no default limit — so `await req.json()` would
    //    otherwise buffer an arbitrarily large body into the shared heap and let
    //    a single tenant OOM the whole process. Reject via Content-Length against
    //    this tier's own ceiling (transcript + attachments) with a generous
    //    margin for base64 (~1.34x) and JSON overhead.
    const maxBodyBytes = Math.ceil((tierCfg.transcriptMaxBytes + tierCfg.attachmentMaxBytes) * 1.4) + 1024 * 1024;
    const contentLength = Number(req.headers.get('content-length') ?? '');
    if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
      return NextResponse.json({ error: 'Payload too large for your tier.' }, { status: 413 });
    }

    // 5. Parse body
    let body: RequestBody;
    try {
      body = await req.json() as RequestBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { ticketId, transcriptHtml, attachments = [] } = body;

    if (typeof ticketId !== 'number' || typeof transcriptHtml !== 'string') {
      return NextResponse.json({ error: 'Missing required fields: ticketId, transcriptHtml.' }, { status: 400 });
    }

    // 5. Validate transcript size
    const htmlBytes = Buffer.byteLength(transcriptHtml, 'utf-8');
    if (htmlBytes > tierCfg.transcriptMaxBytes) {
      return NextResponse.json({
        error: `Transcript exceeds size limit for your tier (${tierCfg.transcriptMaxBytes / 1024 / 1024} MB).`,
      }, { status: 413 });
    }

    // 6. Validate attachments (premium only)
    if (attachments.length > 0 && !tierCfg.attachments) {
      return NextResponse.json({ error: 'Attachments require a Premium subscription.' }, { status: 403 });
    }

    let totalAttachmentBytes = 0;
    for (const att of attachments) {
      if (typeof att.data !== 'string' || typeof att.name !== 'string') {
        return NextResponse.json({ error: 'Invalid attachment format.' }, { status: 400 });
      }
      if (!isAllowedMime(att.mimeType ?? '')) {
        return NextResponse.json({ error: `Attachment type not allowed: ${att.mimeType}` }, { status: 400 });
      }
      // Allow-list the file EXTENSION (not just the client-supplied MIME, which is
      // a trivially-spoofable blocklist). This is the control that blocks
      // executable/active types (.php/.html/.svg/…) from reaching the web root.
      if (!safeAttachmentExt(att.name)) {
        return NextResponse.json({ error: `Attachment file type not allowed: ${path.extname(att.name) || '(none)'}` }, { status: 400 });
      }
      const sizeBytes = Math.ceil(att.data.length * 3 / 4); // approx. base64 decoded size
      totalAttachmentBytes += sizeBytes;
    }

    if (totalAttachmentBytes > tierCfg.attachmentMaxBytes) {
      return NextResponse.json({
        error: `Attachments exceed size limit for your tier (${tierCfg.attachmentMaxBytes / 1024 / 1024} MB).`,
      }, { status: 413 });
    }

    // 7. Prepare filesystem paths.
    //    Reuse the existing transcript for this ticket so re-closing it (e.g.
    //    after a reopen) REPLACES the transcript in place and keeps the SAME
    //    public URL, instead of accumulating a new transcript per close. Both
    //    ids come from our own DB / randomUUID() — never from the request — so
    //    the on-disk path stays fully server-controlled.
    const existing = await query<{ id: string }>(
      `SELECT id FROM ticketbot_transcripts WHERE guild_id = ? AND ticket_id = ? ORDER BY created_at DESC`,
      [guild.guild_id, ticketId],
    );
    const transcriptId    = existing[0]?.id ?? randomUUID();
    const urlPrefix       = transcriptUrlPrefix(guild);
    // turbopackIgnore: these paths are dynamic by design — the base directory
    // comes from TRANSCRIPT_BASE_PATH and points outside the repo
    // (/var/www/html/transcripts), the rest is the guild id plus a UUID from the
    // database. Without the hint Turbopack traces the entire project into the
    // build output. That output is unused here (no `output: 'standalone'`, the
    // server runs `next start` from the full checkout), so this only silences
    // noise — but it keeps a real problem visible if the deployment ever moves
    // to standalone.
    const guildDir        = path.join(/*turbopackIgnore: true*/ transcriptBasePath(), guild.guild_id);
    const transcriptDir   = path.join(/*turbopackIgnore: true*/ guildDir, transcriptId);
    const htmlFilename    = 'transcript.html';
    const htmlFilePath    = path.join(transcriptDir, htmlFilename);

    // Drop any older duplicate transcripts for this ticket (files + DB rows,
    // attachments cascade), then clear the reused directory so stale HTML and
    // attachments don't linger before we write the fresh version.
    for (const dup of existing.slice(1)) {
      await rm(path.join(/*turbopackIgnore: true*/ guildDir, dup.id), { recursive: true, force: true }).catch(() => {});
      await query(`DELETE FROM ticketbot_transcripts WHERE id = ?`, [dup.id]);
    }
    await rm(transcriptDir, { recursive: true, force: true }).catch(() => {});
    await mkdir(transcriptDir, { recursive: true });

    // 8. Write transcript HTML to disk
    // Path is safe: transcriptBasePath (env/constant) / guild_id (from DB) / randomUUID() / transcript.html
    // Content is user-supplied HTML — intentional by design (transcript storage service).
    // Size is validated above (tierCfg.transcriptMaxBytes).
    await writeFile(htmlFilePath, transcriptHtml, 'utf-8'); // lgtm[js/http-to-file-access]

    // 9. Write attachments to disk (premium)
    const savedAttachments: Array<{
      id: string;
      originalName: string;
      filePath: string;
      downloadUrl: string;
      sizeBytes: number;
      mimeType: string;
    }> = [];

    const attachmentsDir = path.join(transcriptDir, 'attachments');
    if (attachments.length > 0) {
      await mkdir(attachmentsDir, { recursive: true });
    }

    for (const att of attachments) {
      // Prefer the bot-supplied UUID so the transcript HTML can reference this
      // file via a stable relative path (attachments/<id>.<ext>). Fall back to a
      // server UUID for older bots / invalid ids — the strict UUID_RE guarantees
      // the value can't escape the attachments dir.
      const attId       = (typeof att.id === 'string' && UUID_RE.test(att.id)) ? att.id : randomUUID();
      const ext         = safeAttachmentExt(att.name)!;   // allow-listed in step 6
      const storedName  = `${attId}.${ext}`;
      const attFilePath = path.join(attachmentsDir, storedName);
      const raw         = Buffer.from(att.data, 'base64');

      // Image attachments are re-encoded through sharp (strips polyglots/payloads/
      // metadata and confirms it's a real image); non-image allow-listed types are
      // stored as-is. The on-disk path is fully server-controlled (UUID + allow-
      // listed extension), so the attacker-controlled name never reaches the web root.
      let data: Buffer;
      if (IMAGE_EXTS.has(ext)) {
        try {
          data = await reencodeImage(ext, raw);
        } catch {
          return NextResponse.json({ error: `Attachment is not a valid ${ext} image.` }, { status: 400 });
        }
      } else {
        data = raw;
      }

      await writeFile(attFilePath, data);

      const downloadUrl = `${urlPrefix}/${transcriptId}/attachments/${storedName}`;
      savedAttachments.push({
        id:           attId,
        originalName: att.name,
        filePath:     attFilePath,
        downloadUrl,
        sizeBytes:    data.length,
        mimeType:     att.mimeType,
      });
    }

    // 10. Persist to DB
    const expiresAt      = getExpiresAt(guild.tier);
    const transcriptUrl  = `${urlPrefix}/${transcriptId}/${htmlFilename}`;

    // Persist atomically. Replace-in-place when reusing an id (the DELETE clears
    // the old row + its attachment rows via cascade; a no-op for a brand-new id),
    // then insert the transcript and its attachments in ONE transaction so a
    // partial failure never leaves a transcript row without its attachments.
    // The UNIQUE(guild_id, ticket_id) constraint additionally serializes two
    // concurrent uploads for the same ticket: the loser's INSERT hits the unique
    // key, its transaction rolls back, and we return 409 instead of minting a
    // duplicate transcript row + URL.
    try {
      await withTransaction(async (conn) => {
        await conn.execute(`DELETE FROM ticketbot_transcripts WHERE id = ?`, [transcriptId]);
        await conn.execute(
          `INSERT INTO ticketbot_transcripts
             (id, guild_id, ticket_id, file_path, transcript_url, file_size_bytes, has_attachments, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transcriptId,
            guild.guild_id,
            ticketId,
            htmlFilePath,
            transcriptUrl,
            htmlBytes,
            savedAttachments.length > 0 ? 1 : 0,
            expiresAt,
          ],
        );
        for (const att of savedAttachments) {
          await conn.execute(
            `INSERT INTO ticketbot_attachments
               (id, transcript_id, original_name, file_path, download_url, file_size_bytes, mime_type)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [att.id, transcriptId, att.originalName, att.filePath, att.downloadUrl, att.sizeBytes, att.mimeType],
          );
        }
      });
    } catch (err) {
      // Concurrent upload for the same (guild_id, ticket_id) won the race.
      if ((err as { code?: string })?.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'A transcript for this ticket is already being written. Retry.' }, { status: 409 });
      }
      throw err;
    }

    // 11. Return public URL
    return NextResponse.json({
      success: true,
      url:     transcriptUrl,
      tier:    guild.tier,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (err) {
    console.error('[transcript/upload] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
