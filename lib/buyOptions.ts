import type { PackageVariant } from '@/lib/config'
import type { Product } from '@/lib/products'
import type { TebexPackage } from '@/types/tebex'

/**
 * The choices of a product page's buy box and which package each one puts
 * into the basket. A module of its own, without server code, because the
 * buy box runs in the browser and the page builds the options on the server.
 */

/** What the cart button needs of a package; nothing more travels to the browser. */
export type CartPackage = Pick<TebexPackage, 'id' | 'name' | 'type' | 'base_price' | 'disable_gifting'>

export interface BuyOption {
  variant: PackageVariant | null
  pkg: CartPackage
  basePrice: number
  totalPrice: number
}

/** One option per variant of the product, in the order of the page. */
export function buyOptions(product: Pick<Product, 'variants'>): BuyOption[] {
  return product.variants.map(({ variant, pkg }) => ({
    variant,
    pkg: { id: pkg.id, name: pkg.name, type: pkg.type, base_price: pkg.base_price, disable_gifting: pkg.disable_gifting },
    basePrice: pkg.base_price ?? 0,
    totalPrice: pkg.total_price ?? pkg.base_price ?? 0,
  }))
}

/**
 * The option a choice stands for, and with it the package that goes into the
 * basket. An unknown choice falls back to the first option, the default of
 * the page.
 */
export function optionFor(options: readonly BuyOption[], variant: PackageVariant | null): BuyOption {
  return options.find(o => o.variant === variant) ?? options[0]
}
