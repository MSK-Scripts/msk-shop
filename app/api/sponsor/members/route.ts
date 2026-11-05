import { NextResponse } from 'next/server'

import { bearerMatches, readSponsorConfig, readSyncSecret } from '@/lib/sponsorLink'
import { listSponsorLinks } from '@/lib/sponsorLinks'
import { currentSponsors } from '@/lib/sponsors'

// The list the Discord bot reconciles the sponsor role against once a day:
// every linked Discord user whose GitHub account has a valid sponsorship right
// now. Auth: `Authorization: Bearer <SPONSOR_SYNC_SECRET>`, constant-time.
//
// Any failure answers `{ ok: false }` with a non-200 status, and the bot then
// changes nothing. An empty list on a failed GitHub query would read as
// "nobody sponsors" and strip the role from everyone.

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: Request) {
  const secret = readSyncSecret()
  if (!secret) {
    console.error('[sponsor] members endpoint disabled, SPONSOR_SYNC_SECRET missing or shorter than 32 chars')
    return NextResponse.json({ ok: false }, { status: 503, headers: NO_STORE })
  }
  if (!bearerMatches(req.headers.get('authorization'), secret)) {
    return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE })
  }

  const cfg = readSponsorConfig()
  if (!cfg.ok) {
    console.error(`[sponsor] members endpoint disabled, missing or invalid env: ${cfg.missing.join(', ')}`)
    return NextResponse.json({ ok: false }, { status: 503, headers: NO_STORE })
  }

  let sponsors
  try {
    sponsors = await currentSponsors({ token: cfg.config.sponsorsToken, org: cfg.config.githubOrg })
  } catch (err) {
    console.error('[sponsor] GitHub sponsorship query failed:', err instanceof Error ? err.message : 'unknown error')
    return NextResponse.json({ ok: false }, { status: 502, headers: NO_STORE })
  }

  let links
  try {
    links = await listSponsorLinks()
  } catch (err) {
    console.error('[sponsor] reading sponsor links failed:', err instanceof Error ? err.message : 'unknown error')
    return NextResponse.json({ ok: false }, { status: 500, headers: NO_STORE })
  }

  const members = links.flatMap(link => {
    const grant = sponsors.get(link.githubUserId)
    if (!grant) return []
    return [{
      discordId:   link.discordUserId,
      // GitHub's current login, the stored one may predate a rename.
      githubLogin: grant.login || link.githubLogin || '',
      kind:        grant.kind,
      validUntil:  grant.validUntil ? grant.validUntil.toISOString() : null,
    }]
  })

  return NextResponse.json(
    { ok: true, generatedAt: new Date().toISOString(), members },
    { headers: NO_STORE },
  )
}
