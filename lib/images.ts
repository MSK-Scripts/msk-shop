import { query, queryOne } from '@/lib/db'
import type { Lang } from '@/lib/i18n'

/**
 * Image gallery: data access and URL building.
 *
 * Server-only. The files themselves do not live in this project but in the
 * file system behind `cdn.msk-scripts.de`; only the metadata from
 * `msk_images` and `msk_image_categories` is handled here.
 *
 * **Only this file builds the three URLs.** No client ever assembles a CDN
 * address itself. That is why a later move of the collection (a pull CDN in
 * front, or object storage behind) is a change to one env variable and not a
 * refactoring through half the frontend.
 */

/** Base URL of the CDN, without a trailing slash. */
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
  /** Original, PNG with alpha channel. */
  url:      string
  /** 400 px WebP, what the gallery and NUIs display. */
  card:     string
  /** 160 px WebP for dense grids. */
  thumb:    string
}

export interface ImageListResult {
  total: number
  page:  number
  per:   number
  items: ImageRecord[]
}

/** Maximum for `per`, enforced server-side. */
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
 * Build the public record from a database row.
 *
 * The cache buster is only appended from version 2 on: the vhost serves with
 * `max-age=31536000, immutable`, so a replaced file needs a new address. On the
 * initial import, `?v=1` on every URL would just be dead weight, and it would
 * travel along in every copied link.
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
 * Defuse a search term for MATCH ... AGAINST IN BOOLEAN MODE.
 *
 * In boolean mode, `+ - > < ( ) ~ * " @` are operators. A user who types
 * "pistol -50" does not mean an exclusion, and a single `"` would abort the
 * query with a syntax error. That is why only letters, digits, underscore and
 * hyphen are kept; every word gets a `*` appended, so that "zent" also finds
 * "zentorno".
 *
 * The hyphen is the special case here, and until 26.08.2026 it was a defect:
 * it has to stay **inside** a word (`low-rider` is a real tag), but **at the
 * start** it is exactly the exclusion operator the paragraph above meant to
 * rule out. "pistol -50" therefore returned results without "50" instead of
 * results with both. Leading hyphens are now dropped; the character class
 * already takes care of all other operator characters.
 *
 * By default MariaDB only indexes from three characters on (ft_min_word_len).
 * A shorter term therefore falls back to LIKE, see listImages().
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
 * The WHERE condition for a search term, or `null` for empty input.
 *
 * Lives here and not in the calling function, because the admin area needs
 * the same search: it is the place where labels and tags are maintained, and
 * whoever finds something different there than the visitor does is
 * maintaining past the problem. Both callers must alias the table as `i`.
 */
export function searchClause(q: string): { sql: string; params: string[] } | null {
  const term = q.trim()
  if (!term) return null

  const terms = booleanTerms(term)
  // Below the full-text minimum length, MATCH returns nothing even though
  // there would be matches. Short terms like "gt" or "50" are exactly the
  // normal case for spawn names, though, hence LIKE with a prefix there.
  if (terms && term.length >= 3) {
    return { sql: 'MATCH(i.name, i.label, i.tags) AGAINST (? IN BOOLEAN MODE)', params: [terms] }
  }
  return { sql: '(i.name LIKE ? OR i.label LIKE ?)', params: [`%${term}%`, `%${term}%`] }
}

/** Categories with the number of published images. */
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
  // Hard cap: a `?per=100000` gets 100, not half the collection.
  const per  = Math.min(MAX_PER_PAGE, Math.max(1, Math.floor(Number(opts.per) || DEFAULT_PER_PAGE)))

  const where:  string[]   = [`i.status = 'published'`]
  const params: unknown[]  = []

  if (opts.category) {
    where.push('i.category = ?')
    params.push(opts.category)
  }

  if (opts.tag) {
    // FIND_IN_SET fits the comma-separated column and matches whole tags,
    // not substrings: a LIKE '%sport%' would also find "transport".
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

  // LIMIT and OFFSET are inline, because mysql2 does not allow placeholders
  // there. Both are forced above, by Math.floor and the caps above, into
  // integers within known bounds, so no user value goes into the SQL
  // unchecked.
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

/** Neighbours for the prev/next navigation on the detail page. */
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

/** Total number of published images, for the overview and the sitemap. */
export async function countPublished(): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM msk_images WHERE status = 'published'`,
  )
  return Number(row?.total ?? 0)
}
