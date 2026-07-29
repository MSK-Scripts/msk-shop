// NOTE: server-only module. Imported exclusively by the API route and the
// server-rendered page — never by a client component. FIVESTATS_API_KEY has
// no NEXT_PUBLIC_ prefix, so it is never inlined into the client bundle.
import {
  RESOURCE_STATS,
  RESOURCE_STATS_GAME,
  RESOURCE_STATS_HEADLINE,
  RESOURCE_STATS_PERIOD_HOURS,
  type ResourceStatEntry,
} from '@/content/resource-stats'

// ─────────────────────────────────────────────────────────────
//  fivestats.io API client (SERVER-ONLY)
//
//  The API key (FIVESTATS_API_KEY) never reaches the client — this
//  module imports 'server-only' and all calls go out from the server.
//  Read calls are cached (revalidate) so we don't hammer the upstream.
//
//  Endpoints used (per resource):
//    GET /api/resources/:name?game=            → current server_count + rank
//    GET /api/resources/:name/history?hours=   → time series for the chart
//
//  server_count/rank change over the window is derived from the history
//  (first vs. last point) so it always matches the chart's period.
// ─────────────────────────────────────────────────────────────

const BASE = 'https://fivestats.io/api'
const REVALIDATE_SECONDS = 300 // 5 min

// ── Upstream response shapes (parsed defensively) ────────────
interface FivestatsCurrent {
  resource_name?: string
  game?: string
  server_count?: number
  rank?: number
  updated_at?: string
}

interface FivestatsHistoryPoint {
  timestamp?: number
  game?: string
  server_count?: number
  rank?: number
}

// ── Public aggregate shapes (client-safe) ────────────────────
export interface ResourceLink {
  label: string
  href: string
  external: boolean
  /** 'primary' renders a filled button, 'secondary' an outline. */
  variant: 'primary' | 'secondary'
}

export interface HistoryPoint {
  t: number // unix seconds
  serverCount: number
  rank: number
}

export interface ResourceStat {
  resourceName: string
  displayName: string
  tier: 'free' | 'paid'
  links: ResourceLink[]
  /** false when the upstream returned no usable data for this resource. */
  available: boolean
  serverCount: number
  rank: number
  /** server_count delta across the history window (can be negative). */
  serverCountChange: number
  /** rank improvement across the window: positive = climbed (rank got lower). */
  rankChange: number
  updatedAt: string | null
  history: HistoryPoint[]
}

export interface ResourceStatsResult {
  /** true when at least one resource returned usable data. */
  available: boolean
  periodHours: number
  game: string
  resources: ResourceStat[]
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function buildLinks(entry: ResourceStatEntry): ResourceLink[] {
  if (entry.tier === 'paid' && entry.packages) {
    return [
      { label: 'Encrypted', href: `/packages/${entry.packages.encrypted}`, external: false, variant: 'primary' },
      { label: 'Source',    href: `/packages/${entry.packages.source}`,    external: false, variant: 'secondary' },
    ]
  }
  if (entry.github) {
    return [{ label: 'GitHub', href: entry.github, external: true, variant: 'secondary' }]
  }
  return []
}

async function fivestatsFetch<T>(path: string): Promise<T | null> {
  const key = process.env.FIVESTATS_API_KEY
  if (!key) {
    console.error('[fivestats] FIVESTATS_API_KEY is not set')
    return null
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) {
      // 404 = resource not indexed (yet) — expected, handled by the caller.
      if (res.status !== 404) console.error(`[fivestats] ${path} → ${res.status}`)
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.error(`[fivestats] ${path} failed:`, err)
    return null
  }
}

async function loadOne(entry: ResourceStatEntry, game: string, hours: number): Promise<ResourceStat> {
  const links = buildLinks(entry)
  const name = encodeURIComponent(entry.resourceName)

  const [current, historyRaw] = await Promise.all([
    fivestatsFetch<FivestatsCurrent>(`/resources/${name}?game=${game}`),
    fivestatsFetch<FivestatsHistoryPoint[]>(`/resources/${name}/history?hours=${hours}&game=${game}`),
  ])

  const history: HistoryPoint[] = (Array.isArray(historyRaw) ? historyRaw : [])
    .map(p => ({ t: num(p.timestamp), serverCount: num(p.server_count), rank: num(p.rank) }))
    .filter(p => p.t > 0)
    .sort((a, b) => a.t - b.t)

  const serverCount = current ? num(current.server_count) : (history.at(-1)?.serverCount ?? 0)
  const rank        = current ? num(current.rank)         : (history.at(-1)?.rank ?? 0)

  // Change across the window: compare the earliest history point to now.
  const first = history[0]
  const serverCountChange = first ? serverCount - first.serverCount : 0
  // Lower rank number = better placement; report improvement as positive.
  const rankChange = first && first.rank > 0 && rank > 0 ? first.rank - rank : 0

  const available = current !== null || history.length > 0

  return {
    resourceName: entry.resourceName,
    displayName:  entry.displayName,
    tier:         entry.tier,
    links,
    available,
    serverCount,
    rank,
    serverCountChange,
    rankChange,
    updatedAt: current?.updated_at ?? null,
    history,
  }
}

export interface HeadlineStat {
  /** Human-readable name, e.g. "MSK Core". */
  displayName: string
  serverCount: number
}

/**
 * Live server count of a single resource, for the homepage hero badge.
 *
 * Deliberately **one** upstream call (current value only, no history), unlike
 * `loadResourceStats()` which does two per resource. Firing 22 requests to
 * render one badge would be out of proportion for the most-visited page.
 *
 * Returns `null` on any problem (no API key, upstream down, resource not
 * indexed, count of 0). The caller then falls back to static copy, so the hero
 * never shows a broken or zeroed number.
 */
export async function loadHeadlineStat(): Promise<HeadlineStat | null> {
  const entry = RESOURCE_STATS.find(r => r.resourceName === RESOURCE_STATS_HEADLINE)
  if (!entry) {
    console.error(`[fivestats] RESOURCE_STATS_HEADLINE "${RESOURCE_STATS_HEADLINE}" not found in RESOURCE_STATS`)
    return null
  }

  const current = await fivestatsFetch<FivestatsCurrent>(
    `/resources/${encodeURIComponent(entry.resourceName)}?game=${RESOURCE_STATS_GAME}`,
  )
  if (!current) return null

  const serverCount = num(current.server_count)
  if (serverCount <= 0) return null

  return { displayName: entry.displayName, serverCount }
}

export async function loadResourceStats(): Promise<ResourceStatsResult> {
  const game  = RESOURCE_STATS_GAME
  const hours = RESOURCE_STATS_PERIOD_HOURS

  // Fault-tolerant: one failing resource must not sink the whole page.
  const settled = await Promise.allSettled(
    RESOURCE_STATS.map(entry => loadOne(entry, game, hours)),
  )

  const resources: ResourceStat[] = settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    const entry = RESOURCE_STATS[i]
    console.error(`[fivestats] loadOne(${entry.resourceName}) rejected:`, r.reason)
    return {
      resourceName: entry.resourceName,
      displayName:  entry.displayName,
      tier:         entry.tier,
      links:        buildLinks(entry),
      available:    false,
      serverCount:  0,
      rank:         0,
      serverCountChange: 0,
      rankChange:   0,
      updatedAt:    null,
      history:      [],
    }
  })

  return {
    available: resources.some(r => r.available),
    periodHours: hours,
    game,
    resources,
  }
}
