import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { signAdminSession, parseAdminSession } from '@/lib/adminSession'

const SECRET = 'test-secret-123'

beforeAll(() => { process.env.SESSION_SECRET = SECRET })
afterEach(() => { vi.useRealTimers() })

describe('adminSession', () => {
  it('round-trips a valid session', () => {
    const token = signAdminSession({ discordUserId: '42' })
    expect(parseAdminSession(token)).toEqual({ discordUserId: '42' })
  })

  it('rejects a tampered signature', () => {
    const token = signAdminSession({ discordUserId: '42' })
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect(parseAdminSession(tampered)).toBeNull()
  })

  it('rejects malformed tokens', () => {
    expect(parseAdminSession('')).toBeNull()
    expect(parseAdminSession('no-dot')).toBeNull()
    expect(parseAdminSession('a.b')).toBeNull()
  })

  it('rejects an expired token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'))
    const token = signAdminSession({ discordUserId: '42' })
    vi.setSystemTime(new Date('2020-01-01T02:00:00Z')) // +2h, past the 1h TTL
    expect(parseAdminSession(token)).toBeNull()
  })

  it('rejects a validly-signed token that has no exp', () => {
    const payload = Buffer.from(JSON.stringify({ discordUserId: '42' })).toString('base64url')
    const sig = createHmac('sha256', SECRET).update(payload).digest('base64url')
    expect(parseAdminSession(`${payload}.${sig}`)).toBeNull()
  })
})
