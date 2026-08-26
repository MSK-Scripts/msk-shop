import { query, queryOne } from '@/lib/db'
import { cdnBase, searchClause, MAX_PER_PAGE, DEFAULT_PER_PAGE } from '@/lib/images'

/**
 * Bildergalerie: der Datenzugriff des Admin-Bereichs.
 *
 * Bewusst neben `lib/images.ts` und nicht darin. Jede Abfrage dort traegt
 * `status = 'published'` fest verdrahtet, und genau das ist die Zusicherung,
 * auf der die oeffentliche Galerie beruht: ein verstecktes Bild kann von dort
 * nicht versehentlich herausfallen. Ein Flag `includeHidden` haette diese
 * Zusicherung zu einer Aufrufer-Entscheidung gemacht, und die vergisst man
 * genau einmal.
 *
 * Der Preis dafuer ist eine zweite Abfrage mit aehnlichem SQL. Der Suchteil
 * ist deshalb geteilt (`searchClause`), damit Admin und Besucher nicht
 * unterschiedliche Treffer sehen.
 *
 * Was hier NICHT passiert: Dateien schreiben. Der Ingest bleibt
 * `scripts/image-ingest.js` auf dem Server. Ein Upload-Endpunkt, der in ein
 * oeffentlich ausgeliefertes Verzeichnis schreibt, ist die riskanteste
 * Einzelkomponente des ganzen Projekts und wird fuer nichts gebraucht, was
 * dieser Bereich leisten soll.
 */

/**
 * Die drei Zustaende der Spalte `status`, in der Reihenfolge, in der ein Bild
 * sie durchlaeuft.
 *
 * `pending` ist der Eingangszustand eines Community-Uploads. Solange es das
 * Upload-Modul nicht gibt, ist die Schlange leer, aber der Zustand existiert
 * im Schema seit dem ersten Tag und wird hier vollstaendig behandelt: die
 * Galerie zeigt ihn nicht (dort gilt `status = 'published'`), die Kennzahlen
 * zaehlen ihn, und der Admin-Bereich loest ihn auf. Ein Zustand, den niemand
 * aufloest, ist eine Falle; das war der Grund, ihn zuerst wegzulassen, und
 * mit der Oberflaeche dafuer faellt der Grund weg.
 */
export const IMAGE_STATUSES = ['pending', 'published', 'hidden'] as const
export type ImageStatus = (typeof IMAGE_STATUSES)[number]

export function isImageStatus(value: unknown): value is ImageStatus {
  return typeof value === 'string' && (IMAGE_STATUSES as readonly string[]).includes(value)
}

/**
 * Welches Recht eine Statusaenderung verlangt.
 *
 * Eine Zeile aus `pending` herauszuholen ist eine Moderationsentscheidung ueber
 * fremdes Material, kein Pflegevorgang am eigenen Bestand. Deshalb haengt die
 * Antwort am **bisherigen** Zustand und nicht am gewuenschten: wer nur
 * `images.manage` hat, darf den eigenen Bestand verstecken und wieder
 * veroeffentlichen, aber keinen Upload freigeben.
 */
export function permissionForStatusChange(current: string): 'images.moderate' | 'images.manage' {
  return current === 'pending' ? 'images.moderate' : 'images.manage'
}

export const ADMIN_IMAGE_FILTERS = ['all', 'pending', 'no_label', 'no_tags', 'hidden'] as const
export type AdminImageFilter = (typeof ADMIN_IMAGE_FILTERS)[number]

export function isAdminImageFilter(value: unknown): value is AdminImageFilter {
  return typeof value === 'string' && (ADMIN_IMAGE_FILTERS as readonly string[]).includes(value)
}

export interface AdminImage {
  category:    string
  name:        string
  label:       string | null
  tags:        string[]
  ext:         string
  width:       number
  height:      number
  bytes:       number
  version:     number
  status:      string
  source:      string | null
  licenseNote: string | null
  /** Discord-User-Id des Einreichenden. Nur bei Community-Uploads gesetzt. */
  submittedBy: string | null
  updatedAt:   string
  /** 160 px WebP, reicht fuer die Tabelle. */
  thumb:       string
  /** Original, fuer den Blick aufs echte Bild. */
  url:         string
}

interface AdminImageRow {
  category:     string
  name:         string
  label:        string | null
  tags:         string | null
  ext:          string
  width:        number
  height:       number
  bytes:        number
  version:      number
  status:       string
  source:       string | null
  license_note: string | null
  submitted_by: string | null
  updated_at:   string
}

export function splitTags(raw: string | null): string[] {
  return raw ? raw.split(',').map(t => t.trim()).filter(Boolean) : []
}

function toAdminImage(row: AdminImageRow): AdminImage {
  const base = `${cdnBase()}/${row.category}/${row.name}`
  // Cachebuster erst ab Version 2, gleiche Regel wie in lib/images.ts.
  const v = row.version > 1 ? `?v=${row.version}` : ''

  return {
    category:    row.category,
    name:        row.name,
    label:       row.label,
    tags:        splitTags(row.tags),
    ext:         row.ext,
    width:       row.width,
    height:      row.height,
    bytes:       row.bytes,
    version:     row.version,
    status:      row.status,
    source:      row.source,
    licenseNote: row.license_note,
    submittedBy: row.submitted_by,
    updatedAt:   row.updated_at,
    thumb:       `${base}_thumb.webp${v}`,
    url:         `${base}.${row.ext}${v}`,
  }
}

/**
 * Tag-Eingabe auf die Form bringen, die `FIND_IN_SET` erwartet.
 *
 * Kleinbuchstaben, keine Leerzeichen um die Kommas, keine Dubletten. Kommas
 * sind das Trennzeichen der Spalte und koennen deshalb nicht Teil eines Tags
 * sein; alles andere bleibt stehen, damit `msk_core` oder `low-rider` heil
 * durchkommen. Gibt `null` zurueck, wenn nichts uebrig bleibt, denn die Spalte
 * ist nullable und ein leerer String waere ein dritter Zustand fuer
 * "keine Tags".
 */
export function normalizeTags(raw: string): string | null {
  const seen = new Set<string>()
  for (const part of raw.split(',')) {
    const tag = part.trim().toLowerCase()
    if (tag) seen.add(tag)
  }
  const joined = [...seen].join(',')
  return joined ? joined.slice(0, 255) : null
}

/** Label leeren heisst NULL, nicht Leerstring. Gleiche Begruendung wie oben. */
export function normalizeLabel(raw: string): string | null {
  const label = raw.trim()
  return label ? label.slice(0, 160) : null
}

export interface AdminListOptions {
  category?: string
  q?:        string
  filter?:   AdminImageFilter
  page?:     number
  per?:      number
}

export interface AdminImageList {
  total: number
  page:  number
  per:   number
  items: AdminImage[]
}

export async function listAdminImages(opts: AdminListOptions): Promise<AdminImageList> {
  const page = Math.max(1, Math.floor(Number(opts.page) || 1))
  const per  = Math.min(MAX_PER_PAGE, Math.max(1, Math.floor(Number(opts.per) || DEFAULT_PER_PAGE)))

  const where:  string[]  = []
  const params: unknown[] = []

  if (opts.category) {
    where.push('i.category = ?')
    params.push(opts.category)
  }

  switch (opts.filter) {
    case 'pending':  where.push("i.status = 'pending'");              break
    case 'no_label': where.push("(i.label IS NULL OR i.label = '')"); break
    case 'no_tags':  where.push("(i.tags IS NULL OR i.tags = '')");   break
    case 'hidden':   where.push("i.status = 'hidden'");               break
    default: break
  }

  const search = searchClause(opts.q || '')
  if (search) {
    where.push(search.sql)
    params.push(...search.params)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const totalRow = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM msk_images i ${whereSql}`, params,
  )
  const total = Number(totalRow?.total ?? 0)

  // LIMIT und OFFSET inline, weil mysql2 dafuer keine Platzhalter erlaubt.
  // Beide sind oben durch Math.floor und die Deckel auf Ganzzahlen in
  // bekannten Grenzen gezwungen, es geht also kein Nutzerwert ungeprueft
  // in das SQL.
  const offset = (page - 1) * per

  const rows = await query<AdminImageRow>(
    `SELECT i.category, i.name, i.label, i.tags, i.ext, i.width, i.height,
            i.bytes, i.version, i.status, i.source, i.license_note,
            i.submitted_by, i.updated_at
       FROM msk_images i
       ${whereSql}
      ORDER BY i.category, i.name
      LIMIT ${per} OFFSET ${offset}`,
    params,
  )

  return { total, page, per, items: rows.map(toAdminImage) }
}

export interface AdminImageCategoryStat {
  slug:      string
  name:      string
  isPublic:  boolean
  total:     number
  published: number
  pending:   number
  hidden:    number
  noLabel:   number
  noTags:    number
}

/**
 * Kennzahlen je Kategorie, inklusive der nicht oeffentlichen.
 *
 * Eine Abfrage ueber alle Kategorien statt einer je Kategorie, und ein
 * `LEFT JOIN`, damit auch eine leere Kategorie in der Liste bleibt: `props`
 * steht seit Monaten auf 0 und soll sichtbar bleiben, sonst wirkt der
 * Rueckstand wie erledigt.
 */
export async function adminImageStats(): Promise<AdminImageCategoryStat[]> {
  const rows = await query<{
    slug: string; name_en: string; is_public: number
    total: number; published: number | null; pending: number | null; hidden: number | null
    no_label: number | null; no_tags: number | null
  }>(
    `SELECT c.slug, c.name_en, c.is_public,
            COUNT(i.id)                                  AS total,
            SUM(i.status = 'published')                  AS published,
            SUM(i.status = 'pending')                    AS pending,
            SUM(i.status = 'hidden')                     AS hidden,
            SUM(i.label IS NULL OR i.label = '')         AS no_label,
            SUM(i.tags IS NULL OR i.tags = '')           AS no_tags
       FROM msk_image_categories c
       LEFT JOIN msk_images i ON i.category = c.slug
      GROUP BY c.slug, c.name_en, c.is_public, c.sort_order
      ORDER BY c.sort_order`,
  )

  return rows.map(r => ({
    slug:      r.slug,
    name:      r.name_en,
    isPublic:  Number(r.is_public) === 1,
    total:     Number(r.total),
    published: Number(r.published ?? 0),
    pending:   Number(r.pending ?? 0),
    hidden:    Number(r.hidden ?? 0),
    noLabel:   Number(r.no_label ?? 0),
    noTags:    Number(r.no_tags ?? 0),
  }))
}

export interface AdminImagePatch {
  label?:  string | null
  tags?:   string | null
  status?: ImageStatus
}

export async function getAdminImage(category: string, name: string): Promise<AdminImage | null> {
  const row = await queryOne<AdminImageRow>(
    `SELECT i.category, i.name, i.label, i.tags, i.ext, i.width, i.height,
            i.bytes, i.version, i.status, i.source, i.license_note,
            i.submitted_by, i.updated_at
       FROM msk_images i
      WHERE i.category = ? AND i.name = ?`,
    [category, name],
  )
  return row ? toAdminImage(row) : null
}

/**
 * Label, Tags und Sichtbarkeit einer Zeile aendern.
 *
 * Bewusst nur diese drei Spalten. Alles andere (`width`, `bytes`, `sha256`,
 * `version`) beschreibt die Datei auf der Platte, und die kann von hier aus
 * niemand anfassen; ein editierbares `bytes` waere eine Luege ueber den
 * Bestand, und genau solche Abweichungen meldet `image-sync-check.js` als
 * Befund.
 *
 * Gibt `null` zurueck, wenn es die Zeile nicht gibt.
 */
export async function updateAdminImage(
  category: string,
  name: string,
  patch: AdminImagePatch,
): Promise<AdminImage | null> {
  const sets:   string[]  = []
  const params: unknown[] = []

  if (patch.label !== undefined)  { sets.push('label = ?');  params.push(patch.label) }
  if (patch.tags !== undefined)   { sets.push('tags = ?');   params.push(patch.tags) }
  if (patch.status !== undefined) { sets.push('status = ?'); params.push(patch.status) }

  if (sets.length) {
    params.push(category, name)
    await query(
      `UPDATE msk_images SET ${sets.join(', ')} WHERE category = ? AND name = ?`,
      params,
    )
  }

  return getAdminImage(category, name)
}
