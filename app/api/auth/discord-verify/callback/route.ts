import { NextResponse }                 from 'next/server';
import { cookies }                      from 'next/headers';
import { parseSession, signSession }    from '@/lib/session';
import type { DiscordGuild }            from '@/lib/session';

// Discord guild permissions bit for ADMINISTRATOR
const ADMINISTRATOR = BigInt(0x8);

function isAdmin(permissions: string, owner: boolean): boolean {
  if (owner) return true;
  try {
    return (BigInt(permissions) & ADMINISTRATOR) !== BigInt(0);
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const baseUrl      = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  const { searchParams } = new URL(req.url);
  const code         = searchParams.get('code');
  const state        = searchParams.get('state');

  // Verify CSRF state
  const cookieStore  = await cookies();
  const storedState  = cookieStore.get('msk_oauth_state')?.value;
  const sessionRaw   = cookieStore.get('msk_verify_session')?.value;
  const session      = sessionRaw ? parseSession(sessionRaw) : null;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/verify?error=invalid_state`);
  }

  if (!session?.githubUsername) {
    return NextResponse.redirect(`${baseUrl}/verify?error=github_required`);
  }

  // Exchange code for access token
  let tokenData: { access_token?: string };
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        client_id:     process.env.DISCORD_VERIFY_CLIENT_ID    ?? '',
        client_secret: process.env.DISCORD_VERIFY_CLIENT_SECRET ?? '',
        grant_type:    'authorization_code',
        code,
        redirect_uri:  `${baseUrl}/api/auth/discord-verify/callback`,
      }),
    });
    tokenData = await tokenRes.json();
  } catch {
    return NextResponse.redirect(`${baseUrl}/verify?error=discord_token_failed`);
  }

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${baseUrl}/verify?error=discord_token_failed`);
  }

  // Fetch all guilds the user belongs to
  let rawGuilds: Array<{ id: string; name: string; icon: string | null; owner: boolean; permissions: string }>;
  try {
    const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    rawGuilds = await guildsRes.json();
  } catch {
    return NextResponse.redirect(`${baseUrl}/verify?error=discord_guilds_failed`);
  }

  // Only show guilds where the user is admin or owner
  const adminGuilds: DiscordGuild[] = rawGuilds
    .filter(g => isAdmin(g.permissions, g.owner))
    .map(g => ({ id: g.id, name: g.name, icon: g.icon }));

  // Update session with guild list and redirect to guild selection step
  const updatedSession = signSession({ githubUsername: session.githubUsername, guilds: adminGuilds });
  const res            = NextResponse.redirect(`${baseUrl}/verify?step=select`);

  res.cookies.set('msk_verify_session', updatedSession, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   3600,
    path:     '/',
  });
  res.cookies.delete('msk_oauth_state');

  return res;
}
