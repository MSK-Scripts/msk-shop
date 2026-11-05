import { listCategories } from '@/lib/images'
import { absoluteUrl } from '@/lib/siteUrl'
import { X_DEFAULT_PATH, alternatePaths } from '@/lib/routes'

/**
 * Sitemap: data assembly and serialization.
 *
 * Why by hand and not via Next's `app/sitemap.ts`: its serializer offers no
 * place for an `<?xml-stylesheet?>` instruction. Without it the browser
 * renders the file as concatenated text, which makes any manual inspection
 * useless. Google does not care about the stylesheet, it reads the XML.
 *
 * Why neither `priority` nor `changefreq` is here: Google ignores both fields
 * completely (Search Central, "Build and Submit a Sitemap"). They were in the
 * file until 22.08.2026 and did nothing except pretend to offer a control
 * that does not exist.
 *
 * `lastmod`, on the other hand, is evaluated by Google, but only if the value is
 * "consistently and verifiably accurate". Before 22.08.2026 it held `new Date()`
 * for **all** URLs, so the value moved forward with every revalidation and
 * said nothing about the page. The product and category pages took theirs
 * from Tebex' `updated_at`; they left the sitemap on 05.11.2026 with the paid
 * scripts (they redirect now, see `retiredRedirect` in lib/routes.ts). What
 * is left has **no** `lastmod` at all.
 *
 * No date is better than a wrong one: if it is missing, Google simply does not
 * use it. If it is recognizably made up, the whole file loses its credibility.
 */

export interface SitemapEntry {
  url:           string
  lastModified?: Date
  /** hreflang → absolute URL. Leave empty if the page is single-language. */
  alternates?:   Record<string, string>
}

/** Path to the XSL stylesheet that lets the browser show the sitemap as a table. */
export const SITEMAP_STYLESHEET = '/sitemap.xsl'

/** Static, publicly indexable pages. */
const STATIC_ROUTES = [
  '/',
  '/fivem/free',
  '/stats',
  '/discord',
  '/tools',
  '/about',
  '/tools/images',
  '/tools/images/upload',
  '/discord/ticket-bot',
  '/discord/ticket-bot/compare',
  '/discord/giveaway-bot',
  '/discord/ticket-bot/stats',
  '/discord/giveaway-bot/stats',
  '/legal/terms',
  '/legal/imprint',
  '/legal/privacy',
  '/legal/withdrawal',
  '/legal/dpa',
  // The three mandatory forms belong in the sitemap, not in robots.txt:
  // they must be reachable without logging in and without searching.
  '/withdraw-contract',
  '/cancel-contract',
  '/report',
]

/**
 * Every page is in the sitemap twice, once per language, and both entries
 * name the same hreflang trio. Google does not evaluate a one-sided or
 * mismatched pair.
 *
 * Since 22.08.2026 this applies to the whole tree and no longer only to the
 * two bot landing pages: the language is in the path, `/de/fivem` is a
 * separate address with its own content.
 */
function bothLanguages(path: string, lastModified?: Date): SitemapEntry[] {
  const alt = alternatePaths(path)
  const alternates = {
    'en':        absoluteUrl(alt.en),
    'de':        absoluteUrl(alt.de),
    'x-default': absoluteUrl(X_DEFAULT_PATH),
  }
  return (['en', 'de'] as const).map(lang => ({
    url: absoluteUrl(alt[lang]),
    lastModified,
    alternates,
  }))
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const staticEntries: SitemapEntry[] = STATIC_ROUTES.flatMap(path => bothLanguages(path))

  // Gallery: the overview and category pages belong here, the individual
  // images do NOT. There are thousands of them, and a sitemap may hold
  // 50,000 URLs, so they live in `/sitemap-images.xml`, which also brings
  // the image namespace that Google evaluates for image search.
  //
  // Fail-soft: without a database (CI build) the sitemap stays valid instead
  // of bringing down the build.
  const imageCategories = await listCategories('en').catch(err => {
    console.warn('[sitemap] Bildkategorien nicht verfuegbar:', err)
    return []
  })

  const imageCategoryEntries: SitemapEntry[] = imageCategories
    .filter(c => c.count > 0)
    .flatMap(c => bothLanguages(`/tools/images/${c.slug}`))

  return [...staticEntries, ...imageCategoryEntries]
}

/**
 * Escapes the five characters that may not appear raw in XML text or attribute
 * values. Today all URLs contain only digits and letters, but a serializer
 * that relies on that produces a broken file at the first special
 * character.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const hasAlternates = entries.some(e => e.alternates && Object.keys(e.alternates).length > 0)

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<?xml-stylesheet type="text/xsl" href="${SITEMAP_STYLESHEET}"?>`,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
      + (hasAlternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : '')
      + '>',
  ]

  for (const entry of entries) {
    lines.push('<url>')
    lines.push(`<loc>${escapeXml(entry.url)}</loc>`)
    for (const [hreflang, href] of Object.entries(entry.alternates ?? {})) {
      lines.push(`<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`)
    }
    if (entry.lastModified) lines.push(`<lastmod>${entry.lastModified.toISOString()}</lastmod>`)
    lines.push('</url>')
  }

  lines.push('</urlset>')
  return lines.join('\n') + '\n'
}
