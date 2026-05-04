import { NextResponse }    from 'next/server';
import { generateState }   from '@/lib/session';

export async function GET() {
  const state   = generateState();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';

  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID ?? '',
    redirect_uri: `${baseUrl}/api/auth/github/callback`,
    scope:        'read:user',
    state,
  });

  const res = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );

  // Store state in a short-lived httpOnly cookie for CSRF verification
  res.cookies.set('msk_oauth_state', state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   600, // 10 minutes
    path:     '/',
  });

  return res;
}
