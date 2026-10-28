import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@/app/[lang]/admin/adminRequests'

/**
 * The requests of the admin areas after Phase 10. The routes behind them did
 * not change, so each body is pinned against what the old tab components
 * sent, written out here rather than derived from the module: a renamed key
 * would arrive at the route as missing and be refused, or silently ignored.
 */

const calls: Array<{ url: string; method: string; body: unknown }> = []
let reply: { status: number; body: unknown } = { status: 200, body: {} }

beforeEach(() => {
  calls.length = 0
  reply = { status: 200, body: {} }
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body === undefined ? undefined : JSON.parse(String(init.body)) })
    return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'content-type': 'application/json' } })
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

const last = () => calls[calls.length - 1]

describe('admin request bodies', () => {
  it.each([
    ['give a package', () => api.givePackage({ ign: ' Atlas_RP ', packageId: 6001, price: 0, note: '' }, 'x'),
      '/api/admin/payments', 'POST', { ign: 'Atlas_RP', packages: [{ id: 6001 }], price: 0 }],
    ['give a package with a note', () => api.givePackage({ ign: 'Atlas_RP', packageId: 6001, price: 4.5, note: ' Winner ' }, 'x'),
      '/api/admin/payments', 'POST', { ign: 'Atlas_RP', packages: [{ id: 6001 }], price: 4.5, note: 'Winner' }],
    ['refund', () => api.refundPayment('51240', 'x'), '/api/admin/payments/51240', 'PATCH', { status: 'refund' }],
    ['create a coupon', () => api.createCoupon({ code: ' AUTUMN20 ', discountType: 'percentage', amount: 20, effectiveOn: 'package', ids: ['6001', '6002'] }, 'x'),
      '/api/admin/coupons', 'POST', { code: 'AUTUMN20', discountType: 'percentage', amount: 20, effectiveOn: 'package', ids: '6001,6002' }],
    ['delete a coupon', () => api.deleteCoupon(901, 'x'), '/api/admin/coupons/901', 'DELETE', undefined],
    ['create a gift card', () => api.createGiftCard({ amount: 25, note: '', expiresAt: '' }, 'x'), '/api/admin/giftcards', 'POST', { amount: 25 }],
    ['create a gift card with note and expiry', () => api.createGiftCard({ amount: 25, note: ' Goodwill ', expiresAt: '2026-12-31' }, 'x'),
      '/api/admin/giftcards', 'POST', { amount: 25, note: 'Goodwill', expiresAt: '2026-12-31' }],
    ['top up a gift card', () => api.topUpGiftCard(301, 5, 'x'), '/api/admin/giftcards/301', 'PUT', { amount: 5 }],
    ['void a gift card', () => api.voidGiftCard(301, 'x'), '/api/admin/giftcards/301', 'DELETE', undefined],
    ['edit a package', () => api.updatePackage(6001, { price: 19 }, 'x'), '/api/admin/packages/6001', 'PUT', { price: 19 }],
    ['hide a package', () => api.updatePackage(6001, { disabled: true }, 'x'), '/api/admin/packages/6001', 'PUT', { disabled: true }],
    ['ban without IP', () => api.createBan({ user: ' quick_buyer ', reason: ' Fraud ', ip: ' ' }, 'x'), '/api/admin/bans', 'POST', { user: 'quick_buyer', reason: 'Fraud' }],
    ['ban with IP', () => api.createBan({ user: 'quick_buyer', reason: 'Fraud', ip: '203.0.113.42' }, 'x'), '/api/admin/bans', 'POST', { user: 'quick_buyer', reason: 'Fraud', ip: '203.0.113.42' }],
    ['change an API key', () => api.updateApiKey('900394679634370640', { tier: 'premium', statsExcluded: true, keyOrigin: 'giveaway' }, 'x'),
      '/api/admin/api-keys/900394679634370640', 'PATCH', { tier: 'premium', statsExcluded: true, keyOrigin: 'giveaway' }],
    ['edit an image', () => api.updateImage('vehicles', 'adder', { label: 'Adder', tags: 'a, b', category: 'vehicles' }, 'x'),
      '/api/admin/images/vehicles/adder', 'PATCH', { label: 'Adder', tags: 'a, b', category: 'vehicles' }],
    ['hide an image', () => api.updateImage('vehicles', 'adder', { status: 'hidden' }, 'x'), '/api/admin/images/vehicles/adder', 'PATCH', { status: 'hidden' }],
    ['delete an image', () => api.deleteImage('vehicles', 'adder', 'x'), '/api/admin/images/vehicles/adder', 'DELETE', undefined],
    ['approve an upload', () => api.decideUpload('u-1', { approve: 'vehicles' }, 'x'), '/api/admin/image-uploads/u-1', 'POST', { decision: 'approve', category: 'vehicles' }],
    ['reject an upload', () => api.decideUpload('u-1', { reject: 'Watermark' }, 'x'), '/api/admin/image-uploads/u-1', 'POST', { decision: 'reject', reason: 'Watermark' }],
    ['add a team member', () => api.addTeamMember({ discordUserId: ' 333333333333333333 ', displayName: ' ', permissions: ['payments.view'] }, 'x'),
      '/api/admin/team', 'POST', { discordUserId: '333333333333333333', permissions: ['payments.view'] }],
    ['update a team member', () => api.updateTeamMember('333333333333333333', { permissions: ['bans.manage'], active: false }, 'x'),
      '/api/admin/team/333333333333333333', 'PATCH', { permissions: ['bans.manage'], active: false }],
    ['remove a team member', () => api.removeTeamMember('333333333333333333', 'x'), '/api/admin/team/333333333333333333', 'DELETE', undefined],
    ['reveal a value', () => api.revealValue('ban', '77', 'ip', 'x'), '/api/admin/reveal', 'POST', { kind: 'ban', id: '77', field: 'ip' }],
  ] as const)('%s', async (_name, run, url, method, body) => {
    await run()
    expect(last()).toEqual({ url, method, body })
  })

  it('saves the news popup wrapped in settings and returns what was stored', async () => {
    const settings = { enabled: true, title: 'T', text: 'X', button: null, secondButton: null, coupon: null }
    reply = { status: 200, body: { settings: { ...settings, title: 'Stored' } } }
    const stored = await api.saveNewsPopup(settings as never, 'x')
    expect(last()).toEqual({ url: '/api/admin/news-popup', method: 'PUT', body: { settings } })
    expect(stored.title).toBe('Stored')
  })

  it('looks a player up by the address of the old tab', async () => {
    reply = { status: 200, body: { result: { player: { id: '1' } } } }
    expect(await api.lookupPlayer(' Atlas RP ', 'x')).toEqual({ player: { id: '1' } })
    expect(last()).toEqual({ url: '/api/admin/lookup?user=Atlas%20RP', method: 'GET', body: undefined })
  })
})

describe('admin request errors', () => {
  it('passes on the sentence of the route', async () => {
    reply = { status: 400, body: { error: 'Code is required.' } }
    await expect(api.deleteCoupon(1, 'Delete failed.')).rejects.toThrow('Code is required.')
  })

  it('uses the fallback for a body that is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Too many requests', { status: 429 })))
    await expect(api.voidGiftCard(1, 'Void failed.')).rejects.toMatchObject({ message: 'Void failed.', status: 429 })
  })
})
