import { describe, it, expect, beforeAll } from 'vitest'
import { signSession, parseSession, generateState } from '@/lib/session'
import { signDashboardSession, parseDashboardSession } from '@/lib/dashboardSession'
import {
  signGiveawaySession, parseGiveawaySession,
  signGiveawayVerify, parseGiveawayVerify,
} from '@/lib/giveawaySession'

beforeAll(() => { process.env.SESSION_SECRET = 'test-secret' })

describe('verify session (session.ts)', () => {
  it('round-trips and rejects tampering / junk', () => {
    const t = signSession({ discordUserId: '1', guilds: [] })
    expect(parseSession(t)?.discordUserId).toBe('1')
    expect(parseSession(t.slice(0, -1) + (t.endsWith('a') ? 'b' : 'a'))).toBeNull()
    expect(parseSession('')).toBeNull()
  })

  it('generateState returns a unique 32-char hex token', () => {
    const a = generateState()
    const b = generateState()
    expect(a).toMatch(/^[0-9a-f]{32}$/)
    expect(a).not.toBe(b)
  })
})

describe('dashboard session', () => {
  it('round-trips and rejects tampering', () => {
    const t = signDashboardSession({ discordUserId: '9' })
    expect(parseDashboardSession(t)).toEqual({ discordUserId: '9' })
    expect(parseDashboardSession(t.slice(0, -1) + (t.endsWith('a') ? 'b' : 'a'))).toBeNull()
  })
})

describe('giveaway sessions', () => {
  it('round-trips the giveaway and verify sessions', () => {
    expect(parseGiveawaySession(signGiveawaySession({ guildId: 'G' }))).toEqual({ guildId: 'G' })
    expect(parseGiveawayVerify(signGiveawayVerify({ discordUserId: 'U', guilds: [] }))?.discordUserId).toBe('U')
  })

  it('does not accept a token signed under a different scope', () => {
    // A giveaway token must not validate as a giveaway-verify token (scope-bound HMAC).
    const giveawayToken = signGiveawaySession({ guildId: 'G' })
    expect(parseGiveawayVerify(giveawayToken)).toBeNull()
    // ...and vice versa.
    const verifyToken = signGiveawayVerify({ discordUserId: 'U', guilds: [] })
    expect(parseGiveawaySession(verifyToken)).toBeNull()
  })
})
