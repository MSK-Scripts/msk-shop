import { describe, it, expect, afterEach, vi } from 'vitest'
import { fetchUserGuilds, fetchGuildMemberRoles } from '@/lib/discordGuilds'

const guild = (id: string) => ({
  id, name: `g${id}`, icon: null, owner: false, permissions: '0',
})

/** A page of exactly 200 guilds, which is what Discord returns when there may
 *  be more. Ids ascend so the `after` cursor is the last one. */
const fullPage = (from: number) =>
  Array.from({ length: 200 }, (_, i) => guild(String(100000000000000000 + from + i)))

const okJson = (body: unknown) => ({ ok: true, status: 200, json: async () => body })

describe('fetchUserGuilds', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns a short page as complete, with one request', async () => {
    const f = vi.fn().mockResolvedValue(okJson([guild('1'), guild('2')]))
    vi.stubGlobal('fetch', f)

    const res = await fetchUserGuilds('tok')
    expect(res.complete).toBe(true)
    expect(res.guilds).toHaveLength(2)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('treats an empty list as complete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson([])))
    const res = await fetchUserGuilds('tok')
    expect(res).toEqual({ guilds: [], complete: true })
  })

  // The boundary this pagination exists for: a full page is indistinguishable
  // from a truncated one, so a second request has to settle it.
  it('follows the cursor past a full page and reports complete', async () => {
    const page1 = fullPage(0)
    const f = vi.fn()
      .mockResolvedValueOnce(okJson(page1))
      .mockResolvedValueOnce(okJson([guild('999')]))
    vi.stubGlobal('fetch', f)

    const res = await fetchUserGuilds('tok')
    expect(res.complete).toBe(true)
    expect(res.guilds).toHaveLength(201)
    expect(f).toHaveBeenCalledTimes(2)
    // Second request must carry the last id of the first page as `after`.
    expect(String(f.mock.calls[1][0])).toContain(`after=${page1[199].id}`)
  })

  it('sends the bearer token and a limit of 200', async () => {
    const f = vi.fn().mockResolvedValue(okJson([]))
    vi.stubGlobal('fetch', f)
    await fetchUserGuilds('tok')
    expect(String(f.mock.calls[0][0])).toContain('limit=200')
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer tok')
  })

  // Everything below is the same assertion from a different angle: absence of
  // a guild is what `reconcileGuildAccess` reads as "lost access", so anything
  // short of a provably whole list must not claim to be one.
  it('reports incomplete on an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }))
    expect((await fetchUserGuilds('tok')).complete).toBe(false)
  })

  it('reports incomplete on a thrown request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect((await fetchUserGuilds('tok')).complete).toBe(false)
  })

  it('reports incomplete when Discord answers with an error object', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ message: '401: Unauthorized', code: 0 })))
    const res = await fetchUserGuilds('tok')
    expect(res).toEqual({ guilds: [], complete: false })
  })

  it('keeps what it read when a later page fails', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(okJson(fullPage(0)))
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) }))
    const res = await fetchUserGuilds('tok')
    expect(res.guilds).toHaveLength(200)
    expect(res.complete).toBe(false)
  })

  it('gives up rather than paginating forever', async () => {
    // Every page full, so the loop never sees its exit condition.
    const f = vi.fn().mockImplementation(() => Promise.resolve(okJson(fullPage(0))))
    vi.stubGlobal('fetch', f)
    const res = await fetchUserGuilds('tok')
    expect(res.complete).toBe(false)
    expect(f.mock.calls.length).toBeLessThanOrEqual(6)
  })
})

describe('fetchGuildMemberRoles', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns the role ids as strings', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ roles: ['1', 2] })))
    await expect(fetchGuildMemberRoles('tok', '123')).resolves.toEqual(['1', '2'])
  })

  it('returns an empty array for a member with no roles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ roles: [] })))
    await expect(fetchGuildMemberRoles('tok', '123')).resolves.toEqual([])
  })

  // null means "cannot say" and callers must not read it as "holds no roles".
  it('returns null on a missing scope, an error or junk', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }))
    await expect(fetchGuildMemberRoles('tok', '123')).resolves.toBeNull()

    vi.unstubAllGlobals()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(fetchGuildMemberRoles('tok', '123')).resolves.toBeNull()

    vi.unstubAllGlobals()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ nope: true })))
    await expect(fetchGuildMemberRoles('tok', '123')).resolves.toBeNull()
  })
})
