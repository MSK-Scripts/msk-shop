import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

/**
 * Die Aufbereitungsregeln des Bildbestands, als TypeScript.
 *
 * **Das ist ein bewusster Spiegel von `scripts/image-ingest.js`**, nicht eine
 * zweite Meinung. Das Script ist Plain-JS und laeuft ausserhalb von Next; es
 * kann dieses Modul nicht importieren, und dieses Modul kann das Script nicht
 * laden. Dasselbe Muster wie `BASIC_STORAGE_DAYS` in `scripts/cleanup.js`.
 *
 * Warum die Duplikation trotzdem vertretbar ist: die Regeln aendern sich fast
 * nie, und wenn doch, aendern sie das Aussehen der ganzen Galerie — das ist
 * kein beilaeufiger Commit. `tests/imagePipeline.test.ts` liest die Zahlen aus
 * dem Script und vergleicht sie mit denen hier, damit ein Auseinanderlaufen
 * auffaellt statt sich als Bestand mit zwei Looks niederzuschlagen.
 */
export const PIPELINE_RULES = {
  originalMaxEdge: 1024,
  cardWidth:       400,
  thumbWidth:      160,
  cardQuality:     82,
  thumbQuality:    78,
  paddingPercent:  0.04,
  minEdge:         32,
} as const

/** Formate, die ein Einreichender schicken darf. Geprueft wird der Inhalt, nicht die Endung. */
export const ACCEPTED_INPUT_FORMATS = ['png', 'jpeg', 'webp'] as const

export function cdnRootPath(): string {
  return process.env.CDN_ROOT_PATH || '/var/www/cdn.msk-scripts.de'
}

/**
 * Dateiname auf das Schema bringen, das die URL vertraegt.
 *
 * Zeichengleich mit `normaliseName` im Ingest-Script, inklusive der Reihenfolge
 * der ersten beiden Schritte: die Umlaute muessen VOR `normalize('NFD')` weg,
 * sonst zerlegt NFD sie und der Folgeschritt wirft das Diakritikum weg, bevor
 * die Umlautregel greift. Genau dieser Fehler war am 25.08.2026 im Script drin
 * und machte aus "Baeckerei" ein "backerei".
 */
export function normaliseName(raw: string): string {
  return raw
    .replace(/ä/gi, 'ae').replace(/ö/gi, 'oe').replace(/ü/gi, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 128)
}

export interface Variants {
  original: Buffer
  card:     Buffer
  thumb:    Buffer
  width:    number
  height:   number
}

/**
 * Trimmen, dann einheitlich umranden.
 *
 * Der Trim macht optisch am meisten aus: ungetrimmte Aufnahmen ergeben ein
 * Raster, in dem jedes Objekt anders gross wirkt, weil jedes Bild anders viel
 * Leerraum mitbringt. Der Rand wird aus der GETRIMMTEN Groesse berechnet, sonst
 * wandert er mit dem Leerraum mit, den wir gerade entfernt haben.
 */
export async function trimAndPad(input: Buffer): Promise<Buffer> {
  let working = input
  try {
    working = await sharp(input).trim({ threshold: 0 }).toBuffer()
  } catch {
    // Ein Bild ohne beschneidbaren Rand laesst sharp werfen. Dann bleibt das
    // Original stehen, das ist kein Fehlerfall.
  }

  const meta = await sharp(working).metadata()
  const pad  = Math.round(Math.max(meta.width ?? 0, meta.height ?? 0) * PIPELINE_RULES.paddingPercent)
  if (pad < 1) return working

  return sharp(working)
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()
}

export async function buildVariants(padded: Buffer): Promise<Variants> {
  const original = await sharp(padded)
    .resize({
      width:  PIPELINE_RULES.originalMaxEdge,
      height: PIPELINE_RULES.originalMaxEdge,
      fit: 'inside', withoutEnlargement: true,
    })
    // effort: 10 ist kein Feinschliff, sondern der Unterschied zwischen 358 KB
    // und 93 KB je Bild (am Ingest nachgemessen). Ohne den Wert liefert sharp
    // ein PNG, das groesser ist als die Quelle.
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()

  const card = await sharp(padded)
    .resize({ width: PIPELINE_RULES.cardWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: PIPELINE_RULES.cardQuality, effort: 6 })
    .toBuffer()

  const thumb = await sharp(padded)
    .resize({ width: PIPELINE_RULES.thumbWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: PIPELINE_RULES.thumbQuality, effort: 6 })
    .toBuffer()

  const meta = await sharp(original).metadata()
  return { original, card, thumb, width: meta.width ?? 0, height: meta.height ?? 0 }
}

/**
 * Die drei Fassungen in das oeffentlich ausgelieferte Verzeichnis schreiben.
 *
 * Bis zum 26.08.2026 tat das ausschliesslich `scripts/image-ingest.js`, und der
 * Plan sagte, das solle so bleiben. Mit den Community-Uploads gibt es eine
 * zweite Stelle, und zwar bewusst: die Alternative waere ein Cron gewesen, der
 * freigegebene Einreichungen einsammelt, also eine zweite bewegliche Komponente
 * und eine Verzoegerung zwischen Klick und Ergebnis.
 *
 * Was die Entscheidung traegt, ist der Weg davor: was hier ankommt, ist keine
 * hochgeladene Datei, sondern ein von sharp neu erzeugter Puffer. Fremde Bytes
 * erreichen dieses Verzeichnis nie, `category` und `name` sind gegen die
 * Datenbank bzw. gegen `normaliseName` geprueft, und geschrieben wird erst
 * nach einer Freigabe durch einen Menschen.
 */
export async function writeVariants(category: string, name: string, v: Variants): Promise<void> {
  // turbopackIgnore: der Pfad ist absichtlich dynamisch, die Wurzel kommt aus
  // CDN_ROOT_PATH und zeigt aus dem Repo heraus. Ohne den Hinweis traced
  // Turbopack das ganze Projekt, wie beim Transcript-Upload.
  const dir = join(/*turbopackIgnore: true*/ cdnRootPath(), category)
  await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true })

  await writeFile(join(/*turbopackIgnore: true*/ dir, `${name}.png`), v.original)
  await writeFile(join(/*turbopackIgnore: true*/ dir, `${name}.webp`), v.card)
  await writeFile(join(/*turbopackIgnore: true*/ dir, `${name}_thumb.webp`), v.thumb)
}
