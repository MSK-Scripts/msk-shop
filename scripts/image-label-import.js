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
 *
 * Der Schutz gilt aber dem einzelnen Feld, nicht der ganzen Zeile. Bis zum
 * 26.08.2026 sprang die Schleife bei vorhandenem Label komplett weiter, damit
 * liessen sich an einem benannten Bild nie Tags nachtragen. Aufgefallen an den
 * 83 Items: alle hatten ein Label, 40 hatten kein Tag, und der Import meldete
 * sie als "schon gepflegt". Label und Tags werden deshalb getrennt geprueft.
 */

'use strict'

const fs    = require('node:fs/promises')
const mysql = require('mysql2/promise')

/**
 * Tags auf die Form bringen, die die Spalte erwartet.
 *
 * `msk_images.tags` ist eine kommaseparierte Liste, die `FIND_IN_SET` liest.
 * Bis zum 28.08.2026 ging der Wert aus der JSON-Datei ungeprueft in die
 * Spalte. Wer dort das naheliegende `tags: ["food"]` schrieb, bekam den String
 * `["food"]` gespeichert: kein Fehler, keine Warnung, und die Tag-Suche fand
 * ab da nichts mehr. Aufgefallen an 2066 Zeilen aus dem ox_inventory-Satz,
 * deren Suche still null Treffer lieferte, obwohl die Spalte gefuellt aussah.
 *
 * Ein Array ist die natuerlichere Form fuer Tags, also wird es angenommen und
 * umgewandelt statt abgelehnt. Alles, was weder Array noch String ist, bricht
 * den Lauf ab, denn ein stiller Fehlschreiber in einer Spalte, die eine Suche
 * speist, ist schlimmer als ein lauter Abbruch.
 *
 * Spiegel von normalizeTags in lib/adminImages.ts: kleingeschrieben, ohne
 * Leerraum um die Kommas, ohne Dubletten, auf die Spaltenbreite begrenzt.
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
    // Ein Komma im Tag waere ein zweiter Tag: das Trennzeichen der Spalte kann
    // nicht Teil eines Wertes sein.
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

    // Je Feld entscheiden: ein vorhandener Wert bleibt stehen, ein leerer wird
    // gefuellt. --force setzt beide neu.
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
