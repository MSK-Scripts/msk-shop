import { describe, it, expect } from 'vitest'
import { parseEnv, setEnvValue } from '@/lib/botconfig/envEdit'

const roundTrip = (key: string, value: string): string =>
  parseEnv(setEnvValue('K=old\n', key, value)).get(key)!.value

describe('setEnvValue / parseEnv', () => {
  it('patches only the matching line and preserves the rest', () => {
    const out = setEnvValue('# note\nFOO=1\nBAR=old\n', 'BAR', 'new')
    expect(out).toContain('# note')
    expect(out).toContain('FOO=1')
    expect(parseEnv(out).get('BAR')?.value).toBe('new')
  })

  it('appends a missing key', () => {
    expect(parseEnv(setEnvValue('FOO=1\n', 'NEW', 'x')).get('NEW')?.value).toBe('x')
  })

  it('round-trips values with quotes and backslashes', () => {
    expect(roundTrip('K', 'a"b')).toBe('a"b')
    expect(roundTrip('K', 'a\\b')).toBe('a\\b')
    expect(roundTrip('K', 'a\\"b')).toBe('a\\"b')
  })

  it('neutralizes a trailing backslash so it cannot break out of the quotes', () => {
    // Written as K="x\\" (both backslashes escaped) — the closing quote stays intact.
    expect(setEnvValue('K=', 'K', 'x\\')).toBe('K="x\\\\"')
    expect(roundTrip('K', 'trail\\')).toBe('trail\\')
  })
})
