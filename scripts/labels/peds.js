#!/usr/bin/env node
/**
 * Build labels and tags for peds from DurtyFree/gta-v-data-dumps.
 *
 *   curl -sLO https://raw.githubusercontent.com/DurtyFree/gta-v-data-dumps/master/peds.json
 *   node scripts/labels/peds.js peds.json ped-labels.json
 *   node scripts/image-label-import.js peds ped-labels.json --dry-run
 *
 * The game only keeps display names for the peds that can be selected in the
 * Rockstar Editor. For all others the label is built from the CamelCase form
 * of the model name, which the dump includes and which is the only one that
 * knows the word boundaries: `casinocash` cannot be split, `CasinoCash` can.
 *
 * Abbreviations stay as they are on purpose (`StrPunk` -> "Str Punk").
 * Expanding them would be interpretation and not a data source.
 */
'use strict'
const fs = require('node:fs')

const GRUPPE = {
  a: 'ambient', s: 'service', g: 'gang', u: 'unique', ig: 'story',
  cs: 'cutscene', csb: 'cutscene', mp: 'multiplayer', hc: 'heist',
  p: 'player', player: 'player', slod: 'slod',
}
const ALTER = { y: 'young', m: 'middle-aged', o: 'old' }
// Pedtype is not a gender: COP, army, MEDIC and Swat appear there as values of
// their own. It only provides the role, the gender comes from the name.
const ROLLE = {
  COP: 'police', army: 'army', MEDIC: 'medic', FIREMAN: 'fireman',
  Swat: 'swat', PLAYER_0: 'player', PLAYER_1: 'player', PLAYER_2: 'player',
}
// Fallback for the gender. Only the prefixes a_, s_, g_ and u_ carry it in the
// name; cs_, csb_, ig_ and mp_ do not, and those are over half of them here.
// For those it is in the Pedtype, which otherwise provides the role.
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
  // Pure numbers at the end are variant numbers. The tile shows the spawn
  // name above it anyway, in the label they would be a duplication.
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
