import { NextResponse }                        from 'next/server';
import { cookies }                             from 'next/headers';
import { parseGiveawayVerify, signGiveawaySession, GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';
import { giveawayQueryOne }                    from '@/lib/giveawayDb';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session     = parseGiveawayVerify(cookieStore.get('msk_gw_verify')?.value);

  if (!session?.guilds || !session.discordUserId) {
    return NextResponse.json({ error: 'Not authenticated. Please log in with Discord again.' }, { status: 401 });
  }

  let guildId: string;
  try {
    const body = await req.json();
    guildId    = String(body.guildId ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // User muss Admin dieser Guild sein (aus seiner OAuth-Guild-Liste).
  const guild = session.guilds.find((g) => g.id === guildId);
  if (!/^\d{17,20}$/.test(guildId) || !guild) {
    return NextResponse.json({ error: 'Invalid or unauthorized guild.' }, { status: 403 });
  }

  // Der Giveaway-Bot muss in dieser Guild sein (= GuildSettings-Row existiert).
  const row = await giveawayQueryOne<{ guildId: string }>(
    'SELECT guildId FROM `GuildSettings` WHERE guildId = ?',
    [guildId],
  );
  if (!row) {
    return NextResponse.json({ error: 'The giveaway bot is not in this server yet.' }, { status: 404 });
  }

  const token = signGiveawaySession({
    guildId,
    userId: session.discordUserId,
    owner:  Boolean(guild.owner),
  });
  const res = NextResponse.json({ success: true });
  res.cookies.delete('msk_gw_verify');
  res.cookies.set(GIVEAWAY_SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30, // 30 Tage
    path:     '/',
  });
  return res;
}
