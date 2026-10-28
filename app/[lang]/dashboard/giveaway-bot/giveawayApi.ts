import type { Settings } from './giveawayModel'
import { settingsBody } from './giveawayModel'

/**
 * Every request the giveaway dashboard sends, in one place.
 *
 * Until Phase 9 of the redesign each tab of one large client file built its
 * own `fetch`. The areas were rebuilt then, and the requests had to stay what
 * the two API routes pass on to the bot: `/api/giveaway/data?kind=…` to read
 * and `/api/giveaway/action` with `{ action, … }` to write. Kept here so a
 * test can pin them down (tests/giveawayApi.test.ts) and a component cannot
 * drift from them by accident.
 *
 * No guild and no user id goes along: both routes take them from the signed
 * giveaway session and strip them from the body (app/api/giveaway/*). Whether
 * the store calls are allowed is the bot's decision against guild.ownerId.
 */

export type DataKind = 'giveaways' | 'settings' | 'roles' | 'channels' | 'templates' | 'tebex' | 'tebexPackages'

/** What a write answers: the status and the parsed body, `{}` when there was none. */
export interface ActionResult<T = Record<string, unknown>> {
  ok: boolean
  status: number
  data: Partial<T> & { error?: string }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

/** One read. Null when the session is gone (401); the caller sends the visitor to sign in. */
export async function fetchData(kind: DataKind): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`/api/giveaway/data?kind=${kind}`, { cache: 'no-store' })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

async function post<T>(body: Record<string, unknown>): Promise<ActionResult<T>> {
  const res = await fetch('/api/giveaway/action', {
    method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body),
  })
  // A 500 is Next's HTML page and a 429 from proxy.ts is plain text; neither
  // parses, and neither should surface as "Unexpected end of JSON input".
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data: (data ?? {}) as ActionResult<T>['data'] }
}

// ── Giveaways ────────────────────────────────────────────────────────────────

export function createGiveaway(body: Record<string, unknown>) {
  return post<{ id: string }>({ action: 'create', ...body })
}

export function editGiveaway(id: string, body: Record<string, unknown>) {
  return post({ action: 'edit', id, ...body })
}

/** The four state changes that take nothing but the giveaway's id. */
export type Lifecycle = 'pause' | 'resume' | 'end' | 'cancel'

export function changeGiveaway(action: Lifecycle, id: string) {
  return post({ action, id })
}

export function extendGiveaway(id: string, duration: string) {
  return post({ action: 'extend', id, duration })
}

/** All winners again, or the one given. */
export function rerollGiveaway(id: string, winnerId?: string) {
  return post(winnerId ? { action: 'reroll', id, winnerId } : { action: 'reroll', id })
}

/**
 * Save a giveaway as a template. The bot builds the template from the
 * record, only the id and the name are sent; an empty name takes the title.
 */
export function saveGiveawayAsTemplate(id: string, name: string, title: string) {
  return post({ action: 'templateFrom', id, name: name.trim() || title })
}

// ── Templates ────────────────────────────────────────────────────────────────

/** A new template without `id`, a change with it. */
export function saveTemplate(body: Record<string, unknown>, id?: number) {
  return post(id === undefined ? { action: 'templateSave', ...body } : { action: 'templateSave', id, ...body })
}

export function deleteTemplate(id: number) {
  return post({ action: 'templateDelete', id })
}

// ── Settings ─────────────────────────────────────────────────────────────────

export function saveSettings(form: Settings) {
  return post<{ settings: Settings }>({ action: 'settings', ...settingsBody(form) })
}

// ── Tebex store (the server owner only) ──────────────────────────────────────

export function saveTebexSecret(secret: string) {
  return post<{ store: string; hint: string }>({ action: 'tebexSecret', secret: secret.trim() })
}

export function revealTebexSecret() {
  return post<{ secret: string }>({ action: 'tebexReveal' })
}

export function clearTebexSecret() {
  return post({ action: 'tebexClear' })
}

export function saveTebexStore(publicToken: string, storeUrl: string) {
  return post({ action: 'tebexStore', publicToken: publicToken.trim(), storeUrl: storeUrl.trim() })
}

// ── Loading the dashboard ────────────────────────────────────────────────────

export interface DashboardBundle {
  giveaways?: unknown
  templates?: unknown
  settings?: unknown
  roles?: unknown
  channels?: unknown
  tebex?: unknown
  packages?: unknown
}

/**
 * Everything the dashboard shows, in one round. `get` answers null when the
 * session ran out.
 *
 * The Tebex status is only asked for by owners; for everyone else the bot
 * answers 403 anyway, and a manager has no store area. The package list
 * depends on the public token, not on the secret.
 */
export async function loadDashboard(
  get: (kind: DataKind) => Promise<Record<string, unknown> | null>,
  owner: boolean,
): Promise<DashboardBundle> {
  const [gw, st, rl, ch, tp, tx] = await Promise.all([
    get('giveaways'), get('settings'), get('roles'), get('channels'), get('templates'),
    owner ? get('tebex') : Promise.resolve(null),
  ])
  const out: DashboardBundle = {
    giveaways: gw?.giveaways, templates: tp?.templates, settings: st?.settings,
    roles: rl?.roles, channels: ch?.channels, tebex: tx?.tebex,
  }
  const tebex = tx?.tebex as { publicToken?: string | null } | undefined
  if (tebex?.publicToken) {
    const pk = await get('tebexPackages')
    out.packages = pk?.packages
  }
  return out
}
