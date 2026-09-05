// NOTE: server module. No secret behind it, the sitemap is public -- but
// fetching it server-side happens ONCE per hour for every visitor instead of
// once per page view in the browser, and the value is already in the delivered
// markup instead of arriving later.

/**
 * How many pages the documentation publishes.
 *
 * Until 05.09.2026 this was `DOC_PAGES = 206`, a constant in
 * `components/home/ProofLine.tsx`. Measured while replacing it: **208**. So the
 * constant was already wrong, and nobody notices that kind of thing: the proof
 * line claims every one of its figures is measured, and one of them was a
 * hand-written number going stale with every docs commit.
 *
 * The source is the docs sitemap, because the Docusaurus build produces it
 * anyway and it therefore lists exactly the pages that are really served. A
 * second way of counting (counting files in the docs repo) would have had its
 * own opinion about what a page is.
 *
 * **Every `<url>` entry counts**, including `/datenschutz/`. The honest label
 * is "pages in the documentation", not "pages I consider documentation"; any
 * filter rule would be an interpretation nobody can recompute.
 */

const SITEMAP_URL = 'https://docu.msk-scripts.de/sitemap.xml'

/** One hour. The docs change in commits, not in seconds. */
const REVALIDATE_SECONDS = 3600

/** Cap on the response we read, so a broken upstream cannot eat memory. */
const MAX_BYTES = 2 * 1024 * 1024

/**
 * Returns the count, or `null` when it cannot be determined.
 *
 * `null` and no substitute figure, which is the same rule the proof line is
 * built on anyway: an entry whose source is currently unavailable drops out. A
 * frozen last-known number would be exactly the claim this change removes.
 */
export async function loadDocPageCount(): Promise<number | null> {
  try {
    const res = await fetch(SITEMAP_URL, {
      // No cookie, no referrer: this is public XML and the request comes from
      // the server.
      headers: { accept: 'application/xml,text/xml' },
      next:    { revalidate: REVALIDATE_SECONDS },
    })

    if (!res.ok) {
      console.error(`[docsPages] sitemap responded ${res.status}`)
      return null
    }

    const xml = await res.text()
    if (xml.length > MAX_BYTES) {
      console.error('[docsPages] sitemap is implausibly large, ignoring it')
      return null
    }

    return countUrls(xml)
  } catch (e) {
    console.error('[docsPages] could not read the sitemap:', e)
    return null
  }
}

/**
 * Count `<url>` elements.
 *
 * Deliberately the opening tags and not `<loc>`: `<loc>` also appears in a
 * sitemap index, but there once per partial sitemap instead of once per page.
 * Should the docs ever grow into an index, this returns `0` rather than an
 * invented figure, and the entry disappears instead of reporting a handful of
 * partial sitemaps as "pages".
 *
 * The pattern covers `<url>` and `<sm:url>` while leaving `<urlset>` out,
 * because the name must be followed by a `>` or whitespace.
 */
export function countUrls(xml: string): number {
  return (xml.match(/<(?:[a-zA-Z0-9_-]+:)?url(?:\s[^>]*)?>/g) ?? []).length
}
