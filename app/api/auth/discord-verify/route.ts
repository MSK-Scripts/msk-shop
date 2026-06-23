import { NextResponse }    from 'next/server';
import { generateState }   from '@/lib/session';

// Discord OAuth is the first (and only sign-in) step of the verify flow.
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';

  const state   = generateState();
  const params  = new URLSearchParams({
    client_id:    process.env.DISCORD_VERIFY_CLIENT_ID ?? '',
    redirect_uri: `${baseUrl}/api/auth/discord-verify/callback`,
    response_type: 'code',
    scope:        'identify guilds',
    state,
  });

  const res = NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );

  res.cookies.set('msk_oauth_state', state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });

  return res;
}
