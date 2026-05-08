import { NextResponse }               from 'next/server';
import { randomUUID }                  from 'crypto';
import { writeFile, mkdir }            from 'fs/promises';
import path                            from 'path';
import { query, queryOne }             from '@/lib/db';
import { TIER_CONFIG, getExpiresAt }   from '@/lib/tiers';
import type { Tier }                   from '@/lib/tiers';

// ── Types ──────────────────────────────────────────────────────────────────────

interface GuildRow {
  guild_id: string;
  tier:     Tier;
  active:   number;
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
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extract and validate the Bearer token from the Authorization header. */
function extractApiKey(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+([A-Za-z0-9_\-]{32,128})$/);
  return match ? match[1] : null;
}

/** Validate that the guild was found and is active. */
function isValidGuild(guild: GuildRow | null): guild is GuildRow {
  return guild !== null && guild.active === 1;
}

/** Derive the base filesystem path where transcript files are stored. */
function transcriptBasePath(): string {
  return process.env.TRANSCRIPT_BASE_PATH ?? '/var/www/html/transcripts';
}

/** Derive the public base URL for transcript links. */
function transcriptBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de') + '/transcripts';
}

/** Enforce rate limiting – max N uploads per rolling 60-minute window per API key. */
async function checkRateLimit(apiKey: string, maxPerHour: number): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - 60);

  const rows = await query<RateLimitRow>(
    `SELECT SUM(request_count) AS request_count
     FROM ticketbot_rate_limits
     WHERE api_key = ? AND window_start >= ?`,
    [apiKey, windowStart],
  );

  const count = Number(rows[0]?.request_count ?? 0);
  if (count >= maxPerHour) return false;

  // Record this request (upsert into current minute bucket)
  const bucket = new Date();
  bucket.setSeconds(0, 0);
  await query(
    `INSERT INTO ticketbot_rate_limits (api_key, window_start, request_count)
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE request_count = request_count + 1`,
    [apiKey, bucket],
  );

  // Prune old buckets (keep DB clean)
  await query(
    `DELETE FROM ticketbot_rate_limits WHERE window_start < ?`,
    [windowStart],
  );

  return true;
}

/** Validate a filename – strip path traversal and dangerous characters. */
function sanitizeFilename(name: string): string {
  return path
    .basename(name)
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .substring(0, 200);
}

/** Validate MIME type for attachments – block executables. */
function isAllowedMime(mime: string): boolean {
  const blocked = [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-sh',
    'text/x-sh',
    'application/x-bat',
  ];
  return !blocked.some(b => mime.toLowerCase().startsWith(b));
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // 1. Authenticate – API key from Authorization header
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header.' }, { status: 401 });
    }

    // 2. Look up the guild – guild_id comes ONLY from DB, never from the request body
    const guild = await queryOne<GuildRow>(
      `SELECT guild_id, tier, active FROM ticketbot_guilds WHERE api_key = ?`,
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

    // 4. Parse body
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
      const sizeBytes = Math.ceil(att.data.length * 3 / 4); // approx. base64 decoded size
      totalAttachmentBytes += sizeBytes;
    }

    if (totalAttachmentBytes > tierCfg.attachmentMaxBytes) {
      return NextResponse.json({
        error: `Attachments exceed size limit for your tier (${tierCfg.attachmentMaxBytes / 1024 / 1024} MB).`,
      }, { status: 413 });
    }

    // 7. Prepare filesystem paths
    const transcriptId    = randomUUID();
    const guildDir        = path.join(transcriptBasePath(), guild.guild_id);
    const transcriptDir   = path.join(guildDir, transcriptId);
    const htmlFilename    = 'transcript.html';
    const htmlFilePath    = path.join(transcriptDir, htmlFilename);

    await mkdir(transcriptDir, { recursive: true });

    // 8. Write transcript HTML to disk
    // Path is safe: transcriptBasePath (env/constant) / guild_id (from DB) / randomUUID() / transcript.html
    // Content is user-supplied HTML — intentional by design (transcript storage service).
    // Size is validated above (tierCfg.transcriptMaxBytes). // lgtm[js/unsafe-external-data]
    await writeFile(htmlFilePath, transcriptHtml, 'utf-8');

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
      const attId       = randomUUID();
      const safeName    = sanitizeFilename(att.name);
      const attFilePath = path.join(attachmentsDir, `${attId}-${safeName}`);
      const buffer      = Buffer.from(att.data, 'base64');

      // Path is safe: attachmentsDir uses server-generated UUIDs; filename is sanitized.
      // Content is base64-decoded attachment — intentional by design. MIME + size validated above.
      // lgtm[js/unsafe-external-data]
      await writeFile(attFilePath, buffer);

      const downloadUrl = `${transcriptBaseUrl()}/${guild.guild_id}/${transcriptId}/attachments/${attId}-${safeName}`;
      savedAttachments.push({
        id:           attId,
        originalName: att.name,
        filePath:     attFilePath,
        downloadUrl,
        sizeBytes:    buffer.length,
        mimeType:     att.mimeType,
      });
    }

    // 10. Persist to DB
    const expiresAt      = getExpiresAt(guild.tier);
    const transcriptUrl  = `${transcriptBaseUrl()}/${guild.guild_id}/${transcriptId}/${htmlFilename}`;

    await query(
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
      await query(
        `INSERT INTO ticketbot_attachments
           (id, transcript_id, original_name, file_path, download_url, file_size_bytes, mime_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [att.id, transcriptId, att.originalName, att.filePath, att.downloadUrl, att.sizeBytes, att.mimeType],
      );
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
