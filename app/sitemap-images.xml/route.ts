import { listCategories, listImages, MAX_PER_PAGE } from '@/lib/images'
import { absoluteUrl } from '@/lib/siteUrl'
import { alternatePaths } from '@/lib/lang'

/**
 * Image sitemap.
 *
 * Separate from `/sitemap.xml`, for two reasons:
 *
 * 1. **Volume.** A sitemap holds 50,000 URLs. The gallery's detail pages
 *    run into the thousands and would dominate the main file, which today
 *    holds 46 truly important addresses.
 * 2. **Namespace.** For image search Google evaluates `image:image`. That
 *    only belongs here; in `renderSitemapXml()` it would be dead weight for
 *    every other page.
 *
 * `lastmod` is deliberately missing, as with the static pages of the main sitemap:
 * the images practically never change after import, and a date that moves on with
 * every ingest run would be exactly the wrong signal. Google only uses
 * `lastmod` when it is verifiably accurate.
 */

export const revalidate = 3600

/** Safety net: never generate a file beyond the sitemap limit. */
const MAX_URLS = 45_000

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const categories = await listCategories('en').catch(() => [])

  const lines: string[] = []
  let count = 0

  for (const category of categories) {
    if (count >= MAX_URLS) break

    // Read page by page instead of all at once: the inventory should be allowed
    // to grow without this route eventually blowing the memory.
    for (let page = 1; ; page++) {
      const result = await listImages({ category: category.slug, page, per: MAX_PER_PAGE })
      if (!result.items.length) break

      for (const image of result.items) {
        if (count >= MAX_URLS) break
        const path = `/images/${image.category}/${image.name}`
        const alt  = alternatePaths(path)

        lines.push(
          '  <url>',
          `    <loc>${escapeXml(absoluteUrl(alt.en))}</loc>`,
          `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(absoluteUrl(alt.en))}" />`,
          `    <xhtml:link rel="alternate" hreflang="de" href="${escapeXml(absoluteUrl(alt.de))}" />`,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(alt.en))}" />`,
          '    <image:image>',
          `      <image:loc>${escapeXml(image.url)}</image:loc>`,
          `      <image:title>${escapeXml(image.label || image.name)}</image:title>`,
          '    </image:image>',
          '  </url>',
        )
        count++
      }

      if (result.page * result.per >= result.total) break
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...lines,
    '</urlset>',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
