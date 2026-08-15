import { describe, expect, it } from 'vitest'

import { breadcrumbJsonLd, organizationJsonLd, productJsonLd, softwareApplicationJsonLd } from '@/lib/jsonLd'
import type { TebexPackage } from '@/types/tebex'

function makePackage(overrides: Partial<TebexPackage> = {}): TebexPackage {
  return {
    id:          5732587,
    name:        'MSK Garage & Impound',
    slug:        'msk-garage',
    description: '<p>Ein <strong>Garagen</strong>-System.</p>',
    image:       'https://cdn/garage.png',
    media:       [],
    type:        'single',
    category:    { id: 2105296, name: 'Encrypted Version' },
    base_price:  19.99,
    sales_tax:   0,
    total_price: 19.99,
    currency:    'EUR',
    discount:    0,
    disable_quantity: false,
    disable_gifting:  false,
    created_at:  '2026-01-01',
    updated_at:  '2026-01-01',
    order:       1,
    ...overrides,
  } as TebexPackage
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
      { name: 'Packages', path: '/packages' },
      { name: 'MSK Garage' },
    ])

    const items = crumbs.itemListElement as Array<Record<string, unknown>>
    expect(items).toHaveLength(3)
    expect(items.map(i => i.position)).toEqual([1, 2, 3])
    expect(items[1].item).toMatch(/\/packages$/)

    // Das letzte Element ist die aktuelle Seite und bekommt bewusst kein `item`.
    expect(items[2].item).toBeUndefined()
    expect(items[2].name).toBe('MSK Garage')
  })
})

describe('productJsonLd', () => {
  it('zeichnet Preis, Währung und Verfügbarkeit aus', () => {
    const product = productJsonLd(makePackage())
    const offer = product.offers as Record<string, unknown>

    expect(product['@type']).toBe('Product')
    expect(product.name).toBe('MSK Garage & Impound')
    expect(offer.price).toBe('19.99')
    expect(offer.priceCurrency).toBe('EUR')
    expect(offer.availability).toBe('https://schema.org/InStock')
    expect(String(offer.url)).toMatch(/\/packages\/5732587$/)
  })

  // Der Crawler sieht nie einen authentifizierten Basket, also nie den Sale.
  // Das Markup muss dem entsprechen, was ausgeloggt gerendert wird.
  it('nutzt den Katalogpreis, nicht einen user-spezifischen Sale', () => {
    const product = productJsonLd(makePackage({ base_price: 29.99, total_price: 29.99 }))
    expect((product.offers as Record<string, unknown>).price).toBe('29.99')
  })

  it('formatiert den Preis immer mit zwei Nachkommastellen', () => {
    const product = productJsonLd(makePackage({ base_price: 20, total_price: 20 }))
    expect((product.offers as Record<string, unknown>).price).toBe('20.00')
  })

  it('leitet die Beschreibung als Klartext aus dem Tebex-HTML ab', () => {
    const product = productJsonLd(makePackage())
    expect(product.description).toBe('Ein Garagen-System.')
  })

  it('bevorzugt die kuratierte Beschreibung, wenn übergeben', () => {
    const product = productJsonLd(makePackage(), 'Kurze kuratierte Beschreibung.')
    expect(product.description).toBe('Kurze kuratierte Beschreibung.')
  })

  it('übernimmt die Kategorie', () => {
    expect(productJsonLd(makePackage()).category).toBe('Encrypted Version')
  })

  // Der JSON-Block landet in einem <script>-Element. Ein `<` im Wert dürfte den
  // Block nicht verlassen können.
  it('bleibt nach dem Escaping ein gültiger, ausbruchsicherer Script-Inhalt', () => {
    const product = productJsonLd(makePackage({ name: '</script><img src=x onerror=alert(1)>' }))
    const serialized = JSON.stringify(product).replace(/</g, '\\u003c')

    expect(serialized).not.toContain('</script>')
    expect(serialized).not.toContain('<img')
    // Trotz Escaping muss der Wert unverfälscht zurückparsen.
    expect(JSON.parse(serialized).name).toBe('</script><img src=x onerror=alert(1)>')
  })
})

describe('softwareApplicationJsonLd', () => {
  const app = softwareApplicationJsonLd({
    name:        'MSK Discord Ticket Bot',
    path:        '/de/ticketbot',
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
    expect(String(app.url)).toMatch(/^https?:\/\/.+\/de\/ticketbot$/)
    expect(String(app.image)).toMatch(/^https?:\/\/.+\/discord_ticketbot_banner\.webp$/)
  })

  it('lässt eine bereits absolute Bild-URL unangetastet', () => {
    const withCdn = softwareApplicationJsonLd({
      name: 'x', path: '/giveaway', description: 'x',
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

  // Ohne echte Bewertungen wäre aggregateRating erfunden. Das ist ein
  // Richtlinienverstoß und fliegt sonst irgendwann als manuelle Maßnahme auf.
  it('erfindet keine Bewertungen', () => {
    expect(app.aggregateRating).toBeUndefined()
    expect(app.review).toBeUndefined()
  })

  it('nimmt das Repository nur auf, wenn es eins gibt', () => {
    expect(app.codeRepository).toBeUndefined()
    expect(app.sameAs).toBeUndefined()

    const oss = softwareApplicationJsonLd({
      name: 'x', path: '/giveaway', description: 'x', image: '/x.webp',
      inLanguage: 'en-US', codeRepository: 'https://github.com/MSK-Scripts/discord_giveawaybot',
    })
    expect(oss.codeRepository).toBe('https://github.com/MSK-Scripts/discord_giveawaybot')
    expect(oss.sameAs).toEqual(['https://github.com/MSK-Scripts/discord_giveawaybot'])
  })
})
