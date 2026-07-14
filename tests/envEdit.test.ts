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

/**
 * Regression: CRLF line endings.
 *
 * Splitting on '\n' leaves a trailing '\r' on every line of a Windows-authored
 * file. KEY_LINE_RE ends in `(.*)$`, and in JS `.` does not match '\r' while `$`
 * does not match before it — so the regex failed on every line, setEnvValue
 * concluded the key was absent, and APPENDED a duplicate instead of updating it.
 */
describe('CRLF line endings', () => {
  const CRLF = 'TOKEN="abc"\r\n# comment\r\nCLIENT_ID="123"\r\n'
  const countKey = (content: string, key: string) =>
    content.split(/\r?\n/).filter(l => new RegExp(`^\s*${key}\s*=`).test(l)).length

  it('updates an existing key instead of appending a duplicate', () => {
    const out = setEnvValue(CRLF, 'CLIENT_ID', '999')
    expect(countKey(out, 'CLIENT_ID')).toBe(1)
    expect(parseEnv(out).get('CLIENT_ID')?.value).toBe('999')
  })

  it('never accumulates duplicates across repeated writes', () => {
    let out = CRLF
    for (let i = 0; i < 5; i++) out = setEnvValue(out, 'NEW_KEY', String(i))
    expect(countKey(out, 'NEW_KEY')).toBe(1)
    expect(parseEnv(out).get('NEW_KEY')?.value).toBe('4')
  })

  it('preserves the original CRLF line endings and the comments', () => {
    const out = setEnvValue(CRLF, 'CLIENT_ID', '999')
    expect(out).toContain('\r\n')
    expect(out).toContain('# comment')
    expect(parseEnv(out).get('TOKEN')?.value).toBe('abc')
  })

  it('leaves an LF file with LF endings', () => {
    const out = setEnvValue('A="1"\nB="2"\n', 'B', '3')
    expect(out).not.toContain('\r')
    expect(countKey(out, 'B')).toBe(1)
  })
})
