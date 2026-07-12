import { describe, it, expect, beforeAll } from 'vitest'
import type Stripe from 'stripe'
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
})

describe('priceIdForTier', () => {
  it('maps paid tiers and returns null for basic', () => {
    expect(priceIdForTier('premium')).toBe('price_prem')
    expect(priceIdForTier('premium_plus')).toBe('price_plus')
    expect(priceIdForTier('basic')).toBeNull()
  })
})

describe('resolveTierFromPrice', () => {
  it('reverse-maps configured price ids', () => {
    expect(resolveTierFromPrice('price_prem')).toBe('premium')
    expect(resolveTierFromPrice('price_plus')).toBe('premium_plus')
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
