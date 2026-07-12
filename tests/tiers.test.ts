import { describe, it, expect, afterEach, vi } from 'vitest'
import { getExpiresAt, TIER_CONFIG } from '@/lib/tiers'

afterEach(() => { vi.useRealTimers() })

describe('getExpiresAt', () => {
  it('adds each tier\'s storageDays to now', () => {
    // Mid-year fixed instant; compare in whole days so it is timezone/DST-safe.
    const now = new Date('2026-06-01T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)

    const days = (tier: Parameters<typeof getExpiresAt>[0]) =>
      Math.round((getExpiresAt(tier).getTime() - now.getTime()) / 86_400_000)

    expect(days('basic')).toBe(30)
    expect(days('premium')).toBe(180)
    expect(days('premium_plus')).toBe(365)
  })
})

describe('TIER_CONFIG invariants', () => {
  it('limits grow from basic to premium to premium_plus', () => {
    expect(TIER_CONFIG.basic.storageDays).toBeLessThan(TIER_CONFIG.premium.storageDays)
    expect(TIER_CONFIG.premium.storageDays).toBeLessThan(TIER_CONFIG.premium_plus.storageDays)
    expect(TIER_CONFIG.basic.transcriptMaxBytes).toBeLessThan(TIER_CONFIG.premium.transcriptMaxBytes)
    expect(TIER_CONFIG.basic.uploadsPerHour).toBeLessThan(TIER_CONFIG.premium.uploadsPerHour)
  })

  it('gates custom domains and attachments to paid tiers only', () => {
    expect(TIER_CONFIG.basic.customDomain).toBe(false)
    expect(TIER_CONFIG.basic.attachments).toBe(false)
    expect(TIER_CONFIG.basic.attachmentMaxBytes).toBe(0)
    expect(TIER_CONFIG.premium.customDomain).toBe(true)
    expect(TIER_CONFIG.premium_plus.attachments).toBe(true)
  })
})
