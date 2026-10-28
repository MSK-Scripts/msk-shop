import { describe, expect, it } from 'vitest'

import { breadcrumbJsonLd, organizationJsonLd, productJsonLd, softwareApplicationJsonLd, webSiteJsonLd } from '@/lib/jsonLd'
import type { ProductJsonLdInput } from '@/lib/jsonLd'

function makeProduct(overrides: Partial<ProductJsonLdInput> = {}): ProductJsonLdInput {
  return {
    name:        'MSK Garage',
    path:        '/fivem/garage',
    image:       'https://cdn/garage-screenshot.png',
    description: 'Ein Garagen-System.',
    offers:      [{ price: 19.99, currency: 'EUR' }],
    ...overrides,
  }
}

describe('organizationJsonLd', () => {
  it('beschreibt die Marke mit Logo und Profilen', () => {
    const org = organizationJsonLd()

    expect(org['@type']).toBe('Organization')
    expect(org.name).toBe('MSK Scripts')
    expect(String(org.url)).toMatch(/^https:\/\//)
    expect(String(org.logo)).toMatch(/\/logo\.png$/)
    expect(Array.isArray(org.sameAs)).toBe(true)
    expect((org.sameAs as string[]).length).toBeGreaterThan(0)
  })
})

describe('breadcrumbJsonLd', () => {
  it('nummeriert ab 1 und verlinkt alle bis auf die aktuelle Seite', () => {
    const crumbs = breadcrumbJsonLd([
      { name: 'Home',     path: '/' },
      { name: 'Packages', path: '/en/fivem' },
      { name: 'MSK Garage' },
    ])

    const items = crumbs.itemListElement as Array<Record<string, unknown>>
    expect(items).toHaveLength(3)
    expect(items.map(i => i.position)).toEqual([1, 2, 3])
    expect(items[1].item).toMatch(/\/en\/fivem$/)

    // The last element is the current page and deliberately gets no `item`.
    expect(items[2].item).toBeUndefined()
    expect(items[2].name).toBe('MSK Garage')
  })
})

describe('productJsonLd', () => {
  it('zeichnet Preis, Währung und Verfügbarkeit aus', () => {
    const product = productJsonLd(makeProduct())
    const offer = product.offers as Record<string, unknown>

    expect(product['@type']).toBe('Product')
    expect(product.name).toBe('MSK Garage')
    expect(product.image).toBe('https://cdn/garage-screenshot.png')
    expect(offer['@type']).toBe('Offer')
    expect(offer.price).toBe('19.99')
    expect(offer.priceCurrency).toBe('EUR')
    expect(offer.availability).toBe('https://schema.org/InStock')
    expect(String(offer.url)).toMatch(/\/en\/fivem\/garage$/)
  })

  it('formatiert den Preis immer mit zwei Nachkommastellen', () => {
    const product = productJsonLd(makeProduct({ offers: [{ price: 20, currency: 'EUR' }] }))
    expect((product.offers as Record<string, unknown>).price).toBe('20.00')
  })

  // Encrypted and Source are two offers on one page since Phase 4: the markup
  // names the range and both prices, as the buy box does.
  it('names both variants of a product as an AggregateOffer', () => {
    const product = productJsonLd(makeProduct({
      offers: [
        { name: 'Encrypted', price: 19.99, currency: 'EUR' },
        { name: 'Source',    price: 39.99, currency: 'EUR' },
      ],
    }))
    const aggregate = product.offers as Record<string, unknown>
    const offers = aggregate.offers as Array<Record<string, unknown>>

    expect(aggregate['@type']).toBe('AggregateOffer')
    expect(aggregate.lowPrice).toBe('19.99')
    expect(aggregate.highPrice).toBe('39.99')
    expect(aggregate.offerCount).toBe(2)
    expect(offers.map(o => [o.name, o.price])).toEqual([['Encrypted', '19.99'], ['Source', '39.99']])
  })

  it('übernimmt die Beschreibung und lässt sie ohne weg', () => {
    expect(productJsonLd(makeProduct()).description).toBe('Ein Garagen-System.')
    expect(productJsonLd(makeProduct({ description: undefined }))).not.toHaveProperty('description')
  })

  // The JSON block ends up in a <script> element. A `<` in the value must not
  // be able to break out of the block.
  it('bleibt nach dem Escaping ein gültiger, ausbruchsicherer Script-Inhalt', () => {
    const product = productJsonLd(makeProduct({ name: '</script><img src=x onerror=alert(1)>' }))
    const serialized = JSON.stringify(product).replace(/</g, '\\u003c')

    expect(serialized).not.toContain('</script>')
    expect(serialized).not.toContain('<img')
    // Despite escaping, the value must parse back unaltered.
    expect(JSON.parse(serialized).name).toBe('</script><img src=x onerror=alert(1)>')
  })
})

describe('softwareApplicationJsonLd', () => {
  const app = softwareApplicationJsonLd({
    name:        'MSK Discord Ticket Bot',
    path:        '/de/discord/ticket-bot',
    description: 'Kostenloser Discord Ticket Bot zum Selbsthosten.',
    image:       '/discord_ticketbot_banner.webp',
    inLanguage:  'de-DE',
  })

  it('zeichnet die Landingpage als SoftwareApplication aus, nicht als Product', () => {
    expect(app['@type']).toBe('SoftwareApplication')
    expect(app.name).toBe('MSK Discord Ticket Bot')
    expect(app.inLanguage).toBe('de-DE')
  })

  it('macht aus internen Pfaden absolute URLs', () => {
    expect(String(app.url)).toMatch(/^https?:\/\/.+\/de\/discord\/ticket-bot$/)
    expect(String(app.image)).toMatch(/^https?:\/\/.+\/discord_ticketbot_banner\.webp$/)
  })

  it('lässt eine bereits absolute Bild-URL unangetastet', () => {
    const withCdn = softwareApplicationJsonLd({
      name: 'x', path: '/en/discord/giveaway-bot', description: 'x',
      image: 'https://cdn.example/banner.png', inLanguage: 'en-US',
    })
    expect(withCdn.image).toBe('https://cdn.example/banner.png')
  })

  it('weist den Preis 0 aus, statt ihn Google raten zu lassen', () => {
    const offers = app.offers as Record<string, unknown>
    expect(offers.price).toBe('0')
    expect(offers.priceCurrency).toBe('EUR')
    expect(app.isAccessibleForFree).toBe(true)
  })

  // Without real reviews, aggregateRating would be made up. That is a
  // policy violation and would otherwise surface at some point as a manual action.
  it('erfindet keine Bewertungen', () => {
    expect(app.aggregateRating).toBeUndefined()
    expect(app.review).toBeUndefined()
  })

  it('nimmt das Repository nur auf, wenn es eins gibt', () => {
    expect(app.codeRepository).toBeUndefined()
    expect(app.sameAs).toBeUndefined()

    const oss = softwareApplicationJsonLd({
      name: 'x', path: '/en/discord/giveaway-bot', description: 'x', image: '/x.webp',
      inLanguage: 'en-US', codeRepository: 'https://github.com/MSK-Scripts/discord_giveawaybot',
    })
    expect(oss.codeRepository).toBe('https://github.com/MSK-Scripts/discord_giveawaybot')
    expect(oss.sameAs).toEqual(['https://github.com/MSK-Scripts/discord_giveawaybot'])
  })
})

describe('organizationJsonLd describe option', () => {
  it('carries the site tagline by default', () => {
    expect(organizationJsonLd()).toHaveProperty('description')
  })

  // Omitted, not replaced. Two different descriptions for the same organisation
  // across pages is a contradiction a crawler can see; leaving the field out is
  // simply less information. Used on the bot landing pages, where the site-wide
  // tagline leads with FiveM and had language models filing a plain Discord bot
  // as a FiveM extension.
  it('omits the description entirely when asked to', () => {
    const org = organizationJsonLd({ describe: false })
    expect(org).not.toHaveProperty('description')
    expect(org.name).toBe('MSK Scripts')
    expect(org).toHaveProperty('url')
    expect(org).toHaveProperty('sameAs')
  })
})

describe('productJsonLd language', () => {
  // Until 01.10.2026 the German page named the English address in `url` and
  // `offers.url`, against its own canonical.
  it('names the address of the page it sits on', () => {
    const en = productJsonLd(makeProduct(), 'en')
    const de = productJsonLd(makeProduct({ path: '/fivem/all-access' }), 'de')

    expect(String(en.url)).toMatch(/\/en\/fivem\/garage$/)
    // The German address of the subscription has German words.
    expect(String(de.url)).toMatch(/\/de\/fivem\/alle-scripts$/)
    expect((de.offers as Record<string, unknown>).url).toBe(de.url)
  })

  it('stays on the default language when none is given', () => {
    expect(productJsonLd(makeProduct()).url).toBe(productJsonLd(makeProduct(), 'en').url)
  })
})

describe('webSiteJsonLd', () => {
  it('describes one site in both languages, published by the organisation', () => {
    const site = webSiteJsonLd()
    const org = organizationJsonLd()

    expect(site['@type']).toBe('WebSite')
    expect(site.url).toBe(org.url)
    expect(site.inLanguage).toEqual(['en', 'de'])
    expect((site.publisher as Record<string, unknown>).name).toBe(org.name)
  })

  // A SearchAction promises a results page. The site has a search dialog, no
  // such page, and markup for something that does not exist is a false claim.
  it('announces no search it does not have', () => {
    expect(webSiteJsonLd().potentialAction).toBeUndefined()
  })
})

describe('organizationJsonLd contact', () => {
  it('carries the contact address, with and without the description', () => {
    expect(organizationJsonLd().email).toBe('info@msk-scripts.de')
    expect(organizationJsonLd({ describe: false }).email).toBe('info@msk-scripts.de')
  })
})
