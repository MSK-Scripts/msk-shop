import { describe, it, expect, afterEach } from 'vitest'
import { getIgnoredApiKeys } from '@/lib/statsIgnore'

afterEach(() => { delete process.env.STATS_IGNORED_API_KEYS })

describe('getIgnoredApiKeys', () => {
  it('parses the env list, trimming and dropping empty entries', () => {
    process.env.STATS_IGNORED_API_KEYS = ' a , b ,, c '
    expect(getIgnoredApiKeys().sort()).toEqual(['a', 'b', 'c'])
  })

  it('deduplicates', () => {
    process.env.STATS_IGNORED_API_KEYS = 'x,x,y'
    expect(getIgnoredApiKeys().sort()).toEqual(['x', 'y'])
  })

  it('returns an array when the env var is unset', () => {
    const keys = getIgnoredApiKeys()
    expect(Array.isArray(keys)).toBe(true)
  })
})
