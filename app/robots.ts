import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/siteUrl'

/**
 * robots.txt — von Next.js zur Build-Zeit unter /robots.txt ausgeliefert.
 *
 * Alles was hinter einer Session steht (Dashboards, Verify-Flows, Account,
 * Checkout) oder rein funktional ist (API, Botproxy) wird ausgeschlossen: Diese
 * Routen rendern für Crawler ohnehin nur einen Redirect und würden das
 * Crawl-Budget auf Seiten verbrennen, die nie in den Index gehören.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow: [
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
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host:    siteUrl(),
  }
}
