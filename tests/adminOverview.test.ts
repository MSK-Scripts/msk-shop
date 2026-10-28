import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

vi.mock('@/lib/db', () => ({ queryOne: vi.fn(), query: vi.fn() }))
vi.mock('@/lib/tebexPlugin', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/tebexPlugin')>()
  return { ...actual, tebexPlugin: { payments: { list: vi.fn() } } }
})
vi.mock('@/lib/imageUploads', () => ({ countPendingUploads: vi.fn() }))
vi.mock('@/lib/adminImages', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/adminImages')>()
  return { ...actual, adminImageStats: vi.fn() }
})

import { queryOne } from '@/lib/db'
import { tebexPlugin } from '@/lib/tebexPlugin'
import { countPendingUploads } from '@/lib/imageUploads'
import { adminImageStats } from '@/lib/adminImages'
import { DAY_MS, paymentKind, percentChange, summarizePayments } from '@/lib/adminPayments'
import { GET } from '@/app/api/admin/overview/route'
import { adminReq, staticCtx } from './helpers'
import { ADMIN_FIXTURE } from './fixtures/adminFixtures'

/**
 * The admin overview (plan 6.6): what is counted, and that each figure is
 * only computed for someone who may open the area behind it.
 */

const NOW = Date.parse('2026-10-28T12:00:00Z')
const at = (days: number) => new Date(NOW - days * DAY_MS).toISOString()
const p = (days: number, amount: number, status = 'Complete') => ({ amount, date: at(days), status, currency: { iso_4217: 'EUR' } })

describe('paymentKind', () => {
  it('tells paid, free, refunded and charged back apart', () => {
    expect(paymentKind({ amount: 12.99, status: 'Complete' })).toBe('paid')
    expect(paymentKind({ amount: 0, status: 'Complete' })).toBe('free')
    expect(paymentKind({ amount: 12.99, status: 'Refund' })).toBe('refunded')
    expect(paymentKind({ amount: 12.99, status: 'Chargeback' })).toBe('chargeback')
    expect(paymentKind({ amount: 12.99, status: 'Pending' })).toBe('other')
  })
})

describe('summarizePayments', () => {
  it('counts the last 30 days and compares with the 30 before', () => {
    const s = summarizePayments([p(1, 10), p(2, 0), p(3, 5, 'Refund'), p(4, 7, 'Chargeback'), p(20, 20), p(40, 15), p(70, 99)], NOW, 100)
    expect(s).toMatchObject({ currency: 'EUR', revenue: 30, previousRevenue: 15, payments: 5, free: 1, refunds: 1, chargebacks: 1, complete: true })
  })

  it('says so when the latest payments do not reach back 30 days', () => {
    const full = Array.from({ length: 100 }, (_, i) => p(i * 0.1, 1))
    const s = summarizePayments(full, NOW, 100)
    expect(s.complete).toBe(false)
    expect(s.previousRevenue).toBeNull()
  })

  it('gives no trend without a previous period to compare with', () => {
    expect(percentChange(30, 15)).toBe(100)
    expect(percentChange(30, 0)).toBeNull()
    expect(percentChange(30, null)).toBeNull()
  })
})

describe('overview route', () => {
  const TEAM: Record<string, string[] | 'owner'> = { boss: 'owner', payer: ['payments.view'], images: ['images.view'], keys: ['api_key.change'] }

  beforeAll(() => { process.env.SESSION_SECRET = 'test-secret' })
  beforeEach(() => {
    vi.clearAllMocks()
    ;(queryOne as Mock).mockImplementation(async (sql: string, params: unknown[]) => {
      if (sql.includes('msk_admin_team')) {
        const perms = TEAM[String(params[0])]
        if (!perms) return null
        return { discord_user_id: params[0], display_name: null, is_owner: perms === 'owner' ? 1 : 0, permissions: JSON.stringify(perms === 'owner' ? [] : perms), active: 1 }
      }
      return { recent: '3', previous: '1' }
    })
    ;(tebexPlugin.payments.list as Mock).mockResolvedValue({ data: ADMIN_FIXTURE.payments })
    ;(countPendingUploads as Mock).mockResolvedValue(2)
    ;(adminImageStats as Mock).mockResolvedValue(ADMIN_FIXTURE.imageStats)
  })

  async function overview(userId: string) {
    const res = await GET(adminReq('/api/admin/overview', { userId }), staticCtx)
    return { status: res.status, body: await res.json() }
  }

  it('gives the owner every section', async () => {
    const { body } = await overview('boss')
    expect(body.overview.sales.ok).toBe(true)
    expect(body.overview.apiKeys).toEqual({ ok: true, data: { recent: 3, previous: 1 } })
    expect(body.overview.images).toEqual({ ok: true, data: { pendingUploads: 2, missingLabel: 1994 } })
  })

  it('computes only the sections of the member’s permissions', async () => {
    const payer = await overview('payer')
    expect(payer.body.overview.apiKeys).toBeNull()
    expect(payer.body.overview.images).toBeNull()
    expect(adminImageStats).not.toHaveBeenCalled()

    vi.clearAllMocks()
    const images = await overview('images')
    expect(images.body.overview.sales).toBeNull()
    expect(tebexPlugin.payments.list).not.toHaveBeenCalled()
    expect(images.body.overview.images.ok).toBe(true)

    const keys = await overview('keys')
    expect(keys.body.overview.apiKeys.ok).toBe(true)
    expect(keys.body.overview.sales).toBeNull()
  })

  it('reports a failing source without losing the others', async () => {
    ;(tebexPlugin.payments.list as Mock).mockRejectedValue(new Error('tebex down'))
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { status, body } = await overview('boss')
    errors.mockRestore()
    expect(status).toBe(200)
    expect(body.overview.sales).toEqual({ ok: false })
    expect(body.overview.images.ok).toBe(true)
  })
})
