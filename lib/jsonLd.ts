import { SITE_CONFIG } from '@/lib/config'
import { resolveDisplayPrice } from '@/lib/price'
import { absoluteUrl, siteUrl } from '@/lib/siteUrl'
import { packageImage, plainExcerpt } from '@/lib/seo'
import type { TebexPackage } from '@/types/tebex'

/**
 * Structured data (JSON-LD, schema.org) for search engines.
 *
 * The blocks are emitted by `components/JsonLd.tsx` as
 * `<script type="application/ld+json">`. That is a data block that the
 * browser does not execute, so the nonce CSP does not apply here.
 *
 * Ground rule: only mark up what is actually on the page. Markup that
 * differs from the visible content (especially the price) is treated by
 * Google as a mismatch and, at best, ignored.
 */

/** Minimal JSON value type, so the builders get by without `any`. */
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
 * The brand behind the site. Belongs in the root layout once.
 *
 * `sameAs` lists the official profiles: this lets Google consolidate the brand
 * as an entity instead of taking "MSK Scripts" for an arbitrary word.
 */
/**
 * The publisher, as structured data.
 *
 * `describe: false` omits the description instead of substituting a different
 * one. That distinction matters: the same organisation carrying two different
 * descriptions across pages is a contradiction a crawler can see, while leaving
 * the field out is simply less information. It is used on the bot landing pages,
 * where the site-wide tagline ("High quality FiveM resources & Discord bots")
 * was the strongest signal telling machines that a plain Discord bot belongs to
 * a FiveM product line. Nothing in that tagline is false; it is just the wrong
 * context for those two pages, and it was measurably being read that way.
 */
export function organizationJsonLd(opts: { describe?: boolean } = {}): JsonLdObject {
  const { describe = true } = opts
  return {
    '@context': SCHEMA,
    '@type':    'Organization',
    name:       'MSK Scripts',
    url:        siteUrl(),
    logo:       absoluteUrl('/logo.png'),
    ...(describe ? { description: SITE_CONFIG.tagline } : {}),
    sameAs: [
      SITE_CONFIG.github,
      SITE_CONFIG.discord,
      'https://www.musiker15.de',
    ],
  }
}

export interface SoftwareApplicationInput {
  name:         string
  /** Internal path of the landing page, e.g. `/ticketbot` or `/de/giveaway`. */
  path:         string
  description:  string
  /** Internal path or absolute URL of the preview image. */
  image:        string
  /** BCP-47 tag of the page language. */
  inLanguage:   string
  /** Where the source code lives. Ends up as an additional `sameAs`. */
  codeRepository?: string
}

/**
 * One of the two Discord bot landing pages as a SoftwareApplication.
 *
 * `Product` would be wrong here: the bots are not shop items but software
 * that you invite or host yourself. The price is still included as an
 * `Offer` with `0`, because "free" is a statement Google would otherwise
 * have to guess.
 *
 * **No `aggregateRating`.** Without ratings Google shows no star snippet for
 * this type, but the markup still helps with identifying the entity.
 * Making up ratings would be a policy violation, and real ones do not exist
 * yet (item 8 of the website list, deferred).
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
    // Discord bots do not run on a classic operating system. Both values
    // describe what a user actually needs.
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
  /** Internal path. Omit for the last element, that is the current page. */
  path?: string
}

/**
 * Breadcrumb trail. Must match the visible breadcrumb of the page.
 *
 * Google uses it to replace the bare URL in the result with the trail
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
      // The last element (current page) deliberately gets no `item`.
      if (crumb.path) entry.item = absoluteUrl(crumb.path)
      return entry
    }),
  }
}

export interface FaqEntry {
  question: string
  answer:   string
}

/**
 * FAQ markup for a page.
 *
 * **Required:** every question and every answer must also be visible on the
 * page. Google explicitly demands this, and markup with answers that are
 * missing from the rendered HTML is a policy violation, not a trick.
 *
 * Since 2023 Google shows the FAQ rich result only for a few government and
 * health sites. The benefit today lies elsewhere: the markup makes a
 * question-answer pair cleanly extractable, and it is exactly in this form
 * that answers get cited by language models.
 */
export function faqPageJsonLd(entries: FaqEntry[]): JsonLdObject {
  return {
    '@context': SCHEMA,
    '@type':    'FAQPage',
    mainEntity: entries.map(entry => ({
      '@type': 'Question',
      name:    entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    entry.answer,
      },
    })),
  }
}

/**
 * A Tebex package as Product + Offer.
 *
 * **Price:** deliberately the catalog price from the unauthenticated Tebex API,
 * i.e. exactly the value a logged-out visitor (and therefore also
 * Googlebot) sees on the page. The user-specific sales depend on an
 * authenticated basket ident that a crawler never has. Taking them into
 * account here would produce markup that does not match the rendered page.
 * See `resolveDisplayPrice` in `lib/price.ts`.
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
      // Digital product, delivered via Tebex.
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
