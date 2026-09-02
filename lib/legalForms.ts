// ── Widerruf, Kündigung, DSA-Meldung ────────────────────────────────────────
//
// Ein Modul für die drei Formulare, die das Gesetz verlangt und die **ohne
// Anmeldung** erreichbar sein müssen (§ 356a BGB, § 312k BGB, Art. 16 DSA).
//
// Zwei Dinge bestimmen den Zuschnitt:
//
// 1. **Prüfen heißt hier nicht abweisen.** Wer widerruft, muss seinen Vertrag
//    nur identifizierbar beschreiben, nicht nachweisen. Es gibt deshalb keinen
//    Abgleich gegen `ticketbot_guilds` und kein Captcha. Geprüft wird nur, dass
//    die Pflichtfelder da und plausibel sind — eine leere Erklärung wäre für
//    beide Seiten wertlos.
//
// 2. **Erst speichern, dann mailen.** Scheitert SMTP, steht die Erklärung
//    trotzdem mit ihrem Zeitstempel in der Datenbank und die Frist ist gewahrt.
//    Andersherum gäbe es eine bestätigte Erklärung, von der wir nichts wissen.
//
// Die Validierung ist rein und ohne Datenbank testbar; die Schreibfunktionen
// stehen darunter.

import { randomUUID } from 'crypto'
import { query } from '@/lib/db'

// ── Grenzen ─────────────────────────────────────────────────────────────────
//
// Großzügig genug für jeden echten Fall und eng genug, dass niemand die
// Tabelle als Ablage benutzt. Die Spaltenbreiten in `database/schema.sql`
// liegen darüber, ein Wert am Limit kann also nicht still abgeschnitten
// werden.
export const MAX_NAME     = 200
export const MAX_EMAIL    = 200
export const MAX_CONTRACT = 200
export const MAX_URL      = 2000
export const MAX_REASON   = 5000

/** Grobe Plausibilitätsprüfung. Bewusst nicht RFC-genau: eine Adresse wegen
 *  eines exotischen Sonderzeichens abzulehnen wäre genau die Hürde, die die
 *  Norm verbietet. Ob die Adresse existiert, zeigt der Versand. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface FieldErrors { [field: string]: string }

export type ValidationResult<T> =
  | { ok: true;  value: T }
  | { ok: false; errors: FieldErrors }

function clean(value: unknown, max: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Mehrzeiliger Freitext: Zeilenumbrüche bleiben, alles andere wird getrimmt. */
function cleanMultiline(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, max)
}

// ── Widerruf ────────────────────────────────────────────────────────────────

export interface WithdrawalFields {
  name:        string
  contractRef: string
  email:       string
}

export function validateWithdrawal(body: unknown): ValidationResult<WithdrawalFields> {
  const b = (body ?? {}) as Record<string, unknown>
  const value: WithdrawalFields = {
    name:        clean(b.name,        MAX_NAME),
    contractRef: clean(b.contractRef, MAX_CONTRACT),
    email:       clean(b.email,       MAX_EMAIL).toLowerCase(),
  }

  const errors: FieldErrors = {}
  if (!value.name)        errors.name        = 'required'
  if (!value.contractRef) errors.contractRef = 'required'
  if (!value.email)       errors.email       = 'required'
  else if (!EMAIL_RE.test(value.email)) errors.email = 'invalid'

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value }
}

// ── Kündigung ───────────────────────────────────────────────────────────────

export type CancellationKind = 'ordinary' | 'extraordinary'

export interface CancellationFields {
  kind:        CancellationKind
  name:        string
  contractRef: string
  email:       string
  effectiveAt: string
  reason:      string | null
}

export function validateCancellation(body: unknown): ValidationResult<CancellationFields> {
  const b = (body ?? {}) as Record<string, unknown>
  const kind: CancellationKind = b.kind === 'extraordinary' ? 'extraordinary' : 'ordinary'

  const value: CancellationFields = {
    kind,
    name:        clean(b.name,        MAX_NAME),
    contractRef: clean(b.contractRef, MAX_CONTRACT),
    email:       clean(b.email,       MAX_EMAIL).toLowerCase(),
    // Leer heißt "zum nächstmöglichen Zeitpunkt" — das ist der gesetzliche
    // Regelfall und darf kein Formularfehler sein.
    effectiveAt: clean(b.effectiveAt, 64) || 'asap',
    reason:      cleanMultiline(b.reason, MAX_REASON) || null,
  }

  const errors: FieldErrors = {}
  if (!value.name)        errors.name        = 'required'
  if (!value.contractRef) errors.contractRef = 'required'
  if (!value.email)       errors.email       = 'required'
  else if (!EMAIL_RE.test(value.email)) errors.email = 'invalid'

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value }
}

// ── DSA-Meldung ─────────────────────────────────────────────────────────────

export interface ReportFields {
  contentUrl: string
  reason:     string
  name:       string
  email:      string
}

export function validateReport(body: unknown): ValidationResult<ReportFields> {
  const b = (body ?? {}) as Record<string, unknown>
  const value: ReportFields = {
    contentUrl: clean(b.contentUrl, MAX_URL),
    reason:     cleanMultiline(b.reason, MAX_REASON),
    name:       clean(b.name,  MAX_NAME),
    email:      clean(b.email, MAX_EMAIL).toLowerCase(),
  }

  const errors: FieldErrors = {}
  if (!value.contentUrl) errors.contentUrl = 'required'
  else if (!/^https?:\/\//i.test(value.contentUrl)) errors.contentUrl = 'invalid'
  if (!value.reason) errors.reason = 'required'
  if (!value.name)   errors.name   = 'required'
  if (!value.email)  errors.email  = 'required'
  else if (!EMAIL_RE.test(value.email)) errors.email = 'invalid'
  // Art. 16 Abs. 2 lit. d DSA: ohne diese Erklärung ist es keine Meldung im
  // Sinne der Norm, deshalb serverseitig erzwungen und nicht nur im Formular.
  if (b.declaredTrue !== true) errors.declaredTrue = 'required'

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value }
}

// ── Speichern ───────────────────────────────────────────────────────────────

export interface StoredDeclaration {
  id:         string
  receivedAt: Date
}

export async function storeWithdrawal(
  fields: WithdrawalFields, declaration: string, clientIp: string | null,
): Promise<StoredDeclaration> {
  const id = randomUUID()
  const receivedAt = new Date()
  await query(
    `INSERT INTO msk_withdrawals (id, name, contract_ref, email, declaration, client_ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, fields.name, fields.contractRef, fields.email, declaration, clientIp, receivedAt],
  )
  return { id, receivedAt }
}

export async function storeCancellation(
  fields: CancellationFields, declaration: string, clientIp: string | null,
): Promise<StoredDeclaration> {
  const id = randomUUID()
  const receivedAt = new Date()
  await query(
    `INSERT INTO msk_cancellations
       (id, kind, name, contract_ref, email, effective_at, reason, declaration, client_ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, fields.kind, fields.name, fields.contractRef, fields.email,
     fields.effectiveAt, fields.reason, declaration, clientIp, receivedAt],
  )
  return { id, receivedAt }
}

export async function storeReport(
  fields: ReportFields, clientIp: string | null,
): Promise<StoredDeclaration> {
  const id = randomUUID()
  const receivedAt = new Date()
  await query(
    `INSERT INTO msk_content_reports
       (id, content_url, reason, name, email, declared_true, client_ip, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, fields.contentUrl, fields.reason, fields.name, fields.email, clientIp, receivedAt],
  )
  return { id, receivedAt }
}

/**
 * Festhalten, dass die Bestätigung wirklich rausging.
 *
 * `confirmed_at` bleibt NULL, wenn der Versand scheitert oder SMTP gar nicht
 * konfiguriert ist. Das ist Absicht: die Spalte ist die Liste der Fälle, bei
 * denen von Hand nachgefasst werden muss, und keine Kopie von `created_at`.
 */
export async function markConfirmed(
  table: 'msk_withdrawals' | 'msk_cancellations' | 'msk_content_reports', id: string,
): Promise<void> {
  await query(`UPDATE ${table} SET confirmed_at = NOW() WHERE id = ?`, [id])
}
