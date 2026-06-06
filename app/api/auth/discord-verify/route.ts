import { NextResponse }    from 'next/server';
import { cookies }         from 'next/headers';
import { generateState, parseSession } from '@/lib/session';

export async function GET() {
  const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';

  // Make sure GitHub is already verified before allowing Discord step
  const cookieStore = await cookies();
  const sessionRaw  = cookieStore.get('msk_verify_session')?.value;
  const session     = sessionRaw ? parseSession(sessionRaw) : null;

  if (!session?.githubUsername) {
    return NextResponse.redirect(`${baseUrl}/ticketbot/verify?error=github_required`);
  }

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
