import { query, queryOne } from '@/lib/db'
import { cdnBase, searchClause, MAX_PER_PAGE, DEFAULT_PER_PAGE } from '@/lib/images'
import { copyVariants, deleteVariants } from '@/lib/imagePipeline'

/**
 * Image gallery: the data access of the admin area.
 *
 * Deliberately next to `lib/images.ts` and not inside it. Every query there has
 * `status = 'published'` hard-wired, and that is exactly the guarantee the
 * public gallery rests on: a hidden image cannot accidentally slip out from
 * there. An `includeHidden` flag would have turned that guarantee into a
 * caller's decision, and that is the kind of thing you forget exactly once.
 *
 * The price for this is a second query with similar SQL. The search part is
 * therefore shared (`searchClause`), so admins and visitors do not see
 * different results.
 *
 * What does NOT happen here: producing new image data. The ingest stays
 * `scripts/image-ingest.js` on the server, and an endpoint that writes foreign
 * bytes into a publicly served directory is the riskiest single component of
 * this whole project.
 *
 * What does happen here, since moving and deleting exist: copying and removing
 * files that are already there. The difference is where the bytes come from.
 * What gets moved is what the ingest or an approval produced; `category` and
 * `name` come from our own database, never from the request. Until 05.09.2026
 * this said flatly "no files are written here", which was already wrong once
 * community uploads landed.
 */

/**
 * The three states of the `status` column, in the order an image passes
 * through them.
 *
 * `pending` is the entry state of a community upload. As long as the upload
 * module does not exist, the queue is empty, but the state has existed in the
 * schema since day one and is handled completely here: the gallery does not
 * show it (`status = 'published'` applies there), the stats count it, and the
 * admin area resolves it. A state that nobody resolves is a trap; that was the
 * reason to leave it out at first, and with a UI for it that reason goes away.
 */
export const IMAGE_STATUSES = ['pending', 'published', 'hidden'] as const
export type ImageStatus = (typeof IMAGE_STATUSES)[number]

export function isImageStatus(value: unknown): value is ImageStatus {
  return typeof value === 'string' && (IMAGE_STATUSES as readonly string[]).includes(value)
}

/**
 * Which permission a status change requires.
 *
 * Taking a row out of `pending` is a moderation decision about someone else's
 * material, not maintenance of our own collection. That is why the answer
 * depends on the **current** state and not on the requested one: whoever only
 * has `images.manage` may hide and republish our own collection, but may not
 * approve an upload.
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
  /** Discord user id of the submitter. Only set for community uploads. */
  submittedBy: string | null
  updatedAt:   string
  /** 160 px WebP, enough for the table. */
  thumb:       string
  /** Original, for a look at the real image. */
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
  // Cache buster only from version 2 on, same rule as in lib/images.ts.
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
 * Bring tag input into the shape `FIND_IN_SET` expects.
 *
 * Lowercase, no spaces around the commas, no duplicates. Commas are the
 * column's separator and therefore cannot be part of a tag; everything else
 * stays, so `msk_core` or `low-rider` come through intact. Returns `null` if
 * nothing is left, because the column is nullable and an empty string would be
 * a third state for "no tags".
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

/** Clearing the label means NULL, not an empty string. Same reasoning as above. */
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

  // LIMIT and OFFSET inline, because mysql2 does not allow placeholders there.
  // Both are forced above, by Math.floor and the caps, into integers within
  // known bounds, so no user value goes into the SQL unchecked.
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
 * Stats per category, including the non-public ones.
 *
 * One query across all categories instead of one per category, and a
 * `LEFT JOIN` so that an empty category stays in the list too: `props` has
 * been at 0 for months and should stay visible, otherwise the backlog looks
 * like it is done.
 *
 * That very LEFT JOIN is the trap in the two gap counters, though. Without a
 * join partner the row yields `i.label = NULL`, and `NULL IS NULL` is true:
 * `props` therefore reported 1 image without a label, although there is no
 * image there at all. The total therefore read 13 instead of 12. The guard
 * `i.id IS NOT NULL` distinguishes "row without a label" from "no row".
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
            SUM(i.id IS NOT NULL AND (i.label IS NULL OR i.label = '')) AS no_label,
            SUM(i.id IS NOT NULL AND (i.tags  IS NULL OR i.tags  = '')) AS no_tags
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
 * Change the label, tags and visibility of a row.
 *
 * Deliberately only these three columns. Everything else (`width`, `bytes`,
 * `sha256`, `version`) describes the file on disk, and nobody can touch that
 * from here; an editable `bytes` would be a lie about the collection, and
 * exactly such mismatches are what `image-sync-check.js` reports as a
 * finding.
 *
 * Returns `null` if the row does not exist.
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
// ── Moving between categories, and deleting ─────────────────────────────────

/**
 * Does the category exist at all?
 *
 * Deliberately without `allows_upload`. That flag answers "may a submitter
 * pick this" and excludes `brand`. Where a moderator files an image is a
 * different question, and its answer is meant to include `brand`.
 */
export async function categoryExists(slug: string): Promise<boolean> {
  const row = await queryOne<{ slug: string }>(
    `SELECT slug FROM msk_image_categories WHERE slug = ?`, [slug],
  )
  return Boolean(row)
}

export type MoveFailure = 'not_found' | 'category_unknown' | 'name_taken' | 'no_files' | 'move_failed'

export type MoveResult =
  | { ok: true; image: AdminImage }
  | { ok: false; reason: MoveFailure }

/**
 * File an image under a different category.
 *
 * **This changes the public address.** `cdn.msk-scripts.de/<old>/<name>.png`
 * 404s afterwards, and because the CDN vhost sends `immutable`, caches keep the
 * old address until it expires. Anyone who wrote that URL into a script or a
 * doc page will notice the move. That is why the UI says so before saving and
 * not after.
 *
 * Order: copy, rewrite the row, remove the old files. Every intermediate state
 * is one in which the gallery works. A `rename` would be shorter and would, in
 * between the two steps, leave a row whose image 404s.
 */
export async function moveAdminImage(
  category: string, name: string, target: string,
): Promise<MoveResult> {
  const existing = await getAdminImage(category, name)
  if (!existing) return { ok: false, reason: 'not_found' }
  if (target === category) return { ok: true, image: existing }

  if (!(await categoryExists(target))) return { ok: false, reason: 'category_unknown' }

  // `UNIQUE (category, name)` would catch this anyway, but as a write error and
  // only after the files have already been copied. Asking first costs one query
  // and avoids exactly that half-finished state.
  const taken = await queryOne<{ id: number }>(
    `SELECT id FROM msk_images WHERE category = ? AND name = ?`, [target, name],
  )
  if (taken) return { ok: false, reason: 'name_taken' }

  let copied = 0
  try {
    copied = await copyVariants(category, target, name, existing.ext)
  } catch (e) {
    console.error('[admin-images] copying the variants failed:', e)
    return { ok: false, reason: 'move_failed' }
  }
  // Not a single file found means the row describes nothing. Moving it anyway
  // would carry the finding into another category instead of surfacing it.
  if (!copied) return { ok: false, reason: 'no_files' }

  await query(
    `UPDATE msk_images SET category = ? WHERE category = ? AND name = ?`,
    [target, category, name],
  )

  // Only now the old files. If that fails, copies without a row are left in the
  // old directory: the sync check reports them and the gallery stays intact.
  await deleteVariants(category, name, existing.ext).catch(e =>
    console.error('[admin-images] removing the old variants failed:', e))

  const image = await getAdminImage(target, name)
  return image ? { ok: true, image } : { ok: false, reason: 'move_failed' }
}

export type DeleteResult =
  | { ok: true; filesRemoved: boolean }
  | { ok: false; reason: 'not_found' }

/**
 * Remove an image for good: the row goes, the three files go.
 *
 * Not reversible, and the file cannot be recovered from a database backup
 * either, because `msk_images` only ever described it.
 *
 * **Row first, files second.** The other way round a failure would leave a row
 * without a file, and in the public gallery that is a tile whose image 404s,
 * visible to every visitor. This way the worst case is files without a row:
 * nobody knows them except whoever still has the old address, and the sync
 * check reports them. Same trade-off as in the upload approval.
 *
 * `filesRemoved` says whether the second step worked. A silent `ok` would be
 * the worst possible answer here: whoever removes an image for a legal reason
 * has to know that the file is still being served.
 */
export async function deleteAdminImage(category: string, name: string): Promise<DeleteResult> {
  const existing = await getAdminImage(category, name)
  if (!existing) return { ok: false, reason: 'not_found' }

  await query(`DELETE FROM msk_images WHERE category = ? AND name = ?`, [category, name])

  let filesRemoved = true
  try {
    await deleteVariants(category, name, existing.ext)
  } catch (e) {
    console.error('[admin-images] removing the variants failed:', e)
    filesRemoved = false
  }

  return { ok: true, filesRemoved }
}
