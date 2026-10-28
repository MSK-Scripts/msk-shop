import { RESOURCE_STATS } from '@/content/resource-stats'
import { SUBSCRIPTION_PACKAGE_IDS, resolveVariant, type PackageVariant } from '@/lib/config'
import type { TebexPackage } from '@/types/tebex'

/**
 * Products: what the shop sells, as opposed to what Tebex stores.
 *
 * Tebex keeps every script twice, once as Encrypted and once as Source, as two
 * packages with two ids, two names and two pages. A buyer sees one script with
 * a choice. This module is the one place that turns the packages into
 * products, gives each product its address and knows which package id belongs
 * to which product.
 *
 * Nothing here is maintained twice. The pairing of the scripts comes from
 * `RESOURCE_STATS` (content/resource-stats.ts), which already lists both
 * package ids of every paid resource for the statistics page; the
 * subscription pair is `SUBSCRIPTION_PACKAGE_IDS` in lib/config.ts. A package
 * that neither knows still lands in exactly one product: it is paired with a
 * partner of the same Tebex slug stem if there is one, otherwise it is a
 * product with a single variant. So a script added in Tebex shows up in the
 * shop without a deploy, as it always did.
 *
 * The address is the slug: `/fivem/garage`. Product names are proper nouns,
 * so the slug is the same in both languages. The slug of a script is its
 * FiveM resource name without the `msk_` prefix, which is as stable as a name
 * gets: the scripts themselves and the version checker depend on it. The
 * subscription lives at `/fivem/all-access`, a page of the route table with a
 * German address of its own.
 *
 * Pure on purpose: the proxy imports this to answer old id addresses and
 * unknown slugs before anything renders.
 */

export type ProductKind = 'script' | 'subscription'

/** Variant order on every surface: the cheaper Encrypted release first. */
export const VARIANT_ORDER: readonly PackageVariant[] = ['encrypted', 'source']

/** Slug of the subscription, and the last segment of its route. */
export const SUBSCRIPTION_SLUG = 'all-access'

/**
 * Segments below `/fivem` that are pages of their own and can therefore never
 * be the slug of a derived product.
 */
const RESERVED_SLUGS = new Set(['free', 'all-access', 'categories'])

/** A product as configured, before any Tebex data is known. */
export interface ProductEntry {
  slug: string
  /** Internal path of the product page. */
  path: string
  kind: ProductKind
  /** Display name for scripts. The subscription is named by the UI texts. */
  name: string
  /** FiveM resource folder name, e.g. `msk_garage`: documentation and releases hang on it. */
  resourceName?: string
  /** File in the VERSIONS repository with the release history. */
  versionsFile?: string
  packages: Partial<Record<PackageVariant, number>>
}

/** `msk_vehiclekeys` -> `vehiclekeys`. */
export function slugFromResourceName(resourceName: string): string {
  return toSlug(resourceName.replace(/^msk_/i, ''))
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function productPath(slug: string): string {
  return `/fivem/${slug}`
}

export const PRODUCT_TABLE: readonly ProductEntry[] = [
  ...RESOURCE_STATS.flatMap((r): ProductEntry[] => {
    if (r.tier !== 'paid' || !r.packages) return []
    const slug = slugFromResourceName(r.resourceName)
    return [{
      slug,
      path: productPath(slug),
      kind: 'script',
      name: r.displayName,
      resourceName: r.resourceName,
      versionsFile: r.versionsFile,
      packages: { ...r.packages },
    }]
  }),
  ...(SUBSCRIPTION_PACKAGE_IDS
    ? [{
        slug: SUBSCRIPTION_SLUG,
        path: productPath(SUBSCRIPTION_SLUG),
        kind: 'subscription' as const,
        name: '',
        packages: { ...SUBSCRIPTION_PACKAGE_IDS },
      }]
    : []),
]

// ─── Products from Tebex data ───────────────────────────────────────────────

export interface ProductVariant {
  /** `null` for a package that is neither Encrypted nor Source. */
  variant: PackageVariant | null
  pkg: TebexPackage
}

export interface Product {
  slug: string
  path: string
  kind: ProductKind
  /** Display name; empty for the subscription, whose name is a UI text. */
  name: string
  resourceName?: string
  versionsFile?: string
  /** At least one, in `VARIANT_ORDER`. The first is the default choice. */
  variants: ProductVariant[]
  /** False for a product derived from a package nothing configures. */
  configured: boolean
}

/** Tebex names end in `| Encrypted`, `| Source` or `- Encrypted Version`. */
const VARIANT_SUFFIX = /\s*(?:[|(]\s*|-\s+)(?:encrypted|source)(?:\s+version)?\s*\)?\s*$/i

/** The name of a package without the variant it is sold in. */
export function baseName(name: string | null | undefined): string {
  const full = (name ?? '').trim()
  return full.replace(VARIANT_SUFFIX, '').trim() || full
}

/** `garage-e` and `garage-s` share the stem `garage`. */
function slugStem(pkg: TebexPackage): string {
  const fromTebex = toSlug(pkg.slug ?? '').replace(/-(?:e|s|encrypted|source)$/, '')
  if (fromTebex) return fromTebex
  return toSlug(baseName(pkg.name)).replace(/^msk-/, '')
}

/**
 * A slug for a product nothing configures: URL-safe, never purely numeric
 * (that would read as an old Tebex id), never a reserved page and never one
 * that is already taken.
 */
function freeSlug(stem: string, id: number, taken: Set<string>): string {
  let slug = stem && !/^\d+$/.test(stem) ? stem : `script-${id}`
  if (RESERVED_SLUGS.has(slug) || taken.has(slug)) slug = `${slug}-${id}`
  return slug
}

function byVariantOrder(a: ProductVariant, b: ProductVariant): number {
  const rank = (v: ProductVariant) => (v.variant === null ? VARIANT_ORDER.length : VARIANT_ORDER.indexOf(v.variant))
  return rank(a) - rank(b)
}

/**
 * Groups the Tebex packages into products. Every package ends up in exactly
 * one product, and no two products share a slug.
 *
 * Configured products come first, in the order of the table; packages nothing
 * configures follow in the order Tebex delivers them. A configured product
 * whose packages are all missing from Tebex is left out.
 */
export function groupProducts(packages: readonly TebexPackage[]): Product[] {
  const byId = new Map(packages.map(p => [p.id, p]))
  const claimed = new Set<number>()
  const products: Product[] = []

  for (const entry of PRODUCT_TABLE) {
    const variants = VARIANT_ORDER.flatMap((variant): ProductVariant[] => {
      const id = entry.packages[variant]
      const pkg = id === undefined || claimed.has(id) ? undefined : byId.get(id)
      return pkg ? [{ variant, pkg }] : []
    })
    if (variants.length === 0) continue
    for (const v of variants) claimed.add(v.pkg.id)
    products.push({
      slug: entry.slug,
      path: entry.path,
      kind: entry.kind,
      name: entry.name,
      resourceName: entry.resourceName,
      versionsFile: entry.versionsFile,
      variants,
      configured: true,
    })
  }

  // Every configured slug stays reserved, even while its packages are missing:
  // a slug must never change its meaning.
  const taken = new Set(PRODUCT_TABLE.map(e => e.slug))
  const derived = new Map<string, Product>()

  for (const pkg of packages) {
    if (claimed.has(pkg.id)) continue
    claimed.add(pkg.id)
    const variant = resolveVariant(pkg)
    const stem = slugStem(pkg)
    const partner = derived.get(stem)
    // Paired only if both are a known variant and the variant is still free.
    if (partner && variant && partner.variants.every(v => v.variant !== null && v.variant !== variant)) {
      partner.variants.push({ variant, pkg })
      partner.variants.sort(byVariantOrder)
      continue
    }
    const slug = freeSlug(stem, pkg.id, taken)
    taken.add(slug)
    const product: Product = {
      slug,
      path: productPath(slug),
      kind: pkg.type === 'subscription' ? 'subscription' : 'script',
      name: baseName(pkg.name),
      variants: [{ variant, pkg }],
      configured: false,
    }
    if (!derived.has(stem)) derived.set(stem, product)
    products.push(product)
  }

  return products
}

export function findProduct(products: readonly Product[], slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}

/** The variant a visitor asked for, if the product has it; otherwise the default. */
export function chooseVariant(product: Product, requested: unknown): ProductVariant {
  const wanted = Array.isArray(requested) ? requested[0] : requested
  return product.variants.find(v => v.variant !== null && v.variant === wanted) ?? product.variants[0]
}

/** The package that goes into the basket for a chosen variant. */
export function packageForVariant(product: Product, variant: PackageVariant | null): TebexPackage {
  return (product.variants.find(v => v.variant === variant) ?? product.variants[0]).pkg
}

/** Query that preselects a variant on the product page; empty for the default one. */
export function variantQuery(
  product: { variants: ReadonlyArray<{ variant: PackageVariant | null }> },
  variant: PackageVariant | null,
): string {
  return variant && product.variants[0]?.variant !== variant ? `?variant=${variant}` : ''
}

// ─── Index for the router ────────────────────────────────────────────────────

/** Where a product address or an old package id leads. */
export interface ProductTarget {
  /** Internal path of the product page. */
  path: string
  /** `?variant=source` when the id was the non-default variant, else empty. */
  query: string
}

export interface ProductIndex {
  slugs: ReadonlyMap<string, ProductTarget>
  ids: ReadonlyMap<number, ProductTarget>
}

function buildIndex(items: Array<{ slug: string; path: string; ids: Array<{ id: number; variant: PackageVariant | null }> }>): ProductIndex {
  const slugs = new Map<string, ProductTarget>()
  const ids = new Map<number, ProductTarget>()
  for (const item of items) {
    slugs.set(item.slug, { path: item.path, query: '' })
    const shape = { variants: item.ids.map(i => ({ variant: i.variant })) }
    for (const { id, variant } of item.ids) ids.set(id, { path: item.path, query: variantQuery(shape, variant) })
  }
  return { slugs, ids }
}

/** Index of the configured products, known without asking Tebex. */
export const STATIC_PRODUCT_INDEX: ProductIndex = buildIndex(
  PRODUCT_TABLE.map(e => ({
    slug: e.slug,
    path: e.path,
    ids: VARIANT_ORDER.flatMap(variant => (e.packages[variant] === undefined ? [] : [{ id: e.packages[variant]!, variant }])),
  })),
)

/** Index of products grouped from Tebex data, on top of the configured ones. */
export function indexProducts(products: readonly Product[]): ProductIndex {
  const live = buildIndex(products.map(p => ({
    slug: p.slug,
    path: p.path,
    ids: p.variants.map(v => ({ id: v.pkg.id, variant: v.variant })),
  })))
  return {
    slugs: new Map([...live.slugs, ...STATIC_PRODUCT_INDEX.slugs]),
    ids: new Map([...live.ids, ...STATIC_PRODUCT_INDEX.ids]),
  }
}

/**
 * The product page an internal path `/fivem/<segment>` stands for: a product
 * slug is served as it is, a Tebex package id leads to its product. `null`
 * if the segment is neither.
 */
export function productTarget(segment: string, index: ProductIndex): ProductTarget | null {
  const bySlug = index.slugs.get(segment)
  if (bySlug) return bySlug
  return /^\d+$/.test(segment) ? index.ids.get(Number(segment)) ?? null : null
}

/**
 * Loads the index from Tebex at most once per `ttlMs`, for addresses the
 * configured products do not know. A failed load counts as no answer (`null`)
 * for the same time, so an outage does not turn every unknown address into a
 * request to Tebex.
 */
export function createLiveIndexLoader(
  load: () => Promise<TebexPackage[]>,
  ttlMs = 60_000,
): (now?: number) => Promise<ProductIndex | null> {
  let cached: { at: number; value: Promise<ProductIndex | null> } | null = null
  return (now = Date.now()) => {
    if (!cached || now - cached.at >= ttlMs) {
      cached = {
        at: now,
        value: load().then(pkgs => indexProducts(groupProducts(pkgs)), () => null),
      }
    }
    return cached.value
  }
}

/** Internal href of the product page that sells a package, with its variant preselected. */
export function productHrefForPackage(packageId: number): string | null {
  const target = STATIC_PRODUCT_INDEX.ids.get(packageId)
  return target ? `${target.path}${target.query}` : null
}
