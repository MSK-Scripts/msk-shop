import { describe, expect, it } from 'vitest'

import { aboutFigures } from '@/lib/aboutFigures'
import type { ShopStats } from '@/lib/shopStats'

/**
 * The about page shows measured figures, among them the share of refunded or
 * charged-back payments (decision E6). What is shown there must be the
 * measured value with its counts, and a figure without a source must vanish
 * instead of turning into a zero or an estimate.
 */

const stats: ShopStats = {
  uniqueBuyers: 1234,
  totalPayments: 1500,
  completedPayments: 1385,
  refunds: 8,
  chargebacks: 3,
  reversalRate: 11 / 1396,
  firstPaymentAt: new Date('2022-06-14T10:00:00Z'),
  updatedAt: new Date('2026-10-28T03:00:00Z'),
}

const byLabel = (figures: ReturnType<typeof aboutFigures>, part: string) =>
  figures.find(f => f.label.includes(part))

describe('aboutFigures', () => {
  it('states the reversal rate with the counts it comes from', () => {
    const de = byLabel(aboutFigures('de', stats, 262, 252), 'erstattet oder zurückgebucht')
    expect(de?.value).toBe('0,79 %')
    expect(de?.source).toBe('8 Erstattungen und 3 Rückbuchungen bei 1.396 abgerechneten Zahlungen')
    const en = byLabel(aboutFigures('en', stats, 262, 252), 'refunded or charged back')
    expect(en?.value).toBe('0.79%')
    expect(en?.source).toBe('8 refunds and 3 chargebacks out of 1,396 settled payments')
  })

  it('leaves out every shop figure when the snapshot is missing', () => {
    const figures = aboutFigures('en', null, 262, 252)
    expect(figures.map(f => f.label)).toEqual(['servers running msk_core', 'documentation pages'])
  })

  it('shows no rate before a single payment was settled', () => {
    const none = { ...stats, completedPayments: 0, refunds: 0, chargebacks: 0, reversalRate: 0 }
    expect(byLabel(aboutFigures('en', none, null, null), 'refunded')).toBeUndefined()
  })

  it('drops a source that returned nothing usable', () => {
    const figures = aboutFigures('en', stats, null, 0)
    expect(byLabel(figures, 'servers')).toBeUndefined()
    expect(byLabel(figures, 'documentation')).toBeUndefined()
    expect(byLabel(figures, 'unique buyers')?.value).toBe('1,234')
  })
})
