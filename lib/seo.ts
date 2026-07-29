import type { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'

import type { TebexPackage } from '@/types/tebex'

/** Fallback-Bild, wenn ein Tebex-Objekt kein eigenes Bild mitbringt. */
export const DEFAULT_OG_IMAGE = '/msk-scripts-server-banner.webp'

/**
 * Basis-OpenGraph-Objekt für eine Unterseite.
 *
 * Next.js merged `metadata` nur flach: Sobald eine Seite `openGraph` setzt,
 * ersetzt das den Block aus dem Root-Layout komplett. Ohne diesen Helper
 * verliert jede Seite, die nur `url` überschreiben will, still ihr `og:image`
 * und `og:site_name`. Deshalb werden die Defaults hier explizit mitgegeben.
 */
export function openGraphFor(overrides: OpenGraph & { images?: OpenGraph['images'] }): OpenGraph {
  return {
    type:     'website',
    siteName: 'MSK Scripts',
    locale:   'en_US',
    images:   [{ url: DEFAULT_OG_IMAGE, width: 1920, height: 1080, alt: 'MSK Scripts' }],
    ...overrides,
  }
}

/**
 * Macht aus Tebex-Beschreibungs-HTML einen einzeiligen Klartext-Auszug für
 * `<meta name="description">` und `og:description`.
 *
 * Bewusst simpel gehalten: Tags raus, die paar HTML-Entities die Tebex nutzt
 * auflösen, Whitespace kollabieren, an einer Wortgrenze kürzen. Das Ergebnis
 * landet nie im DOM (Next.js escaped Metadata-Werte), es geht hier also rein um
 * Lesbarkeit, nicht um Sanitizing.
 */
export function plainExcerpt(html: string | undefined | null, maxLength = 160): string {
  if (!html) return ''

  const text = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text

  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/**
 * Bestes verfügbares Vorschaubild eines Tebex-Pakets.
 *
 * Reihenfolge: explizites `image`, dann das als primär markierte Medium, dann
 * das erste Medium überhaupt, sonst das Seiten-Banner. Tebex liefert absolute
 * CDN-URLs, die von `metadataBase` unangetastet durchgereicht werden.
 */
export function packageImage(pkg: Pick<TebexPackage, 'image' | 'media'>): string {
  if (pkg.image) return pkg.image

  const media = pkg.media ?? []
  const primary = media.find(m => m.primary && m.url)
  if (primary) return primary.url

  const first = media.find(m => m.url)
  return first ? first.url : DEFAULT_OG_IMAGE
}
