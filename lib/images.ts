import { query, queryOne } from '@/lib/db'
import type { Lang } from '@/lib/i18n'

/**
 * Bildergalerie: Datenzugriff und URL-Bau.
 *
 * Server-only. Die Dateien selbst liegen nicht in diesem Projekt, sondern im
 * Dateisystem hinter `cdn.msk-scripts.de`; hier stehen nur die Metadaten aus
 * `msk_images` und `msk_image_categories`.
 *
 * **Die drei URLs baut ausschliesslich diese Datei.** Kein Client setzt je
 * selbst eine CDN-Adresse zusammen. Das ist der Grund, warum ein spaeterer
 * Umzug des Bestands (Pull-CDN davor, oder Object Storage dahinter) eine
 * Aenderung an einer Env-Variable ist und kein Refactoring durch das halbe
 * Frontend.
 */

/** Basis-URL des CDN, ohne Schraegstrich am Ende. */
export function cdnBase(): string {
  const raw = process.env.CDN_BASE_URL || 'https://cdn.msk-scripts.de'
  return raw.replace(/\/+$/, '')
}

export interface ImageCategory {
  slug:        string
  name:        string
  description: string | null
  icon:        string | null
  count:       number
}

export interface ImageRecord {
  category: string
  name:     string
  label:    string | null
  ext:      string
  width:    number
  height:   number
  bytes:    number
  version:  number
  tags:     string[]
  /** Original, PNG mit Alphakanal. */
  url:      string
  /** 400 px WebP, das was Galerie und NUIs anzeigen. */
  card:     string
  /** 160 px WebP fuer dichte Raster. */
  thumb:    string
}

export interface ImageListResult {
  total: number
  page:  number
  per:   number
  items: ImageRecord[]
}

/** Hoechstwert fuer `per`, serverseitig erzwungen. */
export const MAX_PER_PAGE = 100
export const DEFAULT_PER_PAGE = 60

interface ImageRow {
  category: string
  name:     string
  label:    string | null
  ext:      string
  width:    number
  height:   number
  bytes:    number
  version:  number
  tags:     string | null
}

/**
 * Aus einer Datenbankzeile den oeffentlichen Datensatz bauen.
 *
 * Der Cachebuster haengt nur ab Version 2 an: der vhost liefert mit
 * `max-age=31536000, immutable` aus, eine ersetzte Datei braucht deshalb eine
 * neue Adresse. Beim Erstimport waere `?v=1` an jeder URL nur Ballast, und er
 * wuerde in jedem kopierten Link mitwandern.
 */
function toRecord(row: ImageRow): ImageRecord {
  const base = `${cdnBase()}/${row.category}/${row.name}`
  const v    = row.version > 1 ? `?v=${row.version}` : ''

  return {
    category: row.category,
    name:     row.name,
    label:    row.label,
    ext:      row.ext,
    width:    row.width,
    height:   row.height,
    bytes:    row.bytes,
    version:  row.version,
    tags:     row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    url:      `${base}.${row.ext}${v}`,
    card:     `${base}.webp${v}`,
    thumb:    `${base}_thumb.webp${v}`,
  }
}

/**
 * Suchbegriff fuer MATCH ... AGAINST IN BOOLEAN MODE entschaerfen.
 *
 * Im Boolean-Modus sind `+ - > < ( ) ~ * " @` Operatoren. Ein Nutzer, der
 * "pistol -50" eintippt, meint keinen Ausschluss, und ein einzelnes `"` wuerde
 * die Abfrage mit einem Syntaxfehler abbrechen. Deshalb bleiben nur Buchstaben,
 * Ziffern, Unterstrich und Bindestrich stehen; jedes Wort bekommt ein `*`
 * angehaengt, damit "zent" auch "zentorno" findet.
 *
 * Der Bindestrich ist dabei der Sonderfall, und er war bis zum 26.08.2026 ein
 * Defekt: er muss **innerhalb** eines Wortes stehen bleiben (`low-rider` ist
 * ein echter Tag), **am Anfang** ist er aber genau der Ausschlussoperator, den
 * der Absatz darueber ausschliessen wollte. "pistol -50" lieferte deshalb
 * Treffer ohne "50" statt Treffer mit beidem. Fuehrende Bindestriche fallen
 * jetzt weg; alle anderen Operatorzeichen erledigt bereits die Zeichenklasse.
 *
 * MariaDB indiziert per Default erst ab drei Zeichen (ft_min_word_len). Ein
 * kuerzerer Begriff faellt deshalb auf LIKE zurueck, siehe listImages().
 */
function booleanTerms(q: string): string {
  return q
    .split(/\s+/)
    .map(w => w.replace(/[^\p{L}\p{N}_-]/gu, '').replace(/^-+/, ''))
    .filter(Boolean)
    .map(w => `${w}*`)
    .join(' ')
}

/**
 * Die WHERE-Bedingung fuer einen Suchbegriff, oder `null` bei leerer Eingabe.
 *
 * Steht hier und nicht in der aufrufenden Funktion, weil der Admin-Bereich
 * dieselbe Suche braucht: er ist die Stelle, an der Label und Tags gepflegt
 * werden, und wer dort etwas anderes findet als der Besucher, pflegt am
 * Problem vorbei. Beide Aufrufer muessen die Tabelle als `i` aliasen.
 */
export function searchClause(q: string): { sql: string; params: string[] } | null {
  const term = q.trim()
  if (!term) return null

  const terms = booleanTerms(term)
  // Unterhalb der Volltext-Mindestlaenge liefert MATCH nichts, obwohl es
  // Treffer gaebe. Kurze Begriffe wie "gt" oder "50" sind bei Spawnnamen
  // aber genau der Normalfall, deshalb dort LIKE mit Praefix.
  if (terms && term.length >= 3) {
    return { sql: 'MATCH(i.name, i.label, i.tags) AGAINST (? IN BOOLEAN MODE)', params: [terms] }
  }
  return { sql: '(i.name LIKE ? OR i.label LIKE ?)', params: [`%${term}%`, `%${term}%`] }
}

/** Kategorien mit Anzahl der veroeffentlichten Bilder. */
export async function listCategories(lang: Lang, includePrivate = false): Promise<ImageCategory[]> {
  const rows = await query<{
    slug: string; name_en: string; name_de: string
    description_en: string | null; description_de: string | null
    icon: string | null; count: number
  }>(
    `SELECT c.slug, c.name_en, c.name_de, c.description_en, c.description_de, c.icon,
            (SELECT COUNT(*) FROM msk_images i
              WHERE i.category = c.slug AND i.status = 'published') AS count
       FROM msk_image_categories c
      ${includePrivate ? '' : 'WHERE c.is_public = 1'}
      ORDER BY c.sort_order`,
  )

  return rows.map(r => ({
    slug:        r.slug,
    name:        lang === 'de' ? r.name_de : r.name_en,
    description: lang === 'de' ? r.description_de : r.description_en,
    icon:        r.icon,
    count:       Number(r.count),
  }))
}

export async function categoryExists(slug: string, includePrivate = false): Promise<boolean> {
  const row = await queryOne<{ slug: string }>(
    `SELECT slug FROM msk_image_categories
      WHERE slug = ? ${includePrivate ? '' : 'AND is_public = 1'}`,
    [slug],
  )
  return Boolean(row)
}

export interface ListOptions {
  category?: string
  q?:        string
  tag?:      string
  page?:     number
  per?:      number
}

export async function listImages(opts: ListOptions): Promise<ImageListResult> {
  const page = Math.max(1, Math.floor(Number(opts.page) || 1))
  // Hart gedeckelt: ein `?per=100000` bekommt 100, nicht den halben Bestand.
  const per  = Math.min(MAX_PER_PAGE, Math.max(1, Math.floor(Number(opts.per) || DEFAULT_PER_PAGE)))

  const where:  string[]   = [`i.status = 'published'`]
  const params: unknown[]  = []

  if (opts.category) {
    where.push('i.category = ?')
    params.push(opts.category)
  }

  if (opts.tag) {
    // FIND_IN_SET passt zur kommaseparierten Spalte und trifft ganze Tags,
    // nicht Teilzeichenketten: ein LIKE '%sport%' wuerde auch "transport" finden.
    where.push('FIND_IN_SET(?, i.tags)')
    params.push(opts.tag.toLowerCase())
  }

  const search = searchClause(opts.q || '')
  if (search) {
    where.push(search.sql)
    params.push(...search.params)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`

  const totalRow = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM msk_images i ${whereSql}`, params,
  )
  const total = Number(totalRow?.total ?? 0)

  // LIMIT und OFFSET stehen inline, weil mysql2 dafuer keine Platzhalter
  // erlaubt. Beide sind oben durch Math.floor und die Deckel oben auf
  // Ganzzahlen in bekannten Grenzen gezwungen, es geht also kein Nutzerwert
  // ungeprueft in das SQL.
  const offset = (page - 1) * per

  const rows = await query<ImageRow>(
    `SELECT i.category, i.name, i.label, i.ext, i.width, i.height, i.bytes, i.version, i.tags
       FROM msk_images i
       ${whereSql}
      ORDER BY i.name
      LIMIT ${per} OFFSET ${offset}`,
    params,
  )

  return { total, page, per, items: rows.map(toRecord) }
}

export async function getImage(category: string, name: string): Promise<ImageRecord | null> {
  const row = await queryOne<ImageRow>(
    `SELECT category, name, label, ext, width, height, bytes, version, tags
       FROM msk_images
      WHERE category = ? AND name = ? AND status = 'published'`,
    [category, name],
  )
  return row ? toRecord(row) : null
}

/** Nachbarn fuer die Blaetternavigation auf der Detailseite. */
export async function getNeighbours(category: string, name: string): Promise<{
  prev: string | null
  next: string | null
}> {
  const prev = await queryOne<{ name: string }>(
    `SELECT name FROM msk_images
      WHERE category = ? AND status = 'published' AND name < ?
      ORDER BY name DESC LIMIT 1`,
    [category, name],
  )
  const next = await queryOne<{ name: string }>(
    `SELECT name FROM msk_images
      WHERE category = ? AND status = 'published' AND name > ?
      ORDER BY name ASC LIMIT 1`,
    [category, name],
  )
  return { prev: prev?.name ?? null, next: next?.name ?? null }
}

/** Gesamtzahl veroeffentlichter Bilder, fuer die Uebersicht und die Sitemap. */
export async function countPublished(): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM msk_images WHERE status = 'published'`,
  )
  return Number(row?.total ?? 0)
}
