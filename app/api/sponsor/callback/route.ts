import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { publicPath } from '@/lib/routes'
import { getPreferredLang } from '@/lib/serverLang'
import { absoluteUrl, siteUrl } from '@/lib/siteUrl'
import {
  GITHUB_LOGIN_RE, SPONSOR_STATE_COOKIE, readSponsorConfig, readStateCookie, safeEqual,
  type SponsorStatus,
} from '@/lib/sponsorLink'
import { grantSponsorRole, upsertSponsorLink } from '@/lib/sponsorLinks'
import { currentSponsors } from '@/lib/sponsors'

// GitHub sends the browser back here. Log lines name the outcome, never the
// Discord or GitHub id, the token or the code (log injection, privacy). In order:
//   1. state from the query equals the state in our signed cookie (CSRF), the
//      cookie is deleted on every path;
//   2. the code is exchanged for a token, which is used once for GET /user and
//      then forgotten (never stored, never logged);
//   3. the link Discord user <-> GitHub account is saved;
//   4. the org's sponsorships are checked, and a valid sponsor gets the role
//      on Discord right away. Removing it again is the bot's daily reconcile
//      against GET /api/sponsor/members.

export async function GET(req: Request) {
  const lang = await getPreferredLang()
  const finish = (status: SponsorStatus) => {
    const res = NextResponse.redirect(absoluteUrl(publicPath(lang, `/sponsor/verify?status=${status}`)))
    res.cookies.set(SPONSOR_STATE_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/api/sponsor' })
    return res
  }

  const cfg = readSponsorConfig()
  if (!cfg.ok) {
    console.error(`[sponsor] feature disabled, missing or invalid env: ${cfg.missing.join(', ')}`)
    return finish('error')
  }
  const { config } = cfg

  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const saved = readStateCookie((await cookies()).get(SPONSOR_STATE_COOKIE)?.value, config.linkSecret)
  if (!code || !state || !saved || !safeEqual(state, saved.state)) {
    return finish('link_invalid')
  }
  const discordId = saved.discordId

  // ── GitHub identity ──────────────────────────────────────────────────────
  let githubId: number
  let githubLogin: string
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method:  'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        client_id:     config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri:  `${siteUrl()}/api/sponsor/callback`,
      }),
      cache:  'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    const tokenData = await tokenRes.json() as { access_token?: unknown }
    if (typeof tokenData.access_token !== 'string' || !tokenData.access_token) {
      console.warn('[sponsor] GitHub code exchange returned no access token')
      return finish('error')
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept:        'application/vnd.github+json',
        'User-Agent':  'msk-shop-sponsors',
      },
      cache:  'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    if (!userRes.ok) {
      console.warn(`[sponsor] GitHub /user answered HTTP ${userRes.status}`)
      return finish('error')
    }
    const user = await userRes.json() as { id?: unknown; login?: unknown }
    if (typeof user.id !== 'number' || !Number.isSafeInteger(user.id) || user.id <= 0
      || typeof user.login !== 'string' || !GITHUB_LOGIN_RE.test(user.login)) {
      console.warn('[sponsor] GitHub /user returned an unexpected shape')
      return finish('error')
    }
    githubId = user.id
    githubLogin = user.login
  } catch {
    console.warn('[sponsor] GitHub OAuth request failed')
    return finish('error')
  }

  // ── Link ─────────────────────────────────────────────────────────────────
  try {
    await upsertSponsorLink(discordId, githubId, githubLogin)
  } catch (err) {
    console.error('[sponsor] saving the link failed:', err instanceof Error ? err.message : 'unknown error')
    return finish('error')
  }

  // ── Sponsorship ──────────────────────────────────────────────────────────
  let isSponsor: boolean
  try {
    const sponsors = await currentSponsors({ token: config.sponsorsToken, org: config.githubOrg })
    isSponsor = sponsors.has(githubId)
  } catch (err) {
    // The link is saved, the next daily sync picks a valid sponsor up.
    console.error('[sponsor] GitHub sponsorship query failed:', err instanceof Error ? err.message : 'unknown error')
    return finish('error')
  }
  if (!isSponsor) {
    console.info('[sponsor] account linked, no valid sponsorship')
    return finish('linked_no_sponsorship')
  }

  const granted = await grantSponsorRole({
    botToken: config.botToken, guildId: config.guildId, roleId: config.roleId, discordUserId: discordId,
  })
  if (!granted) {
    console.warn('[sponsor] account linked and sponsorship valid, but the Discord role grant failed')
    return finish('role_failed')
  }
  console.info('[sponsor] account linked, sponsor role granted')
  return finish('granted')
}
