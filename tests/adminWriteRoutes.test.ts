import { describe, it, expect, beforeAll, beforeEach, vi, type Mock } from 'vitest'

vi.mock('@/lib/db', () => ({ queryOne: vi.fn(), query: vi.fn() }))
vi.mock('@/lib/tebexPlugin', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/tebexPlugin')>()
  return {
    ...actual,
    tebexPlugin: {
      payments:  { createManual: vi.fn(), setStatus: vi.fn(), addNote: vi.fn(), list: vi.fn(), get: vi.fn(), fields: vi.fn(), paged: vi.fn() },
      coupons:   { create: vi.fn(), remove: vi.fn(), list: vi.fn(), get: vi.fn() },
      giftCards: { create: vi.fn(), topUp: vi.fn(), void: vi.fn(), list: vi.fn(), get: vi.fn(), lookup: vi.fn() },
      bans:      { create: vi.fn(), list: vi.fn() },
      packages:  { update: vi.fn() },
      lookup:    { user: vi.fn(), purchases: vi.fn() },
      information: vi.fn(),
    },
  }
})

import { queryOne } from '@/lib/db'
import { tebexPlugin } from '@/lib/tebexPlugin'
import { POST as paymentsPOST } from '@/app/api/admin/payments/route'
import { PATCH as paymentsPATCH } from '@/app/api/admin/payments/[txn]/route'
import { PUT as packagesPUT } from '@/app/api/admin/packages/[id]/route'
import { POST as couponsPOST } from '@/app/api/admin/coupons/route'
import { adminReq, serveAdminTeam, staticCtx } from './helpers'

const OWNER = [{ discord_user_id: 'boss', is_owner: 1 }]

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret'
  process.env.NEXT_PUBLIC_BASE_URL = 'https://www.msk-scripts.de'
})
beforeEach(() => { vi.clearAllMocks(); serveAdminTeam(queryOne as Mock, OWNER) })

describe('payments POST (give package)', () => {
  it('rejects a negative price without calling Tebex', async () => {
    const res = await paymentsPOST(adminReq('/api/admin/payments', { method: 'POST', userId: 'boss', body: { ign: 'Notch', packages: [{ id: 5 }], price: -1 } }), staticCtx)
    expect(res.status).toBe(400)
    expect(tebexPlugin.payments.createManual).not.toHaveBeenCalled()
  })

  it('rejects when no valid package id is given', async () => {
    const res = await paymentsPOST(adminReq('/api/admin/payments', { method: 'POST', userId: 'boss', body: { ign: 'Notch', packages: [], price: 0 } }), staticCtx)
    expect(res.status).toBe(400)
    expect(tebexPlugin.payments.createManual).not.toHaveBeenCalled()
  })

  it('creates a free manual payment on valid input', async () => {
    const res = await paymentsPOST(adminReq('/api/admin/payments', { method: 'POST', userId: 'boss', body: { ign: 'Notch', packages: [{ id: 5 }], price: 0 } }), staticCtx)
    expect(res.status).toBe(200)
    expect(tebexPlugin.payments.createManual).toHaveBeenCalledWith(expect.objectContaining({ ign: 'Notch', price: 0 }))
  })
})

describe('payments PATCH (refund)', () => {
  const ctx = { params: Promise.resolve({ txn: 'tbx-1' }) }

  it('rejects an invalid status', async () => {
    const res = await paymentsPATCH(adminReq('/api/admin/payments/tbx-1', { method: 'PATCH', userId: 'boss', body: { status: 'bogus' } }), ctx)
    expect(res.status).toBe(400)
    expect(tebexPlugin.payments.setStatus).not.toHaveBeenCalled()
  })

  it('performs a refund on a valid status', async () => {
    const res = await paymentsPATCH(adminReq('/api/admin/payments/tbx-1', { method: 'PATCH', userId: 'boss', body: { status: 'refund' } }), ctx)
    expect(res.status).toBe(200)
    expect(tebexPlugin.payments.setStatus).toHaveBeenCalledWith('tbx-1', 'refund')
  })
})

describe('packages PUT (edit)', () => {
  const ctx = { params: Promise.resolve({ id: '5' }) }

  it('rejects an empty update (no fields)', async () => {
    const res = await packagesPUT(adminReq('/api/admin/packages/5', { method: 'PUT', userId: 'boss', body: {} }), ctx)
    expect(res.status).toBe(400)
    expect(tebexPlugin.packages.update).not.toHaveBeenCalled()
  })

  it('updates only the provided fields', async () => {
    const res = await packagesPUT(adminReq('/api/admin/packages/5', { method: 'PUT', userId: 'boss', body: { name: 'New name' } }), ctx)
    expect(res.status).toBe(200)
    expect(tebexPlugin.packages.update).toHaveBeenCalledWith(5, { name: 'New name' })
  })
})

describe('coupons POST (create)', () => {
  it('rejects a missing code', async () => {
    const res = await couponsPOST(adminReq('/api/admin/coupons', { method: 'POST', userId: 'boss', body: { amount: 10, discountType: 'percentage', effectiveOn: 'cart' } }), staticCtx)
    expect(res.status).toBe(400)
    expect(tebexPlugin.coupons.create).not.toHaveBeenCalled()
  })

  it('creates a coupon on valid input', async () => {
    const res = await couponsPOST(adminReq('/api/admin/coupons', { method: 'POST', userId: 'boss', body: { code: 'SUMMER10', amount: 10, discountType: 'percentage', effectiveOn: 'cart' } }), staticCtx)
    expect(res.status).toBe(200)
    expect(tebexPlugin.coupons.create).toHaveBeenCalled()
  })
})
