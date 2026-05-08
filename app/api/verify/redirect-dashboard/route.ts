import { NextResponse }           from 'next/server';
import { cookies }                from 'next/headers';
import { parseSession }           from '@/lib/session';
import { signDashboardSession }   from '@/lib/dashboardSession';
import { queryOne }               from '@/lib/db';

interface GuildRow { github_username: string | null; }

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionRaw  = cookieStore.get('msk_verify_session')?.value;
  const session     = sessionRaw ? parseSession(sessionRaw) : null;

  if (!session?.githubUsername || !session?.guilds) {
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

  // Verify the guild is actually registered to the current GitHub account
  const existing = await queryOne<GuildRow>(
    `SELECT github_username FROM ticketbot_guilds WHERE guild_id = ?`,
    [guildId],
  );

  if (!existing) {
    return NextResponse.json({ error: 'Guild not found.' }, { status: 404 });
  }

  if (existing.github_username !== session.githubUsername) {
    return NextResponse.json({ error: 'This server is registered to another account.' }, { status: 403 });
  }

  // Set dashboard session without touching the API key
  const dashboardToken = signDashboardSession({ guildId });
  const res = NextResponse.json({ success: true });
  res.cookies.delete('msk_verify_session');
  res.cookies.set('msk_dashboard_session', dashboardToken, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30, // 30 days
    path:     '/',
  });
  return res;
}
