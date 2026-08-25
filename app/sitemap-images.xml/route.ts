import { listCategories, listImages, MAX_PER_PAGE } from '@/lib/images'
import { absoluteUrl } from '@/lib/siteUrl'
import { alternatePaths } from '@/lib/lang'

/**
 * Bilder-Sitemap.
 *
 * Getrennt von `/sitemap.xml`, aus zwei Gruenden:
 *
 * 1. **Menge.** Eine Sitemap fasst 50.000 URLs. Die Detailseiten der Galerie
 *    gehen in die Tausende und wuerden die Hauptdatei dominieren, in der heute
 *    46 wirklich wichtige Adressen stehen.
 * 2. **Namespace.** Google wertet fuer die Bildersuche `image:image` aus. Das
 *    gehoert nur hierher, in `renderSitemapXml()` waere es fuer jede andere
 *    Seite Ballast.
 *
 * `lastmod` fehlt bewusst, wie bei den statischen Seiten der Hauptsitemap: die
 * Bilder aendern sich nach dem Import praktisch nie, und ein Datum, das mit
 * jedem Ingest-Lauf weiterwandert, waere genau das falsche Signal. Google nutzt
 * `lastmod` nur, wenn es nachweisbar stimmt.
 */

export const revalidate = 3600

/** Sicherheitsnetz: keine Datei ueber das Sitemap-Limit hinaus erzeugen. */
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

    // Seitenweise lesen statt alles auf einmal: der Bestand soll wachsen
    // duerfen, ohne dass diese Route irgendwann den Speicher sprengt.
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
