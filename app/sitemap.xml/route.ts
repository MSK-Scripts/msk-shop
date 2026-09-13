import { buildSitemapEntries, renderSitemapXml } from '@/lib/sitemap'

// Same revalidation as the catalogue pages, so that new packages show up in
// the sitemap promptly.
export const revalidate = 3600

export async function GET() {
  const xml = renderSitemapXml(await buildSitemapEntries())

  return new Response(xml, {
    headers: {
      // The browser only applies XSLT when the document is delivered as
      // XML. `text/plain` or a missing type make the sitemap appear as a
      // wall of text again.
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
