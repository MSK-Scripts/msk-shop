import { describe, it, expect, beforeAll, beforeEach, afterAll, vi, type Mock } from 'vitest'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

// Nur die Datenbank wird ersetzt. sharp laeuft echt: der ganze Punkt dieser
// Tests ist, was die Bildverarbeitung mit fremden Bytes macht, und ein
// nachgebautes sharp wuerde genau das wegabstrahieren.
vi.mock('@/lib/db', () => ({ query: vi.fn(), queryOne: vi.fn() }))

import { query, queryOne } from '@/lib/db'
import { submitUpload, type SubmitInput } from '@/lib/imageUploads'
import { normaliseName, PIPELINE_RULES } from '@/lib/imagePipeline'

let inbox: string

beforeAll(async () => {
  inbox = await mkdtemp(join(tmpdir(), 'msk-upload-test-'))
  process.env.UPLOAD_INBOX_PATH = inbox
})

afterAll(async () => {
  await rm(inbox, { recursive: true, force: true })
})

/**
 * Die Datenbank so einstellen, dass ein Upload durchgeht: Kategorie erlaubt,
 * Name frei, nichts in der Schlange, Tageslimit nicht erreicht.
 *
 * `queryOne` wird in `submitUpload` fuenfmal in fester Reihenfolge gerufen:
 * Kategorie, Bestand, Schlange, Tageszaehler, und nach dem INSERT das
 * Zurueckelesen der geschriebenen Zeile.
 */
function happyPath() {
  (queryOne as Mock)
    .mockResolvedValueOnce({ slug: 'props' })   // categoryAllowsUpload
    .mockResolvedValueOnce(null)                // msk_images name frei
    .mockResolvedValueOnce(null)                // nichts in der Schlange
    .mockResolvedValueOnce({ total: 0 })        // recentUploadCount
    .mockResolvedValueOnce(storedRow())         // getUpload nach dem INSERT
}

/** Eine Zeile, wie sie nach dem INSERT zurueckkaeme. */
function storedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '00000000-0000-4000-8000-000000000000',
    category: 'props', name: 'test_prop', label: null, tags: null,
    original_filename: 'shot.png', width: 200, height: 200, bytes: 1234,
    sha256: 'a'.repeat(64), submitted_by: '123456789012345678',
    submitted_name: 'Tester', note: null, status: 'pending',
    reject_reason: null, reviewed_by: null, reviewed_at: null,
    created_at: '2026-08-26 00:00:00',
    ...overrides,
  }
}

async function pixels(width = 200, height = 200): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 4, background: { r: 20, g: 180, b: 60, alpha: 1 } },
  }).png().toBuffer()
}

async function input(overrides: Partial<SubmitInput> = {}): Promise<SubmitInput> {
  return {
    category:      'props',
    rawName:       'test_prop',
    label:         '',
    tags:          '',
    note:          '',
    licenseOk:     true,
    fileName:      'shot.png',
    file:          await pixels(),
    submittedBy:   '123456789012345678',
    submittedName: 'Tester',
    ...overrides,
  }
}

beforeEach(() => {
  (queryOne as Mock).mockReset()
  ;(query as Mock).mockReset()
  ;(query as Mock).mockResolvedValue([])
})

describe('submitUpload: the cheap checks come first', () => {
  it('refuses without the rights declaration, before touching the database', async () => {
    const r = await submitUpload(await input({ licenseOk: false }))
    expect(r).toEqual({ ok: false, reason: 'license_required' })
    expect(queryOne as Mock).not.toHaveBeenCalled()
  })

  it('refuses a category that does not accept submissions', async () => {
    (queryOne as Mock).mockResolvedValueOnce(null)
    const r = await submitUpload(await input({ category: 'brand' }))
    expect(r).toEqual({ ok: false, reason: 'category_unknown' })
  })

  it('refuses a name that normalises to nothing', async () => {
    (queryOne as Mock).mockResolvedValueOnce({ slug: 'props' })
    const r = await submitUpload(await input({ rawName: '!!!' }))
    expect(r).toEqual({ ok: false, reason: 'name_invalid' })
  })

  it('never replaces an image that is already in the inventory', async () => {
    (queryOne as Mock)
      .mockResolvedValueOnce({ slug: 'props' })
      .mockResolvedValueOnce({ id: 7 })
    const r = await submitUpload(await input())
    expect(r).toEqual({ ok: false, reason: 'name_taken' })
  })

  it('refuses a second submission for a name that is still in the queue', async () => {
    (queryOne as Mock)
      .mockResolvedValueOnce({ slug: 'props' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'abc' })
    const r = await submitUpload(await input())
    expect(r).toEqual({ ok: false, reason: 'name_queued' })
  })

  it('enforces the daily cap before decoding anything', async () => {
    (queryOne as Mock)
      .mockResolvedValueOnce({ slug: 'props' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ total: 10 })
    const r = await submitUpload(await input())
    expect(r).toEqual({ ok: false, reason: 'rate_limited' })
    // Nichts geschrieben: weder Datei noch Zeile.
    expect(query as Mock).not.toHaveBeenCalled()
  })
})

describe('submitUpload: the file itself', () => {
  it('rejects something that is not an image, whatever it claims to be', async () => {
    happyPath()
    const r = await submitUpload(await input({
      file: Buffer.from('not an image, just bytes pretending to be one'),
      fileName: 'evil.png',
    }))
    expect(r).toEqual({ ok: false, reason: 'file_unreadable' })
  })

  it('rejects an image below the minimum edge', async () => {
    happyPath()
    const r = await submitUpload(await input({ file: await pixels(32, 32) }))
    expect(r).toEqual({ ok: false, reason: 'too_small' })
  })

  it('rejects an image above the maximum edge', async () => {
    happyPath()
    const r = await submitUpload(await input({ file: await pixels(5000, 100) }))
    expect(r).toEqual({ ok: false, reason: 'too_large' })
  })

  it('rejects a format that is not png, webp or jpeg', async () => {
    happyPath()
    const tiff = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 1, g: 2, b: 3 } },
    }).tiff().toBuffer()
    const r = await submitUpload(await input({ file: tiff }))
    expect(r).toEqual({ ok: false, reason: 'format_unsupported' })
  })
})

describe('submitUpload: what lands in quarantine', () => {
  it('stores our own PNG, not the submitted bytes', async () => {
    happyPath()

    // Ein JPEG mit EXIF: das Format wechselt bei der Neukodierung, und die
    // Metadaten muessen verschwinden.
    const jpeg = await sharp({
      create: { width: 300, height: 200, channels: 3, background: { r: 200, g: 30, b: 30 } },
    })
      .withMetadata({ exif: { IFD0: { Copyright: 'somebody else' } } })
      .jpeg()
      .toBuffer()

    expect((await sharp(jpeg).metadata()).exif).toBeDefined()

    const r = await submitUpload(await input({ file: jpeg, fileName: 'photo.jpg' }))
    expect(r.ok).toBe(true)

    const files = await readdir(inbox)
    expect(files).toHaveLength(1)

    const stored = await readFile(join(inbox, files[0]))
    const meta   = await sharp(stored).metadata()
    expect(meta.format).toBe('png')
    expect(meta.exif).toBeUndefined()
    // Byte-fuer-Byte etwas anderes als das Eingereichte.
    expect(stored.equals(jpeg)).toBe(false)
  })

  it('names the quarantine file after a UUID, never after the submitted name', async () => {
    happyPath()
    const r = await submitUpload(await input({ fileName: '../../etc/passwd.png' }))
    expect(r.ok).toBe(true)

    const files = await readdir(inbox)
    for (const f of files) {
      expect(f).toMatch(/^[0-9a-f-]{36}\.png$/)
    }
  })

  it('writes the row with the normalised name and the declaration flag', async () => {
    happyPath()
    const r = await submitUpload(await input({ rawName: 'Große Kiste 01' }))
    expect(r.ok).toBe(true)

    const insert = (query as Mock).mock.calls.find(c => String(c[0]).includes('INSERT INTO msk_image_uploads'))
    expect(insert).toBeDefined()
    // Reihenfolge der Platzhalter: id, category, name, ...
    expect(insert![1][2]).toBe('grosse_kiste_01')
    expect(String(insert![0])).toContain('license_declared')
  })
})

describe('normaliseName', () => {
  it('turns a human name into something that survives a URL', () => {
    expect(normaliseName('Große Kiste 01')).toBe('grosse_kiste_01')
    expect(normaliseName('  prop__crate  ')).toBe('prop_crate')
    expect(normaliseName('Ölfass')).toBe('oelfass')
  })

  it('keeps hyphens and underscores, which spawn names use', () => {
    expect(normaliseName('prop_bench-01')).toBe('prop_bench-01')
  })

  it('returns an empty string when nothing usable is left', () => {
    expect(normaliseName('!!!')).toBe('')
  })

  /**
   * Tuning parts come in grades where the plus is the whole difference:
   * `engineS+` against `engineS`. Left to the generic rule the plus becomes an
   * underscore and the trailing trim removes it, so both names collapse into
   * one. `UNIQUE (category, name)` then admits a single row and the other
   * picture is gone without a word, which is the worst way for an ingest to
   * lose something. Found on the ox_inventory set, 2216 files, four of them
   * affected.
   */
  it('spells out a plus instead of letting it collapse the name', () => {
    expect(normaliseName('engineS+')).toBe('engines_plus')
    expect(normaliseName('coiloversS+')).toBe('coiloverss_plus')
  })

  it('keeps the graded pair apart', () => {
    expect(normaliseName('engineS+')).not.toBe(normaliseName('engineS'))
    expect(normaliseName('coiloversS+')).not.toBe(normaliseName('coiloversS'))
  })

  it('leaves names without a plus exactly as they were', () => {
    // The rule must not become a second way to rewrite ordinary names.
    for (const name of ['weapon_appistol', 'water_bottle2', 'prop_bench-01', 'grosse_kiste_01']) {
      expect(normaliseName(name)).toBe(name)
    }
  })
})

describe('the pipeline rules mirror the ingest script', () => {
  it('has the same numbers as scripts/image-ingest.js', async () => {
    // Der Ingest ist Plain-JS und laeuft ausserhalb von Next, er kann das
    // TypeScript-Modul nicht importieren. Laufen die beiden auseinander, hat
    // der Bestand zwei Looks, und das faellt erst am fertigen Raster auf.
    const script = await readFile(join(process.cwd(), 'scripts', 'image-ingest.js'), 'utf8')
    for (const [key, value] of Object.entries(PIPELINE_RULES)) {
      expect(script).toMatch(new RegExp(`${key}:\\s*${String(value).replace('.', '\\.')}`))
    }
  })
})
