import { getCategories, getPackages } from '@/lib/tebex'
import { groupProducts } from '@/lib/products'
import { productUpdatedAt } from '@/lib/productView'
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
 * "consistently and verifiably accurate". Before, it held `new Date()` for **all**
 * URLs, so the value moved forward with every revalidation and said nothing
 * about the page. Now:
 *
 *   - product pages   → the most recent `updated_at` of their variants
 *   - category pages  → the most recent `updated_at` of their packages
 *   - everything static → **no** `lastmod` at all
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
  '/fivem',
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
 * Parses a Tebex timestamp defensively. If it is missing or unusable,
 * `undefined` is returned and the entry gets no `lastmod`, see the
 * reasoning above. The API already returns `created_at` as `null` for some
 * packages, so `updated_at` cannot be relied on without a check.
 */
function parseTimestamp(value?: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** Most recent date of a list, or `undefined` if none is usable. */
function newest(dates: Array<Date | undefined>): Date | undefined {
  const usable = dates.filter((d): d is Date => d !== undefined)
  if (usable.length === 0) return undefined
  return usable.reduce((a, b) => (a > b ? a : b))
}

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

  // Fail-soft: if Tebex is unreachable (CI build without secrets, API outage),
  // a valid sitemap with the static pages is still delivered instead of
  // bringing down the whole build.
  const [packages, categories] = await Promise.all([
    getPackages().catch(err => {
      console.warn('[sitemap] Tebex-Pakete nicht verfügbar:', err)
      return []
    }),
    getCategories().catch(err => {
      console.warn('[sitemap] Tebex-Kategorien nicht verfügbar:', err)
      return []
    }),
  ])

  // One entry per product page; the old package ids answer 308 to it.
  const packageEntries: SitemapEntry[] = groupProducts(packages).flatMap(product =>
    bothLanguages(product.path, parseTimestamp(productUpdatedAt(product))),
  )

  // `getCategories()` queries with `includePackages=1`, so the packages are
  // already there. A category page changes exactly when one of its packages
  // changes.
  const categoryEntries: SitemapEntry[] = categories.flatMap(cat =>
    bothLanguages(`/fivem/categories/${cat.id}`, newest((cat.packages ?? []).map(pkg => parseTimestamp(pkg.updated_at)))),
  )

  // Gallery: the overview and category pages belong here, the individual
  // images do NOT. There are thousands of them, and a sitemap may hold
  // 50,000 URLs, so they live in `/sitemap-images.xml`, which also brings
  // the image namespace that Google evaluates for image search.
  //
  // Fail-soft as with Tebex: without a database (CI build) the sitemap stays
  // valid instead of bringing down the build.
  const imageCategories = await listCategories('en').catch(err => {
    console.warn('[sitemap] Bildkategorien nicht verfuegbar:', err)
    return []
  })

  const imageCategoryEntries: SitemapEntry[] = imageCategories
    .filter(c => c.count > 0)
    .flatMap(c => bothLanguages(`/tools/images/${c.slug}`))

  return [...staticEntries, ...packageEntries, ...categoryEntries, ...imageCategoryEntries]
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
