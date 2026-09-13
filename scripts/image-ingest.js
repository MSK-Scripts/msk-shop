#!/usr/bin/env node
/**
 * image-ingest.js: ingest images into the CDN.
 *
 *   node scripts/image-ingest.js <category> <source-dir> [options]
 *
 * Options:
 *   --dry-run              write nothing, only report
 *   --force                rebuild derivatives, even if the source is unchanged
 *   --allow-opaque         allow images without an alpha channel (default: reject)
 *   --source=<text>        origin, ends up in msk_images.source
 *   --license=<text>       license note, mandatory for third-party sources
 *   --limit=<n>            only the first n files (for trial runs)
 *
 * Environment (source from /opt/msk-shop/.env.local, as with cleanup.js):
 *   DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME
 *   CDN_ROOT_PATH   target directory, default /var/www/cdn.msk-scripts.de
 *
 * Invocation on the server:
 *   set -a; . /opt/msk-shop/.env.local; set +a
 *   NODE_PATH=/opt/msk-shop/node_modules node /opt/msk-shop/scripts/image-ingest.js \
 *     vehicles /srv/staging/vehicles --source=msk_garage --dry-run
 *
 * Why the script runs on the server and not locally: the source material runs
 * into gigabytes, and the target directory is served publicly. Syncing both
 * over OneDrive would be slow and error-prone.
 *
 * Why always --dry-run first: the script writes into a publicly
 * reachable directory. A typo in the source path is expensive.
 */

'use strict'

const fs      = require('node:fs/promises')
const path    = require('node:path')
const crypto  = require('node:crypto')
const sharp   = require('sharp')
const mysql   = require('mysql2/promise')

// ── Processing rules. Deliberately up here and not scattered: they are the
//    reason the collection looks uniform. Whoever changes them changes
//    the look of the whole gallery.
const RULES = {
  originalMaxEdge: 1024,   // longest edge of the original
  cardWidth:       400,    // tile in the gallery and in NUIs
  thumbWidth:      160,    // preview in dense grids
  cardQuality:     82,
  thumbQuality:    78,
  paddingPercent:  0.04,   // uniform margin AFTER trimming
  minEdge:         32,     // anything below is not a usable asset
}

// Exceptions per category. The rules above exist so that game assets look
// uniform in the grid: same margin, comparable size, a cap against
// outliers. `brand` does not appear in any grid (the category is set to
// is_public = 0), there they only do damage. Measured on 26.08.2026, a
// 1920 x 1080 banner would have become a 1024 x 609 one with a transparent
// frame, and the trim would first have cut 162 px off the Quicksale
// banners.
const CATEGORY_RULES = {
  brand: { trim: false, paddingPercent: 0, originalMaxEdge: 1920 },
}

/** Rules for a category: default, overridden by the exception. */
function rulesFor(category) {
  return { trim: true, ...RULES, ...(CATEGORY_RULES[category] || {}) }
}

const SOURCE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [k, ...rest] = arg.slice(2).split('=')
      flags[k] = rest.length ? rest.join('=') : true
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}

/**
 * Bring a file name into the scheme the URL tolerates.
 *
 * An image is named the way a script knows the model: lowercase, without
 * spaces, without umlauts. Only then can a consumer build the URL from the
 * model name without looking anything up first.
 */
function normaliseName(raw) {
  return raw
    // Replace umlauts BEFORE normalize('NFD'): NFD splits them into base letter
    // plus diacritic, and the next step throws the diacritic away.
    // The other way round, "Baeckerei" would have become "backerei", and the
    // umlaut rule below would never have applied.
    .replace(/ä/gi, 'ae').replace(/ö/gi, 'oe').replace(/ü/gi, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // remove remaining accents
    .toLowerCase()
    // Spell out plus before the line below turns it into an underscore
    // and the trim at the end of the word removes it: otherwise `coiloversS+` and
    // `coiloversS` become the same name and one of the images silently drops out.
    // Mirror of normaliseName in lib/imagePipeline.ts.
    .replace(/\+/g, '_plus')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
}

async function sha256File(file) {
  const buf = await fs.readFile(file)
  return crypto.createHash('sha256').update(buf).digest('hex')
}

async function walk(dir, out = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, out)
    else if (SOURCE_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full)
  }
  return out
}

// ---------------------------------------------------------------------------
// Image processing
// ---------------------------------------------------------------------------
/**
 * Trim, then pad uniformly.
 *
 * The trim is the step that matters most visually: untrimmed
 * screenshots produce a grid in which every vehicle has a different size,
 * because every image brings a different amount of empty space. Trimming first
 * and then setting a percentage margin makes them comparable.
 *
 * The margin is calculated from the trimmed size, not from the original one,
 * otherwise it moves along with the empty space we just removed.
 */
async function trimAndPad(inputBuffer, regeln = rulesFor(null)) {
  let working = inputBuffer
  if (regeln.trim) {
    try {
      working = await sharp(inputBuffer).trim({ threshold: 0 }).toBuffer()
    } catch {
      // An image without a trimmable margin (or a completely empty one) makes sharp
      // throw. Then the original stays as it is, that is not an error case.
    }
  }

  const meta = await sharp(working).metadata()
  const pad  = Math.round(Math.max(meta.width, meta.height) * regeln.paddingPercent)
  if (pad < 1) return working

  return sharp(working)
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()
}

async function buildVariants(padded, regeln = rulesFor(null)) {
  const original = await sharp(padded)
    .resize({
      width: regeln.originalMaxEdge, height: regeln.originalMaxEdge,
      fit: 'inside', withoutEnlargement: true,
    })
    // effort: 10 is not fine-tuning here, but the difference between
    // 358 KB and 93 KB per vehicle image (re-measured on adder.png). Without the
    // value sharp produces a PNG that is LARGER than the source, and the
    // collection would be bloated by a factor of four. Costs computing time during
    // ingest, which is spent exactly once per image.
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()

  const card = await sharp(padded)
    .resize({ width: RULES.cardWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: RULES.cardQuality, effort: 6 })
    .toBuffer()

  const thumb = await sharp(padded)
    .resize({ width: RULES.thumbWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: RULES.thumbQuality, effort: 6 })
    .toBuffer()

  const meta = await sharp(original).metadata()
  return { original, card, thumb, width: meta.width, height: meta.height }
}

// ---------------------------------------------------------------------------
// Main run
// ---------------------------------------------------------------------------
async function main() {
  const { positional, flags } = parseArgs(process.argv)
  const [category, sourceDir] = positional

  if (!category || !sourceDir) {
    console.error('Aufruf: image-ingest.js <kategorie> <quellordner> [--dry-run] [--force] ...')
    process.exit(2)
  }

  const dryRun      = Boolean(flags['dry-run'])
  const force       = Boolean(flags.force)
  const allowOpaque = Boolean(flags['allow-opaque'])
  const limit       = flags.limit ? Number(flags.limit) : Infinity
  const sourceNote  = typeof flags.source  === 'string' ? flags.source  : null
  const licenseNote = typeof flags.license === 'string' ? flags.license : null
  const regeln      = rulesFor(category)

  const cdnRoot = process.env.CDN_ROOT_PATH || '/var/www/cdn.msk-scripts.de'
  const targetDir = path.join(cdnRoot, category)

  const db = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  // The category must exist. A typo in the first argument would otherwise
  // create a new directory that nobody ever serves.
  const [cats] = await db.execute(
    'SELECT slug FROM msk_image_categories WHERE slug = ?', [category],
  )
  if (!cats.length) {
    console.error(`Unbekannte Kategorie "${category}". Bekannt sind die Zeilen in msk_image_categories.`)
    await db.end()
    process.exit(2)
  }

  const files = (await walk(sourceDir)).slice(0, limit)
  console.log(`Quelle:  ${sourceDir}  (${files.length} Dateien)`)
  console.log(`Ziel:    ${targetDir}`)
  console.log(`Modus:   ${dryRun ? 'DRY-RUN, es wird nichts geschrieben' : 'SCHREIBEN'}${force ? ', force' : ''}`)
  console.log('')

  if (!dryRun) await fs.mkdir(targetDir, { recursive: true })

  const stats = { created: 0, updated: 0, skipped: 0, rejected: 0 }
  const rejected = []
  /** Content-identical files: only a notice, not an exclusion (see below). */
  const duplicates = []
  // Duplicates are the rule in third-party packs, not the exception. Whoever
  // does not throw them out during ingest has them forever.
  const seenHashes = new Map()

  for (const file of files) {
    const base = path.basename(file, path.extname(file))
    const name = normaliseName(base)

    if (!name) {
      rejected.push([file, 'Name ist nach der Normalisierung leer'])
      stats.rejected++
      continue
    }

    let hash, meta
    try {
      hash = await sha256File(file)
      meta = await sharp(file).metadata()
    } catch (err) {
      rejected.push([file, `nicht lesbar: ${err.message}`])
      stats.rejected++
      continue
    }

    // Content-identical files are reported, but NOT rejected.
    //
    // The initial import of the vehicles had exactly this case: `issi4.png` is
    // byte-identical to `issi3.png`. Two different spawn names, the same
    // image; in the garage UI it has always been like that and is perfectly fine.
    //
    // A consumer builds the URL from the model name, a missing
    // `issi4.webp` would be a 404 there and thus a real loss of function.
    // The duplicate costs three files of space, that is the wrong price for
    // a broken image.
    if (seenHashes.has(hash)) {
      duplicates.push([file, seenHashes.get(hash)])
    } else {
      seenHashes.set(hash, name)
    }

    if (Math.min(meta.width, meta.height) < RULES.minEdge) {
      rejected.push([file, `zu klein (${meta.width}x${meta.height})`])
      stats.rejected++
      continue
    }

    if (!meta.hasAlpha && !allowOpaque) {
      rejected.push([file, 'kein Alphakanal (mit --allow-opaque zulassen)'])
      stats.rejected++
      continue
    }

    const [rows] = await db.execute(
      'SELECT id, sha256, version FROM msk_images WHERE category = ? AND name = ?',
      [category, name],
    )
    const existing = rows[0]

    if (existing && existing.sha256 === hash && !force) {
      stats.skipped++
      continue
    }

    // A replaced file needs a new URL, because the vhost serves with
    // max-age=1 year + immutable. That is what the version counter is for.
    const version = existing ? (existing.sha256 === hash ? existing.version : existing.version + 1) : 1

    if (dryRun) {
      if (existing) stats.updated++; else stats.created++
      continue
    }

    let variants
    try {
      const padded = await trimAndPad(await fs.readFile(file), regeln)
      variants = await buildVariants(padded, regeln)
    } catch (err) {
      rejected.push([file, `Verarbeitung fehlgeschlagen: ${err.message}`])
      stats.rejected++
      continue
    }

    await fs.writeFile(path.join(targetDir, `${name}.png`),        variants.original)
    await fs.writeFile(path.join(targetDir, `${name}.webp`),       variants.card)
    await fs.writeFile(path.join(targetDir, `${name}_thumb.webp`), variants.thumb)

    await db.execute(
      `INSERT INTO msk_images
         (category, name, ext, width, height, bytes, sha256, version, source, license_note)
       VALUES (?, ?, 'png', ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         width = VALUES(width), height = VALUES(height), bytes = VALUES(bytes),
         sha256 = VALUES(sha256), version = VALUES(version),
         source = COALESCE(VALUES(source), source),
         license_note = COALESCE(VALUES(license_note), license_note)`,
      [category, name, variants.width, variants.height, variants.original.length,
       hash, version, sourceNote, licenseNote],
    )

    if (existing) stats.updated++; else stats.created++
  }

  await db.end()

  console.log('Ergebnis')
  console.log(`  neu:          ${stats.created}`)
  console.log(`  aktualisiert: ${stats.updated}`)
  console.log(`  uebersprungen:${stats.skipped}  (Quelle unveraendert)`)
  console.log(`  abgelehnt:    ${stats.rejected}`)

  // Rejected files are named, not silently swallowed.
  // Otherwise you mistake half a collection for a whole one.
  if (duplicates.length) {
    console.log(`
Inhaltsgleich (trotzdem aufgenommen): ${duplicates.length}`)
    for (const [file, first] of duplicates.slice(0, 20)) {
      console.log(`  ${path.basename(file)} = ${first}`)
    }
    if (duplicates.length > 20) console.log(`  ... und ${duplicates.length - 20} weitere`)
  }

  if (rejected.length) {
    console.log('\nAbgelehnt:')
    for (const [file, reason] of rejected.slice(0, 50)) {
      console.log(`  ${path.basename(file)}: ${reason}`)
    }
    if (rejected.length > 50) console.log(`  ... und ${rejected.length - 50} weitere`)
  }
}

main().catch((err) => {
  console.error('Abbruch:', err)
  process.exit(1)
})
