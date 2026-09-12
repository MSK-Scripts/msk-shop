import { NextResponse }                 from 'next/server';
import { cookies }                      from 'next/headers';
import { signSession }                  from '@/lib/session';
import type { DiscordGuild }            from '@/lib/session';
import { canManageGuild }               from '@/lib/discordPermissions';
import { fetchUserGuilds }              from '@/lib/discordGuilds';
import type { RawGuild }                from '@/lib/discordGuilds';
import { reconcileGuildAccess }         from '@/lib/guildAccess';
import { isRecheckState }               from '@/lib/accessRecheck';

export async function GET(req: Request) {
  const baseUrl      = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  const { searchParams } = new URL(req.url);
  const code         = searchParams.get('code');
  const state        = searchParams.get('state');

  // Verify CSRF state
  const cookieStore  = await cookies();
  const storedState  = cookieStore.get('msk_oauth_state')?.value;

  // Is this the dashboard asking again, or someone walking the verify wizard?
  // Read from either side: with `prompt=none` Discord may come back with an
  // error and no state at all, and that answer still belongs to the dashboard.
  const recheck = isRecheckState(state) || isRecheckState(storedState);

  // Redirect back to wherever the user actually is AND clear the one-shot state
  // cookie, so a failed/abandoned callback does not leave it lingering for its
  // full lifetime.
  //
  // A failed re-check deliberately carries no error: the person is mid-task on
  // the dashboard, nothing they did went wrong, and the guild list we already
  // have is still the best answer available. The loop guard cookie is already
  // set, so this cannot bounce.
  const fail = (reason: string) => {
    const res = NextResponse.redirect(
      recheck ? `${baseUrl}/ticketbot/dashboard`
              : `${baseUrl}/ticketbot/verify?error=${reason}`,
    );
    res.cookies.delete('msk_oauth_state');
    return res;
  };

  if (!code || !state || state !== storedState) {
    return fail('invalid_state');
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

  // Fetch Discord user ID and guild list in parallel. The guild list goes
  // through lib/discordGuilds.ts, which paginates and reports whether the
  // answer is provably complete - `reconcileGuildAccess` takes access away
  // based on a guild being absent, so a truncated list must not look final.
  let discordUserId: string;
  let guilds:   RawGuild[];
  let complete: boolean;
  try {
    const [userRes, userGuilds] = await Promise.all([
      fetch('https://discord.com/api/v10/users/@me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      }),
      fetchUserGuilds(tokenData.access_token),
    ]);
    const discordUser = await userRes.json();
    discordUserId     = discordUser?.id;
    guilds            = userGuilds.guilds;
    complete          = userGuilds.complete;
  } catch {
    return fail('discord_guilds_failed');
  }

  if (!discordUserId) {
    return fail('discord_guilds_failed');
  }

  // A guild list we could not read in full is only fatal for the wizard, which
  // has to show a trustworthy pick list. A re-check can live with it: it writes
  // nothing and the dashboard keeps what it knows.
  if (!complete && !recheck) {
    return fail('discord_guilds_failed');
  }

  // Only show guilds the user may manage (owner, Administrator or Manage Server)
  const manageable = guilds.filter(g => canManageGuild(g.permissions, g.owner));

  // Variant 2: write down what Discord just told us. This is the one moment we
  // hold a fresh, authoritative list without paying for it separately, so both
  // the wizard and the re-check reconcile here. Never fatal - failing to
  // record an observation must not cost anyone their login.
  try {
    await reconcileGuildAccess(discordUserId, manageable.map(g => g.id), complete);
  } catch (err) {
    console.error('[discord-verify] guild access reconcile failed:', err);
  }

  if (recheck) {
    // Straight back to the dashboard. No verify session: the person already
    // holds a dashboard session, and the wizard state would only be litter.
    const res = NextResponse.redirect(`${baseUrl}/ticketbot/dashboard`);
    res.cookies.delete('msk_oauth_state');
    return res;
  }

  // Store guild list + Discord user ID in the signed session, redirect to guild selection
  const adminGuilds: DiscordGuild[] = manageable.map(g => ({ id: g.id, name: g.name, icon: g.icon }));
  const updatedSession = signSession({ discordUserId, guilds: adminGuilds });
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
