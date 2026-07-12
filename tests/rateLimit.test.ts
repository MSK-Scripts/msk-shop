import { describe, it, expect, afterEach, vi } from 'vitest'
import { getClientIp, rateLimit } from '@/lib/rateLimit'

describe('getClientIp', () => {
  it('takes the rightmost X-Forwarded-For token (the address our proxy saw)', () => {
    const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' } })
    expect(getClientIp(req)).toBe('3.3.3.3')
  })

  it('strips an IPv4-mapped IPv6 prefix', () => {
    const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '::ffff:9.9.9.9' } })
    expect(getClientIp(req)).toBe('9.9.9.9')
  })

  it('falls back to x-real-ip, then localhost', () => {
    expect(getClientIp(new Request('http://localhost', { headers: { 'x-real-ip': '8.8.8.8' } }))).toBe('8.8.8.8')
    expect(getClientIp(new Request('http://localhost'))).toBe('127.0.0.1')
  })
})

describe('rateLimit', () => {
  afterEach(() => { vi.useRealTimers() })

  it('allows up to the limit, then blocks', () => {
    const ip = 'rl-limit'
    expect(rateLimit(ip, { limit: 2, windowMs: 60_000 })).toBe(true)
    expect(rateLimit(ip, { limit: 2, windowMs: 60_000 })).toBe(true)
    expect(rateLimit(ip, { limit: 2, windowMs: 60_000 })).toBe(false)
  })

  it('resets once the window has elapsed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const ip = 'rl-window'
    expect(rateLimit(ip, { limit: 1, windowMs: 1_000 })).toBe(true)
    expect(rateLimit(ip, { limit: 1, windowMs: 1_000 })).toBe(false)
    vi.setSystemTime(new Date('2026-01-01T00:00:02Z')) // +2s, past the 1s window
    expect(rateLimit(ip, { limit: 1, windowMs: 1_000 })).toBe(true)
  })
})
