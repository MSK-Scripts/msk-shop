#!/usr/bin/env node
/**
 * image-pedshot-prepare.js: cut out the shots taken with msk_pedshot.
 *
 *   node scripts/image-pedshot-prepare.js <shots-dir> <target-dir> [--schwelle=24]
 *
 * Expects two shots per model in the source directory, taken from the same
 * camera position: `<name>__bg.png` (empty scene) and `<name>.png` (with model).
 *
 * Why a separate background per model and not one for all: the camera
 * moves so that a cat and a horse both fill the frame. A
 * single background image would then only fit a single shot.
 *
 * **Why difference and not chroma key.** The usual approach in the scene is a
 * green surface and a color key. That reliably fails on green
 * clothing, and GTA does not ship a usable greenscreen prop. Here the
 * same setup is photographed twice, once empty and once with the
 * model, and whatever differs is the model. That is
 * color-independent: a white
 * animal against a bright sky works just as well as a black one.
 *
 * The prerequisite is that really only the model changes between the shots.
 * For that, the resource freezes weather, time of day and clouds.
 *
 * The threshold decides from which color distance on a pixel counts as "belongs
 * to the model". Too low picks up sky noise, too high eats away dark
 * edges. The first attempt was set to 24 and swallowed parts of the model in
 * 93 of 240 shots, hence 14 now. Whoever changes it should look at the
 * result and not just the number.
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
 * Build the alpha channel from the difference between two shots.
 *
 * The largest channel distance is compared, not the sum: a model that
 * stands out clearly in only one channel (red shirt against blue sky) would
 * otherwise fall below the threshold with a sum over three channels.
 */
function maskiere(bild, hintergrund, breite, hoehe, schwelle) {
  const alpha = Buffer.alloc(breite * hoehe)

  for (let i = 0, p = 0; i < alpha.length; i++, p += 3) {
    const dr = Math.abs(bild[p]     - hintergrund[p])
    const dg = Math.abs(bild[p + 1] - hintergrund[p + 1])
    const db = Math.abs(bild[p + 2] - hintergrund[p + 2])
    const d  = Math.max(dr, dg, db)

    // Soft transition instead of a hard edge: between the threshold and
    // twice its value alpha ramps up linearly, otherwise every model gets a
    // frayed edge of half-hit pixels.
    alpha[i] = d <= schwelle ? 0
             : d >= schwelle * 2 ? 255
             : Math.round(((d - schwelle) / schwelle) * 255)
  }

  return alpha
}

/**
 * Close holes inside the silhouette.
 *
 * Where the model resembles the sky in color, the difference falls below the
 * threshold and the pixel becomes transparent. With a light shirt against a light
 * sky, half of the upper body is then missing. Measured on the first 240
 * shots, this affected 93 images.
 *
 * The test for it is simple: transparent pixels that are reachable from the
 * image edge belong to the background. All the others are enclosed by
 * model pixels and can only be gaps.
 *
 * This cannot heal holes that are open towards the image edge, for example a
 * missing head. Only a lower threshold helps against those.
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

/** Largest connected region, everything else is dropped. */
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
    // Split into connected regions and keep only the largest one:
    // a passing bird or a flicker of light otherwise produces
    // specks that the crop later mistakes for image content.
    const { alpha, anteil } = groesstenBereichBehalten(roh, breite, hoehe)
    const gefuellt = fuelleLoecher(alpha, breite, hoehe)

    if (anteil < 0.0005) {
      console.log(`  LEER ${name}: nur ${(anteil * 100).toFixed(3)} % Unterschied, nichts aufgenommen?`)
      leer++
      continue
    }

    // Plausibility limit. The camera frames every model with 15 % breathing
    // room, so a hit never covers half the screen. Where it does, the
    // exposure adjustment counted the whole sky as well: in the test run this
    // gave 53 % for a cat and 95 % for a wild boar.
    //
    // Without this limit such images end up in the gallery unnoticed, and with
    // 1109 models nobody looks through them one by one.
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

    // Second check, this time on the crop: if almost the whole frame is
    // left after trimming, the mask was not a model but image noise
    // across the full area. This catches cases that slip through just under
    // the area limit above.
    const { width: zb, height: zh } = zugeschnitten.info
    if (zb > breite * 0.9 && zh > hoehe * 0.9) {
      console.log(`  VERWORFEN ${name}: Zuschnitt ${zb}x${zh} fast so gross wie die Aufnahme`)
      verworfen++
      continue
    }

    // Third check: detail density. A failure covers a large area but is poor
    // in structure, because it contains only sky noise. Measured on 240
    // shots, a real model lies between 0.18 and 0.56 bytes per pixel,
    // the one total failure (cs_marnie, a dot grid) at 0.018. In between
    // lies a factor of ten, so the limit is uncritical to set.
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

    // Candidate for the night run: the mask has gaps because the model
    // blends into the sky in color. Against a dark sky, the same light
    // clothing stands out clearly.
    const dichte2 = zugeschnitten.data.length / (zb * zh)
    if (gefuellt > zb * zh * 0.01 || dichte2 < 0.2) problemfaelle.push(name)

    } catch (err) {
      // An unreadable shot must not bring down the whole run. When a run is
      // aborted, a half-written file is regularly left behind, and
      // without this catch the processing of seven hundred images dies
      // on exactly that one.
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

  // Put the list for the night run next to the images.
  if (problemfaelle.length) {
    const ziel2 = path.join(ziel, '..', 'problemfaelle.json')
    await fs.writeFile(ziel2, JSON.stringify(problemfaelle, null, 0), 'utf8')
    console.log(`
Problemfaelle fuer den Nachtlauf: ${problemfaelle.length}`)
    console.log(`geschrieben nach ${ziel2}`)
  }
}

main().catch((err) => { console.error('Abbruch:', err); process.exit(1) })
