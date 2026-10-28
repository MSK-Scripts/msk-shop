import type { AdminPermission } from '@/lib/adminPerms'
import type { RevealField, RevealKind } from '@/lib/adminReveal'
import type { KeyOrigin } from '@/lib/keyClassification'
import type { NewsPopupSettings } from '@/lib/newsPopup'
import type { Tier } from '@/lib/tiers'

/**
 * Every request the admin areas send, in one module (Phase 10, as the bot
 * dashboards did in Phases 8 and 9).
 *
 * The routes behind them did not change their bodies: each function sends
 * what the old tab sent, key for key, and tests/adminRequests.test.ts pins
 * them. Reading is done through `useAdminResource` with the addresses below.
 *
 * Every failure becomes an Error with the route's own sentence when there is
 * one; a body that is not JSON (Next's error page, the proxy's 429 text)
 * gets the caller's fallback instead of the browser's parser message.
 */

export const ADMIN_URL = {
  overview:   '/api/admin/overview',
  payments:   '/api/admin/payments',
  catalog:    '/api/admin/catalog',
  coupons:    '/api/admin/coupons',
  giftcards:  '/api/admin/giftcards',
  packages:   '/api/admin/packages',
  bans:       '/api/admin/bans',
  apiKeys:    '/api/admin/api-keys',
  imageStats: '/api/admin/images/stats',
  newsPopup:  '/api/admin/news-popup',
  team:       '/api/admin/team',
  audit:      '/api/admin/audit',
  uploads:    (status: string) => `/api/admin/image-uploads?status=${encodeURIComponent(status)}`,
  images:     (query: URLSearchParams) => `/api/admin/images?${query.toString()}`,
  lookup:     (user: string) => `/api/admin/lookup?user=${encodeURIComponent(user)}`,
} as const

export class AdminRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

async function send<T = Record<string, unknown>>(url: string, method: string, body: unknown, fallback: string): Promise<T> {
  const init: RequestInit = { method, cache: 'no-store' }
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  const res = await fetch(url, init)
  let data: unknown = null
  try { data = await res.json() } catch { /* not JSON; the status decides */ }
  if (!res.ok) {
    const reported = (data as { error?: unknown } | null)?.error
    throw new AdminRequestError(typeof reported === 'string' ? reported : fallback, res.status)
  }
  return (data ?? {}) as T
}

const id = (value: string | number) => encodeURIComponent(String(value))

// ─── Sales ───────────────────────────────────────────────────────────────────

export function givePackage(input: { ign: string; packageId: number; price: number; note: string }, fallback: string) {
  return send(ADMIN_URL.payments, 'POST', {
    ign:      input.ign.trim(),
    packages: [{ id: input.packageId }],
    price:    input.price,
    note:     input.note.trim() || undefined,
  }, fallback)
}

export function refundPayment(txn: string, fallback: string) {
  return send(`/api/admin/payments/${id(txn)}`, 'PATCH', { status: 'refund' }, fallback)
}

export async function lookupPlayer<T>(user: string, fallback: string): Promise<T> {
  const data = await send<{ result: T }>(ADMIN_URL.lookup(user.trim()), 'GET', undefined, fallback)
  return data.result
}

export function createCoupon(input: {
  code: string; discountType: 'percentage' | 'value'; amount: number
  effectiveOn: 'cart' | 'package' | 'category'; ids: string[]
}, fallback: string) {
  return send(ADMIN_URL.coupons, 'POST', {
    code: input.code.trim(), discountType: input.discountType, amount: input.amount,
    effectiveOn: input.effectiveOn, ids: input.ids.join(','),
  }, fallback)
}

export function deleteCoupon(couponId: number, fallback: string) {
  return send(`/api/admin/coupons/${id(couponId)}`, 'DELETE', undefined, fallback)
}

export function createGiftCard(input: { amount: number; note: string; expiresAt: string }, fallback: string) {
  return send(ADMIN_URL.giftcards, 'POST', {
    amount: input.amount, note: input.note.trim() || undefined, expiresAt: input.expiresAt || undefined,
  }, fallback)
}

export function topUpGiftCard(cardId: number, amount: number, fallback: string) {
  return send(`/api/admin/giftcards/${id(cardId)}`, 'PUT', { amount }, fallback)
}

export function voidGiftCard(cardId: number, fallback: string) {
  return send(`/api/admin/giftcards/${id(cardId)}`, 'DELETE', undefined, fallback)
}

/** Only the fields that changed; the Plugin API stores the price as an integer. */
export function updatePackage(packageId: number, fields: { name?: string; price?: number; disabled?: boolean }, fallback: string) {
  return send(`/api/admin/packages/${id(packageId)}`, 'PUT', fields, fallback)
}

export function createBan(input: { user: string; reason: string; ip: string }, fallback: string) {
  return send(ADMIN_URL.bans, 'POST', {
    user: input.user.trim(), reason: input.reason.trim(), ip: input.ip.trim() || undefined,
  }, fallback)
}

// ─── Ticket bot ──────────────────────────────────────────────────────────────

/** All three go over the wire; the route writes and audits only what differs. */
export function updateApiKey(guildId: string, input: { tier: Tier; statsExcluded: boolean; keyOrigin: KeyOrigin }, fallback: string) {
  return send<{ warning?: string }>(`/api/admin/api-keys/${id(guildId)}`, 'PATCH', {
    tier: input.tier, statsExcluded: input.statsExcluded, keyOrigin: input.keyOrigin,
  }, fallback)
}

// ─── Image CDN ───────────────────────────────────────────────────────────────

export function updateImage(category: string, name: string, body: { label?: string; tags?: string; category?: string; status?: string }, fallback: string) {
  return send(`/api/admin/images/${category}/${name}`, 'PATCH', body, fallback)
}

export function deleteImage(category: string, name: string, fallback: string) {
  return send<{ warning?: string }>(`/api/admin/images/${category}/${name}`, 'DELETE', undefined, fallback)
}

export async function runImageSyncCheck<T>(fallback: string): Promise<T> {
  const data = await send<{ report: T }>('/api/admin/images/sync-check', 'GET', undefined, fallback)
  return data.report
}

/** The category only travels with an approval; a rejection keeps what was submitted. */
export function decideUpload(uploadId: string, decision: { approve: string } | { reject: string }, fallback: string) {
  const body = 'approve' in decision
    ? { decision: 'approve', category: decision.approve }
    : { decision: 'reject', reason: decision.reject }
  return send(`/api/admin/image-uploads/${uploadId}`, 'POST', body, fallback)
}

// ─── Website ─────────────────────────────────────────────────────────────────

export async function saveNewsPopup(settings: NewsPopupSettings, fallback: string): Promise<NewsPopupSettings> {
  const data = await send<{ settings: NewsPopupSettings }>(ADMIN_URL.newsPopup, 'PUT', { settings }, fallback)
  return data.settings
}

// ─── Administration ──────────────────────────────────────────────────────────

export function addTeamMember(input: { discordUserId: string; displayName: string; permissions: AdminPermission[] }, fallback: string) {
  return send(ADMIN_URL.team, 'POST', {
    discordUserId: input.discordUserId.trim(), displayName: input.displayName.trim() || undefined, permissions: input.permissions,
  }, fallback)
}

export function updateTeamMember(discordUserId: string, input: { permissions: AdminPermission[]; active: boolean }, fallback: string) {
  return send(`/api/admin/team/${discordUserId}`, 'PATCH', { permissions: input.permissions, active: input.active }, fallback)
}

export function removeTeamMember(discordUserId: string, fallback: string) {
  return send(`/api/admin/team/${discordUserId}`, 'DELETE', undefined, fallback)
}

/**
 * The full value of one masked field (lib/adminReveal.ts). The caller keeps
 * it in the state of its row and nowhere else: no store, no cache, no log.
 */
export async function revealValue(kind: RevealKind, recordId: string, field: RevealField, fallback: string): Promise<string> {
  const data = await send<{ value: string }>('/api/admin/reveal', 'POST', { kind, id: recordId, field }, fallback)
  return data.value
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/admin/logout', { method: 'POST' })
  } catch { /* leave even on a network error */ }
}
