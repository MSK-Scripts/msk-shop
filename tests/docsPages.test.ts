import { describe, it, expect } from 'vitest'
import { countUrls } from '@/lib/docsPages'

/**
 * Counting the documentation pages.
 *
 * The reason for this file is not the number but the question of WHAT gets
 * counted. Until 05.09.2026 the code carried `206` as a constant; switching to
 * the sitemap produced 208. A count that quietly counts the wrong thing is the
 * very same mistake again, only harder to see.
 */
const urlset = (locs: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
  + locs.map(l => `<url><loc>${l}</loc></url>`).join('')
  + `</urlset>`

describe('countUrls', () => {
  it('counts one per url element', () => {
    expect(countUrls(urlset(['https://d/a/', 'https://d/b/', 'https://d/c/']))).toBe(3)
  })

  it('does not count the surrounding urlset', () => {
    // `<urlset>` starts with the same four characters as `<url>`. A naive
    // `indexOf('<url')` would have counted 4 here instead of 3.
    expect(countUrls(urlset(['a', 'b', 'c']))).toBe(3)
  })

  it('is 0 for an empty sitemap', () => {
    expect(countUrls(urlset([]))).toBe(0)
  })

  it('handles a namespace prefix', () => {
    expect(countUrls('<sm:urlset><sm:url><sm:loc>a</sm:loc></sm:url></sm:urlset>')).toBe(1)
  })

  it('handles attributes on the url element', () => {
    expect(countUrls('<urlset><url foo="bar"><loc>a</loc></url></urlset>')).toBe(1)
  })

  /**
   * The actual reason for counting `<url>` rather than `<loc>`.
   *
   * A sitemap index carries `<loc>` too, but once per partial sitemap instead
   * of once per page. Should the docs ever grow into one, this returns `0`, the
   * entry drops out of the proof line, and nobody ever reads "3 doc pages".
   */
  it('returns 0 for a sitemap index instead of counting its parts as pages', () => {
    const index = '<sitemapindex>'
      + '<sitemap><loc>https://d/sitemap-1.xml</loc></sitemap>'
      + '<sitemap><loc>https://d/sitemap-2.xml</loc></sitemap>'
      + '</sitemapindex>'
    expect(countUrls(index)).toBe(0)
  })

  it('is not fooled by the word url inside a loc', () => {
    expect(countUrls(urlset(['https://d/docs/url-parameter/']))).toBe(1)
  })
})
