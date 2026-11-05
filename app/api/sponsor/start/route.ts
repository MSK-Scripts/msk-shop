import { NextResponse } from 'next/server'

import { getClientIp, rateLimit } from '@/lib/rateLimit'
import { publicPath } from '@/lib/routes'
import { getPreferredLang } from '@/lib/serverLang'
import { absoluteUrl, siteUrl } from '@/lib/siteUrl'
import {
  SPONSOR_OAUTH_STATE_COOKIE, SPONSOR_STATE_COOKIE, SPONSOR_STATE_TTL_S, newOAuthState, readSponsorConfig, signStateCookie,
  verifyLinkToken, type SponsorStatus,
} from '@/lib/sponsorLink'

// Entry of the GitHub Sponsors verification. The Discord bot hands a member a
// signed, personal link to this route (contract in lib/sponsorLink.ts). We
// check it, remember the Discord user in a short-lived signed cookie together
// with the OAuth state, and send the browser to GitHub. No scope is requested:
// the public identity (id and login) is all we need, the sponsorship itself is
// read with the org's own token.

export async function GET(req: Request) {
  const lang = await getPreferredLang()
  const result = (status: SponsorStatus) =>
    NextResponse.redirect(absoluteUrl(publicPath(lang, `/sponsor/verify?status=${status}`)))

  if (!rateLimit(`sponsor-start:${getClientIp(req)}`, { limit: 10, windowMs: 10 * 60_000 })) {
    return result('rate_limited')
  }

  const cfg = readSponsorConfig()
  if (!cfg.ok) {
    console.error(`[sponsor] feature disabled, missing or invalid env: ${cfg.missing.join(', ')}`)
    return result('error')
  }
  const { config } = cfg

  const token = new URL(req.url).searchParams.get('t')
  const link = verifyLinkToken(token, { secret: config.linkSecret, guildId: config.guildId })
  if (!link) return result('link_invalid')

  const state = newOAuthState()
  const params = new URLSearchParams({
    client_id:    config.clientId,
    redirect_uri: `${siteUrl()}/api/sponsor/callback`,
    state,
    allow_signup: 'true',
  })

  const res = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
  const cookieOptions = {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   SPONSOR_STATE_TTL_S,
    path:     '/api/sponsor',
  } as const
  res.cookies.set(SPONSOR_STATE_COOKIE, signStateCookie({ discordId: link.discordId }, config.linkSecret), cookieOptions)
  res.cookies.set(SPONSOR_OAUTH_STATE_COOKIE, state, cookieOptions)
  return res
}
