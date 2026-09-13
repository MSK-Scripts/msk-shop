import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadHeadlineStat } from '@/lib/fivestats'

/**
 * The home page hero depends on this call. Every error path MUST return `null`
 * so that the hero falls back to its static text instead of showing a
 * broken or zeroed number.
 */
function mockJson(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => body })
}

const ORIGINAL_KEY = process.env.FIVESTATS_API_KEY

beforeEach(() => {
  process.env.FIVESTATS_API_KEY = 'test-key'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  if (ORIGINAL_KEY === undefined) delete process.env.FIVESTATS_API_KEY
  else process.env.FIVESTATS_API_KEY = ORIGINAL_KEY
})

describe('loadHeadlineStat', () => {
  it('liefert Name und Server-Anzahl der konfigurierten Resource', async () => {
    vi.stubGlobal('fetch', mockJson({ server_count: 297, rank: 2171 }))

    const stat = await loadHeadlineStat()
    expect(stat).toEqual({ displayName: 'MSK Core', serverCount: 297 })
  })

  it('fragt genau EINEN Endpoint ab, nicht die History', async () => {
    const f = mockJson({ server_count: 297 })
    vi.stubGlobal('fetch', f)

    await loadHeadlineStat()

    expect(f).toHaveBeenCalledTimes(1)
    expect(String(f.mock.calls[0][0])).not.toContain('/history')
  })

  it('gibt null zurück, wenn kein API-Key gesetzt ist', async () => {
    delete process.env.FIVESTATS_API_KEY
    const f = vi.fn()
    vi.stubGlobal('fetch', f)

    expect(await loadHeadlineStat()).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })

  it('gibt null zurück, wenn die Resource nicht indexiert ist (404)', async () => {
    vi.stubGlobal('fetch', mockJson(null, false, 404))
    expect(await loadHeadlineStat()).toBeNull()
  })

  it('gibt null zurück, wenn die API einen Fehler liefert', async () => {
    vi.stubGlobal('fetch', mockJson(null, false, 500))
    expect(await loadHeadlineStat()).toBeNull()
  })

  it('gibt null zurück, wenn der Request wirft', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect(await loadHeadlineStat()).toBeNull()
  })

  // Better no number at all than „läuft auf 0 Servern" ("running on 0 servers").
  it('gibt null zurück bei einer Server-Anzahl von 0', async () => {
    vi.stubGlobal('fetch', mockJson({ server_count: 0 }))
    expect(await loadHeadlineStat()).toBeNull()
  })

  it('gibt null zurück, wenn server_count fehlt oder unbrauchbar ist', async () => {
    vi.stubGlobal('fetch', mockJson({ rank: 10 }))
    expect(await loadHeadlineStat()).toBeNull()

    vi.stubGlobal('fetch', mockJson({ server_count: 'keine Zahl' }))
    expect(await loadHeadlineStat()).toBeNull()
  })
})
