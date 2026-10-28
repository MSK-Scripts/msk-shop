import type { BillingInterval, Tier } from '@/lib/tiers'

/**
 * Every request the ticket bot dashboard sends, in one place.
 *
 * Until Phase 8 of the redesign each card built its own `fetch`. The areas
 * were rebuilt then, and the requests had to stay byte for byte what the API
 * routes expect: method, address, headers and body. Kept here so a test can
 * pin them down (tests/ticketBotApi.test.ts) and a component cannot drift
 * from them by accident.
 *
 * The guild id always goes along, and every route behind it checks again
 * that the signed-in person owns that guild (`authorizeGuild()` in
 * lib/dashboardAuth.ts). Nothing here decides what anyone may do.
 */

export type PaidTier = Exclude<Tier, 'basic'>

/** What a call answers: the status and the parsed body, `{}` when there was none. */
export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean
  status: number
  data: Partial<T> & { error?: string }
}

const JSON_UPPER = { 'Content-Type': 'application/json' }
const JSON_LOWER = { 'content-type': 'application/json' }

const q = (guildId: string) => `guildId=${encodeURIComponent(guildId)}`

async function send<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(url, init)
  // A 500 is Next's HTML page and a 429 from proxy.ts is plain text; neither
  // parses, and neither should surface as "Unexpected end of JSON input".
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data: (data ?? {}) as ApiResult<T>['data'] }
}

// ── Subscription (Stripe) ────────────────────────────────────────────────────

/** Starts the Stripe checkout. Only ever called from the order summary's button. */
export function startCheckout(guildId: string, tier: PaidTier, interval: BillingInterval) {
  return send<{ url: string }>('/api/stripe/checkout', {
    method: 'POST', headers: JSON_UPPER, body: JSON.stringify({ guildId, tier, interval }),
  })
}

/** Opens the Stripe customer portal: payment method, invoices, cancelling. */
export function openBillingPortal(guildId: string) {
  return send<{ url: string }>('/api/stripe/portal', {
    method: 'POST', headers: JSON_UPPER, body: JSON.stringify({ guildId }),
  })
}

// ── Domain for the transcripts ───────────────────────────────────────────────

export type DomainStatus = 'none' | 'pending_dns' | 'active'

export function setTranscriptDomain(guildId: string, domain: string) {
  return send<{ status: DomainStatus; domain: string; message: string }>('/api/domain/set', {
    method: 'POST', headers: JSON_UPPER, body: JSON.stringify({ guildId, domain: domain.trim() }),
  })
}

export function validateTranscriptDomain(guildId: string) {
  return send<{ status: DomainStatus }>('/api/domain/validate', {
    method: 'POST', headers: JSON_UPPER, body: JSON.stringify({ guildId }),
  })
}

export function removeTranscriptDomain(guildId: string) {
  return send('/api/domain/remove', {
    method: 'POST', headers: JSON_UPPER, body: JSON.stringify({ guildId }),
  })
}

// ── Domain for the hosted bot's dashboard ────────────────────────────────────

export interface DashboardDomainAnswer {
  status: DomainStatus
  domain: string
  redirectUri: string
}

/** POST sets a domain, PATCH checks DNS again, DELETE goes back to the generated host. */
export function dashboardDomain(guildId: string, method: 'POST' | 'PATCH' | 'DELETE', body?: { domain: string }) {
  return send<DashboardDomainAnswer>(`/api/bot-hosting/domain?${q(guildId)}`, {
    method,
    headers: JSON_LOWER,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

// ── Hosted bot: address and owner access ────────────────────────────────────

export function setupDashboardHost(guildId: string) {
  return send<{ host: string; warning: string }>(`/api/bot-hosting/dashboard-host?${q(guildId)}`, {
    method: 'POST', cache: 'no-store',
  })
}

export function openOwnerDashboard(guildId: string) {
  return send<{ url: string }>(`/api/bot-dashboard/open?${q(guildId)}`, { cache: 'no-store' })
}

// ── Hosted bot: process control and logs ────────────────────────────────────

export type BotAction = 'start' | 'stop' | 'restart' | 'update'

export function fetchBotStatus(guildId: string) {
  return send<{ status: string }>(`/api/bot-control?${q(guildId)}`)
}

export function botAction(guildId: string, action: BotAction) {
  return send<{ ok: boolean; output: string; detail: string }>(`/api/bot-control?${q(guildId)}`, {
    method: 'POST', headers: JSON_UPPER, body: JSON.stringify({ action }),
  })
}

export function fetchBotLogs(guildId: string) {
  return send<{ lines: string[] }>(`/api/bot-logs?${q(guildId)}`)
}

/** Address of the server-sent event stream with the bot's live output. */
export function botLogStreamUrl(guildId: string): string {
  return `/api/bot-logs-stream?${q(guildId)}`
}

// ── Hosting set-up ───────────────────────────────────────────────────────────

/** Read with `useJsonResource(url, 'status', …)`. */
export const hostingStatusUrl = (guildId: string) => `/api/bot-hosting/status?${q(guildId)}`
/** Read with `useJsonResource(url, 'env', …)`. Secrets come back as "set" flags only. */
export const hostingEnvUrl = (guildId: string) => `/api/bot-hosting/env?${q(guildId)}`

export interface HostingValues {
  token: string
  clientId: string
  clientSecret: string
  databaseUrl: string
  publicPortal: boolean
}

/**
 * Installs the bot (`provision`) or, once installed, rewrites its .env and
 * restarts it (`env`). The data processing agreement is part of the first
 * installation only; `archive` answers the question about an earlier one.
 */
export function saveHosting(guildId: string, opts: {
  hosted: boolean
  values: HostingValues
  dpaAccepted: boolean
  archive?: 'restore' | 'discard'
}) {
  const { hosted, values, dpaAccepted, archive } = opts
  return send(`/api/bot-hosting/${hosted ? 'env' : 'provision'}?${q(guildId)}`, {
    method: 'POST',
    headers: JSON_LOWER,
    body: JSON.stringify({
      token: values.token, clientId: values.clientId, clientSecret: values.clientSecret,
      databaseUrl: values.databaseUrl, publicPortal: values.publicPortal,
      ...(hosted ? {} : { dpaAccepted }),
      ...(archive ? { archive } : {}),
    }),
  })
}

/** Stops the bot and archives it. `confirm` is the server id the person typed. */
export function removeHosting(guildId: string, confirm: string) {
  return send(`/api/bot-hosting/deactivate?${q(guildId)}`, {
    method: 'POST', headers: JSON_LOWER, body: JSON.stringify({ confirm }),
  })
}

// ── Transcripts ──────────────────────────────────────────────────────────────

export interface TranscriptQuery {
  ticketId: string
  from: string
  to: string
  attachmentsOnly: boolean
  page: number
}

export interface TranscriptItem {
  id: string
  ticketId: number
  url: string
  sizeBytes: number
  hasAttachments: boolean
  createdAt: string
  expiresAt: string
}

export const TRANSCRIPT_PAGE_SIZE = 20

/** Address of one page of the transcript list; empty filters are left out. */
export function transcriptsUrl(guildId: string, query: TranscriptQuery, pageSize = TRANSCRIPT_PAGE_SIZE): string {
  const qs = new URLSearchParams()
  qs.set('guildId', guildId)
  qs.set('page', String(query.page))
  qs.set('pageSize', String(pageSize))
  if (query.ticketId.trim()) qs.set('ticketId', query.ticketId.trim())
  if (query.from) qs.set('from', query.from)
  if (query.to) qs.set('to', query.to)
  if (query.attachmentsOnly) qs.set('attachments', '1')
  return `/api/transcripts?${qs.toString()}`
}

export function fetchTranscripts(guildId: string, query: TranscriptQuery, pageSize = TRANSCRIPT_PAGE_SIZE) {
  return send<{ items: TranscriptItem[]; total: number }>(transcriptsUrl(guildId, query, pageSize), { cache: 'no-store' })
}
