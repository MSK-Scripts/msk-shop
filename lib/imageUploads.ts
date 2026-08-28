import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp, { type Metadata } from 'sharp'

import { query, queryOne } from '@/lib/db'
import { normalizeLabel, normalizeTags } from '@/lib/adminImages'
import {
  ACCEPTED_INPUT_FORMATS,
  PIPELINE_RULES,
  buildVariants,
  normaliseName,
  trimAndPad,
  writeVariants,
} from '@/lib/imagePipeline'

/**
 * Community-Uploads: Quarantaene, Schlange, Freigabe.
 *
 * Der riskanteste Teil des ganzen Bild-Projekts, deshalb hier die Grenze in
 * einem Satz: **eine hochgeladene Datei erreicht das oeffentliche Verzeichnis
 * niemals.** Sie wird beim Upload von sharp neu kodiert, das Ergebnis liegt
 * unter einer UUID in einem Verzeichnis ausserhalb jedes DocumentRoot, und
 * erst eine Freigabe durch einen Menschen erzeugt daraus die drei Fassungen im
 * CDN. Weder der Dateiname noch der Inhalt des Einreichenden wird je Teil
 * eines Pfades.
 */

/** Groesster akzeptierter Upload. Der Proxy weist alles darueber schon am Header ab. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

/** Kleinste und groesste Kantenlaenge, die ueberhaupt Sinn ergibt. */
export const MIN_UPLOAD_EDGE = 64
export const MAX_UPLOAD_EDGE = 4096

/** Einreichungen je Person und Tag. Bremst Flutung, ohne echte Beitraege zu stoeren. */
export const UPLOADS_PER_DAY = 10

export function inboxPath(): string {
  return process.env.UPLOAD_INBOX_PATH || '/var/lib/msk-image-uploads'
}

// turbopackIgnore an jeder Pfadbildung: die Wurzel kommt aus der Umgebung und
// zeigt aus dem Repo heraus. Ohne den Hinweis traced Turbopack das ganze
// Projekt in die Build-Ausgabe.
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
  /** Nur bei `pending` vorhanden: die Quarantaenedatei wird danach geloescht. */
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

// ── Kategorien, die Einreichungen annehmen ───────────────────────────────────

export interface UploadCategory {
  slug: string
  name: string
}

/**
 * Welche Kategorien offenstehen, entscheidet die Spalte `allows_upload`, nicht
 * eine Liste im Code. Eine weitere private Kategorie soll nicht bedeuten, dass
 * jemand daran denken muss, sie hier auszuschliessen.
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

// ── Einreichen ───────────────────────────────────────────────────────────────

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
 * Eine Einreichung pruefen, neu kodieren und in die Quarantaene legen.
 *
 * Die Reihenfolge der Pruefungen ist Absicht: erst die billigen (Recht,
 * Kategorie, Name, Groesse), dann das Tageslimit, und erst zum Schluss laesst
 * die Funktion sharp auf fremde Bytes los. Wer mit einer kaputten Datei um sich
 * wirft, kostet damit keine Bildverarbeitung.
 */
export async function submitUpload(input: SubmitInput): Promise<SubmitResult> {
  if (!input.licenseOk) return { ok: false, reason: 'license_required' }

  if (!(await categoryAllowsUpload(input.category))) {
    return { ok: false, reason: 'category_unknown' }
  }

  const name = normaliseName(input.rawName)
  if (!name || !/^[a-z0-9_-]{1,128}$/.test(name)) return { ok: false, reason: 'name_invalid' }

  // Der Bestand gewinnt: eine Einreichung ersetzt nie ein vorhandenes Bild.
  // Ein Upload, der ein gepflegtes Fahrzeugrendering ueberschreiben koennte,
  // waere ein Weg, die Galerie zu verunstalten, und der Nutzen waere null --
  // was fehlt, sind Luecken, nicht Ersatz.
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

  // Format und Masse aus dem INHALT, nicht aus Endung oder Content-Type. sharp
  // lehnt alles ab, was kein Bild ist; ein als PNG deklariertes Archiv kommt
  // hier nicht durch.
  //
  // `limitInputPixels` deckelt die Dekodierung auf die Flaeche, die MAX_UPLOAD_EDGE
  // im Quadrat ergibt. Die Masspruefung darunter faengt eine Dekompressionsbombe
  // ohnehin ab, weil `metadata()` den Header liest und nicht die Pixel -- aber
  // dann haengt der Schutz daran, dass die Reihenfolge dieser Zeilen so bleibt.
  // Der Deckel haengt an nichts.
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

  // Neu kodieren, und zwar SOFORT, nicht erst bei der Freigabe.
  //
  // Was in der Quarantaene liegt, sind damit von sharp erzeugte Bytes und nicht
  // die des Einreichenden. Das raeumt in einem Schritt mehrere Klassen von
  // Problemen ab: EXIF und andere Metadaten fallen weg (sharp behaelt sie nur
  // mit `withMetadata()`, und das steht hier bewusst nicht), ein an ein
  // gueltiges Bild angehaengter Polyglot-Rest ueberlebt die Dekodierung nicht,
  // und eine animierte Datei wird auf ihr erstes Einzelbild reduziert, weil
  // `animated: true` nicht gesetzt ist.
  //
  // Der Moderierende sieht danach unser eigenes PNG, nicht die eingereichte
  // Datei -- sonst waere die Vorschau im Dashboard der Ort, an dem fremde Bytes
  // doch noch in einem Browser landen.
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
  // Der Datensatz wurde gerade geschrieben; fehlt er, ist etwas grundlegend
  // kaputt und ein stiller Erfolg waere die schlechteste Antwort.
  if (!upload) throw new Error('upload row vanished right after insert')
  return { ok: true, upload }
}

/** Wie viele Einreichungen diese Person in den letzten 24 Stunden gemacht hat. */
export async function recentUploadCount(discordUserId: string): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM msk_image_uploads
      WHERE submitted_by = ? AND created_at > NOW() - INTERVAL 1 DAY`,
    [discordUserId],
  )
  return Number(row?.total ?? 0)
}

// ── Lesen ────────────────────────────────────────────────────────────────────

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

/** Die Quarantaenedatei fuer die Vorschau im Dashboard. */
export async function readQuarantine(id: string): Promise<Buffer | null> {
  try {
    return await readFile(quarantineFile(id))
  } catch {
    return null
  }
}

// ── Entscheiden ──────────────────────────────────────────────────────────────

export type DecisionFailure = 'not_found' | 'not_pending' | 'file_gone' | 'name_taken' | 'write_failed'

export type DecisionResult =
  | { ok: true }
  | { ok: false; reason: DecisionFailure }

/**
 * Eine Einreichung freigeben: Fassungen bauen, ins CDN schreiben, Zeile in
 * `msk_images` anlegen, Quarantaene raeumen.
 *
 * Der Namenskonflikt wird HIER noch einmal geprueft und nicht nur beim Upload.
 * Zwischen Einreichung und Freigabe koennen Wochen liegen, und in der Zeit kann
 * derselbe Name ueber den regulaeren Ingest hereingekommen sein. Ohne die
 * zweite Pruefung wuerde die Freigabe ein gepflegtes Bild ueberschreiben.
 *
 * Reihenfolge mit Absicht: erst die Dateien, dann die Datenbankzeile. Bricht
 * das Schreiben ab, gibt es Dateien ohne Zeile — das meldet der Sync-Check und
 * ist harmlos, weil ohne Zeile niemand die Adresse kennt. Andersherum gaebe es
 * eine Kachel in der Galerie, deren Bild 404 liefert.
 */
export async function approveUpload(id: string, reviewerId: string): Promise<DecisionResult> {
  const upload = await getUpload(id)
  if (!upload) return { ok: false, reason: 'not_found' }
  if (upload.status !== 'pending') return { ok: false, reason: 'not_pending' }

  const taken = await queryOne<{ id: number }>(
    `SELECT id FROM msk_images WHERE category = ? AND name = ?`, [upload.category, upload.name],
  )
  if (taken) return { ok: false, reason: 'name_taken' }

  const source = await readQuarantine(id)
  if (!source) return { ok: false, reason: 'file_gone' }

  const variants = await buildVariants(await trimAndPad(source))

  // Das Schreiben ist der einzige Schritt, der an der Umgebung scheitern kann
  // statt an den Daten: das Zielverzeichnis gehoert dem Ingest, nicht der
  // Anwendung. Ein durchgereichter EACCES kam als blankes
  // "Internal server error" an, und der Grund stand nur im journal des
  // Servers. Als eigener Fehlerfall sagt die Oberflaeche, wonach zu suchen
  // ist. Die Datenbankzeile bleibt bewusst ungeschrieben: eine Kachel ohne
  // Datei liefert in der Galerie 404, umgekehrt kennt niemand die Adresse.
  try {
    await writeVariants(upload.category, upload.name, variants)
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
      upload.category, upload.name, upload.label,
      variants.width, variants.height, variants.original.length, sha,
      upload.tags.length ? upload.tags.join(',') : null,
      `Community submission, rights declared by the submitter (upload ${id})`,
      upload.submittedBy,
    ],
  )

  await query(
    `UPDATE msk_image_uploads
        SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), reject_reason = NULL
      WHERE id = ?`,
    [reviewerId, id],
  )

  await dropQuarantine(id)
  return { ok: true }
}

/**
 * Ablehnen: Datei weg, Zeile bleibt.
 *
 * Die Zeile ist der Grund, warum die Tabelle abgelehnte Eintraege ueberhaupt
 * behaelt. Sie beantwortet zwei Fragen, die sonst niemand beantworten kann:
 * warum ein Bild nicht erschienen ist (der Einreichende sieht seinen Grund),
 * und wer wiederholt Unbrauchbares schickt.
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

/** Nur fuer Tests und Diagnose: die Grenzwerte an einer Stelle ablesbar. */
export const UPLOAD_LIMITS = {
  maxBytes: MAX_UPLOAD_BYTES,
  minEdge:  MIN_UPLOAD_EDGE,
  maxEdge:  MAX_UPLOAD_EDGE,
  perDay:   UPLOADS_PER_DAY,
  pipelineMinEdge: PIPELINE_RULES.minEdge,
} as const
