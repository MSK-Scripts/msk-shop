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
 * Die HTML-Entities, die in Tebex-Beschreibungen vorkommen.
 *
 * Wird für einen **einmaligen** Ersetzungsdurchlauf genutzt (siehe
 * `decodeEntities`). Nacheinander ausgeführte `.replace()`-Aufrufe wären hier
 * falsch: `&amp;` zuerst aufzulösen macht aus `&amp;lt;` erst `&lt;` und im
 * nächsten Schritt ein echtes `<` (Double-Unescaping, CodeQL js/double-escaping).
 */
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;':  ' ',
  '&amp;':   '&',
  '&lt;':    '<',
  '&gt;':    '>',
  '&quot;':  '"',
  '&apos;':  "'",
  '&#39;':   "'",
  '&#039;':  "'",
}

const ENTITY_RE = /&(?:nbsp|amp|lt|gt|quot|apos|#0?39);/g

/** Löst jede Entity genau einmal auf, ohne das Ergebnis erneut zu scannen. */
function decodeEntities(input: string): string {
  return input.replace(ENTITY_RE, m => HTML_ENTITIES[m] ?? m)
}

/**
 * Entfernt Tags, bis sich nichts mehr ändert.
 *
 * Ein einzelner Durchlauf reicht nicht: `<scr<b>ipt>` würde nach dem Entfernen
 * von `<b>` als `<script>` zurückbleiben (CodeQL
 * js/incomplete-multi-character-sanitization). `[^<>]*` statt `[^>]+`, damit
 * eine verschachtelte Klammer den Match begrenzt statt ihn zu verschlucken.
 */
function stripTags(input: string): string {
  let out = input
  let previous: string
  do {
    previous = out
    out = out.replace(/<[^<>]*>/g, '')
  } while (out !== previous)
  return out
}

/**
 * Macht aus Tebex-Beschreibungs-HTML einen einzeiligen Klartext-Auszug für
 * `<meta name="description">` und `og:description`.
 *
 * Reihenfolge ist bewusst Entities zuerst, dann Tags: Sonst könnte ein
 * `&lt;script&gt;` das Tag-Strippen passieren und erst danach zu echtem Markup
 * werden. Das Ergebnis landet zwar nur in Metadata-Werten, die Next.js selbst
 * escaped, aber die Funktion soll für sich genommen korrekt sein.
 *
 * Für gerendertes HTML ist weiterhin `sanitizeTebexHtml` aus `lib/sanitize.ts`
 * zuständig, nicht diese Funktion.
 */
export function plainExcerpt(html: string | undefined | null, maxLength = 160): string {
  if (!html) return ''

  // Block-Enden zu Leerzeichen, sonst kleben Sätze über Tag-Grenzen zusammen.
  const spaced = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, ' ')

  const text = stripTags(decodeEntities(spaced))
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
