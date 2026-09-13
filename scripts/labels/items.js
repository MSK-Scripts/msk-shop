#!/usr/bin/env node
/**
 * Labels and tags for items.
 *
 *   node scripts/labels/items.js item-labels.json
 *   node scripts/image-label-import.js items item-labels.json --dry-run
 *
 * Unlike vehicles, weapons and peds, there is **no data source** here.
 * The labels come from `ox_inventory` (`data/items.lua` and `data/weapons.lua`),
 * and those are already imported: in the comparison on 26.08.2026, 54 of 83
 * matched exactly, 0 differed, and ox does not know 29 at all. ox splits
 * attachments per weapon type (`at_clip_extended_pistol`, `_smg`, ...), our
 * image is generically named `at_clip_extended` and serves all of them; the rest
 * are items that do not exist in ox.
 *
 * What is here is therefore handwork:
 *
 *   TAGS    A classification by use. It is **mine**, not that of a source.
 *           ox keeps no categories. Without them the search only knew file
 *           names, "drug" or "food" returned zero hits.
 *   LABELS  Eight names that the first import had built mechanically from the
 *           file name ("Card Id", "Usb Black"). Only word order and spelling,
 *           nothing invented.
 *
 * Ammo and attachments need nothing here: their labels come from ox and the
 * first run already sets their tags.
 */
'use strict'

const fs = require('node:fs')

/** Classification by use. Lowercase, as in the other categories. */
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
 * Corrections to mechanically built labels. They need `--force`, because the
 * import otherwise leaves an existing label in place.
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

/** Attachments carry their tag from the first run, only the corrections here. */
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
