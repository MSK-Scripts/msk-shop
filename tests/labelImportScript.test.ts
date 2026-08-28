import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeTags } from '@/lib/adminImages'

/**
 * scripts/image-label-import.js is plain JS running outside Next, so it cannot
 * import lib/adminImages. Its tag handling is therefore a copy, and this file
 * is what keeps the copy honest, the same arrangement PIPELINE_RULES has with
 * the ingest script.
 *
 * The rule it guards: msk_images.tags is a comma-separated list read by
 * FIND_IN_SET. Writing a JSON array into it looks fine in the column and makes
 * the search silently return nothing, which is how 2066 rows ended up
 * unsearchable on 2026-08-28.
 */
const source = readFileSync(join(process.cwd(), 'scripts/image-label-import.js'), 'utf8')

function loadToTagList(): (v: unknown, name: string) => string | null {
  const fn = source.match(/function toTagList[\s\S]*?\n}/)
  if (!fn) throw new Error('toTagList not found in image-label-import.js')
  return new Function(`${fn[0]}; return toTagList`)() as (v: unknown, name: string) => string | null
}

const toTagList = loadToTagList()

describe('the import script and lib agree on tag shape', () => {
  it('produces exactly what normalizeTags produces, for string input', () => {
    for (const raw of ['Sports, DLC', 'msk_core, low-rider', 'A, a , B', '  ', 'food']) {
      expect(toTagList(raw, 'x')).toBe(normalizeTags(raw))
    }
  })

  it('accepts an array, which is the natural shape in a JSON file', () => {
    expect(toTagList(['food'], 'x')).toBe('food')
    expect(toTagList(['A', ' b ', 'a'], 'x')).toBe('a,b')
  })

  it('treats nothing-at-all as NULL rather than an empty string', () => {
    // The column is nullable and '' would be a third state for "no tags".
    for (const empty of [null, undefined, '', []]) {
      expect(toTagList(empty, 'x')).toBeNull()
    }
  })

  it('refuses a value it cannot store instead of writing it anyway', () => {
    // The original defect: the value went into the column unchecked, so
    // { tags: ["food"] } was stored as the literal string '["food"]'.
    expect(() => toTagList({ a: 1 }, 'gold_cards')).toThrow(/gold_cards/)
    expect(() => toTagList(42, 'gold_cards')).toThrow()
  })

  it('refuses a comma inside a single tag', () => {
    // A comma is the column separator and cannot be part of one value.
    expect(() => toTagList(['food,drink'], 'x')).toThrow(/Komma/)
  })
})
