import type { MetadataRoute } from 'next'

import { istEinmaligeAdresse, localePath } from '@/lib/lang'
import { siteUrl } from '@/lib/siteUrl'

/**
 * robots.txt — von Next.js zur Build-Zeit unter /robots.txt ausgeliefert.
 *
 * Alles was hinter einer Session steht (Dashboards, Verify-Flows, Account,
 * Checkout) oder rein funktional ist (API, Botproxy) wird ausgeschlossen: Diese
 * Routen rendern für Crawler ohnehin nur einen Redirect und würden das
 * Crawl-Budget auf Seiten verbrennen, die nie in den Index gehören.
 *
 * **Jede Sperre gilt in beiden Sprachen.** Seit die Sprache im Pfad steht, ist
 * `/de/cart` eine eigene Adresse, und eine Zeile `Disallow: /cart` sagt über
 * sie nichts. Nachgemessen am 23.08.2026: `/de/login` und `/de/cart` waren
 * crawlbar und trugen `index, follow`. Deshalb wird die Liste aus einer Quelle
 * für beide Fassungen erzeugt, statt sie von Hand doppelt zu pflegen.
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
  // `localePath` hängt kein Präfix an einen Pfad der Standardsprache, die
  // englische Fassung bleibt also wörtlich stehen. Was es ohnehin nur einmal
  // gibt (API, Auth, Botproxy), bekommt keine zweite Zeile: unter `/de/` liefert
  // das seit dem 23.08.2026 ein 404, und eine Sperre auf eine Adresse, die es
  // nicht gibt, ist nur Rauschen in einer Datei, die jemand lesen können soll.
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
    // Zwei Dateien, weil die Bilder-Sitemap einen eigenen Namespace trägt und
    // in die Tausende geht. Beide müssen hier stehen, sonst findet ein Crawler
    // die zweite nur über die Search Console.
    sitemap: [`${siteUrl()}/sitemap.xml`, `${siteUrl()}/sitemap-images.xml`],
    host:    siteUrl(),
  }
}
