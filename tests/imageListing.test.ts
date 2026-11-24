import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ query: vi.fn(), queryOne: vi.fn() }))

import { query, queryOne } from '@/lib/db'
import { IMAGE_TITLE_MAX, imageTitle, listImages } from '@/lib/images'

const mQuery    = query    as unknown as ReturnType<typeof vi.fn>
const mQueryOne = queryOne as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  mQuery.mockReset()
  mQueryOne.mockReset()
  mQuery.mockResolvedValue([])
})

/**
 * The crawl of 24.11.2026 followed "Next" to page 2725 of every category.
 * Past the last row nothing reaches the SQL: no wasted query, and no
 * `OFFSET 6e+301` from `?page=1e300`, which was a syntax error and a 500.
 */
describe('listImages past the last page', () => {
  it('answers an empty page without asking for rows', async () => {
    mQueryOne.mockResolvedValue({ total: 159 })
    const result = await listImages({ category: 'weapons', page: 4, per: 60 })
    expect(result.items).toEqual([])
    expect(result.total).toBe(159)
    expect(mQuery).not.toHaveBeenCalled()
  })

  it('never puts an exponent or Infinity into the SQL', async () => {
    mQueryOne.mockResolvedValue({ total: 159 })
    for (const page of [1e300, Infinity]) {
      await listImages({ category: 'weapons', page, per: 60 })
    }
    expect(mQuery).not.toHaveBeenCalled()
  })

  it('still reads the last real page', async () => {
    mQueryOne.mockResolvedValue({ total: 159 })
    await listImages({ category: 'weapons', page: 3, per: 60 })
    expect(mQuery).toHaveBeenCalledTimes(1)
    expect(mQuery.mock.calls[0][0]).toContain('LIMIT 60 OFFSET 120')
  })
})

describe('imageTitle', () => {
  it('tells pages with the same label apart by spawn name', () => {
    const a = imageTitle({ name: 'tanker', label: 'Trailer' }, 'en')
    const b = imageTitle({ name: 'tr2',    label: 'Trailer' }, 'en')
    expect(a).not.toBe(b)
    expect(a).toBe('Trailer (tanker), transparent PNG')
  })

  it('does not repeat a label that is just the spawn name', () => {
    expect(imageTitle({ name: 'adder', label: 'Adder' }, 'en')).toBe('adder, transparent PNG')
    expect(imageTitle({ name: 'adder', label: null }, 'de')).toBe('adder, freigestelltes PNG')
  })

  it('stays inside what a search result shows', () => {
    const long = { name: 'acapulcogold_untrimmed_bud', label: 'Acapulco Gold Untrimmed Bud' }
    for (const lang of ['en', 'de'] as const) {
      const title = imageTitle(long, lang)
      expect(title.length).toBeLessThanOrEqual(IMAGE_TITLE_MAX)
      expect(title).toContain(long.name)
    }
  })
})
