import { describe, it, expect } from 'vitest'
import {
  PRICE_BUCKETS, bucketLabel, countBy, countPriceBuckets, priceBucket, splitFacets,
} from '@/lib/packageFacets'

/**
 * Der Anlass: die Preisfacette stand live als "10-20 EUR, unter 10 EUR,
 * 20-40 EUR", weil sie sich die Sortierung nach Haeufigkeit mit den anderen
 * beiden Facetten geteilt hat. Preise haben aber eine natuerliche Reihenfolge.
 */

const price = (n: number) => ({ price: n })
const priceOf = (p: { price: number }) => p.price

describe('priceBucket', () => {
  it('schneidet an den Grenzen nach oben ab', () => {
    expect(priceBucket(0)).toBe('<10')
    expect(priceBucket(9.99)).toBe('<10')
    expect(priceBucket(10)).toBe('10-20')
    expect(priceBucket(19.99)).toBe('10-20')
    expect(priceBucket(20)).toBe('20-40')
    expect(priceBucket(39.99)).toBe('20-40')
    expect(priceBucket(40)).toBe('40+')
    expect(priceBucket(199)).toBe('40+')
  })

  it('liefert nur Werte, die auch in PRICE_BUCKETS stehen', () => {
    for (const p of [0, 5, 10, 25, 40, 1000]) {
      expect(PRICE_BUCKETS).toContain(priceBucket(p))
    }
  })
})

describe('countPriceBuckets', () => {
  it('sortiert nach Preis, nicht nach Haeufigkeit', () => {
    // Genau die Lage aus dem Katalog: die mittlere Stufe ist die häufigste.
    const packages = [
      price(14.99), price(16.99), price(12.99), price(19.99),
      price(4.99),
      price(24.99), price(29.99),
    ]
    expect(countPriceBuckets(packages, priceOf)).toEqual([
      { value: '<10', count: 1 },
      { value: '10-20', count: 4 },
      { value: '20-40', count: 2 },
    ])
  })

  it('laesst leere Stufen weg, statt sie mit 0 anzuzeigen', () => {
    const facets = countPriceBuckets([price(5), price(50)], priceOf)
    expect(facets.map(f => f.value)).toEqual(['<10', '40+'])
  })

  it('kommt mit einer leeren Liste klar', () => {
    expect(countPriceBuckets([], priceOf)).toEqual([])
  })
})

describe('countBy', () => {
  it('sortiert die uebrigen Facetten weiter nach Haeufigkeit', () => {
    const items = [
      { tags: ['msk_core', 'ox_inventory'] },
      { tags: ['msk_core'] },
      { tags: ['msk_core'] },
      { tags: ['ox_inventory'] },
    ]
    expect(countBy(items, i => i.tags)).toEqual([
      { value: 'msk_core', count: 3 },
      { value: 'ox_inventory', count: 2 },
    ])
  })

  it('entscheidet Gleichstand alphabetisch, damit die Reihenfolge stabil ist', () => {
    const items = [{ tags: ['zebra'] }, { tags: ['alpha'] }]
    expect(countBy(items, i => i.tags).map(f => f.value)).toEqual(['alpha', 'zebra'])
  })

  it('zaehlt Einträge ohne Wert gar nicht mit', () => {
    expect(countBy([{ tags: [] }, { tags: ['esx'] }], i => i.tags)).toEqual([
      { value: 'esx', count: 1 },
    ])
  })
})

describe('bucketLabel', () => {
  it('beschriftet die offenen Enden in beiden Sprachen', () => {
    expect(bucketLabel('<10', 'en')).toBe('under 10 €')
    expect(bucketLabel('<10', 'de')).toBe('unter 10 €')
    expect(bucketLabel('40+', 'en')).toBe('from 40 €')
    expect(bucketLabel('40+', 'de')).toBe('ab 40 €')
  })

  it('schreibt Spannen mit Halbgeviertstrich, in beiden Sprachen gleich', () => {
    expect(bucketLabel('10-20', 'en')).toBe('10–20 €')
    expect(bucketLabel('10-20', 'de')).toBe('10–20 €')
  })
})

describe('splitFacets', () => {
  const f = (value: string, count: number) => ({ value, count })

  it('schiebt die Einträge hinter den Ausklapper, die nur ein Produkt treffen', () => {
    // Die echte Lage der Gruppe "Funktioniert mit": drei Einträge tragen,
    // sieben stehen für je ein Produkt, das doppelt im Regal liegt.
    const facets = [
      f('msk_core', 8), f('ox_inventory', 4), f('oxmysql', 4),
      f('AdvancedParking', 2), f('Chezza Inventory', 2), f('Jaksam Vehicle Keys', 2),
      f('MSK VehicleKeys', 2), f('msk_enginetoggle', 2), f('pma-voice', 2), f('saltychat', 2),
    ]
    const { primary, rest } = splitFacets(facets)
    expect(primary.map(x => x.value)).toEqual(['msk_core', 'ox_inventory', 'oxmysql'])
    expect(rest).toHaveLength(7)
  })

  it('hält kurze Gruppen vollständig sichtbar', () => {
    const facets = [f('Encrypted Version', 4), f('Source Version', 4), f('Subscriptions', 2)]
    expect(splitFacets(facets)).toEqual({ primary: facets, rest: [] })
  })

  it('versteckt nichts, wenn alle gleich häufig sind', () => {
    const facets = Array.from({ length: 8 }, (_, i) => f(`t${i}`, 2))
    expect(splitFacets(facets).rest).toEqual([])
  })

  it('hält zusammen, was es trennt', () => {
    const facets = [f('a', 9), f('b', 3), f('c', 1), f('d', 1), f('e', 1), f('f', 1)]
    const { primary, rest } = splitFacets(facets)
    expect(primary.length + rest.length).toBe(facets.length)
    expect([...primary, ...rest].map(x => x.value)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })

  it('überlebt die geplante Zusammenfassung der Paare, die Zähler halbieren sich', () => {
    const facets = [f('msk_core', 4), f('ox_inventory', 2), f('oxmysql', 2),
                    f('pma-voice', 1), f('saltychat', 1), f('Chezza Inventory', 1)]
    const { primary, rest } = splitFacets(facets)
    expect(primary.map(x => x.value)).toEqual(['msk_core', 'ox_inventory', 'oxmysql'])
    expect(rest).toHaveLength(3)
  })
})
