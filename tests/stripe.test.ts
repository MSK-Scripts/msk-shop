import { describe, it, expect, beforeAll } from 'vitest'
import type Stripe from 'stripe'
import { TIER_CONFIG, type Tier } from '@/lib/tiers'
import {
  priceIdForTier,
  resolveTierFromPrice,
  isActiveSubStatus,
  priceIdFromSubscription,
  periodEndFromSubscription,
} from '@/lib/stripe'

beforeAll(() => {
  process.env.STRIPE_PRICE_PREMIUM = 'price_prem'
  process.env.STRIPE_PRICE_PREMIUM_PLUS = 'price_plus'
  process.env.STRIPE_PRICE_BUSINESS = 'price_biz'
})

/** Every paid tier and the env var that carries its price id. Asserted below to
 *  cover TIER_CONFIG in full, so adding a tier without a price mapping fails
 *  here instead of silently resolving to basic in production. */
const PAID_PRICES: Record<Exclude<Tier, 'basic'>, string> = {
  premium:      'price_prem',
  premium_plus: 'price_plus',
  business:     'price_biz',
}

describe('tier coverage', () => {
  it('has a price mapping for every paid tier in TIER_CONFIG', () => {
    const paid = Object.keys(TIER_CONFIG).filter(t => t !== 'basic').sort()
    expect(Object.keys(PAID_PRICES).sort()).toEqual(paid)
  })
})

describe('priceIdForTier', () => {
  it('maps every paid tier and returns null for basic', () => {
    for (const [tier, price] of Object.entries(PAID_PRICES)) {
      expect(priceIdForTier(tier as Tier)).toBe(price)
    }
    expect(priceIdForTier('basic')).toBeNull()
  })
})

describe('resolveTierFromPrice', () => {
  it('reverse-maps every configured price id', () => {
    for (const [tier, price] of Object.entries(PAID_PRICES)) {
      expect(resolveTierFromPrice(price)).toBe(tier)
    }
  })

  it('defaults unknown/empty prices to basic so a stray sub never grants paid', () => {
    expect(resolveTierFromPrice('price_unknown')).toBe('basic')
    expect(resolveTierFromPrice(null)).toBe('basic')
    expect(resolveTierFromPrice(undefined)).toBe('basic')
  })
})

describe('isActiveSubStatus', () => {
  it('grants for active and trialing only', () => {
    expect(isActiveSubStatus('active')).toBe(true)
    expect(isActiveSubStatus('trialing')).toBe(true)
    expect(isActiveSubStatus('canceled')).toBe(false)
    expect(isActiveSubStatus('past_due')).toBe(false)
    expect(isActiveSubStatus('unpaid')).toBe(false)
  })
})

describe('subscription extractors', () => {
  it('pulls price id and period end from the first item', () => {
    const sub = { items: { data: [{ price: { id: 'price_prem' }, current_period_end: 1893456000 }] } } as unknown as Stripe.Subscription
    expect(priceIdFromSubscription(sub)).toBe('price_prem')
    expect(periodEndFromSubscription(sub)).toBe(1893456000)
  })

  it('returns null when there is no line item', () => {
    const sub = { items: { data: [] } } as unknown as Stripe.Subscription
    expect(priceIdFromSubscription(sub)).toBeNull()
    expect(periodEndFromSubscription(sub)).toBeNull()
  })
})
