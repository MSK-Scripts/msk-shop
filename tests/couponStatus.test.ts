import { describe, it, expect } from 'vitest'
import { couponState, isCouponActive, countCouponStates, isTrue } from '@/lib/couponStatus'

// Fixed clock so none of these depend on the day they run.
const NOW = Date.parse('2026-08-15T12:00:00Z')

/** Shapes copied verbatim from the live store, string booleans included. */
const LIVE = {
  // Cart-wide, never expires, unlimited — visible in the Tebex panel.
  ox10: {
    start_date: '2026-01-04T01:46:00+00:00',
    expire: { redeem_unlimited: 'true', expire_never: 'true', limit: 0, date: '1970-01-01T00:00:00+00:00' },
  },
  // One redemption left, never expires — also visible in the panel.
  joschi: {
    start_date: '2026-06-20T15:57:00+00:00',
    expire: { redeem_unlimited: 'false', expire_never: 'true', limit: 1, date: '1970-01-01T00:00:00+00:00' },
  },
  // Never expires but has no redemptions left — hidden in the panel.
  spent: {
    start_date: '2023-06-15T14:51:00+00:00',
    expire: { redeem_unlimited: 'false', expire_never: 'true', limit: 0, date: '1970-01-01T00:00:00+00:00' },
  },
  // Giveaway winner code, one-shot, expiry date already passed.
  giveaway: {
    start_date: '2026-08-14T22:21:28+00:00',
    expire: { redeem_unlimited: 'false', expire_never: 'false', limit: 1, date: '2026-08-15T00:00:00+00:00' },
  },
  // Tebex post-purchase code, still inside its 24 h window.
  postPurchase: {
    start_date: '2026-08-15T11:44:28+00:00',
    expire: { redeem_unlimited: 'false', expire_never: 'false', limit: 1, date: '2026-08-16T11:44:28+00:00' },
  },
}

describe('isTrue', () => {
  it('accepts the string booleans the coupon endpoint sends', () => {
    expect(isTrue('true')).toBe(true)
    expect(isTrue('false')).toBe(false)
  })

  it('still accepts real booleans', () => {
    expect(isTrue(true)).toBe(true)
    expect(isTrue(false)).toBe(false)
    expect(isTrue(undefined)).toBe(false)
  })

  // The regression this whole module exists for: "false" is a truthy string,
  // so a plain check would have called every expired coupon unexpiring.
  it('does not treat the string "false" as truthy', () => {
    expect(isTrue('false')).not.toBe(true)
  })
})

describe('couponState', () => {
  it('keeps an unlimited, never-expiring coupon active', () => {
    expect(couponState(LIVE.ox10, NOW)).toBe('active')
  })

  it('keeps a never-expiring coupon with one redemption left active', () => {
    expect(couponState(LIVE.joschi, NOW)).toBe('active')
  })

  it('marks a never-expiring coupon with no redemptions left as used up', () => {
    expect(couponState(LIVE.spent, NOW)).toBe('used_up')
  })

  it('marks a coupon past its expiry date as expired', () => {
    expect(couponState(LIVE.giveaway, NOW)).toBe('expired')
  })

  it('keeps a dated coupon active while it is inside its window', () => {
    expect(couponState(LIVE.postPurchase, NOW)).toBe('active')
  })

  it('marks a coupon whose start date is in the future as scheduled', () => {
    // Same coupon, checked an hour before it starts.
    expect(couponState(LIVE.postPurchase, Date.parse('2026-08-15T10:44:00Z'))).toBe('scheduled')
  })

  it('ignores the 1970 placeholder date when expire_never is set', () => {
    // A naive date comparison would call this expired 56 years ago.
    expect(couponState(LIVE.ox10, NOW)).not.toBe('expired')
  })

  it('reports expiry before redemptions, so a spent expired coupon reads as expired', () => {
    const both = {
      start_date: '2023-01-01T00:00:00+00:00',
      expire: { redeem_unlimited: 'false', expire_never: 'false', limit: 0, date: '2024-01-01T00:00:00+00:00' },
    }
    expect(couponState(both, NOW)).toBe('expired')
  })

  it('treats a coupon with no expiry information at all as active', () => {
    // Better to show a coupon that may be dead than to hide a live one.
    expect(couponState({}, NOW)).toBe('active')
    expect(couponState({ expire: { redeem_unlimited: 'true' } }, NOW)).toBe('active')
  })

  it('ignores an unparseable date instead of hiding the coupon', () => {
    const broken = { expire: { redeem_unlimited: 'true', expire_never: 'false', date: 'not-a-date' } }
    expect(couponState(broken, NOW)).toBe('active')
  })

  it('handles a limit that arrives as a string', () => {
    const asString = { expire: { redeem_unlimited: 'false', expire_never: 'true', limit: '2' } }
    expect(couponState(asString as never, NOW)).toBe('active')
  })
})

describe('isCouponActive', () => {
  it('is true only for the active state', () => {
    expect(isCouponActive(LIVE.ox10, NOW)).toBe(true)
    expect(isCouponActive(LIVE.spent, NOW)).toBe(false)
    expect(isCouponActive(LIVE.giveaway, NOW)).toBe(false)
  })
})

describe('countCouponStates', () => {
  it('counts each state and the total', () => {
    const counts = countCouponStates(Object.values(LIVE), NOW)
    expect(counts).toEqual({ active: 3, scheduled: 0, expired: 1, used_up: 1, total: 5 })
  })

  it('handles an empty store', () => {
    expect(countCouponStates([], NOW)).toEqual({ active: 0, scheduled: 0, expired: 0, used_up: 0, total: 0 })
  })
})
