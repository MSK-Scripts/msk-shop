import { describe, it, expect } from 'vitest'
import { trustedGuildId } from '@/lib/guildScope'

/**
 * Laufzeitseite von `lib/guildScope.ts`.
 *
 * Der Brand selbst ist reine Compile-Zeit und lässt sich hier nicht prüfen —
 * dafür gibt es den Negativtest mit `tsc` (siehe Kommentar unten). Was ein Test
 * abdecken kann und muss, ist die Formatprüfung: ohne sie wäre
 * `trustedGuildId()` ein `as ScopedGuildId` mit besserer Presse, also eine
 * Behauptung ohne Deckung.
 *
 * Compile-Zeit gegengeprüft am 02.08.2026 mit einer Wegwerf-Route, die
 * `teardownCustomDomain(body.guildId as string)` aufrief:
 *   TS2345: Argument of type 'string' is not assignable to parameter of
 *   type 'ScopedGuildId'.
 * Der Weg über `authorizeGuild()` kompilierte im selben Lauf fehlerfrei.
 */

const VALID = '123456789012345678' // 18-stellige Snowflake

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
    // Ohne die Quelle steht im Log nur, dass irgendwo eine kaputte Id ankam —
    // die Frage ist aber immer, welcher der vier Kanäle sie geliefert hat.
    expect(() => trustedGuildId('nope', 'api-key')).toThrow(/api-key/)
    expect(() => trustedGuildId('nope', 'stripe-webhook')).toThrow(/stripe-webhook/)
  })

  it('verrät den Fehlwert, damit er im Log auffindbar ist', () => {
    expect(() => trustedGuildId('abc', 'maintenance-cron')).toThrow(/"abc"/)
  })
})
