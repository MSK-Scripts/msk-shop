import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { unwrapList, tebexPlugin, TebexPluginError } from '@/lib/tebexPlugin'

describe('unwrapList', () => {
  it('handles bare arrays, { data } wrappers and junk', () => {
    expect(unwrapList([1, 2])).toEqual([1, 2])
    expect(unwrapList({ data: [3] })).toEqual([3])
    expect(unwrapList(null)).toEqual([])
    expect(unwrapList({ nope: 1 })).toEqual([])
    expect(unwrapList('x')).toEqual([])
  })
})

describe('tebexPlugin request/error handling', () => {
  beforeAll(() => { process.env.TEBEX_PLUGIN_SECRET = 'secret' })
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns parsed JSON on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, text: async () => JSON.stringify([{ id: 1 }]),
    }))
    await expect(tebexPlugin.bans.list()).resolves.toEqual([{ id: 1 }])
  })

  it('sends the X-Tebex-Secret header', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '[]' })
    vi.stubGlobal('fetch', f)
    await tebexPlugin.bans.list()
    const opts = f.mock.calls[0][1] as { headers: Record<string, string> }
    expect(opts.headers['X-Tebex-Secret']).toBe('secret')
  })

  it('throws TebexPluginError carrying the Tebex error_message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 403, statusText: 'Forbidden',
      json: async () => ({ error_message: 'Invalid secret' }),
    }))
    await expect(tebexPlugin.bans.list()).rejects.toBeInstanceOf(TebexPluginError)
    await expect(tebexPlugin.bans.list()).rejects.toMatchObject({ status: 403, tebexMessage: 'Invalid secret' })
  })

  it('falls back to statusText when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 500, statusText: 'Server Error',
      json: async () => { throw new Error('not json') },
    }))
    await expect(tebexPlugin.bans.list()).rejects.toMatchObject({ status: 500, tebexMessage: 'Server Error' })
  })
})
