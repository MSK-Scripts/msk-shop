import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  formatTierPrice, getExpiresAt, TIER_CONFIG, yearlyMonthsFree, type Tier,
} from '@/lib/tiers'

/**
 * Cheapest to most expensive. Asserted below to cover TIER_CONFIG in full, so a
 * new tier cannot be added without deciding where it sits in the ladder. The
 * hand-enumerated version of these tests is how `business` reached production
 * with no coverage at all.
 */
const LADDER: Tier[] = ['basic', 'premium', 'premium_plus', 'business']

afterEach(() => { vi.useRealTimers() })

describe('getExpiresAt', () => {
  it('adds each tier\'s storageDays to now', () => {
    // Mid-year fixed instant; compare in whole days so it is timezone/DST-safe.
    const now = new Date('2026-06-01T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)

    const days = (tier: Parameters<typeof getExpiresAt>[0]) =>
      Math.round((getExpiresAt(tier).getTime() - now.getTime()) / 86_400_000)

    for (const tier of LADDER) {
      expect(days(tier)).toBe(TIER_CONFIG[tier].storageDays)
    }
    // Spot values, so a wrong number in TIER_CONFIG cannot agree with itself.
    expect(days('basic')).toBe(30)
    expect(days('premium')).toBe(180)
    expect(days('premium_plus')).toBe(365)
    expect(days('business')).toBe(3650)
  })
})

describe('TIER_CONFIG invariants', () => {
  it('the ladder covers every configured tier', () => {
    expect([...LADDER].sort()).toEqual(Object.keys(TIER_CONFIG).sort())
  })

  it('limits grow with every step up the ladder', () => {
    for (let i = 1; i < LADDER.length; i++) {
      const lower = TIER_CONFIG[LADDER[i - 1]]
      const upper = TIER_CONFIG[LADDER[i]]
      expect(lower.storageDays).toBeLessThan(upper.storageDays)
      expect(lower.transcriptMaxBytes).toBeLessThan(upper.transcriptMaxBytes)
      expect(lower.attachmentMaxBytes).toBeLessThan(upper.attachmentMaxBytes)
      expect(lower.uploadsPerHour).toBeLessThan(upper.uploadsPerHour)
    }
  })

  it('gates the transcript perks to the paid tiers and grants them to each', () => {
    expect(TIER_CONFIG.basic.customDomain).toBe(false)
    expect(TIER_CONFIG.basic.attachments).toBe(false)
    expect(TIER_CONFIG.basic.botHosting).toBe(false)
    expect(TIER_CONFIG.basic.removeBranding).toBe(false)
    expect(TIER_CONFIG.basic.attachmentMaxBytes).toBe(0)

    // Every paid tier gets these three. VerifyClient and the dashboard ask
    // `tier !== 'basic'` rather than listing tiers, and this is what makes
    // that question the right one. Bot hosting is deliberately NOT in this
    // list any more, see the test below.
    for (const tier of LADDER.filter(t => t !== 'basic')) {
      expect(TIER_CONFIG[tier].customDomain).toBe(true)
      expect(TIER_CONFIG[tier].attachments).toBe(true)
      expect(TIER_CONFIG[tier].removeBranding).toBe(true)
    }
  })

  it('starts bot hosting at premium_plus, not at premium', () => {
    // The most expensive feature we run marks the boundary between the two
    // paid halves of the ladder (19.09.2026). Written out per tier rather than
    // as a loop: moving hosting back down to `premium` is a business decision
    // worth several euros per customer per month, and it should fail here
    // rather than be discovered in an invoice.
    expect(TIER_CONFIG.basic.botHosting).toBe(false)
    expect(TIER_CONFIG.premium.botHosting).toBe(false)
    expect(TIER_CONFIG.premium_plus.botHosting).toBe(true)
    expect(TIER_CONFIG.business.botHosting).toBe(true)
  })

  it('prices rise with the ladder and the free tier costs nothing', () => {
    expect(TIER_CONFIG.basic.priceCents).toBe(0)
    expect(TIER_CONFIG.basic.priceCentsYearly).toBe(0)
    for (let i = 1; i < LADDER.length; i++) {
      const lower = TIER_CONFIG[LADDER[i - 1]]
      const upper = TIER_CONFIG[LADDER[i]]
      expect(lower.priceCents).toBeLessThan(upper.priceCents)
      expect(lower.priceCentsYearly).toBeLessThan(upper.priceCentsYearly)
    }
  })

  it('every paid tier has a yearly price that beats twelve monthly ones', () => {
    // A yearly price that is not cheaper is not a yearly price, it is a trap.
    for (const tier of LADDER.filter(t => t !== 'basic')) {
      const c = TIER_CONFIG[tier]
      expect(c.priceCentsYearly).toBeGreaterThan(0)
      expect(c.priceCentsYearly).toBeLessThan(c.priceCents * 12)
      expect(yearlyMonthsFree(tier)).toBe(2)
    }
    // The free tier has no yearly price, so nothing is "free" about it.
    expect(yearlyMonthsFree('basic')).toBe(0)
  })
})

describe('formatTierPrice', () => {
  it('writes the number the way the language does', () => {
    expect(formatTierPrice('premium', 'de')).toBe('4,99\u00A0€')
    expect(formatTierPrice('premium', 'en')).toBe('€4.99')
  })

  it('formats the yearly price when asked, the monthly one by default', () => {
    expect(formatTierPrice('premium_plus', 'en')).toBe('€9.99')
    expect(formatTierPrice('premium_plus', 'en', 'monthly')).toBe('€9.99')
    expect(formatTierPrice('premium_plus', 'en', 'yearly')).toBe('€99.00')
  })
})
