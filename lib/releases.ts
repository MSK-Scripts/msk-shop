import { RESOURCE_STATS, type ResourceStatEntry } from '@/content/resource-stats'

/**
 * Release log for the homepage hero.
 *
 * Source is the public `MSK-Scripts/VERSIONS` repository — the very same files
 * every script polls at runtime through its own `server/versionchecker.lua`.
 * That matters: it is the list that already has to be correct for the version
 * checker to work, so the homepage cannot show something the scripts disagree
 * with, and nobody has to maintain a second copy.
 *
 * Two requests per resource:
 *   1. `raw.githubusercontent.com` for the version and its changelog,
 *   2. the GitHub commits API for the date that file was last touched.
 *
 * The date is deliberately the commit date rather than a field inside the JSON:
 * the JSON has no date, and inventing one would be exactly the kind of
 * unverifiable claim this page is supposed to get rid of.
 *
 * Everything is fail-soft. A resource that cannot be loaded is dropped; if all
 * of them fail the caller gets an empty array and simply renders nothing.
 */

const RAW = 'https://raw.githubusercontent.com/MSK-Scripts/VERSIONS/main'
const API = 'https://api.github.com/repos/MSK-Scripts/VERSIONS/commits'

/**
 * One hour. With eight tracked resources that is 16 upstream requests per hour,
 * comfortably inside GitHub's unauthenticated budget of 60 per hour and IP.
 */
const REVALIDATE_SECONDS = 3600

/** Lines that only enumerate touched files carry nothing for a visitor. */
const FILE_LIST_LINE = /^-?\s*Changed files\b/i

/** Longest summary we render before cutting on a word boundary. */
const MAX_SUMMARY = 130

export interface ReleaseEntry {
  /** FiveM resource folder name, e.g. `msk_vehiclekeys`. */
  resourceName: string
  /** Human-readable name, e.g. `MSK VehicleKeys`. */
  displayName: string
  /** Newest version from the VERSIONS file, e.g. `5.4.2`. */
  version: string
  /** ISO timestamp of the commit that last changed the file. */
  date: string
  /** First meaningful changelog line, trimmed for display. */
  summary: string
}

interface VersionsFileEntry {
  version?: unknown
  changelogs?: unknown
}

/** Trims a changelog bullet down to something that fits one or two lines. */
export function summarize(changelogs: unknown): string {
  if (!Array.isArray(changelogs)) return ''

  const line = changelogs
    .filter((l): l is string => typeof l === 'string')
    .map(l => l.replace(/^\s*[-*]\s*/, '').trim())
    .filter(l => l.length > 0 && !FILE_LIST_LINE.test(l))[0]

  if (!line) return ''

  const flat = line.replace(/\s+/g, ' ')
  if (flat.length <= MAX_SUMMARY) return flat

  const cut = flat.slice(0, MAX_SUMMARY)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > MAX_SUMMARY * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.]$/, '') + '…'
}

/** Picks the newest entry. The files are maintained newest-first. */
export function newestVersion(parsed: unknown): VersionsFileEntry | null {
  if (!Array.isArray(parsed) || parsed.length === 0) return null
  const first = parsed[0]
  if (!first || typeof first !== 'object') return null
  const version = (first as VersionsFileEntry).version
  if (typeof version !== 'string' || !version.trim()) return null
  return first as VersionsFileEntry
}

async function fetchJson(url: string, accept?: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: accept ? { Accept: accept } : undefined,
    next: { revalidate: REVALIDATE_SECONDS },
  })
  if (!res.ok) throw new Error(`${url} antwortete mit ${res.status}`)
  return res.json()
}

async function lastCommitDate(file: string): Promise<string | null> {
  try {
    const data = await fetchJson(
      `${API}?path=${encodeURIComponent(file)}&per_page=1`,
      'application/vnd.github+json',
    )
    if (!Array.isArray(data) || data.length === 0) return null
    const date = data[0]?.commit?.author?.date ?? data[0]?.commit?.committer?.date
    if (typeof date !== 'string') return null
    // Ein unparsbares Datum ist schlimmer als gar keins: es würde als
    // "Invalid Date" durchs Rendering laufen.
    return Number.isNaN(Date.parse(date)) ? null : date
  } catch {
    return null
  }
}

async function loadOne(entry: ResourceStatEntry): Promise<ReleaseEntry | null> {
  if (!entry.versionsFile) return null
  try {
    const [parsed, date] = await Promise.all([
      fetchJson(`${RAW}/${entry.versionsFile}`),
      lastCommitDate(entry.versionsFile),
    ])
    const newest = newestVersion(parsed)
    // Ohne Datum liesse sich der Eintrag nicht einsortieren, und "zuletzt
    // gepflegt" ohne Zeitpunkt ist keine Aussage.
    if (!newest || !date) return null

    return {
      resourceName: entry.resourceName,
      displayName: entry.displayName,
      version: String(newest.version).trim(),
      date,
      summary: summarize(newest.changelogs),
    }
  } catch {
    return null
  }
}

/**
 * Newest releases across all resources that declare a `versionsFile`,
 * most recent first.
 *
 * Never throws. Callers render nothing when the array is empty.
 */
export async function loadReleases(limit = 4): Promise<ReleaseEntry[]> {
  const tracked = RESOURCE_STATS.filter(r => r.versionsFile)
  const settled = await Promise.allSettled(tracked.map(loadOne))

  return settled
    .flatMap(r => (r.status === 'fulfilled' && r.value ? [r.value] : []))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, Math.max(0, limit))
}
