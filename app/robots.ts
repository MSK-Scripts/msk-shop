import type { MetadataRoute } from 'next'

import { LANGS } from '@/lib/lang'
import { isExemptPath, publicPath } from '@/lib/routes'
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
 * `/de/warenkorb` is an address of its own, and a line `Disallow: /en/cart` says
 * nothing about it. Measured on 23.08.2026: `/de/login` and `/de/cart` were
 * crawlable and carried `index, follow`. That is why the list holds internal
 * paths and the route table writes the public form for each language.
 */
const BLOCKED = [
  '/api/',
  '/admin',
  '/account',
  '/cart',
  '/checkout',
  '/login',
  '/auth/',
  '/botproxy',
  '/dashboard/',
  '/discord/giveaway-bot/g/',
]

export default function robots(): MetadataRoute.Robots {
  // What exists only once (API, Auth, Botproxy) gets no prefixed line: under
  // `/en/` and `/de/` it is a 404, and blocking an address that does not exist
  // is just noise in a file that someone is supposed to be able to read.
  const disallow = BLOCKED.flatMap(p =>
    isExemptPath(p.replace(/\/$/, '')) ? [p] : LANGS.map(lang => publicPath(lang, p)))

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
