import { NextResponse } from 'next/server'
import { randomBytes }  from 'crypto'

import { UPLOAD_STATE_COOKIE } from '@/lib/uploadSession'

/**
 * Startet den Discord-Login fuer Community-Uploads.
 *
 * Dieselbe Discord-App wie Verify und Giveaway, aber mit eigener Redirect-URI
 * und **nur `identify`**: fuer eine Einreichung braucht niemand die Guild-Liste
 * des Einreichenden. Die URI muss im Discord-Developer-Portal hinterlegt sein:
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
