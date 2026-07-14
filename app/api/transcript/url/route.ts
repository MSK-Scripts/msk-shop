import { NextResponse } from 'next/server';
import { queryOne }     from '@/lib/db';

// Look up the hosted transcript URL for one ticket, authenticated by the bot's
// API key (same scheme as /api/transcript/upload). The bot's dashboard calls this
// so it can offer an "Open transcript" link without storing the URL a second time.
// The guild is derived from the API key — never from the request — so a key can
// only ever resolve its own guild's transcripts.

export const dynamic = 'force-dynamic';

interface GuildRow { guild_id: string; active: number; }
interface UrlRow { transcript_url: string; expires_at: Date | string; }

/** Extract and validate the Bearer token from the Authorization header. */
function extractApiKey(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+([A-Za-z0-9_\-]{32,128})$/);
  return match ? match[1] : null;
}

export async function GET(req: Request): Promise<NextResponse> {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header.' }, { status: 401 });
  }

  const guild = await queryOne<GuildRow>(
    `SELECT guild_id, active FROM ticketbot_guilds WHERE api_key = ?`,
    [apiKey],
  );
  if (!guild || guild.active !== 1) {
    return NextResponse.json({ error: 'Invalid API key or subscription inactive.' }, { status: 403 });
  }

  const ticketId = Number(new URL(req.url).searchParams.get('ticketId'));
  if (!Number.isInteger(ticketId) || ticketId < 0) {
    return NextResponse.json({ error: 'Invalid ticketId.' }, { status: 400 });
  }

  try {
    // Newest transcript for this ticket (a re-close replaces in place, but order
    // by created_at defensively in case older rows linger).
    const row = await queryOne<UrlRow>(
      `SELECT transcript_url, expires_at
       FROM ticketbot_transcripts
       WHERE guild_id = ? AND ticket_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [guild.guild_id, ticketId],
    );

    // 200 with url:null when there is simply no hosted transcript for this ticket
    // (e.g. the bot ran without an API key when it was closed) — not an error.
    if (!row) return NextResponse.json({ url: null });

    return NextResponse.json({
      url:       row.transcript_url,
      expiresAt: new Date(row.expires_at).toISOString(),
    });
  } catch (err) {
    console.error('[transcript/url] query failed:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
