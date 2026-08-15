import { NextResponse }              from 'next/server';
import { randomBytes, timingSafeEqual } from 'crypto';
import { query, queryOne }           from '@/lib/db';

// Nimmt das Ergebnis eines beendeten Giveaways vom Bot entgegen und hostet eine
// öffentliche Ergebnis-Seite. Auth: Bearer GIVEAWAY_RESULT_SECRET (timing-safe).
// Datenschutz: NUR Gewinner (Username) + anonyme Teilnehmerzahl.
const SECRET = process.env.GIVEAWAY_RESULT_SECRET ?? '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';

function authorized(req: Request): boolean {
  if (!SECRET) return false;
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return false;
  const a = Buffer.from(m[1]);
  const b = Buffer.from(SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface WinnerIn { userId?: unknown; username?: unknown; prize?: unknown }
interface ResultRow { token: string }

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const giveawayId = String(body.giveawayId ?? '').trim();
  const guildId    = String(body.guildId ?? '').trim();
  const title      = String(body.title ?? '').slice(0, 256);
  if (!/^[A-Za-z0-9]{4,16}$/.test(giveawayId) || !/^\d{17,20}$/.test(guildId) || !title) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const prize        = body.prize == null ? null : String(body.prize).slice(0, 256);
  const winnersCount = Number.isInteger(body.winnersCount) ? Math.max(0, Math.min(100, Number(body.winnersCount))) : 1;
  const entryCount   = Number.isInteger(body.entryCount) ? Math.max(0, Number(body.entryCount)) : 0;
  const endedAtRaw   = String(body.endedAt ?? '');
  const endedAt      = new Date(endedAtRaw);
  const endedAtSql   = Number.isNaN(endedAt.getTime()) ? new Date() : endedAt;

  // Datenminimierung: nur den Anzeigenamen speichern, KEINE Discord-User-IDs.
  // (userId wird nur zur Eingangsvalidierung der Gewinner genutzt.)
  //
  // `prize` schickt der Bot nur mit, wenn jeder Gewinner einen eigenen Preis
  // bekommt. Es steht im winners-JSON und braucht deshalb keine neue Spalte.
  const winners = Array.isArray(body.winners)
    ? (body.winners as WinnerIn[])
        .filter((w) => /^\d{17,20}$/.test(String(w.userId ?? '')))
        .slice(0, 100)
        .map((w) => ({
          username: String(w.username ?? '').slice(0, 64) || 'Unknown',
          prize: w.prize == null ? null : String(w.prize).slice(0, 256),
        }))
    : [];

  // Idempotent: existiert schon eine Seite für dieses Giveaway, denselben Token behalten.
  const existing = await queryOne<ResultRow>(
    'SELECT token FROM giveaway_results WHERE giveaway_id = ?',
    [giveawayId],
  );
  const token = existing?.token ?? randomBytes(16).toString('hex');

  if (existing) {
    await query(
      `UPDATE giveaway_results
         SET title = ?, prize = ?, winners_count = ?, entry_count = ?, winners = ?, ended_at = ?
       WHERE giveaway_id = ?`,
      [title, prize, winnersCount, entryCount, JSON.stringify(winners), endedAtSql, giveawayId],
    );
  } else {
    await query(
      `INSERT INTO giveaway_results
         (token, giveaway_id, guild_id, title, prize, winners_count, entry_count, winners, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [token, giveawayId, guildId, title, prize, winnersCount, entryCount, JSON.stringify(winners), endedAtSql],
    );
  }

  return NextResponse.json({ success: true, url: `${BASE_URL}/giveaway/g/${token}` });
}
