import { afterEach, describe, expect, it, vi } from 'vitest'

import { buyOptions, optionFor } from '@/lib/buyOptions'
import { PRODUCT_COPY, SITE_CONFIG } from '@/lib/config'
import {
  PRODUCT_TABLE, STATIC_PRODUCT_INDEX, chooseVariant, createLiveIndexLoader, findProduct, groupProducts,
  packageForVariant, productHrefForPackage, type Product,
} from '@/lib/products'
import { productCard, productImages, productSnippet } from '@/lib/productView'
import { addToBasket } from '@/lib/tebex'
import type { TebexPackage } from '@/types/tebex'

import { TEBEX_PACKAGES } from './fixtures/tebexPackages'

/**
 * The product model of Phase 4: Tebex keeps Encrypted and Source as two
 * packages, the shop sells one product with two variants. These tests hold
 * the grouping to its promises, against the real package list of 28.10.2026.
 */

const products = groupProducts(TEBEX_PACKAGES)
const get = (slug: string) => findProduct(products, slug)!

/** A package as Tebex could add it tomorrow, without anything configured for it. */
function newPackage(id: number, fields: Partial<TebexPackage> = {}): TebexPackage {
  return { id, name: `Package ${id}`, slug: null, type: 'single', media: [], category: { id: 1, name: 'Other' }, base_price: 9.99, total_price: 9.99, ...fields } as unknown as TebexPackage
}

function idsOf(list: Product[]): number[] {
  return list.flatMap(p => p.variants.map(v => v.pkg.id)).sort()
}

describe('groupProducts', () => {
  it('turns the eight Tebex packages into four products with these slugs and ids', () => {
    expect(products.map(p => [p.slug, p.path, p.variants.map(v => [v.variant, v.pkg.id])])).toEqual([
      ['garage',      '/fivem/garage',      [['encrypted', 5732587], ['source', 5732588]]],
      ['handcuffs',   '/fivem/handcuffs',   [['encrypted', 5159927], ['source', 5301828]]],
      ['vehiclekeys', '/fivem/vehiclekeys', [['encrypted', 6446936], ['source', 6446947]]],
      ['all-access',  '/fivem/all-access',  [['encrypted', 7569109], ['source', 7569121]]],
    ])
  })

  it('puts every Tebex package into exactly one product', () => {
    expect(idsOf(products)).toEqual(TEBEX_PACKAGES.map(p => p.id).sort())
  })

  it('gives no two products the same slug, and none a numeric one', () => {
    const slugs = products.map(p => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]*[a-z-][a-z0-9-]*$/)
  })

  it('keeps every configured product in the table unique', () => {
    const slugs = PRODUCT_TABLE.map(e => e.slug)
    const ids = PRODUCT_TABLE.flatMap(e => Object.values(e.packages))
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('pairs two new packages with the same Tebex slug stem into one product', () => {
    const grouped = groupProducts([
      ...TEBEX_PACKAGES,
      newPackage(1, { name: 'MSK Radio | Encrypted', slug: 'radio-e', category: { id: 2105296, name: 'Encrypted Version' } }),
      newPackage(2, { name: 'MSK Radio | Source', slug: 'radio-s', category: { id: 2228937, name: 'Source Version' } }),
    ])
    const radio = findProduct(grouped, 'radio')!
    expect(radio.variants.map(v => [v.variant, v.pkg.id])).toEqual([['encrypted', 1], ['source', 2]])
    expect(radio.name).toBe('MSK Radio')
    expect(radio.configured).toBe(false)
    expect(idsOf(grouped)).toEqual([1, 2, ...TEBEX_PACKAGES.map(p => p.id)].sort())
  })

  it('makes a package without a partner a product with one variant', () => {
    const grouped = groupProducts([newPackage(3, { name: 'Free Thing', slug: 'free-thing' })])
    expect(grouped).toHaveLength(1)
    expect(grouped[0].slug).toBe('free-thing')
    expect(grouped[0].variants.map(v => v.pkg.id)).toEqual([3])
  })

  it('never hands out a taken, reserved or numeric slug to a new package', () => {
    const grouped = groupProducts([
      ...TEBEX_PACKAGES,
      newPackage(4, { slug: 'garage-e', name: 'Another garage | Encrypted', category: { id: 2105296, name: 'Encrypted Version' } }),
      newPackage(5, { slug: 'free' }),
      newPackage(6, { slug: '2024' }),
    ])
    const slugOf = (id: number) => grouped.find(p => p.variants.some(v => v.pkg.id === id))!.slug
    expect(slugOf(4)).toBe('garage-4')
    expect(slugOf(5)).toBe('free-5')
    expect(slugOf(6)).toBe('script-6')
    expect(get('garage').variants.map(v => v.pkg.id)).toEqual([5732587, 5732588])
  })

  it('does not pair two packages of the same variant', () => {
    const grouped = groupProducts([
      newPackage(7, { slug: 'radio-e', category: { id: 2105296, name: 'Encrypted Version' } }),
      newPackage(8, { slug: 'radio-e', category: { id: 2105296, name: 'Encrypted Version' } }),
    ])
    expect(grouped.map(p => p.slug)).toEqual(['radio', 'radio-8'])
  })
})

describe('router index', () => {
  it('knows every configured package id and leads it to its product', () => {
    for (const product of products) {
      for (const [i, v] of product.variants.entries()) {
        expect(STATIC_PRODUCT_INDEX.ids.get(v.pkg.id), String(v.pkg.id)).toEqual({
          path: product.path,
          query: i === 0 ? '' : `?variant=${v.variant}`,
        })
      }
    }
  })

  it('links a package to its product page with the variant chosen', () => {
    expect(productHrefForPackage(5732587)).toBe('/fivem/garage')
    expect(productHrefForPackage(6446947)).toBe('/fivem/vehiclekeys?variant=source')
    expect(productHrefForPackage(1)).toBeNull()
  })

  it('loads the live index at most once per minute and survives a failing Tebex', async () => {
    const load = vi.fn(async () => [newPackage(9, { slug: 'radio-e' })])
    const index = createLiveIndexLoader(load, 60_000)
    expect((await index(0))?.slugs.get('radio')).toEqual({ path: '/fivem/radio', query: '' })
    await index(59_999)
    expect(load).toHaveBeenCalledTimes(1)
    await index(60_000)
    expect(load).toHaveBeenCalledTimes(2)

    const failing = createLiveIndexLoader(async () => { throw new Error('down') })
    expect(await failing(0)).toBeNull()
  })
})

describe('variant choice', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('preselects the variant of the address, and the first one otherwise', () => {
    const garage = get('garage')
    expect(chooseVariant(garage, 'source').variant).toBe('source')
    expect(chooseVariant(garage, ['source', 'encrypted']).variant).toBe('source')
    expect(chooseVariant(garage, undefined).variant).toBe('encrypted')
    expect(chooseVariant(garage, 'nonsense').variant).toBe('encrypted')
  })

  it.each([
    ['encrypted', 5732587],
    ['source', 5732588],
  ] as const)('puts the %s package into the basket call', async (variant, id) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: {} }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const option = optionFor(buyOptions(get('garage')), variant)
    await addToBasket('basket-ident', option.pkg.id, option.pkg.type)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/basket/basket-ident/packages')
    expect(JSON.parse(String(init.body)).package_id).toBe(String(id))
    expect(packageForVariant(get('garage'), variant).id).toBe(id)
  })

  it('falls back to the first option for an unknown choice', () => {
    expect(optionFor(buyOptions(get('handcuffs')), null).pkg.id).toBe(5159927)
  })
})

describe('product view', () => {
  it('shows the first screenshot after the banner, and the banner last in the gallery', () => {
    const garage = get('garage')
    const media = garage.variants[0].pkg.media
    const { hero, gallery } = productImages(garage)
    expect(media[0].primary).toBe(true)
    expect(hero).toBe(media[1].url)
    expect(gallery[0]).toBe(media[1].url)
    expect(gallery.at(-1)).toBe(media[0].url)
  })

  it('falls back to the banner when Tebex has nothing else', () => {
    const handcuffs = get('handcuffs')
    expect(productImages(handcuffs).hero).toBe(handcuffs.variants[0].pkg.media[0].url)
  })

  it('names the price of the variant a category card stands for', () => {
    const card = productCard(get('garage'), 'en', 'source')
    expect(card.variants.map(v => v.id)).toEqual([5732588])
    expect(card.href).toBe('/fivem/garage?variant=source')
    expect(productCard(get('garage'), 'en').variants.map(v => v.id)).toEqual([5732587, 5732588])
  })

  it('prefers the curated search snippet in the requested language', () => {
    expect(productSnippet(get('garage'), 'en')).toEqual(PRODUCT_COPY.garage.seo.en)
    expect(productSnippet(get('garage'), 'de')).toEqual(PRODUCT_COPY.garage.seo.de)
  })

  it('falls back to the Tebex name and a plain-text excerpt, then the tagline', () => {
    const [plain] = groupProducts([newPackage(10, { name: 'Unknown Package', description: '<p>Some <b>text</b>.</p>' })])
    expect(productSnippet(plain, 'en')).toEqual({ title: 'Unknown Package', description: 'Some text.' })
    const [empty] = groupProducts([newPackage(11, { name: 'Unknown Package', description: '' })])
    expect(productSnippet(empty, 'en').description).toBe(SITE_CONFIG.tagline)
  })
})
