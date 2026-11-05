import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * GitHub Sponsors -> Discord role.
 *
 * What must hold:
 *   - only a link token signed with SPONSOR_LINK_SECRET, unexpired and for our
 *     guild starts the GitHub sign-in (the bot implements the same contract);
 *   - the validity rule: monthly while active, one-time for 30 days, at least
 *     $5, users only, the best of several sponsorships;
 *   - the members list is only handed out against the sync secret, and a
 *     failed GitHub query never reads as an empty list.
 */

vi.mock('@/lib/db', () => ({ query: vi.fn(async () => []), queryOne: vi.fn(async () => null), withTransaction: vi.fn() }))

import { GET as membersGET } from '@/app/api/sponsor/members/route'
import { query } from '@/lib/db'
import {
  bearerMatches, parseSponsorStatus, readSponsorConfig, readStateCookie, signLinkToken, signStateCookie,
  verifyLinkToken, type LinkPayload,
} from '@/lib/sponsorLink'
import { evaluateSponsorships, type SponsorshipNode } from '@/lib/sponsors'

const SECRET = 'l'.repeat(40)
const SYNC   = 's'.repeat(40)
const GUILD  = '111111111111111111'
const USER   = '400000000000000001'
const NOW    = Date.parse('2026-11-05T12:00:00Z')
const DAY    = 24 * 60 * 60 * 1000

function payload(over: Partial<LinkPayload> = {}): LinkPayload {
  return { v: 1, d: USER, g: GUILD, exp: Math.floor(NOW / 1000) + 900, n: 'a1b2c3d4', ...over }
}

describe('link token', () => {
  const verify = (t: string | null) => verifyLinkToken(t, { secret: SECRET, guildId: GUILD, nowMs: NOW })

  it('accepts a valid token and returns the Discord user', () => {
    expect(verify(signLinkToken(payload(), SECRET))).toEqual({ discordId: USER })
  })

  it('matches the contract byte for byte (prefix, base64url, HMAC-SHA256)', async () => {
    const { createHmac } = await import('crypto')
    const b64 = Buffer.from(JSON.stringify(payload())).toString('base64url')
    const sig = createHmac('sha256', SECRET).update('sponsor-link.' + b64).digest('base64url')
    expect(verify(`${b64}.${sig}`)).toEqual({ discordId: USER })
  })

  it('rejects a tampered payload', () => {
    const [, sig] = signLinkToken(payload(), SECRET).split('.')
    const forged = Buffer.from(JSON.stringify(payload({ d: '400000000000000002' }))).toString('base64url')
    expect(verify(`${forged}.${sig}`)).toBeNull()
  })

  it('rejects a tampered signature and a foreign secret', () => {
    const token = signLinkToken(payload(), SECRET)
    expect(verify(token.slice(0, -2) + (token.endsWith('AA') ? 'BB' : 'AA'))).toBeNull()
    expect(verify(signLinkToken(payload(), 'x'.repeat(40)))).toBeNull()
  })

  it('rejects an expired token', () => {
    expect(verify(signLinkToken(payload({ exp: Math.floor(NOW / 1000) - 1 }), SECRET))).toBeNull()
    expect(verify(signLinkToken(payload({ exp: Math.floor(NOW / 1000) }), SECRET))).toBeNull()
  })

  it('rejects a token for another guild', () => {
    expect(verify(signLinkToken(payload({ g: '222222222222222222' }), SECRET))).toBeNull()
  })

  it('rejects a wrong version, non-snowflake ids and garbage', () => {
    expect(verify(signLinkToken({ ...payload(), v: 2 } as unknown as LinkPayload, SECRET))).toBeNull()
    expect(verify(signLinkToken(payload({ d: '123' }), SECRET))).toBeNull()
    expect(verify(signLinkToken(payload({ d: `${USER}\n` }), SECRET))).toBeNull()
    expect(verify(null)).toBeNull()
    expect(verify('nodot')).toBeNull()
    expect(verify('.sig')).toBeNull()
  })
})

describe('state cookie', () => {
  it('round-trips and expires after ten minutes', () => {
    const c = signStateCookie({ discordId: USER, state: 'f'.repeat(32) }, SECRET, NOW)
    expect(readStateCookie(c, SECRET, NOW + 60_000)).toEqual({ discordId: USER, state: 'f'.repeat(32) })
    expect(readStateCookie(c, SECRET, NOW + 10 * 60_000)).toBeNull()
  })

  it('is not interchangeable with a link token', () => {
    expect(readStateCookie(signLinkToken(payload(), SECRET), SECRET, NOW)).toBeNull()
    const c = signStateCookie({ discordId: USER, state: 'f'.repeat(32) }, SECRET, NOW)
    expect(verifyLinkToken(c, { secret: SECRET, guildId: GUILD, nowMs: NOW })).toBeNull()
  })
})

describe('config', () => {
  const full = {
    SPONSOR_LINK_SECRET: SECRET, GITHUB_SPONSOR_CLIENT_ID: 'id', GITHUB_SPONSOR_CLIENT_SECRET: 'cs',
    GITHUB_SPONSORS_TOKEN: 'tok', SPONSOR_DISCORD_BOT_TOKEN: 'bot', SPONSOR_GUILD_ID: GUILD, SPONSOR_ROLE_ID: USER,
  }

  it('is complete with all variables and defaults the org', () => {
    const r = readSponsorConfig(full)
    expect(r.ok && r.config.githubOrg).toBe('MSK-Scripts')
  })

  it('fails closed on a short secret or a missing variable, naming them without values', () => {
    const r = readSponsorConfig({ ...full, SPONSOR_LINK_SECRET: 'short', SPONSOR_DISCORD_BOT_TOKEN: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.missing.join()).toContain('SPONSOR_LINK_SECRET')
      expect(r.missing.join()).toContain('SPONSOR_DISCORD_BOT_TOKEN')
      expect(r.missing.join()).not.toContain('short')
    }
  })
})

describe('result status', () => {
  it('passes known statuses and turns anything else into error', () => {
    expect(parseSponsorStatus('granted')).toBe('granted')
    expect(parseSponsorStatus('<script>')).toBe('error')
    expect(parseSponsorStatus(['granted'])).toBe('error')
    expect(parseSponsorStatus(undefined)).toBe('error')
  })
})

// ── Validity rule ────────────────────────────────────────────────────────────

function node(over: Partial<SponsorshipNode> & { id?: number; type?: string; price?: number; oneTime?: boolean } = {}): SponsorshipNode {
  const { id = 42, type = 'User', price = 5, oneTime = false, ...rest } = over
  return {
    isActive:         true,
    isOneTimePayment: oneTime,
    createdAt:        new Date(NOW - 400 * DAY).toISOString(),
    tierSelectedAt:   new Date(NOW - 400 * DAY).toISOString(),
    tier:             { monthlyPriceInDollars: price, isOneTime: oneTime },
    sponsorEntity:    { __typename: type, login: 'octo', databaseId: id },
    ...rest,
  }
}

describe('evaluateSponsorships', () => {
  const run = (nodes: SponsorshipNode[]) => evaluateSponsorships(nodes, NOW)

  it('counts an active monthly sponsorship, open-ended', () => {
    expect(run([node()]).get(42)).toEqual({ githubId: 42, login: 'octo', kind: 'monthly', validUntil: null })
  })

  it('does not count an inactive monthly sponsorship', () => {
    expect(run([node({ isActive: false })]).size).toBe(0)
  })

  it('counts a one-time payment for 30 days from the later date', () => {
    const paid = NOW - 10 * DAY
    const g = run([node({ oneTime: true, isActive: false, createdAt: new Date(NOW - 50 * DAY).toISOString(), tierSelectedAt: new Date(paid).toISOString() })]).get(42)
    expect(g?.kind).toBe('one_time')
    expect(g?.validUntil?.getTime()).toBe(paid + 30 * DAY)
  })

  it('also takes createdAt when it is the later date', () => {
    const g = run([node({ oneTime: true, createdAt: new Date(NOW - 5 * DAY).toISOString(), tierSelectedAt: new Date(NOW - 90 * DAY).toISOString() })]).get(42)
    expect(g?.validUntil?.getTime()).toBe(NOW + 25 * DAY)
  })

  it('drops a one-time payment after 30 days', () => {
    const at = new Date(NOW - 30 * DAY).toISOString()
    expect(run([node({ oneTime: true, createdAt: at, tierSelectedAt: at })]).size).toBe(0)
  })

  it('treats a one-time tier as one-time even without isOneTimePayment', () => {
    const g = run([node({ tier: { monthlyPriceInDollars: 5, isOneTime: true } })]).get(42)
    expect(g).toBeUndefined()
  })

  it('ignores tiers below $5', () => {
    expect(run([node({ price: 4 })]).size).toBe(0)
    expect(run([node({ tier: null })]).size).toBe(0)
    const at = new Date(NOW - DAY).toISOString()
    expect(run([node({ oneTime: true, price: 1, createdAt: at, tierSelectedAt: at })]).size).toBe(0)
  })

  it('ignores organization sponsors and nodes without a database id', () => {
    expect(run([node({ type: 'Organization' })]).size).toBe(0)
    expect(run([node({ sponsorEntity: { __typename: 'User', login: 'x', databaseId: null } })]).size).toBe(0)
  })

  it('takes the best of several sponsorships of one user', () => {
    const early = new Date(NOW - 20 * DAY).toISOString()
    const late  = new Date(NOW - 2 * DAY).toISOString()
    const oneEarly = node({ oneTime: true, createdAt: early, tierSelectedAt: early })
    const oneLate  = node({ oneTime: true, createdAt: late, tierSelectedAt: late })

    expect(run([oneEarly, oneLate]).get(42)?.validUntil?.getTime()).toBe(Date.parse(late) + 30 * DAY)
    expect(run([oneLate, oneEarly]).get(42)?.validUntil?.getTime()).toBe(Date.parse(late) + 30 * DAY)
    expect(run([oneLate, node()]).get(42)?.kind).toBe('monthly')
    expect(run([node(), oneLate]).get(42)?.kind).toBe('monthly')
    expect(run([node({ isActive: false }), oneEarly]).get(42)?.kind).toBe('one_time')
  })

  it('keeps users apart by database id', () => {
    const r = run([node({ id: 1 }), node({ id: 2, isActive: false })])
    expect([...r.keys()]).toEqual([1])
  })
})

// ── Members endpoint ─────────────────────────────────────────────────────────

describe('GET /api/sponsor/members', () => {
  const saved = { ...process.env }
  const req = (auth?: string) => new Request('https://www.msk-scripts.de/api/sponsor/members', {
    headers: auth ? { authorization: auth } : {},
  })

  beforeEach(() => {
    Object.assign(process.env, {
      SPONSOR_SYNC_SECRET: SYNC, SPONSOR_LINK_SECRET: SECRET, GITHUB_SPONSOR_CLIENT_ID: 'id',
      GITHUB_SPONSOR_CLIENT_SECRET: 'cs', GITHUB_SPONSORS_TOKEN: 'tok', SPONSOR_DISCORD_BOT_TOKEN: 'bot',
      SPONSOR_GUILD_ID: GUILD, SPONSOR_ROLE_ID: USER,
    })
    vi.mocked(query).mockReset()
  })

  afterEach(() => {
    process.env = { ...saved }
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('answers 401 without a bearer', async () => {
    const res = await membersGET(req())
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ ok: false })
  })

  it('answers 401 with a wrong bearer, also one of the right length', async () => {
    expect((await membersGET(req('Bearer wrong'))).status).toBe(401)
    expect((await membersGET(req(`Bearer ${'t'.repeat(40)}`))).status).toBe(401)
    expect((await membersGET(req(`Basic ${SYNC}`))).status).toBe(401)
  })

  it('fails closed when the sync secret is unset or too short', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.SPONSOR_SYNC_SECRET = 'short'
    expect((await membersGET(req('Bearer short'))).status).toBe(503)
  })

  it('lists linked users with a valid sponsorship', async () => {
    vi.mocked(query).mockResolvedValue([
      { discord_user_id: USER, github_user_id: 42, github_login: 'old-name' },
      { discord_user_id: '400000000000000002', github_user_id: 7, github_login: 'gone' },
    ])
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      data: { organization: { sponsorshipsAsMaintainer: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [node(), node({ id: 7, isActive: false })],
      } } },
    }))))

    const res = await membersGET(req(`Bearer ${SYNC}`))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.members).toEqual([{ discordId: USER, githubLogin: 'octo', kind: 'monthly', validUntil: null }])
  })

  it('answers 502 when GitHub fails, never an empty list', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(query).mockResolvedValue([{ discord_user_id: USER, github_user_id: 42, github_login: 'octo' }])
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ errors: [{ type: 'FORBIDDEN' }] }))))
    const res = await membersGET(req(`Bearer ${SYNC}`))
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ ok: false })
  })
})

describe('bearerMatches', () => {
  it('needs the exact secret after "Bearer "', () => {
    expect(bearerMatches(`Bearer ${SYNC}`, SYNC)).toBe(true)
    expect(bearerMatches(`Bearer ${SYNC}x`, SYNC)).toBe(false)
    expect(bearerMatches(null, SYNC)).toBe(false)
  })
})
