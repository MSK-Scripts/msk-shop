import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProductPage } from '@/components/products/ProductPage'
import { SUBSCRIPTION_SLUG, findProduct } from '@/lib/products'
import { loadProducts, productMetadata } from '@/lib/productView'
import { getRequestLang } from '@/lib/serverLang'

export const revalidate = 60

/**
 * The subscription for every script, `/en/fivem/all-access` and
 * `/de/fivem/alle-scripts` (plan 5.2). The same product page as a script,
 * with Encrypted and Source as the two choices, priced per month.
 *
 * The address is a page of the route table, so the proxy never marks it
 * unknown. `notFound()` only fires if the subscription vanished from Tebex.
 */

async function subscription() {
  return findProduct(await loadProducts().catch(() => []), SUBSCRIPTION_SLUG)
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang }, product] = await Promise.all([getRequestLang(), subscription()])
  return product ? productMetadata(product, lang) : {}
}

export default async function AllAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string | string[] }>
}) {
  const [{ lang }, product, query] = await Promise.all([getRequestLang(), subscription(), searchParams])
  if (!product) notFound()
  return <ProductPage product={product} lang={lang} requestedVariant={query.variant} releases={[]} />
}
