import { NextRequest, NextResponse } from 'next/server';
import { authorizeGuild }            from '@/lib/dashboardAuth';
import { query, queryOne }           from '@/lib/db';

// Session-/Cookie-abhängig → niemals cachen.
export const dynamic = 'force-dynamic';

interface TranscriptRow {
  id:              string;
  ticket_id:       number;
  transcript_url:  string;
  file_size_bytes: string | number;   // BIGINT kommt als string aus mysql2
  has_attachments: number;
  created_at:      Date | string;
  expires_at:      Date | string;
}

const MAX_PAGE_SIZE = 100;

/** Parst einen positiven Integer aus einem Query-Param, sonst null. */
function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** Validiert ein YYYY-MM-DD-Datum und gibt es zurück, sonst null. */
function parseDate(value: string | null): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams;

  // Auth — guildId comes from the request but must be OWNED by the session's
  // Discord user (account-scoped dashboard).
  const auth = await authorizeGuild(sp.get('guildId'));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const guildId = auth.guild.guild_id;

  // Filter
  const ticketId       = parsePositiveInt(sp.get('ticketId'));
  const from           = parseDate(sp.get('from'));
  const to             = parseDate(sp.get('to'));
  const attachmentsOnly = sp.get('attachments') === '1';

  // Pagination (validierte Ints → sicher inline; mysql2 erlaubt keine LIMIT-Platzhalter)
  const page     = Math.max(1, parsePositiveInt(sp.get('page')) ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parsePositiveInt(sp.get('pageSize')) ?? 20));
  const offset   = (page - 1) * pageSize;

  // WHERE-Klausel dynamisch aufbauen — guild_id immer aus der Session.
  const where: string[] = ['guild_id = ?'];
  const params: unknown[] = [guildId];

  if (ticketId !== null) {
    where.push('ticket_id = ?');
    params.push(ticketId);
  }
  if (from) {
    where.push('created_at >= ?');
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    where.push('created_at <= ?');
    params.push(`${to} 23:59:59`);
  }
  if (attachmentsOnly) {
    where.push('has_attachments = 1');
  }

  const whereSql = where.join(' AND ');

  try {
    const totalRow = await queryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM ticketbot_transcripts WHERE ${whereSql}`,
      params,
    );
    const total = Number(totalRow?.total ?? 0);

    const rows = await query<TranscriptRow>(
      `SELECT id, ticket_id, transcript_url, file_size_bytes, has_attachments, created_at, expires_at
       FROM ticketbot_transcripts
       WHERE ${whereSql}
       ORDER BY created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params,
    );

    const items = rows.map(r => ({
      id:             r.id,
      ticketId:       r.ticket_id,
      url:            r.transcript_url,
      sizeBytes:      Number(r.file_size_bytes),
      hasAttachments: r.has_attachments === 1,
      createdAt:      new Date(r.created_at).toISOString(),
      expiresAt:      new Date(r.expires_at).toISOString(),
    }));

    return NextResponse.json({ items, total, page, pageSize });
  } catch (err) {
    console.error('[transcripts] query failed:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
