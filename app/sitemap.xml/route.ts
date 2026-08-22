import { buildSitemapEntries, renderSitemapXml } from '@/lib/sitemap'

// Gleiche Revalidierung wie die Katalogseiten, damit neue Pakete zeitnah in
// der Sitemap stehen.
export const revalidate = 3600

export async function GET() {
  const xml = renderSitemapXml(await buildSitemapEntries())

  return new Response(xml, {
    headers: {
      // XSLT wendet der Browser nur an, wenn das Dokument als XML ausgeliefert
      // wird. `text/plain` oder ein fehlender Typ lassen die Sitemap wieder als
      // Textwüste erscheinen.
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
