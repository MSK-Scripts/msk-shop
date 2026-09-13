// Central price/sale resolution for display.
//
// Tebex reports an active (possibly user-specific) sale through the Headless API
// ONLY with an authenticated basket ident, and in an unintuitive form:
//   base_price  = price AFTER discount (e.g. 17.994)
//   discount    = discount amount in the currency (e.g. 11.996)
//   total_price = payable price (e.g. 17.99)
// The original (pre-sale) price is therefore `base_price + discount`.
//
// Without a sale (or without basket context) base_price == total_price and discount == 0.

export interface SaleData {
  base_price: number
  total_price: number
  discount: number
}

export interface DisplayPrice {
  /** Original catalogue price (struck through when discounted). */
  original: number
  /** Price actually payable. */
  price: number
  isFree: boolean
  hasDiscount: boolean
  /** Rounded discount in percent. */
  discountPct: number
}

export function resolveDisplayPrice(
  pkgBasePrice: number,
  pkgTotalPrice: number,
  sale?: SaleData,
): DisplayPrice {
  // With an active sale base_price is already discounted → original = base_price + discount.
  // Without sale data, the catalogue price from the server props.
  const original = sale ? sale.base_price + sale.discount : pkgBasePrice
  const price = sale?.total_price ?? pkgTotalPrice
  const isFree = original === 0
  // Float guard: 17.994 vs. 17.99 must NOT slip through as "Sale −0%".
  const hasDiscount = !isFree && original > 0 && original - price > 0.005
  const discountPct = hasDiscount
    ? Math.round(((original - price) / original) * 100)
    : 0

  return { original, price, isFree, hasDiscount, discountPct }
}
