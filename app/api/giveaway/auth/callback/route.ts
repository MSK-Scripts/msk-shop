import { NextResponse }            from 'next/server';
import { cookies }                 from 'next/headers';
import { signGiveawayVerify }      from '@/lib/giveawaySession';
import type { GiveawayGuild }      from '@/lib/giveawaySession';
import { canManageGuild }          from '@/lib/discordPermissions';
import { fetchUserGuilds }         from '@/lib/discordGuilds';
import type { RawGuild }           from '@/lib/discordGuilds';
import { resolveManagerGuilds }    from '@/lib/giveawayManager';

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('msk_gw_oauth_state')?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=invalid_state`);
  }

  // Exchange the code for an access token.
  let tokenData: { access_token?: string };
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        client_id:     process.env.DISCORD_VERIFY_CLIENT_ID     ?? '',
        client_secret: process.env.DISCORD_VERIFY_CLIENT_SECRET ?? '',
        grant_type:    'authorization_code',
        code,
        redirect_uri:  `${baseUrl}/api/giveaway/auth/callback`,
      }),
    });
    tokenData = await tokenRes.json();
  } catch {
    return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=discord_token_failed`);
  }
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=discord_token_failed`);
  }

  // Fetch the user id and the guild list in parallel. The guild list goes
  // through lib/discordGuilds.ts so both verify flows paginate identically.
  let discordUserId: string;
  let rawGuilds: RawGuild[];
  let guildsComplete: boolean;
  try {
    const [userRes, userGuilds] = await Promise.all([
      fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }),
      fetchUserGuilds(tokenData.access_token),
    ]);
    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=discord_guilds_failed`);
    }
    const discordUser = await userRes.json();
    discordUserId     = discordUser?.id;
    rawGuilds         = userGuilds.guilds;
    guildsComplete    = userGuilds.complete;
  } catch {
    return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=discord_guilds_failed`);
  }

  if (!discordUserId || !guildsComplete) {
    return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=discord_guilds_failed`);
  }

  // Guilds the user may manage on Discord (owner, Administrator or Manage
  // Server). The owner flag is carried along because the Tebex section of the
  // dashboard is owner-only, but the authoritative check is the bot's own
  // comparison against guild.ownerId.
  const byPermission = rawGuilds.filter((g) => canManageGuild(g.permissions, g.owner));

  // Plus the guilds where the user holds the configured giveaway manager role.
  // The bot has always let them run every giveaway command; as of 2026-09-12
  // they get the dashboard that configures those commands too. Only guilds
  // that failed the permission check are candidates, so an ordinary admin
  // login still makes zero extra Discord requests.
  //
  // Never fatal: a manager lookup that fails costs the manager path, not the
  // login. Admins get in either way, and a half-working login is better than
  // a redirect to an error page.
  const permitted = new Set(byPermission.map((g) => g.id));
  let managerIds: string[] = [];
  try {
    managerIds = await resolveManagerGuilds(
      tokenData.access_token,
      rawGuilds.filter((g) => !permitted.has(g.id)).map((g) => g.id),
    );
  } catch (err) {
    console.error('[giveaway/auth] manager role resolution failed:', err);
  }
  const managerSet = new Set(managerIds);

  const adminGuilds: GiveawayGuild[] = rawGuilds
    .filter((g) => permitted.has(g.id) || managerSet.has(g.id))
    .map((g) => ({
      id:    g.id,
      name:  g.name,
      icon:  g.icon,
      // A manager is explicitly not the owner. `canManageGuild` already lets
      // the owner through by flag, so anyone arriving via the manager role has
      // owner false and stays out of the Tebex section.
      owner: permitted.has(g.id) ? Boolean(g.owner) : false,
    }));

  // Short-lived intermediate session (guild selection only), with its own
  // cookie name and scope.
  const sessionToken = signGiveawayVerify({ discordUserId, guilds: adminGuilds });
  const res = NextResponse.redirect(`${baseUrl}/giveaway/verify?step=select`);
  res.cookies.set('msk_gw_verify', sessionToken, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   3600,
    path:     '/',
  });
  res.cookies.delete('msk_gw_oauth_state');
  return res;
}
