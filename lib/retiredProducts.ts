/**
 * Products the shop no longer sells, and where their old addresses lead.
 *
 * Since 05.11.2026 the three paid FiveM scripts are free on GitHub and the
 * all-access subscription is gone with them. Their product pages answer with
 * a 301 to the repository, and so does every old address that named one of
 * their Tebex package ids (`/packages/5732587`, `/fivem/5732588`, ...), since
 * forum posts and Search Console still know those.
 *
 * The package ids are kept here on purpose: content/resource-stats.ts no
 * longer lists them for these scripts, and `SUBSCRIPTION_PACKAGE_IDS` in
 * lib/config.ts is switched off. An old address must keep its meaning even
 * after the last place that sold it is gone.
 *
 * Pure, so the route table and the proxy can use it before anything renders.
 */

const GITHUB_ORG = 'https://github.com/MSK-Scripts'

export interface RetiredProduct {
  /** Slug of the former product page, `/fivem/<slug>`. */
  slug: string
  /** Every Tebex package id the product was sold under (Encrypted, Source). */
  packageIds: readonly number[]
  /** Where the product lives now. */
  url: string
}

export const RETIRED_PRODUCTS: readonly RetiredProduct[] = [
  { slug: 'garage',      packageIds: [5732587, 5732588], url: `${GITHUB_ORG}/msk_garage` },
  { slug: 'handcuffs',   packageIds: [5159927, 5301828], url: `${GITHUB_ORG}/msk_handcuffs` },
  { slug: 'vehiclekeys', packageIds: [6446936, 6446947], url: `${GITHUB_ORG}/msk_vehiclekeys` },
  // The subscription covered every script, so it leads to all of them.
  { slug: 'all-access',  packageIds: [7569109, 7569121], url: GITHUB_ORG },
]

/**
 * Where the segment of a former product address `/fivem/<segment>` leads now:
 * the slug of a retired product or one of its Tebex package ids. `null` for
 * anything else.
 */
export function retiredProductUrl(segment: string): string | null {
  const id = /^\d+$/.test(segment) ? Number(segment) : null
  const hit = RETIRED_PRODUCTS.find(p => p.slug === segment || (id !== null && p.packageIds.includes(id)))
  return hit ? hit.url : null
}
