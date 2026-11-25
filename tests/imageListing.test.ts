import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ query: vi.fn(), queryOne: vi.fn() }))

import { query, queryOne } from '@/lib/db'
import { IMAGE_DESCRIPTION_MAX, IMAGE_TITLE_MAX, imageDescription, imageTitle, listImages } from '@/lib/images'

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
  it('keeps the wording before falling back to the bare spawn name', () => {
    // "Gallivanter Baller LE LWB (Armored) (baller6)" is too long for the
    // wording; "baller6 PNG | MSK Scripts" was under 30 characters.
    const title = imageTitle({ name: 'baller6', label: 'Gallivanter Baller LE LWB (Armored)', ext: 'png' }, 'en')
    expect(title).toBe('baller6, transparent PNG')
  })

  it('never gives the English and German page the same title', () => {
    // ".22 Long Rifle (ammo-22) PNG, Items" stood on both language versions.
    const image = { name: 'ammo-22', label: '.22 Long Rifle', ext: 'png' }
    expect(imageTitle(image, 'en', 'Items')).not.toBe(imageTitle(image, 'de', 'Items'))
    const long = { name: 'acapulcogold_untrimmed_bud', label: 'Acapulco Gold Untrimmed Bud', ext: 'png' }
    expect(imageTitle(long, 'en')).not.toBe(imageTitle(long, 'de'))
  })

  it('names the category for an image published in two categories', () => {
    const image = { name: 'ammo-22', label: '.22 Long Rifle', ext: 'png' }
    const items   = imageTitle(image, 'en', 'Items')
    const weapons = imageTitle(image, 'en', 'Weapons')
    expect(items).not.toBe(weapons)
    expect(weapons).toContain('Weapons')
    expect(weapons.length).toBeLessThanOrEqual(IMAGE_TITLE_MAX)
  })

  it('tells pages with the same label apart by spawn name', () => {
    const a = imageTitle({ name: 'tanker', label: 'Trailer', ext: 'png' }, 'en')
    const b = imageTitle({ name: 'tr2',    label: 'Trailer', ext: 'png' }, 'en')
    expect(a).not.toBe(b)
    expect(a).toBe('Trailer (tanker), transparent PNG')
  })

  it('does not repeat a label that is just the spawn name', () => {
    expect(imageTitle({ name: 'adder', label: 'Adder', ext: 'png' }, 'en')).toBe('adder, transparent PNG')
    expect(imageTitle({ name: 'adder', label: null, ext: 'png' }, 'de')).toBe('adder, freigestelltes PNG')
  })

  it('stays inside what a search result shows', () => {
    const long = { name: 'acapulcogold_untrimmed_bud', label: 'Acapulco Gold Untrimmed Bud', ext: 'png' }
    for (const lang of ['en', 'de'] as const) {
      const title = imageTitle(long, lang)
      expect(title.length).toBeLessThanOrEqual(IMAGE_TITLE_MAX)
      expect(title).toContain(long.name)
    }
  })

  it('names the stored format instead of always saying PNG', () => {
    const title = imageTitle({ name: 'banner', label: 'Shop banner', ext: 'jpg' }, 'en')
    expect(title).toBe('Shop banner (banner), JPG')
    expect(title).not.toContain('PNG')
  })
})

describe('imageDescription', () => {
  const base = { label: 'Albany Cavalcade', width: 1024, height: 619 }

  it('tells images with the same label and size apart by spawn name', () => {
    for (const lang of ['en', 'de'] as const) {
      const a = imageDescription({ ...base, name: 'cavalcade' },  lang)
      const b = imageDescription({ ...base, name: 'cavalcade2' }, lang)
      expect(a).not.toBe(b)
      expect(b).toContain('cavalcade2')
    }
  })

  it('stays inside what a search result shows', () => {
    const long = { name: 'phentermine_hydrochloride_pppetite_suppressant', label: 'Phentermine Hydrochloride Appetite Suppressant', width: 512, height: 512 }
    for (const lang of ['en', 'de'] as const) {
      expect(imageDescription(long, lang, 'Items').length).toBeLessThanOrEqual(IMAGE_DESCRIPTION_MAX)
    }
  })
})
