// ── Withdrawal, cancellation, DSA report ────────────────────────────────────
//
// One module for the three forms that the law requires and that must be
// reachable **without logging in** (§ 356a BGB, § 312k BGB, Art. 16 DSA).
//
// Two things determine its shape:
//
// 1. **Validating does not mean rejecting here.** Anyone who withdraws only
//    has to describe their contract identifiably, not prove it. There is
//    therefore no lookup against `ticketbot_guilds` and no captcha. The only
//    check is that the required fields are present and plausible: an empty
//    declaration would be worthless for both sides.
//
// 2. **Store first, then send the mail.** If SMTP fails, the declaration is
//    still in the database with its timestamp and the deadline is met. The
//    other way round there would be a confirmed declaration we know nothing about.
//
// Validation is pure and testable without a database; the write functions
// follow below it.

import { randomUUID } from 'crypto'
import { query } from '@/lib/db'

// ── Limits ──────────────────────────────────────────────────────────────────
//
// Generous enough for every real case and tight enough that nobody uses the
// table as storage. The column widths in `database/schema.sql` are above
// these, so a value at the limit cannot be silently truncated.
//
export const MAX_NAME     = 200
export const MAX_EMAIL    = 200
export const MAX_CONTRACT = 200
export const MAX_URL      = 2000
export const MAX_REASON   = 5000

/** Rough plausibility check. Deliberately not RFC-exact: rejecting an address
 *  because of an exotic special character would be exactly the hurdle that the
 *  statute forbids. Whether the address exists is shown by sending to it. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface FieldErrors { [field: string]: string }

export type ValidationResult<T> =
  | { ok: true;  value: T }
  | { ok: false; errors: FieldErrors }

function clean(value: unknown, max: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Multi-line free text: line breaks are kept, everything else is trimmed. */
function cleanMultiline(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, max)
}

// ── Withdrawal ──────────────────────────────────────────────────────────────

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

// ── Cancellation ────────────────────────────────────────────────────────────

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
    // Empty means "at the earliest possible date": that is the statutory
    // default case and must not be a form error.
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

// ── DSA report ──────────────────────────────────────────────────────────────

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
  // Art. 16 Abs. 2 lit. d DSA: without this statement it is not a notice within
  // the meaning of the provision, so it is enforced server-side and not only in the form.
  if (b.declaredTrue !== true) errors.declaredTrue = 'required'

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value }
}

// ── Storage ─────────────────────────────────────────────────────────────────

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
 * Record that the confirmation actually went out.
 *
 * `confirmed_at` stays NULL if sending fails or SMTP is not configured at
 * all. That is intentional: the column is the list of cases that need
 * manual follow-up, not a copy of `created_at`.
 */
export async function markConfirmed(
  table: 'msk_withdrawals' | 'msk_cancellations' | 'msk_content_reports', id: string,
): Promise<void> {
  await query(`UPDATE ${table} SET confirmed_at = NOW() WHERE id = ?`, [id])
}
