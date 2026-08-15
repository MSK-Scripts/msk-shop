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

describe('coupons.listAll', () => {
  beforeAll(() => { process.env.TEBEX_PLUGIN_SECRET = 'secret' })
  afterEach(() => { vi.unstubAllGlobals() })

  /** Serves `lastPage` pages of one coupon each, named after their page. */
  function stubPages(lastPage: number) {
    const seen: number[] = []
    const f = vi.fn().mockImplementation(async (url: string) => {
      const page = Number(new URL(url).searchParams.get('page'))
      seen.push(page)
      return {
        ok: true, status: 200,
        text: async () => JSON.stringify({
          pagination: { lastPage, currentPage: page },
          data: [{ id: page, code: `C${page}` }],
        }),
      }
    })
    vi.stubGlobal('fetch', f)
    return seen
  }

  it('reads every page, not just the first', async () => {
    // The bug this guards: the store had 35 pages and the dashboard showed 1.
    const seen = stubPages(35)
    const { coupons, truncated } = await tebexPlugin.coupons.listAll()
    expect(coupons).toHaveLength(35)
    expect(truncated).toBe(false)
    expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: 35 }, (_, i) => i + 1))
  })

  it('requests each page exactly once', async () => {
    const seen = stubPages(20)
    await tebexPlugin.coupons.listAll()
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('handles a single-page store without extra requests', async () => {
    const seen = stubPages(1)
    const { coupons } = await tebexPlugin.coupons.listAll()
    expect(coupons).toHaveLength(1)
    expect(seen).toEqual([1])
  })

  it('caps runaway page counts and reports the truncation', async () => {
    const seen = stubPages(500)
    const { coupons, truncated } = await tebexPlugin.coupons.listAll()
    expect(truncated).toBe(true)
    expect(coupons.length).toBeLessThanOrEqual(80)
    expect(seen.length).toBeLessThanOrEqual(80)
  })

  it('survives a missing pagination block', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, text: async () => JSON.stringify({ data: [{ id: 1 }] }),
    }))
    await expect(tebexPlugin.coupons.listAll()).resolves.toEqual({ coupons: [{ id: 1 }], truncated: false })
  })
})
