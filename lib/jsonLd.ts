import { SITE_CONFIG } from '@/lib/config'
import { resolveDisplayPrice } from '@/lib/price'
import { absoluteUrl, siteUrl } from '@/lib/siteUrl'
import { packageImage, plainExcerpt } from '@/lib/seo'
import type { TebexPackage } from '@/types/tebex'

/**
 * Strukturierte Daten (JSON-LD, schema.org) für Suchmaschinen.
 *
 * Die Blöcke werden von `components/JsonLd.tsx` als
 * `<script type="application/ld+json">` ausgegeben. Das ist ein Datenblock, der
 * vom Browser nicht ausgeführt wird, die Nonce-CSP greift hier also nicht.
 *
 * Grundregel: Nur auszeichnen, was auf der Seite auch wirklich steht. Markup,
 * das vom sichtbaren Inhalt abweicht (v. a. beim Preis), wertet Google als
 * Mismatch und ignoriert es im besten Fall.
 */

/** Minimaler JSON-Werttyp, damit die Builder ohne `any` auskommen. */
export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue }

export type JsonLdObject = { [key: string]: JsonLdValue }

const SCHEMA = 'https://schema.org'

/**
 * Die Marke hinter der Seite. Gehört einmal ins Root-Layout.
 *
 * `sameAs` listet die offiziellen Profile: Damit kann Google die Marke als
 * Entität zusammenführen, statt „MSK Scripts" für ein beliebiges Wort zu halten.
 */
export function organizationJsonLd(): JsonLdObject {
  return {
    '@context': SCHEMA,
    '@type':    'Organization',
    name:       'MSK Scripts',
    url:        siteUrl(),
    logo:       absoluteUrl('/logo.png'),
    description: SITE_CONFIG.tagline,
    sameAs: [
      SITE_CONFIG.github,
      SITE_CONFIG.discord,
      'https://www.musiker15.de',
    ],
  }
}

export interface SoftwareApplicationInput {
  name:         string
  /** Interner Pfad der Landingpage, z. B. `/ticketbot` oder `/de/giveaway`. */
  path:         string
  description:  string
  /** Interner Pfad oder absolute URL des Vorschaubilds. */
  image:        string
  /** BCP-47-Tag der Seitensprache. */
  inLanguage:   string
  /** Wo der Quellcode liegt. Landet als zusätzliches `sameAs`. */
  codeRepository?: string
}

/**
 * Eine der beiden Discord-Bot-Landingpages als SoftwareApplication.
 *
 * `Product` wäre hier falsch: Die Bots sind keine Shop-Artikel, sondern
 * Software, die man einlädt oder selbst hostet. Der Preis steht trotzdem als
 * `Offer` mit `0` drin, weil „kostenlos" eine Aussage ist, die Google sonst
 * raten müsste.
 *
 * **Kein `aggregateRating`.** Ohne Bewertungen zeigt Google für diesen Typ kein
 * Sterne-Snippet, das Markup hilft aber trotzdem beim Zuordnen der Entität.
 * Bewertungen zu erfinden wäre ein Richtlinienverstoß, und echte gibt es noch
 * nicht (Punkt 8 der Website-Liste, zurückgestellt).
 */
export function softwareApplicationJsonLd(input: SoftwareApplicationInput): JsonLdObject {
  const url = absoluteUrl(input.path)

  const app: JsonLdObject = {
    '@context':  SCHEMA,
    '@type':     'SoftwareApplication',
    name:        input.name,
    url,
    description: input.description,
    image:       input.image.startsWith('http') ? input.image : absoluteUrl(input.image),
    // Discord-Bots laufen nicht auf einem klassischen Betriebssystem. Beide
    // Angaben beschreiben, was ein Nutzer tatsächlich braucht.
    applicationCategory: 'CommunicationApplication',
    operatingSystem:     'Discord, Node.js 18+',
    inLanguage:          input.inLanguage,
    isAccessibleForFree: true,
    offers: {
      '@type':       'Offer',
      price:         '0',
      priceCurrency: 'EUR',
      availability:  `${SCHEMA}/InStock`,
    },
    author: {
      '@type': 'Organization',
      name:    'MSK Scripts',
      url:     siteUrl(),
    },
  }

  if (input.codeRepository) {
    app.codeRepository = input.codeRepository
    app.sameAs = [input.codeRepository]
  }

  return app
}

export interface Crumb {
  name: string
  /** Interner Pfad. Beim letzten Element weglassen, das ist die aktuelle Seite. */
  path?: string
}

/**
 * Breadcrumb-Pfad. Muss der sichtbaren Breadcrumb der Seite entsprechen.
 *
 * Google ersetzt damit die nackte URL im Treffer durch den Pfad
 * (`msk-scripts.de › Packages › …`).
 */
export function breadcrumbJsonLd(crumbs: Crumb[]): JsonLdObject {
  return {
    '@context': SCHEMA,
    '@type':    'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => {
      const entry: JsonLdObject = {
        '@type':  'ListItem',
        position: index + 1,
        name:     crumb.name,
      }
      // Das letzte Element (aktuelle Seite) bekommt bewusst kein `item`.
      if (crumb.path) entry.item = absoluteUrl(crumb.path)
      return entry
    }),
  }
}

/**
 * Ein Tebex-Paket als Product + Offer.
 *
 * **Preis:** bewusst der Katalogpreis aus der unauthentifizierten Tebex-API,
 * also exakt der Wert, den ein ausgeloggter Besucher (und damit auch der
 * Googlebot) auf der Seite sieht. Die user-spezifischen Sales hängen an einem
 * authentifizierten Basket-Ident, den ein Crawler nie hat. Sie hier zu
 * berücksichtigen würde ein Markup erzeugen, das nicht zur gerenderten Seite
 * passt. Siehe `resolveDisplayPrice` in `lib/price.ts`.
 */
export function productJsonLd(pkg: TebexPackage, description?: string): JsonLdObject {
  const { price } = resolveDisplayPrice(pkg.base_price ?? 0, pkg.total_price ?? pkg.base_price ?? 0)
  const url = absoluteUrl(`/packages/${pkg.id}`)

  const product: JsonLdObject = {
    '@context': SCHEMA,
    '@type':    'Product',
    name:       pkg.name,
    url,
    image:      packageImage(pkg),
    brand: {
      '@type': 'Brand',
      name:    'MSK Scripts',
    },
    offers: {
      '@type':         'Offer',
      url,
      price:           price.toFixed(2),
      priceCurrency:   pkg.currency || 'EUR',
      availability:    `${SCHEMA}/InStock`,
      // Digitales Produkt, Auslieferung über Tebex.
      itemCondition:   `${SCHEMA}/NewCondition`,
      seller: {
        '@type': 'Organization',
        name:    'MSK Scripts',
      },
    },
  }

  const text = description ?? plainExcerpt(pkg.description, 300)
  if (text) product.description = text

  if (pkg.category?.name) {
    product.category = pkg.category.name
  }

  return product
}
