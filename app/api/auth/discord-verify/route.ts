import { NextResponse }    from 'next/server';
import { generateState }   from '@/lib/session';
import { RECHECK_COOKIE, RECHECK_STATE_PREFIX, RECHECK_COOKIE_TTL_S } from '@/lib/accessRecheck';

// Discord OAuth is the first (and only sign-in) step of the verify flow.
//
// It doubles as the re-check path for the dashboard: `?recheck=1` runs the same
// dance silently and lands back on the dashboard instead of the verify wizard.
// The dashboard cannot call Discord on its own - we store no access token, on
// purpose, so the only way to get a fresh guild list is to walk through OAuth
// again. With `prompt=none` that costs a redirect and no user interaction,
// which is a far smaller price than keeping a refresh token per customer on
// disk forever just to answer one question a day.
export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  const recheck = new URL(req.url).searchParams.get('recheck') === '1';

  // The intent rides along in the state token instead of a second cookie: it is
  // already CSRF-bound by the equality check in the callback, so there is
  // nothing to keep in sync. Only a marker travels, never a redirect target -
  // a caller-supplied return path would be an open redirect.
  const state  = (recheck ? RECHECK_STATE_PREFIX : '') + generateState();
  const params = new URLSearchParams({
    client_id:     process.env.DISCORD_VERIFY_CLIENT_ID ?? '',
    redirect_uri:  `${baseUrl}/api/auth/discord-verify/callback`,
    response_type: 'code',
    scope:         'identify guilds',
    state,
  });

  // Skip the consent screen for someone who authorized us already. If they did
  // not (or revoked us), Discord answers with an error instead of prompting,
  // the callback treats that as "cannot say" and the dashboard renders on what
  // it has. A re-check must never interrupt someone mid-task.
  if (recheck) params.set('prompt', 'none');

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

  // Loop guard, and it has to be set HERE rather than in the dashboard: a
  // server component cannot write cookies. Set before the redirect, so an
  // attempt that never comes back (Discord down, user closes the tab) still
  // counts as spent and the next dashboard load renders instead of bouncing.
  if (recheck) {
    res.cookies.set(RECHECK_COOKIE, '1', {
      httpOnly: true,
      secure:   true,
      sameSite: 'lax',
      maxAge:   RECHECK_COOKIE_TTL_S,
      path:     '/',
    });
  }

  return res;
}
