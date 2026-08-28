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

beforeAll(async () => {
  inbox = await mkdtemp(join(tmpdir(), 'msk-inbox-'))
  process.env.UPLOAD_INBOX_PATH = inbox
  const png = await sharp({ create: { width: 128, height: 128, channels: 4, background: { r: 200, g: 30, b: 30, alpha: 1 } } })
    .png().toBuffer()
  await writeFile(join(inbox, `${ID}.png`), png)
})

afterAll(async () => { await rm(inbox, { recursive: true, force: true }) })

beforeEach(() => {
  mQuery.mockReset()
  mQueryOne.mockReset()
  mWrite.mockReset()

  mQuery.mockResolvedValue([])
  mQueryOne.mockImplementation(async (sql: string) => {
    // The name-collision probe, re-run at approval time.
    if (sql.includes('FROM msk_images')) return null
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
