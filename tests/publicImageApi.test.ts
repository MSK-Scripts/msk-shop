import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({ query: vi.fn(), queryOne: vi.fn() }))

import { query, queryOne } from '@/lib/db'
import { GET as list,     OPTIONS as listOptions } from '@/app/api/images/route'
import { GET as cats,     OPTIONS as catsOptions } from '@/app/api/images/categories/route'
import { GET as single,   OPTIONS as singleOptions } from '@/app/api/images/[category]/[name]/route'
import { GET as uploadState } from '@/app/api/images/upload/route'

const mQuery    = query    as unknown as ReturnType<typeof vi.fn>
const mQueryOne = queryOne as unknown as ReturnType<typeof vi.fn>

const req = (path: string) => new NextRequest(new URL(path, 'https://www.msk-scripts.de'))
const ACAO = 'access-control-allow-origin'

const image = {
  category: 'vehicles', name: 'zentorno', label: 'Pegassi Zentorno', tags: 'super',
  ext: 'png', width: 1024, height: 463, bytes: 99444, version: 2,
}

beforeEach(() => {
  mQuery.mockReset()
  mQueryOne.mockReset()
  mQuery.mockResolvedValue([])
  mQueryOne.mockResolvedValue({ total: 0 })
})

describe('the public read endpoints allow cross-origin reads', () => {
  it('serves the image list to any origin', async () => {
    const res = await list(req('/api/images?per=1'))
    expect(res.status).toBe(200)
    expect(res.headers.get(ACAO)).toBe('*')
  })

  it('serves the category list to any origin', async () => {
    const res = await cats(req('/api/images/categories'))
    expect(res.status).toBe(200)
    expect(res.headers.get(ACAO)).toBe('*')
  })

  it('serves a single image to any origin', async () => {
    mQueryOne.mockResolvedValue(image)
    const res = await single(req('/api/images/vehicles/zentorno'), {
      params: Promise.resolve({ category: 'vehicles', name: 'zentorno' }),
    })
    expect(res.status).toBe(200)
    expect(res.headers.get(ACAO)).toBe('*')
  })

  /**
   * A 404 that a browser cannot read is a hang, not an answer: the fetch
   * rejects on the CORS check and the caller never learns the name is unknown,
   * which is the single most useful thing this endpoint can say.
   */
  it('keeps the header on a miss, so the caller can read the 404', async () => {
    mQueryOne.mockResolvedValue(null)
    const res = await single(req('/api/images/vehicles/nope'), {
      params: Promise.resolve({ category: 'vehicles', name: 'nope' }),
    })
    expect(res.status).toBe(404)
    expect(res.headers.get(ACAO)).toBe('*')
  })

  it('answers the preflight instead of leaving it at 405', () => {
    for (const options of [listOptions, catsOptions, singleOptions]) {
      const res = options()
      expect(res.status).toBe(204)
      expect(res.headers.get(ACAO)).toBe('*')
      expect(res.headers.get('access-control-allow-methods')).toContain('GET')
    }
  })
})

describe('the upload endpoint stays same-origin', () => {
  /**
   * The whole reason the header is set per route instead of on the /api/images
   * prefix. This endpoint carries a session cookie and checks Origin as its
   * CSRF defence; a wildcard here would let any page read a signed-in user's
   * submissions, and it is the exact hole that check exists to close.
   */
  it('sends no cross-origin header on the upload state', async () => {
    const res = await uploadState(req('/api/images/upload'))
    expect(res.headers.get(ACAO)).toBeNull()
  })

  it('is not cacheable either, unlike the read endpoints', async () => {
    const res = await uploadState(req('/api/images/upload'))
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})
