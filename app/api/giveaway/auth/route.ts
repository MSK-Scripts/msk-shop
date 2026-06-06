import { NextResponse } from 'next/server';
import { randomBytes }  from 'crypto';

// Startet den Discord-OAuth-Flow für das Giveaway-Dashboard (Discord-only,
// kein GitHub-Schritt). Nutzt dieselbe Discord-OAuth-App wie der Ticketbot-
// Verify, aber mit eigener Redirect-URI (muss im Discord-Developer-Portal als
// erlaubte Redirect-URL hinterlegt sein):
//   {NEXT_PUBLIC_BASE_URL}/api/giveaway/auth/callback
export async function GET() {
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
  const clientId = process.env.DISCORD_VERIFY_CLIENT_ID ?? '';
  const state    = randomBytes(16).toString('hex');

  const url = new URL('https://discord.com/api/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${baseUrl}/api/giveaway/auth/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify guilds');
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
