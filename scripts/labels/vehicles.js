#!/usr/bin/env node
/**
 * Labels und Tags fuer Fahrzeuge aus DurtyFree/gta-v-data-dumps bauen.
 *
 *   curl -sLO https://raw.githubusercontent.com/DurtyFree/gta-v-data-dumps/master/vehicles.json
 *   node scripts/labels/vehicles.js vehicles.json vehicle-labels.json
 *   node scripts/image-label-import.js vehicles vehicle-labels.json --dry-run
 *
 * Label ist Hersteller plus Anzeigename ("Truffade Adder"), Tags sind Klasse und
 * Hersteller in Kleinschreibung ("super,truffade"). Ohne das findet die Suche
 * `zentorno`, aber nicht "Pegassi", und genau danach sucht jemand, der das
 * Fahrzeug im Spiel gesehen hat und den Spawnnamen nicht auswendig kann.
 *
 * Fahrzeuge ohne Anzeigenamen im Dump werden ausgelassen statt geraten. Das
 * sind Anhaenger und ein paar Drift-Varianten, sechs Stueck bei 916 Bildern.
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
