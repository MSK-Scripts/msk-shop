import type { Metadata } from 'next'

import { X_DEFAULT_PATH, alternatePaths } from '@/lib/routes'
import type { Lang } from '@/lib/i18n'
import type { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'

/** Fallback image for pages without an image of their own. */
export const DEFAULT_OG_IMAGE = '/msk-scripts-server-banner.webp'

/**
 * Base OpenGraph object for a subpage.
 *
 * Next.js only merges `metadata` shallowly: as soon as a page sets `openGraph`,
 * it completely replaces the block from the root layout. Without this helper
 * every page that only wants to override `url` silently loses its `og:image`
 * and `og:site_name`. That is why the defaults are passed explicitly here.
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
 * The HTML entities that occur in Tebex descriptions.
 *
 * Used for a **single** replacement pass (see `decodeEntities`).
 * Sequential `.replace()` calls would be wrong here: resolving `&amp;` first
 * turns `&amp;lt;` into `&lt;` and in the next step into a real `<`
 * (double unescaping, CodeQL js/double-escaping).
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

/** Resolves each entity exactly once, without rescanning the result. */
function decodeEntities(input: string): string {
  return input.replace(ENTITY_RE, m => HTML_ENTITIES[m] ?? m)
}

/**
 * Removes tags until nothing changes anymore.
 *
 * A single pass is not enough: `<scr<b>ipt>` would remain as `<script>` after
 * removing `<b>` (CodeQL
 * js/incomplete-multi-character-sanitization). `[^<>]*` instead of `[^>]+`, so
 * that a nested bracket bounds the match instead of swallowing it.
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
 * Turns Tebex description HTML into a single-line plain-text excerpt for
 * `<meta name="description">` and `og:description`.
 *
 * The order is deliberately entities first, then tags: otherwise an
 * `&lt;script&gt;` could pass the tag stripping and only become real markup
 * afterwards. The result only ends up in metadata values that Next.js escapes
 * itself, but the function should be correct on its own.
 *
 * Rendered HTML is still handled by `sanitizeTebexHtml` from `lib/sanitize.ts`,
 * not by this function.
 */
export function plainExcerpt(html: string | undefined | null, maxLength = 160): string {
  if (!html) return ''

  // Block ends become spaces, otherwise sentences stick together across tag boundaries.
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
 * Canonical and hreflang for a page that exists in both languages.
 *
 * The two belong together: the canonical points to the version you are
 * currently reading, `languages` names both plus `x-default`. A canonical without
 * an hreflang pair makes Google treat one of the two versions as a duplicate,
 * and an hreflang without a return link is ignored.
 *
 * `path` is the internal path (`/legal/terms`), not a public address
 * (`/de/rechtliches/agb`): the route table turns it into both versions.
 */
export function alternatesFor(lang: Lang, path: string): NonNullable<Metadata['alternates']> {
  const alt = alternatePaths(path)
  return {
    canonical: alt[lang],
    languages: {
      en:          alt.en,
      de:          alt.de,
      // The root picks a language and redirects: the page for everyone
      // whose browser asks for neither of the two.
      'x-default': X_DEFAULT_PATH,
    },
  }
}
