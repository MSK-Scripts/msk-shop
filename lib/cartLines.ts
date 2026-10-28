import { resolveVariant, type PackageVariant } from '@/lib/config'
import { baseName, PRODUCT_TABLE, productHrefForPackage, VARIANT_ORDER } from '@/lib/products'
import type { TebexBasket } from '@/types/tebex'

/**
 * What the cart shows for one package in the basket (plan 5.8): the product
 * name without the variant suffix, the variant chosen on the product page
 * (Phase 4), the gift details and the price.
 *
 * Pure on purpose, so cart page and drawer show the same lines and a test can
 * hold them without a browser.
 */
export interface CartLine {
  id: number
  name: string
  variant: PackageVariant | null
  /** Internal path of the product page, with the variant preselected. */
  href: string | null
  image: string | null
  price: number
  /** The price before a sale, only when it is higher than `price`. */
  originalPrice: number | null
  gift: { username: string; discordId: string | null } | null
}

/** Gift recipients the shop remembers itself: Tebex does not return them with the basket. */
export type GiftRecipients = Record<number, { username: string; discordId?: string }>

function variantOf(packageId: number, name: string): PackageVariant | null {
  for (const entry of PRODUCT_TABLE) {
    const found = VARIANT_ORDER.find(v => entry.packages[v] === packageId)
    if (found) return found
  }
  return resolveVariant({ name })
}

export function cartLines(basket: Pick<TebexBasket, 'packages'> | null, gifts: GiftRecipients = {}): CartLine[] {
  return (basket?.packages ?? []).map(item => {
    const price = item.paid_price ?? item.in_basket?.price ?? 0
    const base = item.base_price ?? 0
    const giftName = item.in_basket?.gift_username ?? item.in_basket?.gift_username_id ?? gifts[item.id]?.username
    return {
      id: item.id,
      name: baseName(item.name),
      variant: variantOf(item.id, item.name),
      href: productHrefForPackage(item.id),
      image: item.image ?? null,
      price,
      originalPrice: (item.discount ?? 0) > 0 && base > price ? base : null,
      gift: giftName ? { username: String(giftName), discordId: gifts[item.id]?.discordId ?? null } : null,
    }
  })
}

export interface CartTotals {
  /** What Tebex charges, VAT included (sales tax mode "Inclusive", draft 2.1). */
  total: number
  /** Before the coupon; only meaningful when `discount` is set. */
  subtotal: number
  /** Coupon discount, 0 without one. */
  discount: number
}

/**
 * Totals of the basket. `storedSubtotal` is the total the shop noted before a
 * coupon was applied, because the basket itself only reports the result.
 */
export function cartTotals(
  basket: Pick<TebexBasket, 'total_price' | 'coupons'> | null,
  storedSubtotal: number | null,
): CartTotals {
  const total = basket?.total_price ?? 0
  const subtotal = storedSubtotal ?? total
  const discount = (basket?.coupons?.length ?? 0) > 0 ? Math.max(0, subtotal - total) : 0
  // Float guard: 17.994 against 17.99 is no discount.
  return { total, subtotal, discount: discount > 0.005 ? discount : 0 }
}
