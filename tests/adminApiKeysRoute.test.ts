import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { adminReq, staticCtx } from './helpers'

vi.mock('@/lib/db', () => ({ query: vi.fn(), queryOne: vi.fn() }))

import { query, queryOne } from '@/lib/db'
import { GET } from '@/app/api/admin/api-keys/route'

const mQuery    = query    as unknown as ReturnType<typeof vi.fn>
const mQueryOne = queryOne as unknown as ReturnType<typeof vi.fn>

const row = (guild_id: string, created_at: string) => ({
  guild_id, guild_name: `Guild ${guild_id}`, api_key: `key-${guild_id}`,
  tier: 'basic', custom_domain: null, domain_status: 'none',
  is_hosted: 0, active: 1, created_at, expires_at: null,
})

beforeAll(() => { process.env.SESSION_SECRET = 'test-secret' })

beforeEach(() => {
  mQuery.mockReset()
  mQueryOne.mockReset()
  mQueryOne.mockImplementation(async (sql: string) =>
    sql.includes('display_name')
      ? { discord_user_id: '1', display_name: null, is_owner: 1, permissions: '[]', active: 1 }
      : { is_owner: 1 })
})

async function keys() {
  const res = await GET(adminReq('/api/admin/api-keys'), staticCtx)
  expect(res.status).toBe(200)
  return (await res.json()).keys
}

describe('api-keys listing', () => {
  it('carries the registration date, which the table now shows', async () => {
    mQuery.mockResolvedValue([row('1', '2026-08-28T19:26:41.000Z')])
    expect((await keys())[0].createdAt).toBe('2026-08-28T19:26:41.000Z')
  })

  /**
   * The tab states "newest registration first" in plain text, so the order is
   * a promise to the reader and not an incidental detail of the query. The
   * client does not re-sort; it renders what arrives.
   */
  it('asks the database for newest first', async () => {
    mQuery.mockResolvedValue([])
    await keys()
    expect(String(mQuery.mock.calls[0][0])).toMatch(/ORDER BY\s+created_at DESC/)
  })

  it('preserves the order it was given', async () => {
    mQuery.mockResolvedValue([
      row('newest', '2026-08-28T10:00:00.000Z'),
      row('middle', '2026-05-01T10:00:00.000Z'),
      row('oldest', '2024-08-01T10:00:00.000Z'),
    ])
    expect((await keys()).map((k: { guildId: string }) => k.guildId)).toEqual(['newest', 'middle', 'oldest'])
  })
})
