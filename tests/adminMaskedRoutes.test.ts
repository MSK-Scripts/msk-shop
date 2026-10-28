import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

vi.mock('@/lib/db', () => ({ queryOne: vi.fn(), query: vi.fn() }))
vi.mock('@/lib/tebexPlugin', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/tebexPlugin')>()
  return {
    ...actual,
    tebexPlugin: {
      payments:  { list: vi.fn() },
      bans:      { list: vi.fn() },
      lookup:    { user: vi.fn() },
      giftCards: { list: vi.fn() },
      coupons:   { listAll: vi.fn() },
    },
  }
})
vi.mock('@/lib/imageUploads', () => ({ listUploads: vi.fn(), countPendingUploads: vi.fn() }))
vi.mock('@/lib/adminImages', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/adminImages')>()
  return { ...actual, listAdminImages: vi.fn(), adminImageStats: vi.fn() }
})

import { query, queryOne } from '@/lib/db'
import { tebexPlugin } from '@/lib/tebexPlugin'
import { listUploads, countPendingUploads } from '@/lib/imageUploads'
import { adminImageStats, listAdminImages } from '@/lib/adminImages'
import { GET as paymentsGET } from '@/app/api/admin/payments/route'
import { GET as bansGET } from '@/app/api/admin/bans/route'
import { GET as lookupGET } from '@/app/api/admin/lookup/route'
import { GET as giftcardsGET } from '@/app/api/admin/giftcards/route'
import { GET as couponsGET } from '@/app/api/admin/coupons/route'
import { GET as auditGET } from '@/app/api/admin/audit/route'
import { GET as uploadsGET } from '@/app/api/admin/image-uploads/route'
import { GET as imagesGET } from '@/app/api/admin/images/route'
import { GET as apiKeysGET } from '@/app/api/admin/api-keys/route'
import { GET as overviewGET } from '@/app/api/admin/overview/route'
import { adminReq, staticCtx } from './helpers'
import { ADMIN_FIXTURE, PERSONAL } from './fixtures/adminFixtures'

/**
 * Every admin route that hands out records which can hold an email or IP
 * address sends them masked (plan 7). Checked on the JSON the route sends,
 * the one thing that reaches the browser. Fixtures carry real-looking
 * addresses in every field Tebex and the database can put one in.
 */

const mQuery = query as Mock
const mQueryOne = queryOne as Mock

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret'
})

beforeEach(() => {
  vi.clearAllMocks()
  mQueryOne.mockImplementation(async (sql: string) => {
    if (sql.includes('msk_admin_team')) return { discord_user_id: 'boss', display_name: 'Musiker15', is_owner: 1, permissions: '[]', active: 1 }
    if (sql.includes('ticketbot_guilds')) return { recent: '3', previous: '1' }
    return null
  })
  mQuery.mockImplementation(async (sql: string) => {
    if (sql.includes('msk_admin_audit')) return ADMIN_FIXTURE.auditRows
    if (sql.includes('ticketbot_guilds')) return ADMIN_FIXTURE.guildRows
    return []
  })
  ;(tebexPlugin.payments.list as Mock).mockResolvedValue({ data: ADMIN_FIXTURE.payments })
  ;(tebexPlugin.bans.list as Mock).mockResolvedValue({ data: ADMIN_FIXTURE.bans })
  ;(tebexPlugin.lookup.user as Mock).mockResolvedValue(ADMIN_FIXTURE.lookup)
  ;(tebexPlugin.giftCards.list as Mock).mockResolvedValue({ data: ADMIN_FIXTURE.giftCards })
  ;(tebexPlugin.coupons.listAll as Mock).mockResolvedValue({ coupons: ADMIN_FIXTURE.coupons, truncated: false })
  ;(listUploads as Mock).mockResolvedValue(ADMIN_FIXTURE.uploads)
  ;(countPendingUploads as Mock).mockResolvedValue(2)
  ;(listAdminImages as Mock).mockResolvedValue({ total: 1, page: 1, per: 40, items: ADMIN_FIXTURE.images })
  ;(adminImageStats as Mock).mockResolvedValue(ADMIN_FIXTURE.imageStats)
})

async function body(handler: (req: never, ctx: never) => Promise<Response>, path: string): Promise<string> {
  const res = await handler(adminReq(path, { userId: 'boss' }) as never, staticCtx as never)
  expect(res.status).toBe(200)
  return JSON.stringify(await res.json())
}

function expectNoPersonalData(json: string) {
  for (const value of PERSONAL) expect(json, `leaks ${value}`).not.toContain(value)
}

describe('masked admin responses', () => {
  it.each([
    ['payments', paymentsGET, '/api/admin/payments'],
    ['bans', bansGET, '/api/admin/bans'],
    ['player lookup', lookupGET, '/api/admin/lookup?user=Atlas'],
    ['gift cards', giftcardsGET, '/api/admin/giftcards'],
    ['coupons', couponsGET, '/api/admin/coupons'],
    ['audit log', auditGET, '/api/admin/audit'],
    ['uploads', uploadsGET, '/api/admin/image-uploads?status=all'],
    ['images', imagesGET, '/api/admin/images'],
    ['overview', overviewGET, '/api/admin/overview'],
  ] as const)('%s send no email or IP address in full', async (_name, handler, path) => {
    expectNoPersonalData(await body(handler as never, path))
  })

  it('keep a masked email and IP on the row so it can be told apart and revealed', async () => {
    const payments = JSON.parse(await body(paymentsGET as never, '/api/admin/payments')).payments
    expect(payments[0].email).toMatch(/^m\*\*\*@g\*\*\*\.com #[0-9a-f]{4}$/)
    expect(payments[0].id).toBe(ADMIN_FIXTURE.payments[0].id)
    const bans = JSON.parse(await body(bansGET as never, '/api/admin/bans')).bans
    expect(bans[0].ip).toMatch(/^203\.0\.x\.x #[0-9a-f]{4}$/)
    expect(bans[0].payment_email).toMatch(/^c\*\*\*@e\*\*\*\.org #/)
  })

  it('shorten the API keys, whose full value is a reveal too', async () => {
    const json = await body(apiKeysGET as never, '/api/admin/api-keys')
    for (const row of ADMIN_FIXTURE.guildRows) expect(json).not.toContain(row.api_key)
    expect(JSON.parse(json).keys[0].apiKey).toBe('mskt_liv…2345')
  })

  it('give the audit log the name of the admin', async () => {
    const entries = JSON.parse(await body(auditGET as never, '/api/admin/audit')).entries
    expect(entries[0].adminName).toBe('Musiker15')
    expect(String(mQuery.mock.calls[0][0])).toMatch(/LEFT JOIN msk_admin_team/)
  })
})
