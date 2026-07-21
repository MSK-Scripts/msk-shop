import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { TIER_CONFIG } from '@/lib/tiers'

// scripts/cleanup.js is plain JS run via cron and cannot import the TS tier
// config, so it hardcodes BASIC_STORAGE_DAYS as a manual mirror. Guard against
// drift: if someone changes TIER_CONFIG.basic.storageDays, this fails until the
// cron constant is updated too (and vice versa).
describe('cleanup.js BASIC_STORAGE_DAYS mirror', () => {
  it('matches TIER_CONFIG.basic.storageDays', () => {
    const src = readFileSync(resolve(process.cwd(), 'scripts/cleanup.js'), 'utf-8')
    const m = src.match(/const BASIC_STORAGE_DAYS\s*=\s*(\d+)/)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBe(TIER_CONFIG.basic.storageDays)
  })
})
