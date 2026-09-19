import { describe, it, expect, beforeAll, beforeEach, vi, type Mock } from 'vitest'

vi.mock('@/lib/db', () => ({ query: vi.fn(), queryOne: vi.fn() }))
vi.mock('@/lib/adminAudit', () => ({ writeAudit: vi.fn() }))

import { query, queryOne } from '@/lib/db'
import { writeAudit } from '@/lib/adminAudit'
import { PATCH } from '@/app/api/admin/api-keys/[guildId]/route'
import { KEY_ORIGINS, KEY_ORIGIN_LABELS, isKeyOrigin } from '@/lib/keyClassification'
import { adminReq, serveAdminTeam } from './helpers'

const GUILD = '123456789012345678'

/** The stored row the route compares an incoming change against. */
function serveGuild(row: Partial<{
  tier: string; stats_excluded: number; key_origin: string; stripe_subscription_id: string | null
}> = {}) {
  const guild = {
    tier:                   'basic',
    stats_excluded:         0,
    key_origin:             'normal',
    stripe_subscription_id: null,
    ...row,
  }
  ;(queryOne as Mock).mockImplementation(async (sql: string, params: unknown[]) => {
    if (sql.includes('msk_admin_team')) {
      return { discord_user_id: '1', display_name: null, is_owner: 1, permissions: '[]', active: 1 }
    }
    return String(params[0]) === GUILD ? guild : null
  })
  return guild
}

const call = (body: unknown) =>
  PATCH(
    adminReq(`/api/admin/api-keys/${GUILD}`, {
      method: 'PATCH', body, origin: 'https://www.msk-scripts.de',
    }),
    { params: Promise.resolve({ guildId: GUILD }) },
  )

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret'
  process.env.NEXT_PUBLIC_BASE_URL = 'https://www.msk-scripts.de'
})

beforeEach(() => {
  vi.clearAllMocks()
  serveAdminTeam(queryOne as Mock, [{ discord_user_id: '1', is_owner: 1 }])
})

describe('KeyOrigin', () => {
  it('accepts exactly the three known origins', () => {
    for (const o of KEY_ORIGINS) expect(isKeyOrigin(o)).toBe(true)
    for (const bad of ['', 'ignored', 'NORMAL', null, 1, {}]) expect(isKeyOrigin(bad)).toBe(false)
  })

  it('has a label for every origin', () => {
    // A missing entry renders `undefined.label` in the admin table, which is a
    // runtime crash rather than a type error.
    expect(Object.keys(KEY_ORIGIN_LABELS).sort()).toEqual([...KEY_ORIGINS].sort())
  })
})

describe('PATCH /api/admin/api-keys/[guildId]', () => {
  it('rejects an unknown origin', async () => {
    serveGuild()
    const res = await call({ keyOrigin: 'sponsered' })   // typo on purpose
    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('rejects a non-boolean statsExcluded', async () => {
    serveGuild()
    // 'true' as a string is the shape a hand-made curl request produces, and
    // MariaDB would happily coerce it to 1.
    const res = await call({ statsExcluded: 'true' })
    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('rejects an empty body rather than writing nothing quietly', async () => {
    serveGuild()
    expect((await call({})).status).toBe(400)
  })

  it('writes only the fields that actually changed', async () => {
    serveGuild({ tier: 'premium', stats_excluded: 0, key_origin: 'normal' })
    const res = await call({ tier: 'premium', statsExcluded: true, keyOrigin: 'normal' })
    expect(res.status).toBe(200)

    // tier and origin were sent unchanged, so only stats_excluded is in the SET.
    const [sql, params] = (query as Mock).mock.calls[0]
    expect(sql).toContain('stats_excluded = ?')
    expect(sql).not.toContain('tier = ?')
    expect(sql).not.toContain('key_origin = ?')
    expect(params).toEqual([1, GUILD])
  })

  it('audits each changed field separately', async () => {
    serveGuild({ tier: 'basic', key_origin: 'normal' })
    await call({ tier: 'premium', keyOrigin: 'sponsored' })

    const actions = (writeAudit as Mock).mock.calls.map(c => c[1])
    expect(actions).toEqual(['api_key.change_tier', 'api_key.change_origin'])
  })

  it('does not touch the database when nothing differs', async () => {
    serveGuild({ tier: 'premium', stats_excluded: 1, key_origin: 'giveaway' })
    const res = await call({ tier: 'premium', statsExcluded: true, keyOrigin: 'giveaway' })
    expect(res.status).toBe(200)
    expect(query).not.toHaveBeenCalled()
    expect(writeAudit).not.toHaveBeenCalled()
  })

  it('warns about a manual tier override on a live subscription, but not about a classification change', async () => {
    serveGuild({ tier: 'basic', stripe_subscription_id: 'sub_123' })
    const withTier = await (await call({ tier: 'premium' })).json()
    expect(withTier.warning).toContain('Stripe subscription')

    serveGuild({ tier: 'basic', stripe_subscription_id: 'sub_123' })
    const withOrigin = await (await call({ keyOrigin: 'sponsored' })).json()
    // Nothing syncs these two columns, so a warning here would be a lie.
    expect(withOrigin.warning).toBeUndefined()
  })

  it('rejects a guild id that is not a snowflake', async () => {
    serveGuild()
    const res = await PATCH(
      adminReq('/api/admin/api-keys/nope', { method: 'PATCH', body: { keyOrigin: 'normal' }, origin: 'https://www.msk-scripts.de' }),
      { params: Promise.resolve({ guildId: 'nope' }) },
    )
    expect(res.status).toBe(400)
  })
})
