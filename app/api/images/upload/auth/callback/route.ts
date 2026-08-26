import { NextResponse } from 'next/server'
import { cookies }      from 'next/headers'

import {
  signUploadSession,
  UPLOAD_SESSION_COOKIE,
  UPLOAD_STATE_COOKIE,
} from '@/lib/uploadSession'

/**
 * Discord-Rueckkanal des Upload-Logins.
 *
 * Der `state`-Abgleich ist der CSRF-Schutz; sein Cookie wird in **jedem**
 * Ausgang geloescht, auch im Fehlerfall, damit ein abgebrochener Versuch keinen
 * gueltigen State liegen laesst.
 */
export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de'
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get(UPLOAD_STATE_COOKIE)?.value

  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${baseUrl}/images/upload?error=${reason}`)
    res.cookies.delete(UPLOAD_STATE_COOKIE)
    return res
  }

  if (!code || !state || state !== storedState) return fail('invalid_state')

  let accessToken: string | undefined
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        client_id:     process.env.DISCORD_VERIFY_CLIENT_ID     ?? '',
        client_secret: process.env.DISCORD_VERIFY_CLIENT_SECRET ?? '',
        grant_type:    'authorization_code',
        code,
        redirect_uri:  `${baseUrl}/api/images/upload/auth/callback`,
      }),
    })
    const tokenData = await tokenRes.json()
    accessToken = tokenData?.access_token
  } catch {
    return fail('discord_token_failed')
  }
  if (!accessToken) return fail('discord_token_failed')

  let discordUserId: string | undefined
  let displayName: string | null = null
  try {
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userRes.ok) return fail('discord_user_failed')
    const user = await userRes.json()
    discordUserId = typeof user?.id === 'string' ? user.id : undefined
    // global_name ist der heutige Anzeigename, username der Login-Name. Beides
    // kann fehlen, dann bleibt der Name leer statt "undefined" zu heissen.
    const name = user?.global_name ?? user?.username
    displayName = typeof name === 'string' ? name.slice(0, 64) : null
  } catch {
    return fail('discord_user_failed')
  }
  if (!discordUserId) return fail('discord_user_failed')

  const res = NextResponse.redirect(`${baseUrl}/images/upload`)
  res.cookies.set(UPLOAD_SESSION_COOKIE, signUploadSession({ discordUserId, displayName }), {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   7 * 24 * 3600,
    path:     '/',
  })
  res.cookies.delete(UPLOAD_STATE_COOKIE)
  return res
}
