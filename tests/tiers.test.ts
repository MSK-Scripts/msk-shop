import { describe, it, expect, afterEach, vi } from 'vitest'
import { getExpiresAt, TIER_CONFIG, type Tier } from '@/lib/tiers'

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

  it('gates every perk to the paid tiers and grants all of them to each', () => {
    expect(TIER_CONFIG.basic.customDomain).toBe(false)
    expect(TIER_CONFIG.basic.attachments).toBe(false)
    expect(TIER_CONFIG.basic.botHosting).toBe(false)
    expect(TIER_CONFIG.basic.removeBranding).toBe(false)
    expect(TIER_CONFIG.basic.attachmentMaxBytes).toBe(0)

    // Every paid tier gets the lot. VerifyClient and the dashboard ask
    // `tier !== 'basic'` rather than listing tiers, and this is what makes
    // that question the right one.
    for (const tier of LADDER.filter(t => t !== 'basic')) {
      expect(TIER_CONFIG[tier].customDomain).toBe(true)
      expect(TIER_CONFIG[tier].attachments).toBe(true)
      expect(TIER_CONFIG[tier].botHosting).toBe(true)
      expect(TIER_CONFIG[tier].removeBranding).toBe(true)
    }
  })
})
