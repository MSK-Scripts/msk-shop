import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { mkdtemp, rm, writeFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

vi.mock('@/lib/db', () => ({ query: vi.fn(), queryOne: vi.fn() }))

// Only the write is replaced. trimAndPad and buildVariants keep running for
// real, because the point of this file is what happens *around* a failing
// write, not what sharp does.
vi.mock('@/lib/imagePipeline', async importActual => ({
  ...(await importActual<typeof import('@/lib/imagePipeline')>()),
  writeVariants: vi.fn(),
}))

import { query, queryOne } from '@/lib/db'
import { writeVariants }   from '@/lib/imagePipeline'
import { approveUpload }   from '@/lib/imageUploads'

const mQuery    = query          as unknown as ReturnType<typeof vi.fn>
const mQueryOne = queryOne       as unknown as ReturnType<typeof vi.fn>
const mWrite    = writeVariants  as unknown as ReturnType<typeof vi.fn>

const ID = '11111111-2222-4333-8444-555555555555'
let inbox: string
let png: Buffer

beforeAll(async () => {
  inbox = await mkdtemp(join(tmpdir(), 'msk-inbox-'))
  process.env.UPLOAD_INBOX_PATH = inbox
  png = await sharp({ create: { width: 128, height: 128, channels: 4, background: { r: 200, g: 30, b: 30, alpha: 1 } } })
    .png().toBuffer()
})

afterAll(async () => { await rm(inbox, { recursive: true, force: true }) })

beforeEach(async () => {
  // The quarantined file is recreated per test. Without that the tests depend
  // on their order: a successful approval clears it away, and every test after
  // that gets `file_gone` instead of its own result.
  await writeFile(join(inbox, `${ID}.png`), png)

  mQuery.mockReset()
  mQueryOne.mockReset()
  mWrite.mockReset()

  mQuery.mockResolvedValue([])
  mQueryOne.mockImplementation(async (sql: string, params: unknown[] = []) => {
    // The name-collision probe, re-run at approval time.
    if (sql.includes('FROM msk_images')) return null
    // Without this branch every category would exist, because the fallback
    // below answers with the upload row and that is truthy.
    if (sql.includes('FROM msk_image_categories')) {
      return ['items', 'props', 'brand'].includes(String(params[0])) ? { slug: params[0] } : null
    }
    return {
      id: ID, category: 'items', name: 'gold_cards', label: 'Gold Cards', tags: null,
      original_filename: 'gold_cards.png', width: 512, height: 512, bytes: 176_000,
      sha256: 'x', submitted_by: '283339135068938048', submitted_name: 'musiker15',
      note: null, status: 'pending', reject_reason: null,
      reviewed_by: null, reviewed_at: null, created_at: '2026-08-28 21:26:41',
    }
  })
})

const inserted = () => mQuery.mock.calls.map(c => String(c[0])).filter(s => s.includes('INSERT INTO msk_images'))

describe('approveUpload when the CDN cannot be written', () => {
  /**
   * The live failure: /var/www/cdn.msk-scripts.de belonged to root while the
   * app runs as musiker15, so the write raised EACCES. It surfaced as a bare
   * "Internal server error" and the cause was only in the server journal.
   */
  it('reports write_failed instead of throwing', async () => {
    mWrite.mockRejectedValue(Object.assign(new Error('EACCES: permission denied, open \'/var/www/cdn.msk-scripts.de/items/gold_cards.png\''), { code: 'EACCES' }))

    await expect(approveUpload(ID, '1')).resolves.toEqual({ ok: false, reason: 'write_failed' })
  })

  it('writes no inventory row when the files did not land', async () => {
    // A row without files is the one direction that hurts: the gallery would
    // render a tile whose image 404s. Files without a row are invisible and
    // get reported by the sync check.
    mWrite.mockRejectedValue(new Error('EACCES'))

    await approveUpload(ID, '1')
    expect(inserted()).toHaveLength(0)
  })

  it('leaves the quarantined file in place, so the decision can be retried', async () => {
    mWrite.mockRejectedValue(new Error('EACCES'))

    await approveUpload(ID, '1')
    expect(await readdir(inbox)).toContain(`${ID}.png`)
  })

  it('still approves normally once the write succeeds', async () => {
    mWrite.mockResolvedValue(undefined)

    await expect(approveUpload(ID, '1')).resolves.toEqual({ ok: true })
    expect(inserted()).toHaveLength(1)
    expect(mWrite).toHaveBeenCalledWith('items', 'gold_cards', expect.anything())
  })
})

/**
 * Approving into a category other than the submitted one.
 *
 * The category somebody picks while uploading is a suggestion. Filing it
 * correctly is the decision moderation exists for, and without it a
 * misfiled submission would have to be rejected and uploaded again.
 */
describe('approveUpload with a target category', () => {
  it('writes the files and the row into the chosen category', async () => {
    mWrite.mockResolvedValue(undefined)

    await expect(approveUpload(ID, '1', 'props')).resolves.toEqual({ ok: true })
    expect(mWrite).toHaveBeenCalledWith('props', 'gold_cards', expect.anything())

    const insert = mQuery.mock.calls.find(c => String(c[0]).includes('INSERT INTO msk_images'))
    expect(insert?.[1]?.[0]).toBe('props')
  })

  /**
   * `brand` is not open to submitters (`allows_upload = 0`), but a moderator is
   * meant to be able to file something there. Checking `allows_upload` here
   * would make exactly that impossible.
   */
  it('allows a category that does not accept submissions', async () => {
    mWrite.mockResolvedValue(undefined)

    await expect(approveUpload(ID, '1', 'brand')).resolves.toEqual({ ok: true })
    expect(mWrite).toHaveBeenCalledWith('brand', 'gold_cards', expect.anything())
  })

  it('rejects a category that does not exist, before touching any file', async () => {
    mWrite.mockResolvedValue(undefined)

    await expect(approveUpload(ID, '1', 'stickers'))
      .resolves.toEqual({ ok: false, reason: 'category_unknown' })
    expect(mWrite).not.toHaveBeenCalled()
  })

  /**
   * The collision probe has to run against the TARGET. `UNIQUE (category, name)`
   * spans two columns; a name taken in `items` says nothing about `props`.
   */
  it('checks the name against the target category, not the submitted one', async () => {
    mWrite.mockResolvedValue(undefined)
    await approveUpload(ID, '1', 'props')

    const probe = mQueryOne.mock.calls.find(c => String(c[0]).includes('FROM msk_images'))
    expect(probe?.[1]).toEqual(['props', 'gold_cards'])
  })

  /**
   * The Uploads tab's "in the gallery" link is built from this column. If it
   * stayed on the submitted category, the link would point nowhere.
   */
  it('moves the queue row to the category it was filed under', async () => {
    mWrite.mockResolvedValue(undefined)
    await approveUpload(ID, '1', 'props')

    const update = mQuery.mock.calls.find(c => String(c[0]).includes('UPDATE msk_image_uploads'))
    expect(String(update?.[0])).toContain('category = ?')
    expect(update?.[1]?.[0]).toBe('props')
  })

  it('leaves the category alone when none is given', async () => {
    mWrite.mockResolvedValue(undefined)
    await approveUpload(ID, '1')

    expect(mWrite).toHaveBeenCalledWith('items', 'gold_cards', expect.anything())
  })
})
