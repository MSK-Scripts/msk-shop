import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

/**
 * The two routes between the giveaway dashboard and the bot, for what the
 * scheduling release of the bot added: the data kinds `guild` and `history`,
 * the actions `delete` and `preview`, and the shop's own part of a deletion,
 * the public result page.
 *
 * What must hold:
 *   - only listed kinds and actions go through, each value in its one shape;
 *   - the guild is the session's, whatever the request says;
 *   - a result page is deleted only after the bot confirmed the deletion,
 *     and only the one of that giveaway in the session's guild.
 */

const state = vi.hoisted(() => ({ cookies: new Map<string, string>() }))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (state.cookies.has(name) ? { name, value: state.cookies.get(name)! } : undefined),
  }),
  headers: async () => new Headers(),
}))
vi.mock('@/lib/giveawayControl', () => ({ controlGet: vi.fn(), controlPost: vi.fn() }))
vi.mock('@/lib/db', () => ({ query: vi.fn(async () => []), queryOne: vi.fn(async () => null) }))
vi.mock('@/lib/serverLang', () => ({ getPreferredLang: async () => 'en' }))

import { GET as dataGET } from '@/app/api/giveaway/data/route'
import { POST as actionPOST } from '@/app/api/giveaway/action/route'
import { POST as resultDeletePOST } from '@/app/api/giveaway-result/delete/route'
import { query } from '@/lib/db'
import { controlGet, controlPost } from '@/lib/giveawayControl'
import { deleteResultPages } from '@/lib/giveawayResults'
import { GIVEAWAY_SESSION_COOKIE, signGiveawaySession } from '@/lib/giveawaySession'

const GUILD = '111111111111111111'
const FOREIGN = '333333333333333333'
const USER = '400000000000000001'

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-giveaway-routes'
})

beforeEach(() => {
  vi.clearAllMocks()
  state.cookies.clear()
  state.cookies.set(GIVEAWAY_SESSION_COOKIE, signGiveawaySession({ guildId: GUILD, userId: USER, owner: false }))
  ;(controlGet as Mock).mockResolvedValue({ status: 200, data: { ok: true } })
  ;(controlPost as Mock).mockResolvedValue({ status: 200, data: { ok: true } })
})

const read = (search: string) => dataGET(new Request(`https://www.msk-scripts.de/api/giveaway/data?${search}`))
const write = (body: Record<string, unknown>) => actionPOST(new Request('https://www.msk-scripts.de/api/giveaway/action', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
}))

/** The DELETE statements the shop ran against its result pages. */
const deletes = () => (query as Mock).mock.calls.filter(([sql]) => String(sql).startsWith('DELETE FROM giveaway_results'))

describe('data route: the new kinds', () => {
  it('passes guild and history to the bot with the session guild', async () => {
    expect((await read('kind=guild')).status).toBe(200)
    expect(controlGet).toHaveBeenLastCalledWith(GUILD, '/guild', {})
    expect((await read('kind=history&days=90&guildId=' + FOREIGN)).status).toBe(200)
    expect(controlGet).toHaveBeenLastCalledWith(GUILD, '/history', { days: '90' })
    await read('kind=history')
    expect(controlGet).toHaveBeenLastCalledWith(GUILD, '/history', { days: '30' })
  })

  it.each(['7', '365', '30.5', '-30', 'abc', ''])('refuses %j days without asking the bot', async days => {
    const res = await read(`kind=history&days=${days}`)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_days' })
    expect(controlGet).not.toHaveBeenCalled()
  })

  it('passes a giveaway id only in the bot\'s shape, upper-cased', async () => {
    await read('kind=giveaway&id=ab12cd')
    expect(controlGet).toHaveBeenLastCalledWith(GUILD, '/giveaway', { id: 'AB12CD' })
    for (const id of ['', 'AB', 'AB12CD34EF567', '../x', 'AB 12']) {
      const res = await read(`kind=giveaway&id=${encodeURIComponent(id)}`)
      expect(res.status).toBe(400)
    }
    expect(controlGet).toHaveBeenCalledTimes(1)
  })

  it('still refuses a kind that is not listed', async () => {
    expect((await read('kind=delete')).status).toBe(400)
    expect((await read('kind=preview')).status).toBe(400)
    expect(controlGet).not.toHaveBeenCalled()
  })

  it('answers 401 without a session', async () => {
    state.cookies.clear()
    expect((await read('kind=guild')).status).toBe(401)
    expect(controlGet).not.toHaveBeenCalled()
  })
})

describe('action route: preview', () => {
  it('passes the create body on, without guild or user from the client', async () => {
    const res = await write({ action: 'preview', title: 'T', description: 'D', duration: '1d', guildId: FOREIGN, userId: '1', lang: 'de' })
    expect(res.status).toBe(200)
    expect(controlPost).toHaveBeenCalledWith(GUILD, '/giveaway/preview', { title: 'T', description: 'D', duration: '1d', lang: 'de' })
  })

  it('refuses a language the bot does not speak', async () => {
    const res = await write({ action: 'preview', title: 'T', description: 'D', lang: 'xx' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_lang' })
    expect(controlPost).not.toHaveBeenCalled()
  })
})

describe('action route: delete', () => {
  it('deletes the result page of that giveaway in the session guild after the bot confirmed', async () => {
    ;(controlPost as Mock).mockResolvedValue({ status: 200, data: { ok: true, couponsIssued: 2, message: 'deleted' } })
    const res = await write({ action: 'delete', id: 'ab12cd', guildId: FOREIGN })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, couponsIssued: 2, message: 'deleted', resultPage: 'deleted' })
    expect(controlPost).toHaveBeenCalledWith(GUILD, '/giveaway/delete', { id: 'AB12CD' })
    expect(deletes()).toEqual([[
      'DELETE FROM giveaway_results WHERE guild_id = ? AND giveaway_id = ?', [GUILD, 'AB12CD'],
    ]])
  })

  it.each([
    ['still running', 409, { error: 'still_running' }],
    ['unknown or another guild\'s', 404, { error: 'not_found' }],
    ['an older bot without the route', 404, { error: 'not_found' }],
    ['unreachable', 502, { error: 'control_unreachable' }],
    ['a 200 without ok', 200, {}],
  ])('keeps the result page when the bot answers %s', async (_label, status, data) => {
    ;(controlPost as Mock).mockResolvedValue({ status, data })
    const res = await write({ action: 'delete', id: 'AB12CD' })
    expect(res.status).toBe(status)
    expect(deletes()).toEqual([])
  })

  it.each(['', 'AB', 'AB12CD34EF567', "AB12CD' OR 1=1", 'AB_12'])('refuses the id %j before the bot and the database', async id => {
    const res = await write({ action: 'delete', id })
    expect(res.status).toBe(400)
    expect(controlPost).not.toHaveBeenCalled()
    expect(deletes()).toEqual([])
  })

  it('still says the giveaway is gone when only the result page could not be deleted', async () => {
    ;(controlPost as Mock).mockResolvedValue({ status: 200, data: { ok: true, couponsIssued: 0, message: 'none' } })
    ;(query as Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await write({ action: 'delete', id: 'AB12CD' })
    spy.mockRestore()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, resultPage: 'failed' })
  })

  it('answers 401 without a session and touches nothing', async () => {
    state.cookies.clear()
    expect((await write({ action: 'delete', id: 'AB12CD' })).status).toBe(401)
    expect(controlPost).not.toHaveBeenCalled()
    expect(deletes()).toEqual([])
  })
})

describe('result pages', () => {
  it('deletes one giveaway\'s page only together with its guild', async () => {
    await deleteResultPages(GUILD, 'AB12CD')
    await deleteResultPages(GUILD)
    expect(deletes()).toEqual([
      ['DELETE FROM giveaway_results WHERE guild_id = ? AND giveaway_id = ?', [GUILD, 'AB12CD']],
      ['DELETE FROM giveaway_results WHERE guild_id = ?', [GUILD]],
    ])
  })

  it('refuses ids that are not ids instead of running a wider query', async () => {
    await expect(deleteResultPages('', 'AB12CD')).rejects.toThrow()
    await expect(deleteResultPages(GUILD, '%')).rejects.toThrow()
    await expect(deleteResultPages(GUILD, '')).rejects.toThrow()
    expect(deletes()).toEqual([])
  })

  it('the bot\'s own route still deletes a whole guild, with its secret only', async () => {
    process.env.GIVEAWAY_RESULT_SECRET = ''
    const req = () => new Request('https://www.msk-scripts.de/api/giveaway-result/delete', {
      method: 'POST', headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
      body: JSON.stringify({ guildId: GUILD }),
    })
    // The secret is read when the module loads; without one nothing passes.
    expect((await resultDeletePOST(req())).status).toBe(401)
    expect(deletes()).toEqual([])
  })
})
