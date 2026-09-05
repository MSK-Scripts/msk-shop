import { NextResponse }                    from 'next/server';
import { cookies }                         from 'next/headers';
import { query }                           from '@/lib/db';
import { signAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';
import { loadAdminMember }                 from '@/lib/adminAuth';
import { localePath }                      from '@/lib/lang';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const baseUrl          = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  const { searchParams } = new URL(req.url);
  const code             = searchParams.get('code');
  const state            = searchParams.get('state');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('msk_admin_oauth_state')?.value;
  // Set by the sign-in button when the login started on the German version.
  // `localePath` builds the prefix, not this string: there is exactly one place
  // that knows what an address looks like in a given language, and a second
  // hand-written `/de` is the mistake the guard in `tests/localeLinks.test.ts`
  // has been catching since 23.08.2026.
  const adminPath   = localePath(
    cookieStore.get('msk_admin_oauth_lang')?.value === 'de' ? 'de' : 'en',
    '/admin',
  );

  // Redirect back to /admin AND clear the one-shot state cookie on every error
  // path, so an abandoned callback does not leave it lingering.
  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${baseUrl}${adminPath}?error=${reason}`);
    res.cookies.delete('msk_admin_oauth_state');
    res.cookies.delete('msk_admin_oauth_lang');
    return res;
  };

  if (!code || !state || state !== storedState) {
    return fail('invalid_state');
  }

  // Exchange the code for an access token.
  let tokenData: { access_token?: string };
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        client_id:     process.env.DISCORD_ADMIN_CLIENT_ID     ?? '',
        client_secret: process.env.DISCORD_ADMIN_CLIENT_SECRET ?? '',
        grant_type:    'authorization_code',
        code,
        redirect_uri:  `${baseUrl}/api/admin/auth/callback`,
      }),
    });
    tokenData = await tokenRes.json();
  } catch {
    return fail('discord_token_failed');
  }

  if (!tokenData.access_token) {
    return fail('discord_token_failed');
  }

  // Fetch the Discord user id (scope identify).
  let discordUserId: string | undefined;
  let displayName:   string | null = null;
  try {
    const userRes     = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userRes.json();
    discordUserId     = discordUser?.id;
    displayName       = discordUser?.global_name ?? discordUser?.username ?? null;
  } catch {
    return fail('discord_user_failed');
  }

  if (!discordUserId) {
    return fail('discord_user_failed');
  }

  // Self-healing owner seed: if this user is the configured owner, ensure a row
  // exists with is_owner = 1 (all permissions, non-revocable). Keeps the owner
  // from ever being locked out without a manual DB step.
  const ownerId = process.env.ADMIN_OWNER_DISCORD_ID;
  if (ownerId && discordUserId === ownerId) {
    try {
      await query(
        `INSERT INTO msk_admin_team (discord_user_id, display_name, is_owner, permissions, active)
         VALUES (?, ?, 1, ?, 1)
         ON DUPLICATE KEY UPDATE is_owner = 1, active = 1, display_name = VALUES(display_name)`,
        [discordUserId, displayName, JSON.stringify([])],
      );
    } catch {
      return fail('seed_failed');
    }
  }

  // Allowlist check — only team members may proceed.
  const member = await loadAdminMember(discordUserId);
  if (!member) {
    return fail('not_authorized');
  }

  const res = NextResponse.redirect(`${baseUrl}${adminPath}`);
  res.cookies.set(ADMIN_SESSION_COOKIE, signAdminSession({ discordUserId }), {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   3600,
    path:     '/',
  });
  res.cookies.delete('msk_admin_oauth_state');
  res.cookies.delete('msk_admin_oauth_lang');
  return res;
}
