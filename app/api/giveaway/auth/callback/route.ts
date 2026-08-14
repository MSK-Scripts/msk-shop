import { NextResponse }            from 'next/server';
import { cookies }                 from 'next/headers';
import { signGiveawayVerify }      from '@/lib/giveawaySession';
import type { GiveawayGuild }      from '@/lib/giveawaySession';

// Discord-Permission-Bit für ADMINISTRATOR.
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('msk_gw_oauth_state')?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=invalid_state`);
  }

  // Code gegen Access-Token tauschen.
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

  // User-ID + Guild-Liste parallel holen.
  let discordUserId: string;
  let rawGuilds: Array<{ id: string; name: string; icon: string | null; owner: boolean; permissions: string }>;
  try {
    const [userRes, guildsRes] = await Promise.all([
      fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }),
      fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }),
    ]);
    if (!userRes.ok || !guildsRes.ok) {
      return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=discord_guilds_failed`);
    }
    const discordUser = await userRes.json();
    rawGuilds         = await guildsRes.json();
    discordUserId     = discordUser?.id;
  } catch {
    return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=discord_guilds_failed`);
  }

  if (!Array.isArray(rawGuilds) || !discordUserId) {
    return NextResponse.redirect(`${baseUrl}/giveaway/verify?error=discord_guilds_failed`);
  }

  // Nur Guilds, in denen der User Admin/Owner ist. Das Besitzer-Flag wird
  // mitgeführt, weil der Tebex-Bereich im Dashboard nur für Besitzer sichtbar
  // ist — die eigentliche Prüfung macht der Bot gegen guild.ownerId.
  const adminGuilds: GiveawayGuild[] = rawGuilds
    .filter((g) => isAdmin(g.permissions, g.owner))
    .map((g) => ({ id: g.id, name: g.name, icon: g.icon, owner: Boolean(g.owner) }));

  // Kurzlebige Zwischen-Session (nur Guild-Auswahl), eigener Cookie-Name + Scope.
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
