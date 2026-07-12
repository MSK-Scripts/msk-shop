import { describe, it, expect } from 'vitest'
import { resolveDisplayPrice } from '@/lib/price'

describe('resolveDisplayPrice', () => {
  it('uses the catalog price when there is no sale', () => {
    const r = resolveDisplayPrice(29.99, 29.99)
    expect(r).toMatchObject({ original: 29.99, price: 29.99, hasDiscount: false, isFree: false, discountPct: 0 })
  })

  it('reconstructs the pre-sale price from base_price + discount', () => {
    // Tebex reports base_price already discounted (17.994) and the discount amount (11.996).
    const r = resolveDisplayPrice(29.99, 29.99, { base_price: 17.994, total_price: 17.99, discount: 11.996 })
    expect(r.original).toBeCloseTo(29.99, 2)
    expect(r.price).toBe(17.99)
    expect(r.hasDiscount).toBe(true)
    expect(r.discountPct).toBe(40)
  })

  it('does not report a -0% sale on float rounding noise', () => {
    // base_price 17.994 vs total 17.99 with no real discount must not read as a sale.
    const r = resolveDisplayPrice(17.994, 17.99, { base_price: 17.994, total_price: 17.99, discount: 0 })
    expect(r.hasDiscount).toBe(false)
    expect(r.discountPct).toBe(0)
  })

  it('flags a free package', () => {
    const r = resolveDisplayPrice(0, 0)
    expect(r.isFree).toBe(true)
    expect(r.hasDiscount).toBe(false)
  })
})
