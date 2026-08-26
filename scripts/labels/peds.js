#!/usr/bin/env node
/**
 * Labels und Tags fuer Peds aus DurtyFree/gta-v-data-dumps bauen.
 *
 *   curl -sLO https://raw.githubusercontent.com/DurtyFree/gta-v-data-dumps/master/peds.json
 *   node scripts/labels/peds.js peds.json ped-labels.json
 *   node scripts/image-label-import.js peds ped-labels.json --dry-run
 *
 * Anzeigenamen fuehrt das Spiel nur fuer die Peds, die im Rockstar Editor
 * auswaehlbar sind. Fuer alle uebrigen wird das Label aus der CamelCase-Form
 * des Modellnamens gebildet, die der Dump mitliefert und die als einzige die
 * Wortgrenzen kennt: `casinocash` ist nicht trennbar, `CasinoCash` schon.
 *
 * Abkuerzungen bleiben bewusst stehen (`StrPunk` -> "Str Punk"). Eine
 * Aufloesung waere Auslegung und keine Datenquelle.
 */
'use strict'
const fs = require('node:fs')

const GRUPPE = {
  a: 'ambient', s: 'service', g: 'gang', u: 'unique', ig: 'story',
  cs: 'cutscene', csb: 'cutscene', mp: 'multiplayer', hc: 'heist',
  p: 'player', player: 'player', slod: 'slod',
}
const ALTER = { y: 'young', m: 'middle-aged', o: 'old' }
// Pedtype ist kein Geschlecht: COP, army, MEDIC und Swat stehen dort als
// eigene Werte. Es liefert nur die Rolle, das Geschlecht kommt aus dem Namen.
const ROLLE = {
  COP: 'police', army: 'army', MEDIC: 'medic', FIREMAN: 'fireman',
  Swat: 'swat', PLAYER_0: 'player', PLAYER_1: 'player', PLAYER_2: 'player',
}
// Rueckfall fuer das Geschlecht. Nur die Praefixe a_, s_, g_ und u_ tragen es
// im Namen; cs_, csb_, ig_ und mp_ nicht, und das sind hier ueber die Haelfte.
// Fuer die steht es im Pedtype, der sonst die Rolle liefert.
const GESCHLECHT_AUS_TYP = {
  civmale: 'male', CIVMALE: 'male', CIVFEMALE: 'female', civfemale: 'female',
  COP: 'male', army: 'male', MEDIC: 'male', FIREMAN: 'male', Swat: 'male',
}

/** `GenTransport` -> `Gen Transport`, `Bati801` -> `Bati 801` */
function trenneCamel(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
}

function zerlege(camelName) {
  const teile = camelName.split('_')
  const gruppe = GRUPPE[teile[0].toLowerCase()] || null
  let i = 1
  let geschlecht = null, alterstufe = null
  if (teile[i] && teile[i].length === 1) {
    const g = teile[i].toLowerCase()
    geschlecht = g === 'f' ? 'female' : g === 'm' ? 'male' : g === 'c' ? 'animal' : null
    i++
    if (teile[i] && teile[i].length === 1) { alterstufe = ALTER[teile[i].toLowerCase()] || null; i++ }
  }
  // Reine Zahlen am Ende sind Variantennummern. Die Kachel zeigt den
  // Spawnnamen ohnehin darueber, im Label waeren sie eine Doppelung.
  const rest = teile.slice(i).filter(t => !/^\d+$/.test(t))
  return { gruppe, geschlecht, alterstufe, beschreibung: rest.map(trenneCamel).join(' ').trim() }
}

const [quelle, ziel] = process.argv.slice(2)
if (!quelle || !ziel) {
  console.error('Aufruf: peds.js <peds.json aus dem Dump> <labels.json>')
  process.exit(2)
}
const dump = require(require('node:path').resolve(quelle))
const raus = []
for (const p of dump) {
  const camel = String(p.Name || '')
  if (!camel) continue
  const { gruppe, geschlecht, alterstufe, beschreibung } = zerlege(camel)
  const echterName = p.TranslatedDirectorName && p.TranslatedDirectorName.English

  const label = echterName || beschreibung || camel
  const tags = [
    gruppe,
    p.Pedtype === 'Animal' ? 'animal' : (geschlecht || GESCHLECHT_AUS_TYP[p.Pedtype] || null),
    alterstufe,
    ROLLE[p.Pedtype] || null,
    p.DlcName && p.DlcName !== 'null' ? String(p.DlcName).toLowerCase() : null,
  ].filter(Boolean)

  raus.push({ name: camel.toLowerCase(), label, tags: [...new Set(tags)].join(',') })
}
fs.writeFileSync(ziel, JSON.stringify(raus))
console.log('Eintraege:', raus.length)
console.log('mit echtem Anzeigenamen:', raus.filter((r, i) => {
  const p = dump[i]; return p.TranslatedDirectorName && p.TranslatedDirectorName.English
}).length)
console.log('\nStichproben:')
for (const n of ['a_c_boar','s_m_m_gentransport','a_f_y_fitness_02','u_f_m_casinocash_01',
                 's_m_y_blackops_02','g_m_y_strpunk_01','csb_jackhowitzer','ig_money',
                 's_m_y_cop_01','mp_m_freemode_01','a_m_o_salton_01']) {
  const e = raus.find(r => r.name === n)
  if (e) console.log('  ' + e.name.padEnd(22) + ' "' + e.label + '"' + ' '.repeat(Math.max(1, 26 - e.label.length)) + e.tags)
}
