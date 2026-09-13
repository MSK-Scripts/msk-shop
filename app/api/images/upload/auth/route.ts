import { NextResponse } from 'next/server'
import { randomBytes }  from 'crypto'

import { UPLOAD_STATE_COOKIE } from '@/lib/uploadSession'

/**
 * Starts the Discord login for community uploads.
 *
 * The same Discord app as Verify and Giveaway, but with its own redirect URI
 * and **only `identify`**: nobody needs the submitter's guild list for a
 * submission. The URI must be registered in the Discord Developer Portal:
 *   {NEXT_PUBLIC_BASE_URL}/api/images/upload/auth/callback
 */
export async function GET() {
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de'
  const clientId = process.env.DISCORD_VERIFY_CLIENT_ID ?? ''
  const state    = randomBytes(16).toString('hex')

  const url = new URL('https://discord.com/api/oauth2/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', `${baseUrl}/api/images/upload/auth/callback`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'identify')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set(UPLOAD_STATE_COOKIE, state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  })
  return res
}
