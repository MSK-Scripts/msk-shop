#!/usr/bin/env node
/**
 * image-sync-check.js: check the file system and the database against each other.
 *
 *   node scripts/image-sync-check.js [category] [--json]
 *
 * Without a category, all categories from msk_image_categories are checked.
 *
 * Reports four states that all hurt when serving, but none of them
 * is noticed in normal operation:
 *
 *   1. Row without file   The gallery shows a tile, the image is 404.
 *   2. File without row   Sits in the CDN, is served, shows up nowhere.
 *   3. Derivative missing Tile or preview is missing, the original is there.
 *   4. Size differs       The DB value does not match the file, so something
 *                         was written outside the ingest script.
 *
 * Read-only, this script changes nothing. Whatever it finds is straightened
 * out by hand or with another image-ingest.js --force run.
 *
 * Invocation on the server:
 *   set -a; . /opt/msk-shop/.env.local; set +a
 *   NODE_PATH=/opt/msk-shop/node_modules node /opt/msk-shop/scripts/image-sync-check.js
 *
 * Useful as a monthly cron and after every larger ingest.
 */

'use strict'

const fs    = require('node:fs/promises')
const path  = require('node:path')
const mysql = require('mysql2/promise')

const DERIVATIVES = [
  { suffix: '.webp',       label: 'card'  },
  { suffix: '_thumb.webp', label: 'thumb' },
]

async function listFiles(dir) {
  try {
    return await fs.readdir(dir)
  } catch (err) {
    if (err.code === 'ENOENT') return null   // the directory does not exist at all
    throw err
  }
}

async function main() {
  const args     = process.argv.slice(2)
  const asJson   = args.includes('--json')
  const only     = args.find((a) => !a.startsWith('--')) || null
  const cdnRoot  = process.env.CDN_ROOT_PATH || '/var/www/cdn.msk-scripts.de'

  const db = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  const [categories] = only
    ? await db.execute('SELECT slug FROM msk_image_categories WHERE slug = ?', [only])
    : await db.execute('SELECT slug FROM msk_image_categories ORDER BY sort_order')

  if (!categories.length) {
    console.error(only ? `Unbekannte Kategorie "${only}".` : 'Keine Kategorien in msk_image_categories.')
    await db.end()
    process.exit(2)
  }

  const report = []
  let problems = 0

  for (const { slug } of categories) {
    const dir   = path.join(cdnRoot, slug)
    const files = await listFiles(dir)

    const [rows] = await db.execute(
      'SELECT name, ext, bytes, status FROM msk_images WHERE category = ?', [slug],
    )

    const entry = {
      category:      slug,
      rows:          rows.length,
      files:         files ? files.length : 0,
      missingFile:   [],
      orphanFile:    [],
      missingDeriv:  [],
      sizeMismatch:  [],
      directoryGone: files === null,
    }

    if (files === null) {
      // No directory: only a problem if the DB has rows for it.
      if (rows.length) problems++
      report.push(entry)
      continue
    }

    const present = new Set(files)
    const known   = new Set()

    for (const row of rows) {
      const original = `${row.name}.${row.ext}`
      known.add(original)

      if (!present.has(original)) {
        entry.missingFile.push(row.name)
      } else {
        // Size comparison only if the file is there. If it differs, someone
        // wrote past the ingest, and then the sha256 that change detection
        // depends on may no longer match either.
        const stat = await fs.stat(path.join(dir, original))
        if (stat.size !== row.bytes) {
          entry.sizeMismatch.push({ name: row.name, db: row.bytes, disk: stat.size })
        }
      }

      for (const d of DERIVATIVES) {
        const file = `${row.name}${d.suffix}`
        known.add(file)
        if (!present.has(file)) entry.missingDeriv.push(`${row.name} (${d.label})`)
      }
    }

    for (const file of files) {
      if (!known.has(file)) entry.orphanFile.push(file)
    }

    problems += entry.missingFile.length + entry.orphanFile.length
              + entry.missingDeriv.length + entry.sizeMismatch.length
    report.push(entry)
  }

  await db.end()

  if (asJson) {
    console.log(JSON.stringify({ problems, report }, null, 2))
    process.exit(problems ? 1 : 0)
  }

  for (const e of report) {
    console.log(`\n[${e.category}]  ${e.rows} Zeilen, ${e.files} Dateien`)

    if (e.directoryGone) {
      console.log(e.rows
        ? `  FEHLT: Verzeichnis existiert nicht, die DB fuehrt aber ${e.rows} Zeilen`
        : '  (kein Verzeichnis, keine Zeilen, in Ordnung)')
      continue
    }

    const show = (label, list, fmt = String) => {
      if (!list.length) return
      console.log(`  ${label}: ${list.length}`)
      for (const item of list.slice(0, 20)) console.log(`      ${fmt(item)}`)
      if (list.length > 20) console.log(`      ... und ${list.length - 20} weitere`)
    }

    show('Zeile ohne Datei', e.missingFile)
    show('Datei ohne Zeile', e.orphanFile)
    show('Derivat fehlt',    e.missingDeriv)
    show('Groesse weicht ab', e.sizeMismatch,
      (m) => `${m.name}: DB ${m.db} B, Datei ${m.disk} B`)

    if (!e.missingFile.length && !e.orphanFile.length
        && !e.missingDeriv.length && !e.sizeMismatch.length) {
      console.log('  in Ordnung')
    }
  }

  console.log(`\nGefundene Abweichungen insgesamt: ${problems}`)
  // Exit 1 on findings, so a cron complains by mail instead of running silently.
  process.exit(problems ? 1 : 0)
}

main().catch((err) => {
  console.error('Abbruch:', err)
  process.exit(1)
})
