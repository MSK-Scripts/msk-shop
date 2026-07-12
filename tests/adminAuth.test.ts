import { describe, it, expect, beforeAll, beforeEach, vi, type Mock } from 'vitest'

// Mock the DB layer so authorizeAdmin/loadAdminMember run without a database.
vi.mock('@/lib/db', () => ({ queryOne: vi.fn(), query: vi.fn() }))

import { queryOne } from '@/lib/db'
import { authorizeAdmin } from '@/lib/adminAuth'
import { signAdminSession } from '@/lib/adminSession'

const SECRET = 'test-secret-123'
beforeAll(() => { process.env.SESSION_SECRET = SECRET })
beforeEach(() => { (queryOne as Mock).mockReset() })

const tokenFor = (id: string) => signAdminSession({ discordUserId: id })

function row(overrides: Record<string, unknown> = {}) {
  return { discord_user_id: '1', display_name: null, is_owner: 0, permissions: JSON.stringify(['payments.view']), active: 1, ...overrides }
}

describe('authorizeAdmin', () => {
  it('401 without a token', async () => {
    expect(await authorizeAdmin(undefined)).toEqual({ ok: false, status: 401 })
  })

  it('401 with an invalid token', async () => {
    expect(await authorizeAdmin('garbage')).toEqual({ ok: false, status: 401 })
  })

  it('401 when the user is not on the allowlist', async () => {
    (queryOne as Mock).mockResolvedValue(null)
    expect(await authorizeAdmin(tokenFor('1'))).toEqual({ ok: false, status: 401 })
  })

  it('403 when the required permission is missing', async () => {
    (queryOne as Mock).mockResolvedValue(row())
    expect(await authorizeAdmin(tokenFor('1'), 'payments.refund')).toEqual({ ok: false, status: 403 })
  })

  it('grants when the required permission is present', async () => {
    (queryOne as Mock).mockResolvedValue(row())
    const res = await authorizeAdmin(tokenFor('1'), 'payments.view')
    expect(res.ok).toBe(true)
  })

  it('lets the owner pass any permission', async () => {
    (queryOne as Mock).mockResolvedValue(row({ is_owner: 1, permissions: JSON.stringify([]) }))
    const res = await authorizeAdmin(tokenFor('1'), 'team.manage')
    expect(res.ok).toBe(true)
  })

  it('treats an array of permissions as any-of', async () => {
    (queryOne as Mock).mockResolvedValue(row({ permissions: JSON.stringify(['coupons.manage']) }))
    expect((await authorizeAdmin(tokenFor('1'), ['payments.create', 'coupons.manage'])).ok).toBe(true)
    expect((await authorizeAdmin(tokenFor('1'), ['payments.create', 'bans.manage'])).ok).toBe(false)
  })
})
