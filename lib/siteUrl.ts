/**
 * Kanonische Basis-URL der Seite.
 *
 * Single Source of Truth für alles was absolute URLs braucht: `metadataBase`,
 * Canonicals, Sitemap und robots.txt. Trailing Slash wird abgeschnitten, damit
 * `${siteUrl()}/packages` nie ein doppeltes `//` erzeugt.
 */
const FALLBACK_URL = 'https://www.msk-scripts.de'

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (!raw) return FALLBACK_URL
  return raw.replace(/\/+$/, '')
}

/** Absolute URL für einen internen Pfad, z. B. `absoluteUrl('/packages')`. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
