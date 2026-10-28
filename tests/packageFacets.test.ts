import { describe, it, expect } from 'vitest'
import { countBy, matchesFrameworks } from '@/lib/packageFacets'

/**
 * The catalogue filter since Phase 4: one facet, the framework. What is
 * tested is the rule that decides which products stay visible, not the order
 * or the labels of the chips.
 */

const PRODUCTS = [
  { slug: 'garage',      frameworks: ['ESX'] },
  { slug: 'handcuffs',   frameworks: ['ESX', 'QBCore'] },
  { slug: 'vehiclekeys', frameworks: ['ESX', 'QBCore'] },
]

const visible = (selected: string[]) =>
  PRODUCTS.filter(p => matchesFrameworks(new Set(selected), p.frameworks)).map(p => p.slug)

describe('matchesFrameworks', () => {
  it('lets every product through while nothing is ticked', () => {
    expect(visible([])).toEqual(['garage', 'handcuffs', 'vehiclekeys'])
  })

  it('keeps only the products that run on the ticked framework', () => {
    expect(visible(['QBCore'])).toEqual(['handcuffs', 'vehiclekeys'])
  })

  it('reads several ticks as "any of them", not "all of them"', () => {
    // A server runs one framework; ticking two compares, it does not ask for both.
    expect(visible(['ESX', 'QBCore'])).toEqual(['garage', 'handcuffs', 'vehiclekeys'])
  })

  it('hides a product without any framework once a framework is ticked', () => {
    expect(matchesFrameworks(new Set(['ESX']), [])).toBe(false)
  })
})

describe('countBy', () => {
  it('counts each value once per product', () => {
    expect(countBy([{ f: ['ESX', 'ESX'] }, { f: ['ESX'] }], x => x.f)).toEqual([{ value: 'ESX', count: 2 }])
  })

  it('counts the frameworks of the catalogue', () => {
    expect(countBy(PRODUCTS, p => p.frameworks)).toEqual([
      { value: 'ESX', count: 3 },
      { value: 'QBCore', count: 2 },
    ])
  })
})
