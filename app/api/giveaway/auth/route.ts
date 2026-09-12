import { NextResponse } from 'next/server';
import { randomBytes }  from 'crypto';

// Starts the Discord OAuth flow for the giveaway dashboard (Discord only, no
// GitHub step). Uses the same Discord OAuth app as the ticketbot verify flow
// but with its own redirect URI, which has to be registered as an allowed
// redirect URL in the Discord developer portal:
//   {NEXT_PUBLIC_BASE_URL}/api/giveaway/auth/callback
//
// This flow asks for one scope more than the ticketbot flow:
// `guilds.members.read`. The bot lets a holder of the configured manager role
// run every giveaway command (`isManager` = ManageGuild OR managerRole), but
// `managerRole` is a ROLE id, and neither the `guilds` scope nor anything else
// we hold tells us a user's roles. `GET /users/@me/guilds/{id}/member` does,
// and it needs this scope. Without it the dashboard would stay stricter than
// the bot it configures - the same mismatch that locked out Manage Server
// users until 2026-09-03.
//
// Adding a scope means Discord shows the consent screen again on the next
// login, even to people who authorized us before. Unavoidable and one click.
export async function GET() {
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  const clientId = process.env.DISCORD_VERIFY_CLIENT_ID ?? '';
  const state    = randomBytes(16).toString('hex');

  const url = new URL('https://discord.com/api/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${baseUrl}/api/giveaway/auth/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify guilds guilds.members.read');
  url.searchParams.set('state', state);

  const res = NextResponse.redirect(url.toString());
  res.cookies.set('msk_gw_oauth_state', state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });
  return res;
}
