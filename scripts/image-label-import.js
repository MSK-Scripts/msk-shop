#!/usr/bin/env node
/**
 * image-label-import.js: backfill labels and tags.
 *
 *   node scripts/image-label-import.js <category> <labels.json> [--dry-run]
 *
 * Expects a JSON file with [{ name, label, tags }, ...]. Only entries that also
 * have an image are set; entries without an image are counted, not created.
 *
 * Why this is needed at all: the ingest only knows the file name. Without a
 * label the search finds `zentorno`, but not "Pegassi", and that is exactly
 * what someone searches for who saw the vehicle in the game and does not know
 * the spawn name by heart.
 *
 * Existing labels are NOT overwritten, except with --force. Values maintained
 * by hand are worth more than an automatic import.
 *
 * The protection applies to the individual field, though, not the whole row. Until
 * 26.08.2026 the loop skipped the row entirely when a label was present, so tags
 * could never be added to a named image. Noticed on the
 * 83 items: all had a label, 40 had no tag, and the import reported
 * them as "already maintained". Label and tags are therefore checked separately.
 */

'use strict'

const fs    = require('node:fs/promises')
const mysql = require('mysql2/promise')

/**
 * Bring tags into the form the column expects.
 *
 * `msk_images.tags` is a comma-separated list that `FIND_IN_SET` reads.
 * Until 28.08.2026 the value from the JSON file went into the column
 * unchecked. Whoever wrote the obvious `tags: ["food"]` there got the string
 * `["food"]` stored: no error, no warning, and from then on the tag search
 * found nothing. Noticed on 2066 rows from the ox_inventory set,
 * whose search silently returned zero hits although the column looked filled.
 *
 * An array is the more natural form for tags, so it is accepted and
 * converted instead of rejected. Anything that is neither array nor string
 * aborts the run, because a silent miswrite in a column that feeds a search
 * is worse than a loud abort.
 *
 * Mirror of normalizeTags in lib/adminImages.ts: lowercase, without
 * whitespace around the commas, without duplicates, capped at the column width.
 */
function toTagList(value, name) {
  if (value === undefined || value === null || value === '') return null

  let parts
  if (Array.isArray(value))            parts = value
  else if (typeof value === 'string')  parts = value.split(',')
  else throw new Error(`tags fuer "${name}" ist weder Array noch String: ${JSON.stringify(value)}`)

  const seen = new Set()
  for (const part of parts) {
    const tag = String(part).trim().toLowerCase()
    // A comma in the tag would be a second tag: the column's separator cannot
    // be part of a value.
    if (tag.includes(',')) throw new Error(`Tag mit Komma fuer "${name}": ${tag}`)
    if (tag) seen.add(tag)
  }
  const joined = [...seen].join(',')
  return joined ? joined.slice(0, 255) : null
}

async function main() {
  const args     = process.argv.slice(2)
  const dryRun   = args.includes('--dry-run')
  const force    = args.includes('--force')
  const [category, file] = args.filter(a => !a.startsWith('--'))

  if (!category || !file) {
    console.error('Aufruf: image-label-import.js <kategorie> <labels.json> [--dry-run] [--force]')
    process.exit(2)
  }

  const entries = JSON.parse(await fs.readFile(file, 'utf8'))

  const db = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  const [have] = await db.execute(
    'SELECT name, label, tags FROM msk_images WHERE category = ?', [category],
  )
  const known = new Map(have.map(r => [r.name, r]))

  let gesetzt = 0, nurTags = 0, uebersprungen = 0, ohneBild = 0, unveraendert = 0

  for (const e of entries) {
    const name = String(e.name || '').toLowerCase()
    const row  = known.get(name)
    if (!row) { ohneBild++; continue }

    // Decide per field: an existing value stays, an empty one gets
    // filled. --force sets both anew.
    const labelNeu = (force || !row.label) ? (e.label || null) : row.label
    const tagsNeu  = (force || !row.tags)  ? toTagList(e.tags, name) : row.tags

    if (labelNeu === row.label && tagsNeu === row.tags) {
      if (row.label && e.label && row.label !== e.label) uebersprungen++
      else unveraendert++
      continue
    }

    if (!dryRun) {
      await db.execute(
        'UPDATE msk_images SET label = ?, tags = ? WHERE category = ? AND name = ?',
        [labelNeu, tagsNeu, category, name],
      )
    }
    if (labelNeu !== row.label) gesetzt++
    else nurTags++
  }

  await db.end()

  console.log(`Kategorie:            ${category}`)
  console.log(`Eintraege in der Datei: ${entries.length}`)
  console.log(`Bilder in der DB:       ${known.size}`)
  console.log(`Label gesetzt:          ${gesetzt}${dryRun ? ' (DRY-RUN, nichts geschrieben)' : ''}`)
  console.log(`nur Tags ergaenzt:      ${nurTags}`)
  console.log(`Label behalten:         ${uebersprungen}  (abweichend, mit --force ueberschreiben)`)
  console.log(`unveraendert:           ${unveraendert}`)
  console.log(`ohne Bild im Bestand:   ${ohneBild}`)
}

main().catch((err) => { console.error('Abbruch:', err); process.exit(1) })
