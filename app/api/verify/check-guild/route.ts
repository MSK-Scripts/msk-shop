import { NextResponse }  from 'next/server';
import { cookies }        from 'next/headers';
import { parseSession }   from '@/lib/session';
import { queryOne }       from '@/lib/db';
import type { Tier }      from '@/lib/tiers';

interface GuildRow { tier: Tier; discord_user_id: string | null; }

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionRaw  = cookieStore.get('msk_verify_session')?.value;
  const session     = sessionRaw ? parseSession(sessionRaw) : null;

  if (!session?.discordUserId || !session?.guilds) {
    return NextResponse.json({ error: 'No active verify session.' }, { status: 401 });
  }

  let guildId: string;
  try {
    const body = await req.json();
    guildId    = String(body.guildId ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Must be in the user's admin guild list
  const guildAllowed = session.guilds.some(g => g.id === guildId);
  if (!guildAllowed || !/^\d{17,20}$/.test(guildId)) {
    return NextResponse.json({ error: 'Invalid or unauthorized guild.' }, { status: 403 });
  }

  const existing = await queryOne<GuildRow>(
    `SELECT tier, discord_user_id FROM ticketbot_guilds WHERE guild_id = ?`,
    [guildId],
  );

  if (!existing) {
    return NextResponse.json({ exists: false });
  }

  // Registered to a different Discord account → let the complete route handle the error
  if (existing.discord_user_id !== null && existing.discord_user_id !== session.discordUserId) {
    return NextResponse.json({ exists: true, ownedByCurrentUser: false, tier: existing.tier });
  }

  return NextResponse.json({ exists: true, ownedByCurrentUser: true, tier: existing.tier });
}
