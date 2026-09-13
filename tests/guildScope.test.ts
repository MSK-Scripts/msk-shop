import { describe, it, expect } from 'vitest'
import { trustedGuildId } from '@/lib/guildScope'

/**
 * Runtime side of `lib/guildScope.ts`.
 *
 * The brand itself is pure compile time and cannot be checked here; that is
 * what the negative test with `tsc` is for (see comment below). What a test
 * can and must cover is the format check: without it,
 * `trustedGuildId()` would be an `as ScopedGuildId` with better press, i.e. a
 * claim without backing.
 *
 * Compile time cross-checked on 02.08.2026 with a throwaway route that
 * called `teardownCustomDomain(body.guildId as string)`:
 *   TS2345: Argument of type 'string' is not assignable to parameter of
 *   type 'ScopedGuildId'.
 * The path via `authorizeGuild()` compiled without errors in the same run.
 */

const VALID = '123456789012345678' // 18-digit snowflake

describe('trustedGuildId', () => {
  it('nimmt eine gültige Snowflake an und gibt sie unverändert zurück', () => {
    expect(trustedGuildId(VALID, 'stripe-webhook')).toBe(VALID)
  })

  it('akzeptiert die Randlängen 17 und 20', () => {
    expect(trustedGuildId('1'.repeat(17), 'api-key')).toBe('1'.repeat(17))
    expect(trustedGuildId('1'.repeat(20), 'api-key')).toBe('1'.repeat(20))
  })

  it('schneidet umgebende Leerzeichen ab', () => {
    expect(trustedGuildId(`  ${VALID}\n`, 'maintenance-cron')).toBe(VALID)
  })

  it.each([
    ['zu kurz',        '1'.repeat(16)],
    ['zu lang',        '1'.repeat(21)],
    ['leer',           ''],
    ['nur Leerzeichen', '   '],
    ['nicht numerisch', '12345678901234567a'],
    ['mit Trennzeichen', '123456789012345678; DROP TABLE'],
  ])('wirft bei %s', (_label, input) => {
    expect(() => trustedGuildId(input, 'stripe-webhook')).toThrow(/invalid guild id/)
  })

  it('nennt die Quelle in der Fehlermeldung', () => {
    // Without the source the log only says that a broken id arrived somewhere,
    // but the question is always which of the four channels delivered it.
    expect(() => trustedGuildId('nope', 'api-key')).toThrow(/api-key/)
    expect(() => trustedGuildId('nope', 'stripe-webhook')).toThrow(/stripe-webhook/)
  })

  it('verrät den Fehlwert, damit er im Log auffindbar ist', () => {
    expect(() => trustedGuildId('abc', 'maintenance-cron')).toThrow(/"abc"/)
  })
})
