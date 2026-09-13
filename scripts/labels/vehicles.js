#!/usr/bin/env node
/**
 * Build labels and tags for vehicles from DurtyFree/gta-v-data-dumps.
 *
 *   curl -sLO https://raw.githubusercontent.com/DurtyFree/gta-v-data-dumps/master/vehicles.json
 *   node scripts/labels/vehicles.js vehicles.json vehicle-labels.json
 *   node scripts/image-label-import.js vehicles vehicle-labels.json --dry-run
 *
 * The label is manufacturer plus display name ("Truffade Adder"), tags are class
 * and manufacturer in lowercase ("super,truffade"). Without that the search finds
 * `zentorno` but not "Pegassi", and that is exactly what someone searches for who
 * has seen the vehicle in the game and does not know the spawn name by heart.
 *
 * Vehicles without a display name in the dump are skipped instead of guessed.
 * Those are trailers and a few drift variants, six of them across 916 images.
 */
'use strict'

const fs   = require('node:fs')
const path = require('node:path')

const [quelle, ziel] = process.argv.slice(2)
if (!quelle || !ziel) {
  console.error('Aufruf: vehicles.js <vehicles.json aus dem Dump> <labels.json>')
  process.exit(2)
}

const dump = require(path.resolve(quelle))
const raus = []
let ohneAnzeigenamen = 0

for (const v of dump) {
  const name = String(v.Name || '').toLowerCase()
  if (!name) continue

  const anzeige   = v.DisplayName && v.DisplayName.English
  const hersteller = v.ManufacturerDisplayName && v.ManufacturerDisplayName.English
  if (!anzeige) { ohneAnzeigenamen++; continue }

  const label = [hersteller, anzeige].filter(Boolean).join(' ').trim()
  const tags  = [String(v.Class || '').toLowerCase(), hersteller && hersteller.toLowerCase()]
    .filter(Boolean)
    .join(',')

  raus.push({ name, label, tags })
}

fs.writeFileSync(ziel, JSON.stringify(raus))
console.log('Eintraege geschrieben:', raus.length, '| ohne Anzeigenamen uebersprungen:', ohneAnzeigenamen)
console.log('geschrieben nach', ziel)
