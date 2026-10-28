import type { Metadata } from 'next'

import { PRODUCT_COPY, SITE_CONFIG, type PackageVariant, type ProductCopy, type SearchSnippet } from '@/lib/config'
import { packagesTranslations, type Lang } from '@/lib/i18n'
import { resolveDisplayPrice } from '@/lib/price'
import { groupProducts, variantQuery, type Product, type ProductKind } from '@/lib/products'
import { pickLanguageBlock, sanitizeTebexHtml } from '@/lib/sanitize'
import { alternatesFor, openGraphFor, plainExcerpt } from '@/lib/seo'
import { publicPath } from '@/lib/routes'
import { getPackages } from '@/lib/tebex'

/**
 * What the pages show of a product: name, line of benefit, images, prices.
 * Server side only (it sanitizes Tebex HTML); client components get the plain
 * data this builds.
 */

/** All products of the shop, from the Tebex packages (cached for 60 s by the fetch). */
export async function loadProducts(): Promise<Product[]> {
  return groupProducts(await getPackages())
}

export function productCopy(product: Pick<Product, 'slug' | 'configured'>): ProductCopy | undefined {
  return product.configured ? PRODUCT_COPY[product.slug] : undefined
}

export function productName(product: Pick<Product, 'kind' | 'configured' | 'name'>, lang: Lang): string {
  // The subscription has no proper name of its own; it is named in the language of the page.
  if (product.kind === 'subscription' && product.configured) return packagesTranslations[lang].subscription_name
  return product.name
}

/** A text and the language it is written in, which can differ from the page's. */
export interface LocalizedText {
  text: string
  lang: Lang
}

function isBilingual(html: string): boolean {
  return /\[GER\]/i.test(html) && /\[ENG\]/i.test(html)
}

/** The one line of benefit on the card and under the product name. */
export function productSummary(product: Product, lang: Lang): LocalizedText | null {
  const copy = productCopy(product)
  if (copy) {
    const own = copy.summary[lang]
    return own ? { text: own, lang } : { text: copy.summary.en, lang: 'en' }
  }
  const raw = product.variants[0].pkg.description ?? ''
  const text = plainExcerpt(pickLanguageBlock(raw, lang), 140)
  return text ? { text, lang: isBilingual(raw) ? lang : 'en' } : null
}

/**
 * The Tebex description of the product, in the page language where Tebex has
 * one ([GER]/[ENG] blocks), otherwise as it is, which is English.
 */
export function productDescription(product: Product, lang: Lang): { html: string; lang: Lang } {
  const raw = product.variants[0].pkg.description ?? ''
  return { html: sanitizeTebexHtml(pickLanguageBlock(raw, lang)), lang: isBilingual(raw) ? lang : 'en' }
}

export function productFrameworks(product: Product): string[] {
  return productCopy(product)?.frameworks ?? []
}

/**
 * Images of a product, from the lead variant (the variants share their
 * screenshots, their banners differ).
 *
 * The banner Tebex marks as primary says nothing the name does not say, and it
 * is the same picture on every script. So the screenshots come first (plan
 * 4.5): `hero`, the image of card and page, is the first image after the
 * banner, and the banner only when there is nothing else. In the gallery the
 * banner goes last. Nothing changes in Tebex for this.
 */
export function productImages(product: Product): { hero: string | null; gallery: string[] } {
  const lead = product.variants[0].pkg
  const media = (lead.media ?? []).filter(m => m.type === 'image' && m.url)
  const banner = media.find(m => m.primary)?.url ?? lead.image ?? null
  const screenshots = [...new Set(media.filter(m => !m.primary && m.url !== banner).map(m => m.url))]
  const gallery = banner ? [...screenshots, banner] : screenshots
  return { hero: screenshots[0] ?? banner, gallery }
}

/** Link to the documentation of a script, or of everything. */
export function productDocsUrl(product: Pick<Product, 'resourceName'>): string {
  return product.resourceName ? `${SITE_CONFIG.docs}/docs/${product.resourceName}/` : SITE_CONFIG.docs
}

/** What a client component needs to show and sell one variant. */
export interface VariantView {
  variant: PackageVariant | null
  id: number
  basePrice: number
  totalPrice: number
  currency: string
}

export function variantViews(product: Product): VariantView[] {
  return product.variants.map(({ variant, pkg }) => ({
    variant,
    id: pkg.id,
    basePrice: pkg.base_price ?? 0,
    totalPrice: pkg.total_price ?? pkg.base_price ?? 0,
    currency: pkg.currency || 'EUR',
  }))
}

/**
 * Catalogue price of the cheapest variant, as a logged-out visitor sees it.
 * The personal sale prices need a basket and are added in the browser.
 */
export function fromPrice(product: Product): number {
  return Math.min(...variantViews(product).map(v => resolveDisplayPrice(v.basePrice, v.totalPrice).price))
}

export interface ProductCardData {
  slug: string
  kind: ProductKind
  /** Internal path of the product page, with the variant if the card shows one. */
  href: string
  name: string
  summary: LocalizedText | null
  frameworks: string[]
  image: string | null
  /** The variants whose price the card names: "from" the cheapest if more than one. */
  variants: VariantView[]
}

/**
 * The card of a product. With `focus` (a category page of one variant) the
 * card names that variant's price and links to the page with it chosen.
 */
export function productCard(product: Product, lang: Lang, focus?: PackageVariant): ProductCardData {
  const all = variantViews(product)
  const focused = focus ? all.filter(v => v.variant === focus) : []
  return {
    slug: product.slug,
    kind: product.kind,
    href: `${product.path}${focused.length > 0 ? variantQuery(product, focus ?? null) : ''}`,
    name: productName(product, lang),
    summary: productSummary(product, lang),
    frameworks: productFrameworks(product),
    image: productImages(product).hero,
    variants: focused.length > 0 ? focused : all,
  }
}

/**
 * Title and description of a product page as a search result should show
 * them: the curated snippet, then the line of benefit, then the Tebex text.
 * Shared by the page metadata and `/llms.txt`, so both give the same answer.
 */
export function productSnippet(product: Product, lang: Lang): SearchSnippet {
  const seo = productCopy(product)?.seo[lang]
  return {
    title: seo?.title ?? productName(product, lang),
    // `||` and not `??`: an empty excerpt is as good as none.
    description:
      seo?.description
      || productSummary(product, lang)?.text
      || plainExcerpt(product.variants[0].pkg.description)
      || SITE_CONFIG.tagline,
  }
}

/** Newest `updated_at` of the variants, for the sitemap. */
export function productUpdatedAt(product: Product): string | undefined {
  return product.variants
    .map(v => v.pkg.updated_at)
    .filter((d): d is string => typeof d === 'string' && !Number.isNaN(Date.parse(d)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0]
}

/**
 * A date as the page language writes it (plan 5.9): `28.10.2026` on the
 * German pages, `Oct 28, 2026` on the English ones. In UTC, so a server in
 * another time zone does not move a release to the day before.
 */
export function formatDate(iso: string, lang: Lang): string {
  const date = new Date(iso)
  return lang === 'de'
    ? date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** Title, description, canonical and share image of a product page. */
export function productMetadata(product: Product, lang: Lang): Metadata {
  const { title, description } = productSnippet(product, lang)
  const image = productImages(product).hero
  return {
    title,
    description,
    // Canonical without `?variant=`: one page per product, whatever is preselected.
    alternates: alternatesFor(lang, product.path),
    openGraph: openGraphFor({
      url: publicPath(lang, product.path),
      title,
      description,
      ...(image ? { images: [{ url: image, alt: productName(product, lang) }] } : {}),
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
