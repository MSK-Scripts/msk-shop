#!/usr/bin/env node
/**
 * image-pedshot-prepare.js — Aufnahmen aus msk_pedshot freistellen.
 *
 *   node scripts/image-pedshot-prepare.js <shots-ordner> <ziel-ordner> [--schwelle=24]
 *
 * Erwartet im Quellordner je Modell zwei Aufnahmen aus derselben
 * Kameraposition: `<name>__bg.png` (leere Szene) und `<name>.png` (mit Modell).
 *
 * Warum je Modell ein eigener Hintergrund und nicht einer fuer alle: die Kamera
 * wandert, damit eine Katze und ein Pferd beide das Bild ausfuellen. Ein
 * einziges Hintergrundbild passte dann nur noch zu einer einzigen Aufnahme.
 *
 * **Warum Differenz und nicht Chroma-Key.** Der uebliche Weg der Szene ist eine
 * gruene Flaeche und ein Farbschluessel. Das scheitert zuverlaessig an gruener
 * Kleidung, und GTA bringt kein brauchbares Greenscreen-Prop mit. Hier wird
 * dieselbe Einstellung zweimal fotografiert, einmal leer und einmal mit
 * Modell, und was sich unterscheidet, ist das Modell. Das ist
 * farbunabhaengig: ein weisses
 * Tier vor hellem Himmel funktioniert genauso wie ein schwarzes.
 *
 * Voraussetzung ist, dass sich zwischen den Aufnahmen wirklich nur das Modell
 * aendert. Dafuer friert die Resource Wetter, Uhrzeit und Wolken ein.
 *
 * Die Schwelle entscheidet, ab welchem Farbabstand ein Pixel als "gehoert zum
 * Modell" gilt. Zu niedrig holt Himmelsrauschen mit, zu hoch frisst dunkle
 * Kanten weg. Der erste Anlauf stand auf 24 und hat bei 93 von 240 Aufnahmen
 * Teile des Modells verschluckt, deshalb jetzt 14. Wer sie aendert, sollte das
 * Ergebnis ansehen und nicht nur die Zahl.
 */

'use strict'

const fs    = require('node:fs/promises')
const path  = require('node:path')
const sharp = require('sharp')


function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [k, ...rest] = arg.slice(2).split('=')
      flags[k] = rest.length ? rest.join('=') : true
    } else positional.push(arg)
  }
  return { positional, flags }
}

/**
 * Alphakanal aus dem Unterschied zweier Aufnahmen bilden.
 *
 * Verglichen wird der groesste Kanalabstand, nicht die Summe: ein Modell, das
 * sich nur in einem Kanal deutlich abhebt (rotes Hemd vor blauem Himmel), faellt
 * bei einer Summe ueber drei Kanaele sonst unter die Schwelle.
 */
function maskiere(bild, hintergrund, breite, hoehe, schwelle) {
  const alpha = Buffer.alloc(breite * hoehe)

  for (let i = 0, p = 0; i < alpha.length; i++, p += 3) {
    const dr = Math.abs(bild[p]     - hintergrund[p])
    const dg = Math.abs(bild[p + 1] - hintergrund[p + 1])
    const db = Math.abs(bild[p + 2] - hintergrund[p + 2])
    const d  = Math.max(dr, dg, db)

    // Weicher Uebergang statt harter Kante: zwischen Schwelle und dem
    // Doppelten wird linear aufgeblendet, sonst bekommt jedes Modell einen
    // ausgefransten Rand aus halb getroffenen Pixeln.
    alpha[i] = d <= schwelle ? 0
             : d >= schwelle * 2 ? 255
             : Math.round(((d - schwelle) / schwelle) * 255)
  }

  return alpha
}

/**
 * Loecher innerhalb der Silhouette schliessen.
 *
 * Wo das Modell dem Himmel farblich aehnelt, faellt der Unterschied unter die
 * Schwelle und das Pixel wird transparent. Bei einem hellen Hemd vor hellem
 * Himmel fehlt dann der halbe Oberkoerper. Gemessen an den ersten 240
 * Aufnahmen betraf das 93 Bilder.
 *
 * Der Test dafuer ist einfach: transparente Pixel, die vom Bildrand aus
 * erreichbar sind, gehoeren zum Hintergrund. Alle uebrigen liegen von
 * Modellpixeln umschlossen und koennen nur Fehlstellen sein.
 *
 * Nicht heilbar sind damit Loecher, die zum Bildrand hin offen sind, etwa ein
 * fehlender Kopf. Dagegen hilft nur eine niedrigere Schwelle.
 */
function fuelleLoecher(alpha, breite, hoehe) {
  const aussen = new Uint8Array(alpha.length)
  const stack = []

  for (let x = 0; x < breite; x++) { stack.push(x, (hoehe - 1) * breite + x) }
  for (let y = 0; y < hoehe; y++)  { stack.push(y * breite, y * breite + breite - 1) }

  while (stack.length) {
    const i = stack.pop()
    if (aussen[i] || alpha[i] > 0) continue
    aussen[i] = 1
    const x = i % breite
    const y = (i - x) / breite
    if (x > 0)          stack.push(i - 1)
    if (x < breite - 1) stack.push(i + 1)
    if (y > 0)          stack.push(i - breite)
    if (y < hoehe - 1)  stack.push(i + breite)
  }

  let gefuellt = 0
  for (let i = 0; i < alpha.length; i++) {
    if (alpha[i] === 0 && !aussen[i]) { alpha[i] = 255; gefuellt++ }
  }
  return gefuellt
}

/** Groesster zusammenhaengender Bereich, alles andere faellt weg. */
function groesstenBereichBehalten(alpha, breite, hoehe) {
  const besucht = new Uint8Array(alpha.length)
  const stack = []
  let bestGroesse = 0
  let bestMarke = null

  for (let start = 0; start < alpha.length; start++) {
    if (besucht[start] || alpha[start] === 0) continue

    const marke = new Uint8Array(alpha.length)
    let groesse = 0
    stack.push(start)
    besucht[start] = 1

    while (stack.length) {
      const i = stack.pop()
      marke[i] = 1
      groesse++

      const x = i % breite
      const y = (i - x) / breite
      const nachbarn = [
        x > 0          ? i - 1      : -1,
        x < breite - 1 ? i + 1      : -1,
        y > 0          ? i - breite : -1,
        y < hoehe - 1  ? i + breite : -1,
      ]
      for (const n of nachbarn) {
        if (n >= 0 && !besucht[n] && alpha[n] > 0) { besucht[n] = 1; stack.push(n) }
      }
    }

    if (groesse > bestGroesse) { bestGroesse = groesse; bestMarke = marke }
  }

  if (!bestMarke) return { alpha, anteil: 0 }

  const sauber = Buffer.alloc(alpha.length)
  for (let i = 0; i < alpha.length; i++) if (bestMarke[i]) sauber[i] = alpha[i]
  return { alpha: sauber, anteil: bestGroesse / alpha.length }
}

async function main() {
  const { positional, flags } = parseArgs(process.argv)
  const [quelle, ziel] = positional
  const schwelle = Number(flags.schwelle ?? 14)

  if (!quelle || !ziel) {
    console.error('Aufruf: image-pedshot-prepare.js <shots-ordner> <ziel-ordner> [--schwelle=24]')
    process.exit(2)
  }

  console.log(`Schwelle ${schwelle}`)
  await fs.mkdir(ziel, { recursive: true })

  const alle = await fs.readdir(quelle)
  const dateien = alle
    .filter(f => f.endsWith('.png') && !f.endsWith('__bg.png'))
    .sort()

  let ok = 0, leer = 0, ohneHintergrund = 0, verworfen = 0, gefuelltGesamt = 0, kaputt = 0
  const problemfaelle = []

  for (const datei of dateien) {
    const name = path.basename(datei, '.png')
    try {

    const hgDatei = path.join(quelle, `${name}__bg.png`)
    try { await fs.access(hgDatei) } catch {
      console.log(`  uebersprungen ${name}: keine Hintergrundaufnahme daneben`)
      ohneHintergrund++
      continue
    }

    const hg   = await sharp(hgDatei).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const bild = await sharp(path.join(quelle, datei)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width: breite, height: hoehe } = hg.info

    if (bild.info.width !== breite || bild.info.height !== hoehe) {
      console.log(`  uebersprungen ${name}: andere Masse als der Hintergrund`)
      continue
    }

    const roh = maskiere(bild.data, hg.data, breite, hoehe, schwelle)
    // Aufloesen in zusammenhaengende Bereiche und nur den groessten behalten:
    // ein voruebergehender Vogel oder ein Lichtflimmern erzeugt sonst
    // Sprenkel, die der Zuschnitt spaeter fuer Bildinhalt haelt.
    const { alpha, anteil } = groesstenBereichBehalten(roh, breite, hoehe)
    const gefuellt = fuelleLoecher(alpha, breite, hoehe)

    if (anteil < 0.0005) {
      console.log(`  LEER ${name}: nur ${(anteil * 100).toFixed(3)} % Unterschied, nichts aufgenommen?`)
      leer++
      continue
    }

    // Plausibilitaetsgrenze. Die Kamera stellt jedes Modell mit 15 % Luft in
    // den Rahmen, ein Treffer belegt also nie den halben Bildschirm. Wo doch,
    // hat die Belichtungsanpassung den ganzen Himmel mitgezaehlt: im Testlauf
    // kamen so 53 % fuer eine Katze und 95 % fuer ein Wildschwein heraus.
    //
    // Ohne diese Grenze landen solche Bilder unbemerkt in der Galerie, und bei
    // 1109 Modellen sieht sie niemand einzeln durch.
    if (anteil > 0.45) {
      console.log(`  VERWORFEN ${name}: ${(anteil * 100).toFixed(1)} % der Flaeche, das ist der Hintergrund`)
      verworfen++
      continue
    }

    const rgba = Buffer.alloc(breite * hoehe * 4)
    for (let i = 0, p = 0, q = 0; i < alpha.length; i++, p += 3, q += 4) {
      rgba[q]     = bild.data[p]
      rgba[q + 1] = bild.data[p + 1]
      rgba[q + 2] = bild.data[p + 2]
      rgba[q + 3] = alpha[i]
    }

    const zugeschnitten = await sharp(rgba, { raw: { width: breite, height: hoehe, channels: 4 } })
      .trim()
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer({ resolveWithObject: true })

    // Zweite Probe, diesmal am Zuschnitt: bleibt nach dem Trimmen fast der
    // ganze Rahmen uebrig, war die Maske kein Modell, sondern Bildrauschen
    // ueber die volle Flaeche. Das faengt Faelle, die knapp unter der
    // Flaechengrenze oben durchrutschen.
    const { width: zb, height: zh } = zugeschnitten.info
    if (zb > breite * 0.9 && zh > hoehe * 0.9) {
      console.log(`  VERWORFEN ${name}: Zuschnitt ${zb}x${zh} fast so gross wie die Aufnahme`)
      verworfen++
      continue
    }

    // Dritte Probe: Detaildichte. Ein Fehlschlag ist grossflaechig, aber arm
    // an Struktur, weil er nur Himmelsrauschen enthaelt. Gemessen an 240
    // Aufnahmen liegt ein echtes Modell zwischen 0,18 und 0,56 Bytes je Pixel,
    // der eine Totalausfall (cs_marnie, ein Punktraster) bei 0,018. Dazwischen
    // liegt Faktor zehn, die Grenze ist also unkritisch zu setzen.
    const dichte = zugeschnitten.data.length / (zb * zh)
    if (dichte < 0.08) {
      console.log(`  VERWORFEN ${name}: nur ${dichte.toFixed(3)} Bytes je Pixel, kein Modell`)
      verworfen++
      continue
    }

    await fs.writeFile(path.join(ziel, `${name}.png`), zugeschnitten.data)
    ok++
    if (gefuellt > breite * hoehe * 0.005) gefuelltGesamt++
    if (ok <= 5 || ok % 100 === 0) {
      console.log(`  ${name}: ${(anteil * 100).toFixed(2)} % Bildflaeche`)
    }

    // Kandidat fuer den Nachtlauf: die Maske hat Fehlstellen, weil das Modell
    // farblich im Himmel verschwindet. Vor dunklem Himmel steht dieselbe
    // helle Kleidung dagegen klar da.
    const dichte2 = zugeschnitten.data.length / (zb * zh)
    if (gefuellt > zb * zh * 0.01 || dichte2 < 0.2) problemfaelle.push(name)

    } catch (err) {
      // Eine unlesbare Aufnahme darf nicht den ganzen Lauf kippen. Beim
      // Abbrechen eines Laufs bleibt regelmaessig eine halb geschriebene
      // Datei zurueck, und ohne diesen Fang stirbt die Aufbereitung von
      // siebenhundert Bildern an genau einer davon.
      console.log(`  KAPUTT ${name}: ${String(err.message).split(String.fromCharCode(10))[0]}`)
      kaputt++
    }
  }

  console.log(`\nfreigestellt: ${ok}`)
  console.log(`leer geblieben: ${leer}`)
  console.log(`Loecher nennenswert gefuellt bei: ${gefuelltGesamt}`)
  console.log(`verworfen (Hintergrund erwischt): ${verworfen}`)
  console.log(`ohne Hintergrundaufnahme: ${ohneHintergrund}`)
  console.log(`unlesbar: ${kaputt}`)

  // Liste fuer den Nachtlauf neben die Bilder legen.
  if (problemfaelle.length) {
    const ziel2 = path.join(ziel, '..', 'problemfaelle.json')
    await fs.writeFile(ziel2, JSON.stringify(problemfaelle, null, 0), 'utf8')
    console.log(`
Problemfaelle fuer den Nachtlauf: ${problemfaelle.length}`)
    console.log(`geschrieben nach ${ziel2}`)
  }
}

main().catch((err) => { console.error('Abbruch:', err); process.exit(1) })
