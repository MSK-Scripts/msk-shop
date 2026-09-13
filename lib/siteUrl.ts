/**
 * Canonical base URL of the site.
 *
 * Single source of truth for everything that needs absolute URLs: `metadataBase`,
 * canonicals, sitemap and robots.txt. The trailing slash is cut off, so that
 * `${siteUrl()}/packages` never produces a double `//`.
 */
const FALLBACK_URL = 'https://www.msk-scripts.de'

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (!raw) return FALLBACK_URL
  return raw.replace(/\/+$/, '')
}

/** Absolute URL for an internal path, e.g. `absoluteUrl('/packages')`. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
