#!/usr/bin/env node
/**
 * image-ingest.js — Bilder in das CDN aufnehmen.
 *
 *   node scripts/image-ingest.js <kategorie> <quellordner> [optionen]
 *
 * Optionen:
 *   --dry-run              nichts schreiben, nur berichten
 *   --force                Derivate neu bauen, auch wenn die Quelle unveraendert ist
 *   --allow-opaque         Bilder ohne Alphakanal zulassen (Standard: ablehnen)
 *   --source=<text>        Herkunft, landet in msk_images.source
 *   --license=<text>       Lizenzhinweis, bei Fremdquellen Pflicht
 *   --limit=<n>            nur die ersten n Dateien (fuer Probelaeufe)
 *
 * Umgebung (aus /opt/msk-shop/.env.local sourcen, wie bei cleanup.js):
 *   DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME
 *   CDN_ROOT_PATH   Zielverzeichnis, Default /var/www/cdn.msk-scripts.de
 *
 * Aufruf auf dem Server:
 *   set -a; . /opt/msk-shop/.env.local; set +a
 *   NODE_PATH=/opt/msk-shop/node_modules node /opt/msk-shop/scripts/image-ingest.js \
 *     vehicles /srv/staging/vehicles --source=msk_garage --dry-run
 *
 * Warum das Script auf dem Server laeuft und nicht lokal: der Quellbestand geht
 * in die Gigabyte, und das Zielverzeichnis wird oeffentlich ausgeliefert. Beides
 * ueber OneDrive zu synchronisieren waere langsam und fehleranfaellig.
 *
 * Warum immer zuerst --dry-run: das Script schreibt in ein oeffentlich
 * erreichbares Verzeichnis. Ein Tippfehler im Quellpfad ist teuer.
 */

'use strict'

const fs      = require('node:fs/promises')
const path    = require('node:path')
const crypto  = require('node:crypto')
const sharp   = require('sharp')
const mysql   = require('mysql2/promise')

// ── Aufbereitungsregeln. Bewusst hier oben und nicht verstreut: sie sind der
//    Grund, warum der Bestand einheitlich aussieht. Wer sie aendert, aendert
//    das Aussehen der ganzen Galerie.
const RULES = {
  originalMaxEdge: 1024,   // laengste Kante des Originals
  cardWidth:       400,    // Kachel in der Galerie und in NUIs
  thumbWidth:      160,    // Vorschau in dichten Rastern
  cardQuality:     82,
  thumbQuality:    78,
  paddingPercent:  0.04,   // einheitlicher Rand NACH dem Trimmen
  minEdge:         32,     // alles darunter ist kein brauchbares Asset
}

// Ausnahmen je Kategorie. Die Regeln oben existieren, damit Spiel-Assets im
// Raster einheitlich aussehen: gleicher Rand, vergleichbare Groesse, ein Deckel
// gegen Ausreisser. `brand` taucht in keinem Raster auf (die Kategorie steht auf
// is_public = 0), dort richten sie nur Schaden an. Gemessen am 26.08.2026 waere
// aus einem 1920 x 1080 grossen Banner ein 1024 x 609 grosses mit transparentem
// Rahmen geworden, und der Trim haette den Quicksale-Bannern erst 162 px
// abgeschnitten.
const CATEGORY_RULES = {
  brand: { trim: false, paddingPercent: 0, originalMaxEdge: 1920 },
}

/** Regeln fuer eine Kategorie: Standard, ueberschrieben von der Ausnahme. */
function rulesFor(category) {
  return { trim: true, ...RULES, ...(CATEGORY_RULES[category] || {}) }
}

const SOURCE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])

// ---------------------------------------------------------------------------
// Argumente
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [k, ...rest] = arg.slice(2).split('=')
      flags[k] = rest.length ? rest.join('=') : true
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}

/**
 * Dateiname auf das Schema bringen, das die URL vertraegt.
 *
 * Ein Bild heisst so, wie ein Script das Modell kennt: kleingeschrieben, ohne
 * Leerzeichen, ohne Umlaute. Nur dann kann ein Consumer die URL aus dem
 * Modellnamen bauen, ohne vorher irgendwo nachzuschlagen.
 */
function normaliseName(raw) {
  return raw
    // Umlaute VOR normalize('NFD') ersetzen: NFD zerlegt sie in Grundbuchstabe
    // plus Diakritikum, und der naechste Schritt wirft das Diakritikum weg.
    // Umgekehrt herum waere aus "Baeckerei" ein "backerei" geworden, und die
    // Umlautregel darunter haette nie gegriffen.
    .replace(/ä/gi, 'ae').replace(/ö/gi, 'oe').replace(/ü/gi, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // restliche Akzente weg
    .toLowerCase()
    // Plus ausschreiben, bevor die Zeile darunter es zu einem Unterstrich macht
    // und der Schnitt am Wortende ihn entfernt: sonst werden `coiloversS+` und
    // `coiloversS` derselbe Name und eines der Bilder faellt still weg.
    // Spiegel von normaliseName in lib/imagePipeline.ts.
    .replace(/\+/g, '_plus')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
}

async function sha256File(file) {
  const buf = await fs.readFile(file)
  return crypto.createHash('sha256').update(buf).digest('hex')
}

async function walk(dir, out = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, out)
    else if (SOURCE_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full)
  }
  return out
}

// ---------------------------------------------------------------------------
// Bildverarbeitung
// ---------------------------------------------------------------------------
/**
 * Trimmen, dann einheitlich umranden.
 *
 * Der Trim ist der Schritt, der optisch am meisten ausmacht: ungetrimmte
 * Screenshots ergeben ein Raster, in dem jedes Fahrzeug eine andere Groesse
 * hat, weil jedes Bild anders viel Leerraum mitbringt. Erst trimmen und dann
 * einen prozentualen Rand setzen macht sie vergleichbar.
 *
 * Der Rand wird aus der getrimmten Groesse berechnet, nicht aus der originalen,
 * sonst wandert er mit dem Leerraum mit, den wir gerade entfernt haben.
 */
async function trimAndPad(inputBuffer, regeln = rulesFor(null)) {
  let working = inputBuffer
  if (regeln.trim) {
    try {
      working = await sharp(inputBuffer).trim({ threshold: 0 }).toBuffer()
    } catch {
      // Ein Bild ohne beschneidbaren Rand (oder ein komplett leeres) laesst sharp
      // werfen. Dann bleibt das Original stehen, das ist kein Fehlerfall.
    }
  }

  const meta = await sharp(working).metadata()
  const pad  = Math.round(Math.max(meta.width, meta.height) * regeln.paddingPercent)
  if (pad < 1) return working

  return sharp(working)
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()
}

async function buildVariants(padded, regeln = rulesFor(null)) {
  const original = await sharp(padded)
    .resize({
      width: regeln.originalMaxEdge, height: regeln.originalMaxEdge,
      fit: 'inside', withoutEnlargement: true,
    })
    // effort: 10 ist hier kein Feinschliff, sondern der Unterschied zwischen
    // 358 KB und 93 KB pro Fahrzeugbild (nachgemessen an adder.png). Ohne den
    // Wert liefert sharp ein PNG, das GROESSER ist als die Quelle, und der
    // Bestand waere um Faktor vier aufgeblaeht. Kostet Rechenzeit beim Ingest,
    // die genau einmal pro Bild anfaellt.
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()

  const card = await sharp(padded)
    .resize({ width: RULES.cardWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: RULES.cardQuality, effort: 6 })
    .toBuffer()

  const thumb = await sharp(padded)
    .resize({ width: RULES.thumbWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: RULES.thumbQuality, effort: 6 })
    .toBuffer()

  const meta = await sharp(original).metadata()
  return { original, card, thumb, width: meta.width, height: meta.height }
}

// ---------------------------------------------------------------------------
// Hauptlauf
// ---------------------------------------------------------------------------
async function main() {
  const { positional, flags } = parseArgs(process.argv)
  const [category, sourceDir] = positional

  if (!category || !sourceDir) {
    console.error('Aufruf: image-ingest.js <kategorie> <quellordner> [--dry-run] [--force] ...')
    process.exit(2)
  }

  const dryRun      = Boolean(flags['dry-run'])
  const force       = Boolean(flags.force)
  const allowOpaque = Boolean(flags['allow-opaque'])
  const limit       = flags.limit ? Number(flags.limit) : Infinity
  const sourceNote  = typeof flags.source  === 'string' ? flags.source  : null
  const licenseNote = typeof flags.license === 'string' ? flags.license : null
  const regeln      = rulesFor(category)

  const cdnRoot = process.env.CDN_ROOT_PATH || '/var/www/cdn.msk-scripts.de'
  const targetDir = path.join(cdnRoot, category)

  const db = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  // Kategorie muss existieren. Ein Tippfehler im ersten Argument wuerde sonst
  // ein neues Verzeichnis anlegen, das nie jemand ausliefert.
  const [cats] = await db.execute(
    'SELECT slug FROM msk_image_categories WHERE slug = ?', [category],
  )
  if (!cats.length) {
    console.error(`Unbekannte Kategorie "${category}". Bekannt sind die Zeilen in msk_image_categories.`)
    await db.end()
    process.exit(2)
  }

  const files = (await walk(sourceDir)).slice(0, limit)
  console.log(`Quelle:  ${sourceDir}  (${files.length} Dateien)`)
  console.log(`Ziel:    ${targetDir}`)
  console.log(`Modus:   ${dryRun ? 'DRY-RUN, es wird nichts geschrieben' : 'SCHREIBEN'}${force ? ', force' : ''}`)
  console.log('')

  if (!dryRun) await fs.mkdir(targetDir, { recursive: true })

  const stats = { created: 0, updated: 0, skipped: 0, rejected: 0 }
  const rejected = []
  /** Inhaltsgleiche Dateien: nur ein Hinweis, kein Ausschluss (siehe unten). */
  const duplicates = []
  // Dubletten sind in fremden Packs die Regel, nicht die Ausnahme. Wer sie
  // beim Ingest nicht herauswirft, hat sie fuer immer.
  const seenHashes = new Map()

  for (const file of files) {
    const base = path.basename(file, path.extname(file))
    const name = normaliseName(base)

    if (!name) {
      rejected.push([file, 'Name ist nach der Normalisierung leer'])
      stats.rejected++
      continue
    }

    let hash, meta
    try {
      hash = await sha256File(file)
      meta = await sharp(file).metadata()
    } catch (err) {
      rejected.push([file, `nicht lesbar: ${err.message}`])
      stats.rejected++
      continue
    }

    // Inhaltsgleiche Dateien werden gemeldet, aber NICHT abgelehnt.
    //
    // Beim Erstimport der Fahrzeuge lag genau dieser Fall vor: `issi4.png` ist
    // byteidentisch mit `issi3.png`. Zwei verschiedene Spawnnamen, dasselbe
    // Bild — im Garagen-UI ist das seit jeher so und voellig in Ordnung.
    //
    // Ein Consumer baut die URL aus dem Modellnamen, ein fehlendes
    // `issi4.webp` waere dort ein 404 und damit ein echter Funktionsverlust.
    // Platz kostet die Dublette drei Dateien, das ist der falsche Preis fuer
    // ein kaputtes Bild.
    if (seenHashes.has(hash)) {
      duplicates.push([file, seenHashes.get(hash)])
    } else {
      seenHashes.set(hash, name)
    }

    if (Math.min(meta.width, meta.height) < RULES.minEdge) {
      rejected.push([file, `zu klein (${meta.width}x${meta.height})`])
      stats.rejected++
      continue
    }

    if (!meta.hasAlpha && !allowOpaque) {
      rejected.push([file, 'kein Alphakanal (mit --allow-opaque zulassen)'])
      stats.rejected++
      continue
    }

    const [rows] = await db.execute(
      'SELECT id, sha256, version FROM msk_images WHERE category = ? AND name = ?',
      [category, name],
    )
    const existing = rows[0]

    if (existing && existing.sha256 === hash && !force) {
      stats.skipped++
      continue
    }

    // Eine ersetzte Datei braucht eine neue URL, weil der vhost mit
    // max-age=1 Jahr + immutable ausliefert. Dafuer zaehlt version hoch.
    const version = existing ? (existing.sha256 === hash ? existing.version : existing.version + 1) : 1

    if (dryRun) {
      if (existing) stats.updated++; else stats.created++
      continue
    }

    let variants
    try {
      const padded = await trimAndPad(await fs.readFile(file), regeln)
      variants = await buildVariants(padded, regeln)
    } catch (err) {
      rejected.push([file, `Verarbeitung fehlgeschlagen: ${err.message}`])
      stats.rejected++
      continue
    }

    await fs.writeFile(path.join(targetDir, `${name}.png`),        variants.original)
    await fs.writeFile(path.join(targetDir, `${name}.webp`),       variants.card)
    await fs.writeFile(path.join(targetDir, `${name}_thumb.webp`), variants.thumb)

    await db.execute(
      `INSERT INTO msk_images
         (category, name, ext, width, height, bytes, sha256, version, source, license_note)
       VALUES (?, ?, 'png', ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         width = VALUES(width), height = VALUES(height), bytes = VALUES(bytes),
         sha256 = VALUES(sha256), version = VALUES(version),
         source = COALESCE(VALUES(source), source),
         license_note = COALESCE(VALUES(license_note), license_note)`,
      [category, name, variants.width, variants.height, variants.original.length,
       hash, version, sourceNote, licenseNote],
    )

    if (existing) stats.updated++; else stats.created++
  }

  await db.end()

  console.log('Ergebnis')
  console.log(`  neu:          ${stats.created}`)
  console.log(`  aktualisiert: ${stats.updated}`)
  console.log(`  uebersprungen:${stats.skipped}  (Quelle unveraendert)`)
  console.log(`  abgelehnt:    ${stats.rejected}`)

  // Abgelehnte Dateien werden benannt, nicht stillschweigend verschluckt.
  // Sonst haelt man einen halben Bestand fuer einen ganzen.
  if (duplicates.length) {
    console.log(`
Inhaltsgleich (trotzdem aufgenommen): ${duplicates.length}`)
    for (const [file, first] of duplicates.slice(0, 20)) {
      console.log(`  ${path.basename(file)} = ${first}`)
    }
    if (duplicates.length > 20) console.log(`  ... und ${duplicates.length - 20} weitere`)
  }

  if (rejected.length) {
    console.log('\nAbgelehnt:')
    for (const [file, reason] of rejected.slice(0, 50)) {
      console.log(`  ${path.basename(file)}: ${reason}`)
    }
    if (rejected.length > 50) console.log(`  ... und ${rejected.length - 50} weitere`)
  }
}

main().catch((err) => {
  console.error('Abbruch:', err)
  process.exit(1)
})
