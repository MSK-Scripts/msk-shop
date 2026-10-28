import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { NotFoundContent } from '@/components/layout/NotFoundContent'
import { ProductPage } from '@/components/products/ProductPage'
import { LANGS, NOT_FOUND_HEADER } from '@/lib/lang'
import { findProduct, type Product } from '@/lib/products'
import { loadProducts, productMetadata } from '@/lib/productView'
import { loadProductReleases } from '@/lib/releases'
import { getRequestLang } from '@/lib/serverLang'

export const revalidate = 60

/**
 * The product page at `/fivem/<slug>`.
 *
 * Which slugs exist is decided before this page renders: the proxy answers an
 * old package id with a 308 to its product and marks an unknown slug, which
 * this page then shows as the 404 page of its language under the status 404
 * the proxy set (lib/routes.ts, `resolveRequest`). A `notFound()` from here
 * would come back as Next's empty error shell without `lang`, so it is only
 * the last resort for a product that vanished from Tebex in between.
 */

export async function generateStaticParams() {
  // Fail-soft: without Tebex at build time (CI without secrets) no page is
  // prerendered, they all render on demand.
  try {
    const products = await loadProducts()
    // The subscription has a page of its own at `/fivem/all-access`.
    const slugs = products.filter(p => p.kind === 'script').map(p => p.slug)
    return LANGS.flatMap(lang => slugs.map(slug => ({ lang, slug })))
  } catch (err) {
    console.warn('[fivem/[slug]] generateStaticParams: Tebex nicht verfügbar, Prerender übersprungen:', err)
    return []
  }
}

async function isMarkedUnknown(): Promise<boolean> {
  return (await headers()).get(NOT_FOUND_HEADER) === '1'
}

async function productFor(slug: string): Promise<Product | undefined> {
  return findProduct(await loadProducts().catch(() => []), slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  // The layout gives a marked request the title and robots of the 404 page.
  if (await isMarkedUnknown()) return {}
  const [{ slug }, { lang }] = await Promise.all([params, getRequestLang()])
  const product = await productFor(slug)
  if (!product) return {}
  return productMetadata(product, lang)
}

export default async function ProductRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ variant?: string | string[] }>
}) {
  const { lang } = await getRequestLang()
  if (await isMarkedUnknown()) return <NotFoundContent lang={lang} />

  const [{ slug }, query] = await Promise.all([params, searchParams])
  const product = await productFor(slug)
  if (!product) notFound()

  const releases = await loadProductReleases(product.versionsFile)
  return <ProductPage product={product} lang={lang} requestedVariant={query.variant} releases={releases} />
}
