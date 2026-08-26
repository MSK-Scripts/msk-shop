import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { query } from '@/lib/db'

/**
 * Karteileichen im Bild-CDN finden: Zeilen ohne Datei, Dateien ohne Zeile,
 * fehlende Derivate.
 *
 * Das ist die Web-Fassung von `scripts/image-sync-check.js`, und sie ist
 * bewusst die kleinere: das Script prueft zusaetzlich, ob die Dateigroesse auf
 * der Platte zur Spalte `bytes` passt, und braucht dafuer ein `fs.stat` **je
 * Zeile**, also derzeit rund 2100 Systemaufrufe. Das ist fuer einen Cron in
 * Ordnung und fuer einen Klick im Dashboard nicht.
 *
 * Hier reicht ein `readdir` je Kategorie, also sechs Aufrufe fuer den ganzen
 * Bestand. Damit fallen die drei Zustaende auf, die dem Besucher wirklich
 * begegnen: eine Kachel, deren Bild 404 liefert; eine Datei, die ausgeliefert
 * wird und nirgends auftaucht; ein fehlendes Derivat. Fuer den Groessenabgleich
 * bleibt das Script zustaendig, und die Oberflaeche sagt das auch.
 *
 * Reines Lesen. Diese Datei aendert nichts, weder in der Datenbank noch auf
 * der Platte. Aufraeumen bleibt `image-ingest.js --force` bzw. Handarbeit.
 */

const DERIVATIVES = [
  { suffix: '.webp',       label: 'card'  },
  { suffix: '_thumb.webp', label: 'thumb' },
]

/** Wie viele Beispiele je Befund zurueckgehen. Der Rest steht nur als Zahl. */
const SAMPLE_SIZE = 10

export interface SyncCheckCategory {
  category:      string
  rows:          number
  files:         number
  /** Verzeichnis fehlt ganz. Nur dann ein Problem, wenn es Zeilen dazu gibt. */
  directoryGone: boolean
  missingFile:   string[]
  orphanFile:    string[]
  missingDeriv:  string[]
  missingFileTotal:  number
  orphanFileTotal:   number
  missingDerivTotal: number
}

export interface SyncCheckResult {
  /**
   * Wurzel, gegen die geprueft wurde. Steht mit im Bericht, damit ein falscher
   * Pfad als solcher erkennbar ist und nicht als leeres CDN gelesen wird.
   */
  root:       string
  problems:   number
  categories: SyncCheckCategory[]
  /** Gesetzt, wenn die Wurzel gar nicht lesbar ist (lokale Entwicklung). */
  unavailable?: string
}

function cdnRoot(): string {
  return process.env.CDN_ROOT_PATH || '/var/www/cdn.msk-scripts.de'
}

/**
 * turbopackIgnore: der Pfad ist absichtlich dynamisch. Die Wurzel kommt aus
 * CDN_ROOT_PATH und zeigt aus dem Repo heraus (/var/www/cdn.msk-scripts.de),
 * dahinter steht ein Kategorie-Slug aus der Datenbank. Ohne den Hinweis zieht
 * Turbopack das ganze Projekt ins Build-Tracing, wie schon beim
 * Transcript-Upload. Das Tracing ist hier ungenutzt (kein `output: 'standalone'`,
 * der Server startet aus dem vollen Checkout), der Hinweis unterdrueckt also
 * nur Rauschen, das echte Funde ueberdecken wuerde.
 */
async function listFiles(dir: string): Promise<string[] | null> {
  try {
    return await readdir(/*turbopackIgnore: true*/ dir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

export async function runSyncCheck(): Promise<SyncCheckResult> {
  const root = cdnRoot()

  const categories = await query<{ slug: string }>(
    'SELECT slug FROM msk_image_categories ORDER BY sort_order',
  )

  // Ist die Wurzel selbst nicht da, laeuft das hier auf einem Rechner ohne
  // CDN-Verzeichnis. Dann sechs Kategorien als "Verzeichnis fehlt" zu melden
  // waere formal richtig und praktisch ein Fehlalarm.
  if ((await listFiles(root)) === null) {
    return {
      root,
      problems: 0,
      categories: [],
      unavailable: `Directory ${root} does not exist on this host. Set CDN_ROOT_PATH or run the check on the server.`,
    }
  }

  const result: SyncCheckCategory[] = []
  let problems = 0

  for (const { slug } of categories) {
    const files = await listFiles(join(/*turbopackIgnore: true*/ root, slug))
    const rows  = await query<{ name: string; ext: string }>(
      'SELECT name, ext FROM msk_images WHERE category = ?', [slug],
    )

    if (files === null) {
      if (rows.length) problems += rows.length
      result.push({
        category: slug, rows: rows.length, files: 0, directoryGone: true,
        missingFile: [], orphanFile: [], missingDeriv: [],
        missingFileTotal: 0, orphanFileTotal: 0, missingDerivTotal: 0,
      })
      continue
    }

    const present = new Set(files)
    const known   = new Set<string>()
    const missingFile:  string[] = []
    const missingDeriv: string[] = []

    for (const row of rows) {
      const original = `${row.name}.${row.ext}`
      known.add(original)
      if (!present.has(original)) missingFile.push(row.name)

      for (const d of DERIVATIVES) {
        const file = `${row.name}${d.suffix}`
        known.add(file)
        if (!present.has(file)) missingDeriv.push(`${row.name} (${d.label})`)
      }
    }

    const orphanFile = files.filter(f => !known.has(f))

    problems += missingFile.length + orphanFile.length + missingDeriv.length

    result.push({
      category:          slug,
      rows:              rows.length,
      files:             files.length,
      directoryGone:     false,
      missingFile:       missingFile.slice(0, SAMPLE_SIZE),
      orphanFile:        orphanFile.slice(0, SAMPLE_SIZE),
      missingDeriv:      missingDeriv.slice(0, SAMPLE_SIZE),
      missingFileTotal:  missingFile.length,
      orphanFileTotal:   orphanFile.length,
      missingDerivTotal: missingDeriv.length,
    })
  }

  return { root, problems, categories: result }
}
