import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, mkdir, rm, writeFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

vi.mock('@/lib/db', () => ({ query: vi.fn(), queryOne: vi.fn() }))

import { query, queryOne } from '@/lib/db'
import { moveAdminImage, deleteAdminImage } from '@/lib/adminImages'

const mQuery    = query    as unknown as ReturnType<typeof vi.fn>
const mQueryOne = queryOne as unknown as ReturnType<typeof vi.fn>

/**
 * This file works on a real directory, not on a faked filesystem.
 *
 * The whole point of moving and deleting is what happens to the three files:
 * whether they arrive, whether the old ones disappear, and whether a refused
 * move really touched nothing. A mocked `fs` would have abstracted away exactly
 * the layer that can go wrong here -- the same reasoning as the archive tests
 * in `botProvision.test.ts`.
 *
 * Only the database is replaced, by a tiny in-memory table, so that
 * `UNIQUE (category, name)` means anything at all.
 */
const CATEGORIES = ['vehicles', 'items', 'brand']

interface Row {
  category: string; name: string; label: string | null; tags: string | null
  ext: string; width: number; height: number; bytes: number; version: number
  status: string; source: string | null; license_note: string | null
  submitted_by: string | null; updated_at: string
}

let root: string
let rows: Map<string, Row>

const key = (category: string, name: string) => `${category}/${name}`

function row(category: string, name: string, ext = 'png'): Row {
  return {
    category, name, label: 'MSK Wolf', tags: 'msk,wolf', ext,
    width: 1024, height: 1024, bytes: 4096, version: 1, status: 'published',
    source: 'community', license_note: null, submitted_by: '283339135068938048',
    updated_at: '2026-09-05 12:00:00',
  }
}

/** The three files the ingest creates for one image. */
async function seedFiles(category: string, name: string, ext = 'png') {
  const dir = join(root, category)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${name}.${ext}`), 'original')
  await writeFile(join(dir, `${name}.webp`), 'card')
  await writeFile(join(dir, `${name}_thumb.webp`), 'thumb')
}

const ls = async (category: string): Promise<string[]> => {
  try { return (await readdir(join(root, category))).sort() } catch { return [] }
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'msk-cdn-'))
  process.env.CDN_ROOT_PATH = root
  rows = new Map()

  mQueryOne.mockReset()
  mQuery.mockReset()

  mQueryOne.mockImplementation(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('FROM msk_image_categories')) {
      return CATEGORIES.includes(String(params[0])) ? { slug: params[0] } : null
    }
    // Covers both queries: reading the row and the collision probe. The probe
    // only checks for truthiness, so the same row satisfies it.
    if (sql.includes('FROM msk_images')) {
      return rows.get(key(String(params[0]), String(params[1]))) ?? null
    }
    return null
  })

  mQuery.mockImplementation(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('UPDATE msk_images SET category')) {
      const [target, from, name] = params.map(String)
      const found = rows.get(key(from, name))
      if (found) {
        rows.delete(key(from, name))
        rows.set(key(target, name), { ...found, category: target })
      }
    }
    if (sql.includes('DELETE FROM msk_images')) {
      rows.delete(key(String(params[0]), String(params[1])))
    }
    return []
  })
})

afterEach(async () => { await rm(root, { recursive: true, force: true }) })

describe('moveAdminImage', () => {
  it('carries all three files over and leaves the old directory empty', async () => {
    rows.set(key('items', 'msk_wolf'), row('items', 'msk_wolf'))
    await seedFiles('items', 'msk_wolf')

    const result = await moveAdminImage('items', 'msk_wolf', 'brand')

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.image.category).toBe('brand')
    expect(await ls('brand')).toEqual(['msk_wolf.png', 'msk_wolf.webp', 'msk_wolf_thumb.webp'])
    expect(await ls('items')).toEqual([])
    expect(rows.has(key('brand', 'msk_wolf'))).toBe(true)
  })

  it('moving to the same category is a no-op, not an error', async () => {
    rows.set(key('items', 'msk_wolf'), row('items', 'msk_wolf'))
    await seedFiles('items', 'msk_wolf')

    const result = await moveAdminImage('items', 'msk_wolf', 'items')

    expect(result.ok).toBe(true)
    expect(await ls('items')).toHaveLength(3)
    // No UPDATE, no removal: doing nothing should not first copy three files
    // back and forth.
    expect(mQuery.mock.calls).toHaveLength(0)
  })

  /**
   * The most expensive mistake would be noticing the collision only on write:
   * by then the copies are in the target and have overwritten somebody else's
   * image. That is why we ask first, and why this test checks the FILES and not
   * just the return value.
   */
  it('refuses a name the target category already has, without touching any file', async () => {
    rows.set(key('items', 'police'), row('items', 'police'))
    rows.set(key('vehicles', 'police'), row('vehicles', 'police'))
    await seedFiles('items', 'police')
    await seedFiles('vehicles', 'police')
    await writeFile(join(root, 'vehicles', 'police.png'), 'the other one')

    const result = await moveAdminImage('items', 'police', 'vehicles')

    expect(result).toEqual({ ok: false, reason: 'name_taken' })
    expect(await ls('items')).toHaveLength(3)
    expect(rows.get(key('items', 'police'))?.category).toBe('items')
  })

  it('rejects a category that does not exist', async () => {
    rows.set(key('items', 'msk_wolf'), row('items', 'msk_wolf'))
    await seedFiles('items', 'msk_wolf')

    const result = await moveAdminImage('items', 'msk_wolf', 'stickers')

    expect(result).toEqual({ ok: false, reason: 'category_unknown' })
    expect(await ls('items')).toHaveLength(3)
  })

  /**
   * A row without files is a sync-check finding. Refiling it would carry that
   * finding into another category instead of surfacing it.
   */
  it('refuses a row whose files are gone instead of moving the problem', async () => {
    rows.set(key('items', 'ghost'), row('items', 'ghost'))

    const result = await moveAdminImage('items', 'ghost', 'brand')

    expect(result).toEqual({ ok: false, reason: 'no_files' })
    expect(rows.get(key('items', 'ghost'))?.category).toBe('items')
  })

  it('reports a missing row rather than creating one', async () => {
    expect(await moveAdminImage('items', 'nothing', 'brand'))
      .toEqual({ ok: false, reason: 'not_found' })
  })

  /** A missing derivative is an old finding, not a reason to abort the move. */
  it('still moves when a derivative is missing', async () => {
    rows.set(key('items', 'half'), row('items', 'half'))
    await mkdir(join(root, 'items'), { recursive: true })
    await writeFile(join(root, 'items', 'half.png'), 'original only')

    const result = await moveAdminImage('items', 'half', 'brand')

    expect(result.ok).toBe(true)
    expect(await ls('brand')).toEqual(['half.png'])
    expect(await ls('items')).toEqual([])
  })
})

describe('deleteAdminImage', () => {
  it('removes the row and all three files', async () => {
    rows.set(key('brand', 'msk_wolf'), row('brand', 'msk_wolf'))
    await seedFiles('brand', 'msk_wolf')

    const result = await deleteAdminImage('brand', 'msk_wolf')

    expect(result).toEqual({ ok: true, filesRemoved: true })
    expect(await ls('brand')).toEqual([])
    expect(rows.has(key('brand', 'msk_wolf'))).toBe(false)
  })

  it('leaves other images in the same category alone', async () => {
    rows.set(key('brand', 'a'), row('brand', 'a'))
    rows.set(key('brand', 'b'), row('brand', 'b'))
    await seedFiles('brand', 'a')
    await seedFiles('brand', 'b')

    await deleteAdminImage('brand', 'a')

    expect(await ls('brand')).toEqual(['b.png', 'b.webp', 'b_thumb.webp'])
  })

  it('reports a missing row without deleting anything', async () => {
    expect(await deleteAdminImage('brand', 'nothing')).toEqual({ ok: false, reason: 'not_found' })
    expect(mQuery.mock.calls.filter(c => String(c[0]).includes('DELETE'))).toHaveLength(0)
  })

  /**
   * The ingest writes nothing but PNG today, yet `ext` is a column and not a
   * constant. If it gets dropped during deletion, the original stays behind and
   * keeps being served.
   */
  it('honours the stored extension for the original', async () => {
    rows.set(key('items', 'old'), row('items', 'old', 'jpg'))
    await seedFiles('items', 'old', 'jpg')

    await deleteAdminImage('items', 'old')

    expect(await ls('items')).toEqual([])
  })
})
