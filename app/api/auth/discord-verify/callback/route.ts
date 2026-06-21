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

  // Redirect back to the verify flow AND clear the one-shot state cookie, so a
  // failed/abandoned callback does not leave it lingering for its full lifetime.
  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${baseUrl}/ticketbot/verify?error=${reason}`);
    res.cookies.delete('msk_oauth_state');
    return res;
  };

  if (!code || !state || state !== storedState) {
    return fail('invalid_state');
  }

  if (!session?.githubUsername) {
    return fail('github_required');
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
    return fail('discord_token_failed');
  }

  if (!tokenData.access_token) {
    return fail('discord_token_failed');
  }

  // Fetch Discord user ID and guild list in parallel
  let discordUserId: string;
  let rawGuilds: Array<{ id: string; name: string; icon: string | null; owner: boolean; permissions: string }>;
  try {
    const [userRes, guildsRes] = await Promise.all([
      fetch('https://discord.com/api/v10/users/@me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      }),
      fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      }),
    ]);
    const discordUser = await userRes.json();
    rawGuilds         = await guildsRes.json();
    discordUserId     = discordUser?.id;
  } catch {
    return fail('discord_guilds_failed');
  }

  // Discord may return an error object (e.g. 429 rate limit, missing scope)
  // instead of the expected array/user — guard before using array methods.
  if (!Array.isArray(rawGuilds) || !discordUserId) {
    return fail('discord_guilds_failed');
  }

  // Only show guilds where the user is admin or owner
  const adminGuilds: DiscordGuild[] = rawGuilds
    .filter(g => isAdmin(g.permissions, g.owner))
    .map(g => ({ id: g.id, name: g.name, icon: g.icon }));

  // Update session with guild list + Discord user ID, redirect to guild selection
  const updatedSession = signSession({ githubUsername: session.githubUsername, discordUserId, guilds: adminGuilds });
  const res            = NextResponse.redirect(`${baseUrl}/ticketbot/verify?step=select`);

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
