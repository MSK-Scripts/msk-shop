import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp, { type Metadata } from 'sharp'

import { query, queryOne } from '@/lib/db'
import { categoryExists, normalizeLabel, normalizeTags } from '@/lib/adminImages'
import {
  ACCEPTED_INPUT_FORMATS,
  PIPELINE_RULES,
  buildVariants,
  normaliseName,
  trimAndPad,
  writeVariants,
} from '@/lib/imagePipeline'

/**
 * Community uploads: quarantine, queue, approval.
 *
 * The riskiest part of the whole image project, so here is the boundary in
 * one sentence: **an uploaded file never reaches the public directory.**
 * It is re-encoded by sharp on upload, the result lives under a UUID in a
 * directory outside every DocumentRoot, and only an approval by a human turns
 * it into the three variants on the CDN. Neither the file name nor the
 * submitter's content ever becomes part of a path.
 */

/** Largest accepted upload. The proxy already rejects anything above it at the header. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

/** Smallest and largest edge length that makes any sense at all. */
export const MIN_UPLOAD_EDGE = 64
export const MAX_UPLOAD_EDGE = 4096

/** Submissions per person per day. Slows down flooding without getting in the way of real contributions. */
export const UPLOADS_PER_DAY = 10

export function inboxPath(): string {
  return process.env.UPLOAD_INBOX_PATH || '/var/lib/msk-image-uploads'
}

// turbopackIgnore on every path construction: the root comes from the environment
// and points out of the repo. Without the hint Turbopack traces the whole
// project into the build output.
function quarantineFile(id: string): string {
  return join(/*turbopackIgnore: true*/ inboxPath(), `${id}.png`)
}

export type UploadStatus = 'pending' | 'approved' | 'rejected'

export interface ImageUpload {
  id:               string
  category:         string
  name:             string
  label:            string | null
  tags:             string[]
  originalFilename: string | null
  width:            number
  height:           number
  bytes:            number
  sha256:           string
  submittedBy:      string
  submittedName:    string | null
  note:             string | null
  status:           UploadStatus
  rejectReason:     string | null
  reviewedBy:       string | null
  reviewedAt:       string | null
  createdAt:        string
  /** Only present for `pending`: the quarantine file is deleted afterwards. */
  hasFile:          boolean
}

interface UploadRow {
  id: string; category: string; name: string; label: string | null; tags: string | null
  original_filename: string | null; width: number; height: number; bytes: number
  sha256: string; submitted_by: string; submitted_name: string | null; note: string | null
  status: UploadStatus; reject_reason: string | null
  reviewed_by: string | null; reviewed_at: string | null; created_at: string
}

function toUpload(row: UploadRow): ImageUpload {
  return {
    id:               row.id,
    category:         row.category,
    name:             row.name,
    label:            row.label,
    tags:             row.tags ? row.tags.split(',').filter(Boolean) : [],
    originalFilename: row.original_filename,
    width:            row.width,
    height:           row.height,
    bytes:            row.bytes,
    sha256:           row.sha256,
    submittedBy:      row.submitted_by,
    submittedName:    row.submitted_name,
    note:             row.note,
    status:           row.status,
    rejectReason:     row.reject_reason,
    reviewedBy:       row.reviewed_by,
    reviewedAt:       row.reviewed_at,
    createdAt:        row.created_at,
    hasFile:          row.status === 'pending',
  }
}

const COLUMNS = `id, category, name, label, tags, original_filename, width, height,
                 bytes, sha256, submitted_by, submitted_name, note, status,
                 reject_reason, reviewed_by, reviewed_at, created_at`

// ── Categories that accept submissions ───────────────────────────────────────

export interface UploadCategory {
  slug: string
  name: string
}

/**
 * Which categories are open is decided by the `allows_upload` column, not by
 * a list in the code. Adding another private category should not mean that
 * someone has to remember to exclude it here.
 */
export async function uploadCategories(lang: 'de' | 'en'): Promise<UploadCategory[]> {
  const rows = await query<{ slug: string; name_en: string; name_de: string }>(
    `SELECT slug, name_en, name_de FROM msk_image_categories
      WHERE allows_upload = 1 ORDER BY sort_order`,
  )
  return rows.map(r => ({ slug: r.slug, name: lang === 'de' ? r.name_de : r.name_en }))
}

export async function categoryAllowsUpload(slug: string): Promise<boolean> {
  const row = await queryOne<{ slug: string }>(
    `SELECT slug FROM msk_image_categories WHERE slug = ? AND allows_upload = 1`, [slug],
  )
  return Boolean(row)
}

// ── Submitting ───────────────────────────────────────────────────────────────

export type SubmitFailure =
  | 'category_unknown'
  | 'name_invalid'
  | 'name_taken'
  | 'name_queued'
  | 'file_missing'
  | 'file_too_large'
  | 'file_unreadable'
  | 'format_unsupported'
  | 'too_small'
  | 'too_large'
  | 'license_required'
  | 'rate_limited'

export interface SubmitInput {
  category:      string
  rawName:       string
  label:         string
  tags:          string
  note:          string
  licenseOk:     boolean
  fileName:      string | null
  file:          Buffer
  submittedBy:   string
  submittedName: string | null
}

export type SubmitResult =
  | { ok: true; upload: ImageUpload }
  | { ok: false; reason: SubmitFailure }

/**
 * Check a submission, re-encode it and put it into quarantine.
 *
 * The order of the checks is intentional: first the cheap ones (rights,
 * category, name, size), then the daily limit, and only at the very end does
 * the function let sharp loose on foreign bytes. Anyone throwing broken files
 * around therefore costs no image processing.
 */
export async function submitUpload(input: SubmitInput): Promise<SubmitResult> {
  if (!input.licenseOk) return { ok: false, reason: 'license_required' }

  if (!(await categoryAllowsUpload(input.category))) {
    return { ok: false, reason: 'category_unknown' }
  }

  const name = normaliseName(input.rawName)
  if (!name || !/^[a-z0-9_-]{1,128}$/.test(name)) return { ok: false, reason: 'name_invalid' }

  // The existing collection wins: a submission never replaces an existing image.
  // An upload that could overwrite a curated vehicle render would be a way to
  // deface the gallery, and the benefit would be zero --
  // what is missing are gaps, not replacements.
  const taken = await queryOne<{ id: number }>(
    `SELECT id FROM msk_images WHERE category = ? AND name = ?`, [input.category, name],
  )
  if (taken) return { ok: false, reason: 'name_taken' }

  const queued = await queryOne<{ id: string }>(
    `SELECT id FROM msk_image_uploads
      WHERE category = ? AND name = ? AND status = 'pending'`, [input.category, name],
  )
  if (queued) return { ok: false, reason: 'name_queued' }

  if (!input.file.length) return { ok: false, reason: 'file_missing' }
  if (input.file.length > MAX_UPLOAD_BYTES) return { ok: false, reason: 'file_too_large' }

  if (await recentUploadCount(input.submittedBy) >= UPLOADS_PER_DAY) {
    return { ok: false, reason: 'rate_limited' }
  }

  // Format and dimensions from the CONTENT, not from extension or Content-Type.
  // sharp rejects anything that is not an image; an archive declared as PNG does
  // not get through here.
  //
  // `limitInputPixels` caps decoding at the area that MAX_UPLOAD_EDGE squared
  // gives. The dimension check below catches a decompression bomb anyway,
  // because `metadata()` reads the header and not the pixels -- but then the
  // protection depends on the order of these lines staying as it is.
  // The cap depends on nothing.
  const bounded = { limitInputPixels: MAX_UPLOAD_EDGE * MAX_UPLOAD_EDGE }

  let meta: Metadata
  try {
    meta = await sharp(input.file, bounded).metadata()
  } catch {
    return { ok: false, reason: 'file_unreadable' }
  }

  const format = meta.format ?? ''
  if (!(ACCEPTED_INPUT_FORMATS as readonly string[]).includes(format)) {
    return { ok: false, reason: 'format_unsupported' }
  }

  const w = meta.width ?? 0
  const h = meta.height ?? 0
  if (w < MIN_UPLOAD_EDGE || h < MIN_UPLOAD_EDGE) return { ok: false, reason: 'too_small' }
  if (w > MAX_UPLOAD_EDGE || h > MAX_UPLOAD_EDGE) return { ok: false, reason: 'too_large' }

  // Re-encode, and do it IMMEDIATELY, not only on approval.
  //
  // What lies in quarantine is therefore bytes produced by sharp and not the
  // submitter's. That clears several classes of problems in one step: EXIF and
  // other metadata are dropped (sharp only keeps them with `withMetadata()`,
  // and that is deliberately absent here), a polyglot remainder appended to a
  // valid image does not survive decoding, and an animated file is reduced to
  // its first frame, because `animated: true` is not set.
  //
  // The moderator then sees our own PNG, not the submitted file -- otherwise
  // the preview in the dashboard would be the place where foreign bytes still
  // end up in a browser after all.
  let normalized: Buffer
  try {
    normalized = await sharp(input.file, bounded).png({ compressionLevel: 9 }).toBuffer()
  } catch {
    return { ok: false, reason: 'file_unreadable' }
  }

  const id = randomUUID()
  await mkdir(/*turbopackIgnore: true*/ inboxPath(), { recursive: true })
  await writeFile(quarantineFile(id), normalized)

  const sha = createHash('sha256').update(normalized).digest('hex')

  await query(
    `INSERT INTO msk_image_uploads
       (id, category, name, label, tags, original_filename, width, height, bytes,
        sha256, submitted_by, submitted_name, note, license_declared, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending')`,
    [
      id, input.category, name,
      normalizeLabel(input.label),
      normalizeTags(input.tags),
      input.fileName ? input.fileName.slice(0, 255) : null,
      w, h, normalized.length, sha,
      input.submittedBy, input.submittedName ? input.submittedName.slice(0, 64) : null,
      input.note.trim() ? input.note.trim().slice(0, 500) : null,
    ],
  )

  const upload = await getUpload(id)
  // The row was just written; if it is missing, something is fundamentally
  // broken and a silent success would be the worst possible answer.
  if (!upload) throw new Error('upload row vanished right after insert')
  return { ok: true, upload }
}

/** How many submissions this person has made in the last 24 hours. */
export async function recentUploadCount(discordUserId: string): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM msk_image_uploads
      WHERE submitted_by = ? AND created_at > NOW() - INTERVAL 1 DAY`,
    [discordUserId],
  )
  return Number(row?.total ?? 0)
}

// ── Reading ──────────────────────────────────────────────────────────────────

export async function getUpload(id: string): Promise<ImageUpload | null> {
  const row = await queryOne<UploadRow>(
    `SELECT ${COLUMNS} FROM msk_image_uploads WHERE id = ?`, [id],
  )
  return row ? toUpload(row) : null
}

export async function listUploads(status: UploadStatus | 'all', limit = 100): Promise<ImageUpload[]> {
  const cap = Math.min(200, Math.max(1, Math.floor(limit)))
  const rows = status === 'all'
    ? await query<UploadRow>(
        `SELECT ${COLUMNS} FROM msk_image_uploads ORDER BY created_at DESC LIMIT ${cap}`)
    : await query<UploadRow>(
        `SELECT ${COLUMNS} FROM msk_image_uploads WHERE status = ?
          ORDER BY created_at DESC LIMIT ${cap}`, [status])
  return rows.map(toUpload)
}

export async function listUploadsBySubmitter(discordUserId: string, limit = 30): Promise<ImageUpload[]> {
  const cap = Math.min(100, Math.max(1, Math.floor(limit)))
  const rows = await query<UploadRow>(
    `SELECT ${COLUMNS} FROM msk_image_uploads WHERE submitted_by = ?
      ORDER BY created_at DESC LIMIT ${cap}`, [discordUserId],
  )
  return rows.map(toUpload)
}

export async function countPendingUploads(): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM msk_image_uploads WHERE status = 'pending'`,
  )
  return Number(row?.total ?? 0)
}

/** The quarantine file for the preview in the dashboard. */
export async function readQuarantine(id: string): Promise<Buffer | null> {
  try {
    return await readFile(quarantineFile(id))
  } catch {
    return null
  }
}

// ── Deciding ─────────────────────────────────────────────────────────────────

export type DecisionFailure =
  | 'not_found' | 'not_pending' | 'file_gone' | 'name_taken'
  | 'write_failed' | 'category_unknown'

export type DecisionResult =
  | { ok: true }
  | { ok: false; reason: DecisionFailure }

/**
 * Approve a submission: build the variants, write them to the CDN, create the
 * row in `msk_images`, clear the quarantine.
 *
 * The name conflict is checked again HERE, not only on upload. Weeks can pass
 * between submission and approval, and during that time the same name may have
 * come in through the regular ingest. Without the second check the approval
 * would overwrite a curated image.
 *
 * Order on purpose: files first, then the database row. If writing breaks off,
 * there are files without a row. The sync check reports that, and it is
 * harmless, because without a row nobody knows the address. The other way round
 * there would be a tile in the gallery whose image returns 404.
 * `targetCategory` allows refiling on approval. The category a submitter picked
 * is a suggestion, and sorting it correctly is precisely the decision that
 * moderation exists for. Only the existence of the category is checked, **not**
 * `allows_upload`: that flag governs what is offered at submission time
 * (`brand` is deliberately not on that list), not where a human may finally
 * file the image.
 */
export async function approveUpload(
  id: string, reviewerId: string, targetCategory?: string,
): Promise<DecisionResult> {
  const upload = await getUpload(id)
  if (!upload) return { ok: false, reason: 'not_found' }
  if (upload.status !== 'pending') return { ok: false, reason: 'not_pending' }

  const category = targetCategory ?? upload.category
  if (category !== upload.category && !(await categoryExists(category))) {
    return { ok: false, reason: 'category_unknown' }
  }

  // The name collision is checked against the TARGET category, not the
  // submitted one. A name taken in `items` says nothing about whether it is
  // free in `props` -- that is exactly why `UNIQUE (category, name)` spans two
  // columns.
  const taken = await queryOne<{ id: number }>(
    `SELECT id FROM msk_images WHERE category = ? AND name = ?`, [category, upload.name],
  )
  if (taken) return { ok: false, reason: 'name_taken' }

  const source = await readQuarantine(id)
  if (!source) return { ok: false, reason: 'file_gone' }

  const variants = await buildVariants(await trimAndPad(source))

  // Writing is the only step that can fail because of the environment rather
  // than the data: the target directory belongs to the ingest, not to the
  // application. A passed-through EACCES arrived as a bare
  // "Internal server error", and the reason was only in the server's
  // journal. As its own failure case, the UI says what to look for. The
  // database row deliberately stays unwritten: a tile without a file returns
  // 404 in the gallery, the other way round nobody knows the address.
  try {
    await writeVariants(category, upload.name, variants)
  } catch (e) {
    console.error('[image-upload] writing to the CDN failed:', e)
    return { ok: false, reason: 'write_failed' }
  }

  const sha = createHash('sha256').update(variants.original).digest('hex')

  await query(
    `INSERT INTO msk_images
       (category, name, label, ext, width, height, bytes, sha256, version, tags,
        source, license_note, status, submitted_by)
     VALUES (?, ?, ?, 'png', ?, ?, ?, ?, 1, ?, 'community', ?, 'published', ?)`,
    [
      category, upload.name, upload.label,
      variants.width, variants.height, variants.original.length, sha,
      upload.tags.length ? upload.tags.join(',') : null,
      `Community submission, rights declared by the submitter (upload ${id})`,
      upload.submittedBy,
    ],
  )

  // The category travels with it. Otherwise the Uploads tab's "in the gallery"
  // link, which is built from this column, would point nowhere after a refile.
  // What was originally submitted lives in the audit log; that is the place for
  // history, not this column.
  await query(
    `UPDATE msk_image_uploads
        SET status = 'approved', category = ?, reviewed_by = ?, reviewed_at = NOW(),
            reject_reason = NULL
      WHERE id = ?`,
    [category, reviewerId, id],
  )

  await dropQuarantine(id)
  return { ok: true }
}

/**
 * Reject: file gone, row stays.
 *
 * The row is the reason the table keeps rejected entries at all. It answers
 * two questions nobody else can answer: why an image did not appear (the
 * submitter sees their reason), and who repeatedly sends unusable material.
 */
export async function rejectUpload(id: string, reviewerId: string, reason: string): Promise<DecisionResult> {
  const upload = await getUpload(id)
  if (!upload) return { ok: false, reason: 'not_found' }
  if (upload.status !== 'pending') return { ok: false, reason: 'not_pending' }

  await query(
    `UPDATE msk_image_uploads
        SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), reject_reason = ?
      WHERE id = ?`,
    [reviewerId, reason.trim().slice(0, 255) || null, id],
  )

  await dropQuarantine(id)
  return { ok: true }
}

async function dropQuarantine(id: string): Promise<void> {
  await rm(quarantineFile(id), { force: true }).catch(() => {})
}

/** Only for tests and diagnostics: the limits readable in one place. */
export const UPLOAD_LIMITS = {
  maxBytes: MAX_UPLOAD_BYTES,
  minEdge:  MIN_UPLOAD_EDGE,
  maxEdge:  MAX_UPLOAD_EDGE,
  perDay:   UPLOADS_PER_DAY,
  pipelineMinEdge: PIPELINE_RULES.minEdge,
} as const
