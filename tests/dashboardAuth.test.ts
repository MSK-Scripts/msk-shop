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
})
