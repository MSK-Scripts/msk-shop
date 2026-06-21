import { NextResponse }    from 'next/server';
import { cookies }         from 'next/headers';
import { signSession }     from '@/lib/session';

export async function GET(req: Request) {
  const baseUrl      = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  const { searchParams } = new URL(req.url);
  const code         = searchParams.get('code');
  const state        = searchParams.get('state');

  // Verify CSRF state
  const cookieStore  = await cookies();
  const storedState  = cookieStore.get('msk_oauth_state')?.value;

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

  // Exchange code for access token
  let tokenData: { access_token?: string };
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method:  'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    tokenData = await tokenRes.json();
  } catch {
    return fail('github_token_failed');
  }

  if (!tokenData.access_token) {
    return fail('github_token_failed');
  }

  // Fetch GitHub user info
  let githubUser: { login?: string };
  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept':        'application/vnd.github+json',
      },
    });
    githubUser = await userRes.json();
  } catch {
    return fail('github_user_failed');
  }

  if (!githubUser.login) {
    return fail('github_user_failed');
  }

  // Set signed session cookie and redirect to next step
  const session = signSession({ githubUsername: githubUser.login });
  const res     = NextResponse.redirect(`${baseUrl}/ticketbot/verify?step=discord`);

  res.cookies.set('msk_verify_session', session, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   3600, // 1 hour
    path:     '/',
  });
  res.cookies.delete('msk_oauth_state');

  return res;
}
