import { describe, expect, it } from 'vitest'

import { formatBytes, formatDate, formatNumber, formatRetention, isoDate, toDate } from '@/lib/format'

/**
 * One format per language for dates, sizes and periods (plan 5.9, 6.3).
 *
 * The dashboards showed `2026-10-26T13:00:34+00:00`, `19.10.2026, 20:53:33`
 * and `21 Sept 2026` side by side. A date is what a customer reads to know
 * when a trial ends or a transcript is deleted, so a wrong day or an English
 * month on the German page is a wrong statement, not a cosmetic slip.
 */
describe('formatDate', () => {
  it('writes German dates with dots and English ones with the month as a word', () => {
    expect(formatDate('2026-10-27T10:00:00.000Z', 'de')).toBe('27.10.2026')
    expect(formatDate('2026-10-27T10:00:00.000Z', 'en')).toBe('Oct 27, 2026')
    expect(formatDate('2026-09-21T10:00:00.000Z', 'en')).toBe('Sep 21, 2026')
  })

  it('takes what the API and the database hand over: ISO strings, Date objects and epoch milliseconds', () => {
    const at = Date.UTC(2026, 10, 27, 10)
    expect(formatDate(new Date(at), 'de')).toBe('27.11.2026')
    expect(formatDate(at, 'de')).toBe('27.11.2026')
  })

  it('shows the German calendar day, also for an instant late in the UTC evening', () => {
    // 23:30 UTC on 27 October is 00:30 on the 28th in Berlin (CET).
    expect(formatDate('2026-10-27T23:30:00.000Z', 'de')).toBe('28.10.2026')
    expect(formatDate('2026-10-27T23:30:00.000Z', 'en')).toBe('Oct 28, 2026')
  })

  it('gives null rather than "Invalid Date" for a missing or broken value', () => {
    for (const value of [null, undefined, '', 'not-a-date', NaN]) {
      expect(formatDate(value as never, 'de')).toBeNull()
    }
    expect(toDate('garbage')).toBeNull()
    expect(isoDate('garbage')).toBeUndefined()
    expect(isoDate('2026-10-27T10:00:00Z')).toBe('2026-10-27T10:00:00.000Z')
  })
})

describe('formatBytes', () => {
  it('uses the decimal sign of the language', () => {
    expect(formatBytes(2.5 * 1024, 'de')).toBe('2,5 kB')
    expect(formatBytes(2.5 * 1024, 'en')).toBe('2.5 kB')
    expect(formatBytes(1.5 * 1024 * 1024, 'de')).toBe('1,5 MB')
  })

  it('drops the decimal from ten units up, as the dashboard always did', () => {
    expect(formatBytes(29.4 * 1024, 'de')).toBe('29 kB')
  })

  it('counts in binary steps like the size limits in lib/tiers.ts', () => {
    expect(formatBytes(10 * 1024 * 1024, 'en')).toBe('10 MB')
    expect(formatBytes(512 * 1024, 'en')).toBe('512 kB')
  })

  it('shows zero for an empty or broken size', () => {
    expect(formatBytes(0, 'en')).toBe('0 kB')
    expect(formatBytes(Number.NaN, 'de')).toBe('0 kB')
  })
})

describe('formatRetention', () => {
  it('says whole years as years and everything else in days', () => {
    expect(formatRetention(30, 'de')).toBe('30 Tage')
    expect(formatRetention(180, 'en')).toBe('180 days')
    expect(formatRetention(365, 'de')).toBe('1 Jahr')
    expect(formatRetention(3650, 'en')).toBe('10 years')
  })
})

describe('formatNumber', () => {
  it('groups thousands the way the language does', () => {
    expect(formatNumber(1234, 'de')).toBe('1.234')
    expect(formatNumber(1234, 'en')).toBe('1,234')
  })
})
