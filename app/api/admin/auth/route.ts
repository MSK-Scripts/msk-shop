import { NextResponse }  from 'next/server';
import { generateState } from '@/lib/session';

// Admin login: dedicated Discord OAuth app, scope `identify` only. Separate from
// the customer verify flow (own client id + own state cookie).
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';

  // A yes/no, never a path. Anything but exactly `de` counts as English, so
  // this parameter can never turn into a redirect destination.
  const german = new URL(req.url).searchParams.get('lang') === 'de';

  const state  = generateState();
  const params = new URLSearchParams({
    client_id:     process.env.DISCORD_ADMIN_CLIENT_ID ?? '',
    redirect_uri:  `${baseUrl}/api/admin/auth/callback`,
    response_type: 'code',
    scope:         'identify',
    state,
  });

  const res = NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );

  res.cookies.set('msk_admin_oauth_state', state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });

  // Separate from the state, because they are two different things: the state
  // guards against CSRF and has to stay exactly comparable, the language is
  // convenience. Merged, every change to one would have touched the other.
  if (german) {
    res.cookies.set('msk_admin_oauth_lang', 'de', {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/',
    });
  }

  return res;
}
