import { describe, it, expect, beforeAll, beforeEach, vi, type Mock } from 'vitest'

vi.mock('@/lib/db', () => ({ queryOne: vi.fn(), query: vi.fn() }))

import { queryOne, query } from '@/lib/db'
import { PATCH, DELETE } from '@/app/api/admin/team/[discordUserId]/route'
import { POST } from '@/app/api/admin/team/route'
import { adminReq, serveAdminTeam, staticCtx } from './helpers'

const TEAM_MANAGE = JSON.stringify(['team.manage'])
const ctx = (id: string) => ({ params: Promise.resolve({ discordUserId: id }) })

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret'
  process.env.NEXT_PUBLIC_BASE_URL = 'https://www.msk-scripts.de'
})
beforeEach(() => { vi.clearAllMocks() })

describe('PATCH /admin/team/[id]', () => {
  it('blocks editing the owner (403)', async () => {
    serveAdminTeam(queryOne as Mock, [
      { discord_user_id: 'admin', permissions: TEAM_MANAGE },
      { discord_user_id: 'owner', is_owner: 1 },
    ])
    const res = await PATCH(adminReq('/api/admin/team/owner', { method: 'PATCH', userId: 'admin', body: { permissions: ['team.manage'], active: true } }), ctx('owner'))
    expect(res.status).toBe(403)
    expect(query).not.toHaveBeenCalled()
  })

  it('blocks self-lockout (dropping own team.manage)', async () => {
    serveAdminTeam(queryOne as Mock, [{ discord_user_id: 'admin', permissions: TEAM_MANAGE }])
    const res = await PATCH(adminReq('/api/admin/team/admin', { method: 'PATCH', userId: 'admin', body: { permissions: [], active: true } }), ctx('admin'))
    expect(res.status).toBe(403)
  })

  it('blocks self-escalation (granting a permission you lack)', async () => {
    serveAdminTeam(queryOne as Mock, [{ discord_user_id: 'admin', permissions: TEAM_MANAGE }])
    const res = await PATCH(adminReq('/api/admin/team/admin', { method: 'PATCH', userId: 'admin', body: { permissions: ['team.manage', 'payments.refund'], active: true } }), ctx('admin'))
    expect(res.status).toBe(403)
  })

  it('allows a valid update of another member', async () => {
    serveAdminTeam(queryOne as Mock, [
      { discord_user_id: 'admin', permissions: TEAM_MANAGE },
      { discord_user_id: 'bob', permissions: JSON.stringify(['payments.view']) },
    ])
    const res = await PATCH(adminReq('/api/admin/team/bob', { method: 'PATCH', userId: 'admin', body: { permissions: ['payments.view', 'bans.manage'], active: true } }), ctx('bob'))
    expect(res.status).toBe(200)
    expect(query).toHaveBeenCalled()
  })

  it('rejects a caller without team.manage (403)', async () => {
    serveAdminTeam(queryOne as Mock, [{ discord_user_id: 'weak', permissions: JSON.stringify(['payments.view']) }])
    const res = await PATCH(adminReq('/api/admin/team/x', { method: 'PATCH', userId: 'weak', body: { permissions: [], active: true } }), ctx('x'))
    expect(res.status).toBe(403)
  })
})

describe('DELETE /admin/team/[id]', () => {
  it('blocks removing yourself (403)', async () => {
    serveAdminTeam(queryOne as Mock, [{ discord_user_id: 'admin', permissions: TEAM_MANAGE }])
    const res = await DELETE(adminReq('/api/admin/team/admin', { method: 'DELETE', userId: 'admin' }), ctx('admin'))
    expect(res.status).toBe(403)
    expect(query).not.toHaveBeenCalled()
  })

  it('blocks removing the owner (403)', async () => {
    serveAdminTeam(queryOne as Mock, [
      { discord_user_id: 'admin', permissions: TEAM_MANAGE },
      { discord_user_id: 'owner', is_owner: 1 },
    ])
    const res = await DELETE(adminReq('/api/admin/team/owner', { method: 'DELETE', userId: 'admin' }), ctx('owner'))
    expect(res.status).toBe(403)
  })

  it('removes a normal member (200)', async () => {
    serveAdminTeam(queryOne as Mock, [
      { discord_user_id: 'admin', permissions: TEAM_MANAGE },
      { discord_user_id: 'bob' },
    ])
    const res = await DELETE(adminReq('/api/admin/team/bob', { method: 'DELETE', userId: 'admin' }), ctx('bob'))
    expect(res.status).toBe(200)
    expect(query).toHaveBeenCalled()
  })
})

describe('POST /admin/team', () => {
  it('rejects a non-numeric Discord id (400)', async () => {
    serveAdminTeam(queryOne as Mock, [{ discord_user_id: 'admin', permissions: TEAM_MANAGE }])
    const res = await POST(adminReq('/api/admin/team', { method: 'POST', userId: 'admin', body: { discordUserId: 'abc', permissions: [] } }), staticCtx)
    expect(res.status).toBe(400)
  })

  it('inserts with is_owner hardcoded to 0 (never from the body)', async () => {
    serveAdminTeam(queryOne as Mock, [{ discord_user_id: 'admin', permissions: TEAM_MANAGE }])
    const res = await POST(adminReq('/api/admin/team', { method: 'POST', userId: 'admin', body: { discordUserId: '123456', is_owner: 1, permissions: ['team.manage'] } }), staticCtx)
    expect(res.status).toBe(200)
    const insert = (query as Mock).mock.calls.find(c => String(c[0]).includes('INSERT INTO msk_admin_team'))
    expect(insert).toBeTruthy()
    // is_owner is a SQL literal (0), not a bound parameter -> not taken from the body.
    expect(String(insert![0])).toContain('VALUES (?, ?, 0, ?, 1, ?)')
  })
})
