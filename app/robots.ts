import type { MetadataRoute } from 'next'

import { istEinmaligeAdresse, localePath } from '@/lib/lang'
import { siteUrl } from '@/lib/siteUrl'

/**
 * robots.txt: served by Next.js at build time under /robots.txt.
 *
 * Everything behind a session (dashboards, verify flows, account,
 * checkout) or purely functional (API, Botproxy) is excluded: for crawlers
 * these routes only render a redirect anyway and would burn the crawl
 * budget on pages that never belong in the index.
 *
 * **Every block applies in both languages.** Since the language is in the path,
 * `/de/cart` is an address of its own, and a line `Disallow: /cart` says nothing
 * about it. Measured on 23.08.2026: `/de/login` and `/de/cart` were
 * crawlable and carried `index, follow`. That is why the list is generated from
 * one source for both versions instead of maintaining it twice by hand.
 */
const GESPERRT = [
  '/api/',
  '/admin',
  '/account',
  '/cart',
  '/checkout',
  '/login',
  '/auth/',
  '/botproxy',
  '/ticketbot/verify',
  '/ticketbot/dashboard',
  '/giveaway/verify',
  '/giveaway/dashboard',
  '/giveaway/g/',
]

export default function robots(): MetadataRoute.Robots {
  // `localePath` adds no prefix to a path in the default language, so the
  // English version stays exactly as written. What exists only once anyway
  // (API, Auth, Botproxy) gets no second line: under `/de/` that has returned
  // a 404 since 23.08.2026, and blocking an address that does not exist is
  // just noise in a file that someone is supposed to be able to read.
  const disallow = GESPERRT.flatMap(p =>
    istEinmaligeAdresse(p) ? [p] : [localePath('en', p), localePath('de', p)])

  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow,
      },
    ],
    // Two files, because the image sitemap carries its own namespace and
    // runs into the thousands. Both must be listed here, otherwise a crawler
    // only finds the second one through the Search Console.
    sitemap: [`${siteUrl()}/sitemap.xml`, `${siteUrl()}/sitemap-images.xml`],
    host:    siteUrl(),
  }
}
