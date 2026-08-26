#!/usr/bin/env node
/**
 * Labels und Tags fuer Items.
 *
 *   node scripts/labels/items.js item-labels.json
 *   node scripts/image-label-import.js items item-labels.json --dry-run
 *
 * Anders als bei Fahrzeugen, Waffen und Peds gibt es hier **keine Datenquelle**.
 * Die Labels stammen aus `ox_inventory` (`data/items.lua` und `data/weapons.lua`),
 * und die sind bereits eingespielt: beim Abgleich am 26.08.2026 stimmten 54 von
 * 83 exakt ueberein, 0 wichen ab, 29 kennt ox gar nicht. ox splittet Anbauteile
 * pro Waffentyp (`at_clip_extended_pistol`, `_smg`, ...), unser Bild heisst
 * generisch `at_clip_extended` und bedient alle davon; der Rest sind Items, die
 * es in ox nicht gibt.
 *
 * Was hier steht, ist deshalb Handarbeit:
 *
 *   TAGS    Eine Einordnung nach Verwendung. Sie ist **meine**, nicht die einer
 *           Quelle. ox fuehrt keine Kategorien. Ohne sie kannte die Suche nur
 *           Dateinamen, "drug" oder "food" lieferten null Treffer.
 *   LABELS  Acht Namen, die der erste Import mechanisch aus dem Dateinamen
 *           gebaut hatte ("Card Id", "Usb Black"). Nur Wortstellung und
 *           Schreibweise, keine Erfindungen.
 *
 * Ammo und Anbauteile brauchen hier nichts: ihre Labels kommen aus ox und ihre
 * Tags setzt der erste Lauf bereits.
 */
'use strict'

const fs = require('node:fs')

/** Einordnung nach Verwendung. Kleinschreibung, wie in den anderen Kategorien. */
const TAGS = {
  advancedkit: 'tool',        armour: 'equipment',        bandage: 'medical',
  black_money: 'money',       burger: 'food',             burger_chicken: 'food',
  card_id: 'document',        carkey: 'key',              cigarette: 'drug',
  cigarettes_redwood: 'drug', cocaine: 'drug',            donut: 'food',
  fries: 'food',              garbage: 'trash',           key: 'key',
  lockpick: 'tool',           medikit: 'medical',         meth: 'drug',
  money: 'money',             mustard: 'food',            oldkey: 'key',
  panties: 'clothing',        paperbag: 'container',      parachute: 'equipment',
  phone: 'electronics',       pizza_ham: 'food',          pizza_ham_box: 'food',
  pizza_ham_slice: 'food',    radio: 'electronics',       scrapmetal: 'material',
  sprunk: 'drink',            trash: 'trash',             trash_bread: 'trash',
  trash_burger: 'trash',      trash_can: 'trash',         trash_chips: 'trash',
  usb_black: 'electronics',   water: 'drink',             weed: 'drug',
  ziptie: 'tool',
}

/**
 * Korrekturen an mechanisch gebauten Labels. Brauchen `--force`, weil der
 * Import ein vorhandenes Label sonst stehen laesst.
 */
const LABELS = {
  advancedkit:        'Advanced Kit',
  at_clip_extended2:  'Extended Clip 2',
  burger_chicken:     'Chicken Burger',
  card_id:            'ID Card',
  carkey:             'Car Key',
  cigarettes_redwood: 'Redwood Cigarettes',
  oldkey:             'Old Key',
  usb_black:          'USB Drive',
}

/** Anbauteile tragen ihren Tag aus dem ersten Lauf, hier nur die Korrekturen. */
const TAGS_ZU_LABELS = { at_clip_extended2: 'attachment' }

const ziel = process.argv[2]
if (!ziel) {
  console.error('Aufruf: items.js <labels.json>')
  process.exit(2)
}

const namen = new Set([...Object.keys(TAGS), ...Object.keys(LABELS)])
const raus = [...namen].sort().map(name => {
  const eintrag = { name }
  if (LABELS[name]) eintrag.label = LABELS[name]
  const tags = TAGS[name] || TAGS_ZU_LABELS[name]
  if (tags) eintrag.tags = tags
  return eintrag
})

fs.writeFileSync(ziel, JSON.stringify(raus))
console.log('Eintraege:', raus.length, '| davon mit Labelkorrektur:', Object.keys(LABELS).length)
console.log('geschrieben nach', ziel)
console.log('Hinweis: die Labelkorrekturen greifen nur mit --force.')
