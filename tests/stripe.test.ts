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
  process.env.STRIPE_PRICE_PREMIUM_YEARLY = 'price_prem_y'
  process.env.STRIPE_PRICE_PREMIUM_PLUS_YEARLY = 'price_plus_y'
  process.env.STRIPE_PRICE_BUSINESS_YEARLY = 'price_biz_y'
})

/** Every paid tier and the env vars that carry its price ids. Asserted below to
 *  cover TIER_CONFIG in full, so adding a tier without a price mapping fails
 *  here instead of silently resolving to basic in production. */
const PAID_PRICES: Record<Exclude<Tier, 'basic'>, { monthly: string; yearly: string }> = {
  premium:      { monthly: 'price_prem', yearly: 'price_prem_y' },
  premium_plus: { monthly: 'price_plus', yearly: 'price_plus_y' },
  business:     { monthly: 'price_biz',  yearly: 'price_biz_y'  },
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
      expect(priceIdForTier(tier as Tier)).toBe(price.monthly)
      expect(priceIdForTier(tier as Tier, 'monthly')).toBe(price.monthly)
      expect(priceIdForTier(tier as Tier, 'yearly')).toBe(price.yearly)
    }
    expect(priceIdForTier('basic')).toBeNull()
    expect(priceIdForTier('basic', 'yearly')).toBeNull()
  })

  it('returns null for an interval with no price rather than the other one', () => {
    // A customer who picks "yearly" must never be billed monthly because the
    // yearly price is missing. Null surfaces as "billing is not configured".
    const saved = process.env.STRIPE_PRICE_BUSINESS_YEARLY
    delete process.env.STRIPE_PRICE_BUSINESS_YEARLY
    expect(priceIdForTier('business', 'yearly')).toBeNull()
    expect(priceIdForTier('business', 'monthly')).toBe('price_biz')
    process.env.STRIPE_PRICE_BUSINESS_YEARLY = saved
  })
})

describe('resolveTierFromPrice', () => {
  it('reverse-maps every configured price id, both intervals', () => {
    for (const [tier, price] of Object.entries(PAID_PRICES)) {
      expect(resolveTierFromPrice(price.monthly)).toBe(tier)
      expect(resolveTierFromPrice(price.yearly)).toBe(tier)
    }
  })

  it('defaults unknown/empty prices to basic so a stray sub never grants paid', () => {
    expect(resolveTierFromPrice('price_unknown')).toBe('basic')
    expect(resolveTierFromPrice(null)).toBe('basic')
    expect(resolveTierFromPrice(undefined)).toBe('basic')
  })

  it('does not grant a tier from an unset env var', () => {
    // Without the Boolean() guard, an unconfigured price env var is undefined,
    // and a subscription whose price id is also missing would compare equal.
    const saved = process.env.STRIPE_PRICE_BUSINESS_YEARLY
    delete process.env.STRIPE_PRICE_BUSINESS_YEARLY
    expect(resolveTierFromPrice(undefined)).toBe('basic')
    expect(resolveTierFromPrice('')).toBe('basic')
    process.env.STRIPE_PRICE_BUSINESS_YEARLY = saved
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
