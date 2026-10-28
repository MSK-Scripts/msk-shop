import { NextRequest } from 'next/server'
import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

vi.mock('@/lib/db', () => ({ queryOne: vi.fn(), query: vi.fn() }))
vi.mock('@/lib/tebexPlugin', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/tebexPlugin')>()
  return {
    ...actual,
    tebexPlugin: {
      payments: { list: vi.fn() },
      bans:     { list: vi.fn() },
    },
  }
})

import { query, queryOne } from '@/lib/db'
import { tebexPlugin } from '@/lib/tebexPlugin'
import { REVEAL_LIMIT, parseRevealRequest } from '@/lib/adminReveal'
import { POST } from '@/app/api/admin/reveal/route'
import { adminReq, staticCtx } from './helpers'

/**
 * `POST /api/admin/reveal`, the one way to the full value of a masked field
 * (plan 7). Rights and a data path: who may see which address, and that every
 * look at one is on record. Counter-checks in the Phase 10 log.
 */

const EMAIL = 'maximilian.mustermann@gmail.com'
const BAN_EMAIL = 'chargeback.buyer@example.org'
const IP = '203.0.113.42'
const API_KEY = 'mskt_live_abcdefghijklmnopqrstuvwxyz012345'

interface TeamRow { discord_user_id: string; is_owner: number; permissions: string }
const TEAM: Record<string, TeamRow> = {}
function member(id: string, permissions: string[], owner = false) {
  TEAM[id] = { discord_user_id: id, is_owner: owner ? 1 : 0, permissions: JSON.stringify(permissions) }
}
member('boss', [], true)
member('payer', ['payments.view'])
member('banner', ['bans.manage'])
member('keys', ['api_key.view'])
member('images', ['images.view'])

const mQuery = query as Mock
const mQueryOne = queryOne as Mock

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret'
  process.env.NEXT_PUBLIC_BASE_URL = 'https://www.msk-scripts.de'
})

beforeEach(() => {
  vi.clearAllMocks()
  mQueryOne.mockImplementation(async (sql: string, params: unknown[]) => {
    if (sql.includes('msk_admin_team')) {
      const row = TEAM[String(params[0])]
      return row ? { ...row, display_name: null, active: 1 } : null
    }
    if (sql.includes('ticketbot_guilds')) return String(params[0]) === '900394679634370640' ? { api_key: API_KEY } : null
    return null
  })
  mQuery.mockResolvedValue([])
  ;(tebexPlugin.payments.list as Mock).mockResolvedValue({ data: [{ id: 51234, email: EMAIL, amount: 12.99, status: 'Complete' }] })
  ;(tebexPlugin.bans.list as Mock).mockResolvedValue({ data: [{ id: 77, ip: IP, payment_email: BAN_EMAIL, reason: 'Chargeback', user: { ign: 'Atlas', uuid: null } }] })
})

function reveal(userId: string, body: unknown) {
  return POST(adminReq('/api/admin/reveal', { method: 'POST', userId, body }), staticCtx)
}

/** The INSERTs into the audit log, as [discord_user_id, action, target, detail]. */
function auditRows(): unknown[][] {
  return mQuery.mock.calls.filter(([sql]) => String(sql).includes('INSERT INTO msk_admin_audit')).map(([, params]) => params as unknown[])
}

describe('reveal allowed', () => {
  it('hands out the email of a payment and records exactly one entry', async () => {
    const res = await reveal('payer', { kind: 'payment', id: '51234', field: 'email' })
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({ value: EMAIL })
    expect(auditRows()).toEqual([['payer', 'data.reveal', 'payment:51234', JSON.stringify({ field: 'email' })]])
  })

  it('hands out only the field asked for', async () => {
    const res = await reveal('banner', { kind: 'ban', id: '77', field: 'ip' })
    expect(await res.json()).toEqual({ value: IP })
    const email = await reveal('banner', { kind: 'ban', id: '77', field: 'email' })
    expect(await email.json()).toEqual({ value: BAN_EMAIL })
    expect(auditRows().map(r => r[3])).toEqual([JSON.stringify({ field: 'ip' }), JSON.stringify({ field: 'email' })])
  })

  it('hands out an API key to someone who may view keys', async () => {
    const res = await reveal('keys', { kind: 'apikey', id: '900394679634370640', field: 'apiKey' })
    expect(await res.json()).toEqual({ value: API_KEY })
    expect(auditRows()).toHaveLength(1)
  })

  it('never writes the value into the log', async () => {
    await reveal('boss', { kind: 'payment', id: '51234', field: 'email' })
    expect(JSON.stringify(auditRows())).not.toContain(EMAIL)
  })

  it('sends nothing when the entry cannot be written', async () => {
    mQuery.mockRejectedValue(new Error('db down'))
    const res = await reveal('payer', { kind: 'payment', id: '51234', field: 'email' })
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain(EMAIL)
  })
})

describe('reveal refused', () => {
  it('without a session', async () => {
    const req = new NextRequest(new URL('/api/admin/reveal', 'https://www.msk-scripts.de'), {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.9.0.1' },
      body: JSON.stringify({ kind: 'payment', id: '51234', field: 'email' }),
    })
    const res = await POST(req, staticCtx)
    expect(res.status).toBe(401)
    expect(auditRows()).toHaveLength(0)
  })

  it('without any permission that reveals', async () => {
    const res = await reveal('images', { kind: 'payment', id: '51234', field: 'email' })
    expect(res.status).toBe(403)
    expect(tebexPlugin.payments.list).not.toHaveBeenCalled()
    expect(auditRows()).toHaveLength(0)
  })

  it('without the permission of the area the record belongs to', async () => {
    const res = await reveal('payer', { kind: 'ban', id: '77', field: 'ip' })
    expect(res.status).toBe(403)
    expect(tebexPlugin.bans.list).not.toHaveBeenCalled()
    expect(auditRows()).toHaveLength(0)
  })

  it.each([
    ['an unknown field', { kind: 'payment', id: '51234', field: 'ip' }],
    ['a field of another kind', { kind: 'payment', id: '51234', field: 'apiKey' }],
    ['an unknown kind', { kind: 'customer', id: '1', field: 'email' }],
    ['a malformed id', { kind: 'ban', id: '77; DROP TABLE', field: 'ip' }],
    ['no body', null],
  ])('for %s', async (_case, body) => {
    const res = await reveal('boss', body)
    expect(res.status).toBe(400)
    expect(auditRows()).toHaveLength(0)
  })

  it('for an unknown id, looking exactly like a missing permission', async () => {
    const unknown = await reveal('banner', { kind: 'ban', id: '78', field: 'ip' })
    const forbidden = await reveal('payer', { kind: 'ban', id: '77', field: 'ip' })
    const noRight = await reveal('images', { kind: 'ban', id: '77', field: 'ip' })
    const unknownKey = await reveal('keys', { kind: 'apikey', id: '123456789012345678', field: 'apiKey' })
    const bodies = await Promise.all([unknown, forbidden, noRight, unknownKey].map(r => r.json()))
    expect([unknown.status, forbidden.status, noRight.status, unknownKey.status]).toEqual([403, 403, 403, 403])
    expect(new Set(bodies.map(b => JSON.stringify(b))).size).toBe(1)
    expect(auditRows()).toHaveLength(0)
  })

  it('when the admin has revealed too much in a short time', async () => {
    member('busy', ['payments.view'])
    for (let i = 0; i < REVEAL_LIMIT.limit; i++) {
      const ok = await reveal('busy', { kind: 'payment', id: '51234', field: 'email' })
      expect(ok.status).toBe(200)
    }
    const limited = await reveal('busy', { kind: 'payment', id: '51234', field: 'email' })
    expect(limited.status).toBe(429)
    expect(JSON.stringify(await limited.json())).not.toContain(EMAIL)
    expect(auditRows()).toHaveLength(REVEAL_LIMIT.limit)
  })

  it('from a foreign origin', async () => {
    const res = await POST(adminReq('/api/admin/reveal', { method: 'POST', userId: 'boss', origin: 'https://evil.example', body: { kind: 'payment', id: '51234', field: 'email' } }), staticCtx)
    expect(res.status).toBe(403)
    expect(auditRows()).toHaveLength(0)
  })
})

describe('parseRevealRequest', () => {
  it('accepts exactly the allow-list', () => {
    expect(parseRevealRequest({ kind: 'payment', id: '51234', field: 'email' })).toEqual({ kind: 'payment', id: '51234', field: 'email' })
    expect(parseRevealRequest({ kind: 'payment', id: 51234, field: 'email' })).toBeNull()
    expect(parseRevealRequest({ kind: 'ban', id: '77', field: 'apiKey' })).toBeNull()
    expect(parseRevealRequest({ kind: 'apikey', id: 'abc', field: 'apiKey' })).toBeNull()
  })
})
