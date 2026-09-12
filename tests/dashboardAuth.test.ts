import { describe, it, expect, beforeAll, beforeEach, vi, type Mock } from 'vitest'

// authorizeGuild is the single ownership chokepoint for every guild-scoped
// dashboard route. Mock the cookie store + DB so it runs without Next/DB.
let cookieToken: string | undefined
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'msk_dashboard_session' && cookieToken ? { value: cookieToken } : undefined,
  }),
}))
vi.mock('@/lib/db', () => ({ queryOne: vi.fn() }))

import { queryOne } from '@/lib/db'
import { authorizeGuild } from '@/lib/dashboardAuth'
import { signDashboardSession } from '@/lib/dashboardSession'

const GUILD = '123456789012345678'

beforeAll(() => { process.env.SESSION_SECRET = 'test-secret-123' })
beforeEach(() => { (queryOne as Mock).mockReset(); cookieToken = undefined })

describe('authorizeGuild', () => {
  it('401 without a session cookie', async () => {
    expect(await authorizeGuild(GUILD)).toMatchObject({ ok: false, status: 401 })
  })

  it('400 on a malformed guild id — without touching the DB', async () => {
    cookieToken = signDashboardSession({ discordUserId: '42' })
    expect(await authorizeGuild('not-a-snowflake')).toMatchObject({ ok: false, status: 400 })
    expect(queryOne as Mock).not.toHaveBeenCalled()
  })

  it('403 when the guild is not owned by the session user', async () => {
    cookieToken = signDashboardSession({ discordUserId: '42' })
    ;(queryOne as Mock).mockResolvedValue(null)
    expect(await authorizeGuild(GUILD)).toMatchObject({ ok: false, status: 403 })
  })

  it('ok when the guild is owned', async () => {
    cookieToken = signDashboardSession({ discordUserId: '42' })
    ;(queryOne as Mock).mockResolvedValue({ guild_id: GUILD, tier: 'basic' })
    const res = await authorizeGuild(GUILD)
    expect(res.ok).toBe(true)
  })

  it('binds BOTH guild_id and discord_user_id in the ownership query', async () => {
    cookieToken = signDashboardSession({ discordUserId: '42' })
    ;(queryOne as Mock).mockResolvedValue({ guild_id: GUILD })
    await authorizeGuild(GUILD)
    const [sql, params] = (queryOne as Mock).mock.calls[0]
    expect(sql).toContain('guild_id = ?')
    expect(sql).toContain('discord_user_id = ?')
    expect(params).toEqual([GUILD, '42'])
  })

  // Owning the row is not the same as still administering the guild on
  // Discord. Hiding a revoked guild in the dashboard is cosmetic on its own -
  // every guild-scoped route comes through here, so this is where it has to
  // bite. Added after a negative cross-check showed that removing the check
  // broke no test at all.
  describe('revoked Discord access', () => {
    const DAY = 86_400_000
    const owned = (lost: Date | null) => ({
      guild_id: GUILD, tier: 'basic', access_checked_at: new Date(), access_lost_at: lost,
    })

    beforeEach(() => { cookieToken = signDashboardSession({ discordUserId: '42' }) })

    it('403 once the grace period has run out', async () => {
      ;(queryOne as Mock).mockResolvedValue(owned(new Date(Date.now() - 30 * DAY)))
      expect(await authorizeGuild(GUILD)).toMatchObject({
        ok: false, status: 403, error: 'access_revoked',
      })
    })

    it('still lets a guild through inside the grace period', async () => {
      ;(queryOne as Mock).mockResolvedValue(owned(new Date(Date.now() - 2 * DAY)))
      expect((await authorizeGuild(GUILD)).ok).toBe(true)
    })

    it('reads the access columns out of the ownership query', async () => {
      ;(queryOne as Mock).mockResolvedValue(owned(null))
      await authorizeGuild(GUILD)
      const [sql] = (queryOne as Mock).mock.calls[0]
      // Without these in the SELECT the check above silently passes every row,
      // because an absent column reads as "never lost".
      expect(sql).toContain('access_checked_at')
      expect(sql).toContain('access_lost_at')
    })
  })
})
