#!/usr/bin/env node
/**
 * image-label-import.js — Labels und Tags nachpflegen.
 *
 *   node scripts/image-label-import.js <kategorie> <labels.json> [--dry-run]
 *
 * Erwartet eine JSON-Datei mit [{ name, label, tags }, ...]. Gesetzt wird nur,
 * was auch ein Bild hat; Eintraege ohne Bild werden gezaehlt, nicht angelegt.
 *
 * Warum das ueberhaupt noetig ist: der Ingest kennt nur den Dateinamen. Ohne
 * Label findet die Suche `zentorno`, aber nicht "Pegassi", und genau danach
 * sucht jemand, der das Fahrzeug im Spiel gesehen hat und den Spawnnamen nicht
 * auswendig kann.
 *
 * Bestehende Labels werden NICHT ueberschrieben, ausser mit --force. Von Hand
 * gepflegte Werte sind mehr wert als ein automatischer Import.
 */

'use strict'

const fs    = require('node:fs/promises')
const mysql = require('mysql2/promise')

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

  let gesetzt = 0, uebersprungen = 0, ohneBild = 0, unveraendert = 0

  for (const e of entries) {
    const name = String(e.name || '').toLowerCase()
    const row  = known.get(name)
    if (!row) { ohneBild++; continue }

    if (row.label && !force) { uebersprungen++; continue }
    if (row.label === e.label && row.tags === e.tags) { unveraendert++; continue }

    if (!dryRun) {
      await db.execute(
        'UPDATE msk_images SET label = ?, tags = ? WHERE category = ? AND name = ?',
        [e.label || null, e.tags || null, category, name],
      )
    }
    gesetzt++
  }

  await db.end()

  console.log(`Kategorie:            ${category}`)
  console.log(`Eintraege in der Datei: ${entries.length}`)
  console.log(`Bilder in der DB:       ${known.size}`)
  console.log(`gesetzt:                ${gesetzt}${dryRun ? ' (DRY-RUN, nichts geschrieben)' : ''}`)
  console.log(`schon gepflegt:         ${uebersprungen}  (mit --force ueberschreiben)`)
  console.log(`unveraendert:           ${unveraendert}`)
  console.log(`ohne Bild im Bestand:   ${ohneBild}`)
}

main().catch((err) => { console.error('Abbruch:', err); process.exit(1) })
