import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

/**
 * The processing rules of the image collection, as TypeScript.
 *
 * **This is a deliberate mirror of `scripts/image-ingest.js`**, not a second
 * opinion. The script is plain JS and runs outside of Next; it cannot import
 * this module, and this module cannot load the script. Same pattern as
 * `BASIC_STORAGE_DAYS` in `scripts/cleanup.js`.
 *
 * Why the duplication is still acceptable: the rules almost never change, and
 * when they do, they change the look of the entire gallery. That is not an
 * incidental commit. `tests/imagePipeline.test.ts` reads the numbers from the
 * script and compares them with the ones here, so that a divergence gets
 * noticed instead of settling into a collection with two looks.
 */
export const PIPELINE_RULES = {
  originalMaxEdge: 1024,
  cardWidth:       400,
  thumbWidth:      160,
  cardQuality:     82,
  thumbQuality:    78,
  paddingPercent:  0.04,
  minEdge:         32,
} as const

/** Formats a submitter may send. The content is checked, not the extension. */
export const ACCEPTED_INPUT_FORMATS = ['png', 'jpeg', 'webp'] as const

export function cdnRootPath(): string {
  return process.env.CDN_ROOT_PATH || '/var/www/cdn.msk-scripts.de'
}

/**
 * Bring a file name into the scheme the URL can handle.
 *
 * Character-for-character identical to `normaliseName` in the ingest script,
 * including the order of the first two steps: the umlauts must be gone BEFORE
 * `normalize('NFD')`, otherwise NFD decomposes them and the following step
 * throws away the diacritic before the umlaut rule applies. Exactly this bug
 * was in the script on 25.08.2026 and turned "Baeckerei" into "backerei".
 */
export function normaliseName(raw: string): string {
  return raw
    .replace(/ä/gi, 'ae').replace(/ö/gi, 'oe').replace(/ü/gi, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // Spell out the plus BEFORE the special-character rule below turns it into
    // an underscore and the trim at the end of the word removes it again.
    // Without this line `coiloversS+` and `coiloversS` both end up as
    // `coiloverss`, and because `UNIQUE (category, name)` allows only one row,
    // one of the two images would have silently disappeared instead of standing out.
    .replace(/\+/g, '_plus')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 128)
}

export interface Variants {
  original: Buffer
  card:     Buffer
  thumb:    Buffer
  width:    number
  height:   number
}

/**
 * Trim, then pad uniformly.
 *
 * The trim makes the biggest visual difference: untrimmed captures produce a
 * grid in which every object looks a different size, because every image brings
 * a different amount of empty space. The padding is calculated from the TRIMMED
 * size, otherwise it shifts along with the empty space we just removed.
 */
export async function trimAndPad(input: Buffer): Promise<Buffer> {
  let working = input
  try {
    working = await sharp(input).trim({ threshold: 0 }).toBuffer()
  } catch {
    // An image without a croppable border makes sharp throw. Then the original
    // stays as it is; that is not an error case.
  }

  const meta = await sharp(working).metadata()
  const pad  = Math.round(Math.max(meta.width ?? 0, meta.height ?? 0) * PIPELINE_RULES.paddingPercent)
  if (pad < 1) return working

  return sharp(working)
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()
}

export async function buildVariants(padded: Buffer): Promise<Variants> {
  const original = await sharp(padded)
    .resize({
      width:  PIPELINE_RULES.originalMaxEdge,
      height: PIPELINE_RULES.originalMaxEdge,
      fit: 'inside', withoutEnlargement: true,
    })
    // effort: 10 is not polish but the difference between 358 KB and 93 KB
    // per image (measured on the ingest). Without the value sharp produces a
    // PNG that is larger than the source.
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()

  const card = await sharp(padded)
    .resize({ width: PIPELINE_RULES.cardWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: PIPELINE_RULES.cardQuality, effort: 6 })
    .toBuffer()

  const thumb = await sharp(padded)
    .resize({ width: PIPELINE_RULES.thumbWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: PIPELINE_RULES.thumbQuality, effort: 6 })
    .toBuffer()

  const meta = await sharp(original).metadata()
  return { original, card, thumb, width: meta.width ?? 0, height: meta.height ?? 0 }
}

/**
 * Write the three variants into the publicly served directory.
 *
 * Until 26.08.2026 only `scripts/image-ingest.js` did that, and the plan said
 * it should stay that way. With community uploads there is a second place, and
 * deliberately so: the alternative would have been a cron that collects
 * approved submissions, i.e. a second moving component and a delay between
 * click and result.
 *
 * What carries the decision is the path before it: what arrives here is not an
 * uploaded file but a buffer freshly produced by sharp. Foreign bytes never
 * reach this directory, `category` and `name` are checked against the database
 * and against `normaliseName` respectively, and writing only happens after
 * approval by a human.
 */
export async function writeVariants(category: string, name: string, v: Variants): Promise<void> {
  // turbopackIgnore: the path is dynamic on purpose, the root comes from
  // CDN_ROOT_PATH and points out of the repo. Without the hint Turbopack traces
  // the whole project, as with the transcript upload.
  const dir = join(/*turbopackIgnore: true*/ cdnRootPath(), category)
  await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true })

  await writeFile(join(/*turbopackIgnore: true*/ dir, `${name}.png`), v.original)
  await writeFile(join(/*turbopackIgnore: true*/ dir, `${name}.webp`), v.card)
  await writeFile(join(/*turbopackIgnore: true*/ dir, `${name}_thumb.webp`), v.thumb)
}
/**
 * The three files an image consists of on the CDN.
 *
 * `ext` applies to the original only. Both derivatives are always WebP, which
 * `buildVariants` decides and `scripts/image-sync-check.js` checks by exactly
 * these three names. Adding a fourth variant here means changing both places,
 * or the sync check reports it as a file without a row.
 */
export function variantFiles(name: string, ext: string): string[] {
  return [`${name}.${ext}`, `${name}.webp`, `${name}_thumb.webp`]
}

/**
 * Copy the three variants into another category.
 *
 * **Copy, not move**, and that is the whole point: the caller rewrites the
 * database row between the copy and the removal. If it breaks in between, the
 * files exist twice. The gallery keeps working and the sync check reports the
 * copies as files without a row. A real move would, at that same moment, leave
 * a row whose image 404s, which is the failure a visitor sees.
 *
 * A missing derivative is skipped instead of aborting the move: that is an
 * existing sync-check finding and no reason to leave the row in the wrong
 * category. The return value says how many files actually came along; at 0 the
 * row describes nothing and the caller stops.
 */
export async function copyVariants(
  from: string, to: string, name: string, ext: string,
): Promise<number> {
  const root = cdnRootPath()
  const targetDir = join(/*turbopackIgnore: true*/ root, to)
  await mkdir(/*turbopackIgnore: true*/ targetDir, { recursive: true })

  let copied = 0
  for (const file of variantFiles(name, ext)) {
    try {
      await copyFile(
        join(/*turbopackIgnore: true*/ root, from, file),
        join(/*turbopackIgnore: true*/ targetDir, file),
      )
      copied++
    } catch (e) {
      // Only "does not exist" is harmless. An EACCES has to be loud, or half a
      // move looks exactly like a finished one.
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
    }
  }
  return copied
}

/**
 * Remove the three variants.
 *
 * `force`, because an already missing file is not an error. This runs in two
 * places, when deleting a row and as the second step of a move, and in both the
 * goal is "nothing is there afterwards", not "everything was there before".
 */
export async function deleteVariants(category: string, name: string, ext: string): Promise<void> {
  const root = cdnRootPath()
  for (const file of variantFiles(name, ext)) {
    await rm(join(/*turbopackIgnore: true*/ root, category, file), { force: true })
  }
}
