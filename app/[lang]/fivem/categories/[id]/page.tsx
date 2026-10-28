import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CaretRight, ArrowLeft } from '@/components/icons'
import { ProductCard } from '@/components/products/ProductCard'
import { SubscriptionCard } from '@/components/products/SubscriptionCard'
import { Button } from '@/components/ui/Button'
import { CATEGORY_SEO, resolveVariant } from '@/lib/config'
import { sanitizeTebexHtml, pickLanguageBlock } from '@/lib/sanitize'
import { categoriesTranslations, packagesTranslations } from '@/lib/i18n'
import { getRequestLang } from '@/lib/serverLang'
import { groupProducts } from '@/lib/products'
import { productCard } from '@/lib/productView'
import { publicPath } from '@/lib/routes'
import { LANGS } from '@/lib/lang'
import { alternatesFor, DEFAULT_OG_IMAGE, openGraphFor, plainExcerpt } from '@/lib/seo'
import { getCategories, getCategory, getPackages } from '@/lib/tebex'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbJsonLd } from '@/lib/jsonLd'

export const revalidate = 60

export async function generateStaticParams() {
  // Fail-soft: if the Tebex API is unreachable/unauthorized at build time
  // (e.g. CI builds without secrets, as with Dependabot PRs), no prerender
  // is generated; the pages still render on demand. Prevents the
  // entire build from failing on the storefront API.
  try {
    const categories = await getCategories()
    // `lang` is a dynamic segment above this page and needs its own values.
    return LANGS.flatMap(lang => categories.map(cat => ({ lang, id: String(cat.id) })))
  } catch (err) {
    console.warn('[categories/[id]] generateStaticParams: Tebex nicht verfügbar, Prerender übersprungen:', err)
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const [{ id }, { lang }] = await Promise.all([params, getRequestLang()])

  try {
    const cat = await getCategory(id)
    const canonical = `/fivem/categories/${cat.id}`
    const count = cat.packages?.length ?? 0
    const snippet = CATEGORY_SEO[cat.id]?.[lang]

    // `plainExcerpt(cat.description)` returns the **German** part for these
    // categories, because the Tebex texts start with a [GER] block and
    // [ENG] only follows after it. On an English page that is wrong,
    // so the curated snippet takes precedence.
    const description =
      snippet?.description ||
      plainExcerpt(cat.description) ||
      `Browse ${count} ${count === 1 ? 'script' : 'scripts'} in ${cat.name} from MSK Scripts.`
    const title = snippet?.title ?? cat.name

    return {
      title,
      description,
      alternates: alternatesFor(lang, canonical),
      openGraph: openGraphFor({
        url:   publicPath(lang, canonical),
        title,
        description,
      }),
      twitter: {
        card:  'summary_large_image',
        title,
        description,
        images: [DEFAULT_OG_IMAGE],
      },
    }
  } catch {
    return { title: 'Category', alternates: alternatesFor(lang, `/fivem/categories/${id}`) }
  }
}

/**
 * A Tebex category as a list of products, with the cards of the catalogue.
 *
 * The two variant categories (Encrypted Version, Source Version) hold one
 * package of each script. Their cards name that variant's price and lead to
 * the product page with that variant chosen, so "Source" does not show the
 * Encrypted price as "from".
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [{ lang }, category, packages] = await Promise.all([
    getRequestLang(),
    getCategory(id).catch(() => null),
    getPackages().catch(() => []),
  ])
  if (!category) notFound()

  const t = categoriesTranslations[lang]
  const focus = resolveVariant({ category: { id: category.id } }) ?? undefined

  const inCategory = new Set((category.packages ?? []).map(p => p.id))
  const products = groupProducts(packages).filter(p => p.variants.some(v => inCategory.has(v.pkg.id)))
  const scripts = products.filter(p => p.kind === 'script').map(p => productCard(p, lang, focus))
  const subscriptions = products.filter(p => p.kind === 'subscription').map(p => productCard(p, lang, focus))
  const total = scripts.length + subscriptions.length

  const countLabel = (total === 1 ? t.count_one : t.count_many)
    .replace('{n}', total.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'))

  return (
    <div className="container-page grid gap-[var(--space-stack)] py-[clamp(1.5rem,1rem+2vw,4rem)]">
      {/* Must match the visible breadcrumb below, in the language of the page. */}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.breadcrumb_home,  path: publicPath(lang, '/') },
          { name: t.breadcrumb_fivem, path: publicPath(lang, '/fivem') },
          { name: category.name },
        ])}
      />

      <div className="grid gap-3">
        <nav aria-label="Breadcrumb" className="text-small text-[var(--color-muted-foreground)]">
          <ol className="flex flex-wrap items-center gap-x-1.5">
            <li><Link href="/" className="inline-flex min-h-6 items-center hover:text-[var(--color-foreground)] hover:underline">{t.breadcrumb_home}</Link></li>
            <li aria-hidden><CaretRight className="h-3 w-3" /></li>
            <li><Link href="/fivem" className="inline-flex min-h-6 items-center hover:text-[var(--color-foreground)] hover:underline">{t.breadcrumb_fivem}</Link></li>
            <li aria-hidden><CaretRight className="h-3 w-3" /></li>
            <li aria-current="page" className="text-[var(--color-foreground)]">{category.name}</li>
          </ol>
        </nav>

        <header className="grid gap-3">
          <h1 className="font-display text-display font-[750] tracking-[-0.02em]">{category.name}</h1>
          {category.description && (
            <div
              className="tebex-description max-w-[44rem]"
              dangerouslySetInnerHTML={{
                // The Tebex texts maintain both languages in one HTML as a
                // [GER] block followed by [ENG]. Without the cut they appear
                // one below the other on the page.
                __html: sanitizeTebexHtml(pickLanguageBlock(category.description, lang)),
              }}
            />
          )}
          <p className="text-lead text-[var(--color-muted-foreground)]">{countLabel}</p>
          {focus && (
            <p className="max-w-[44rem] text-body text-[var(--color-muted-foreground)]">
              {packagesTranslations[lang].variant_note}
            </p>
          )}
        </header>
      </div>

      {total === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] px-4 py-16 text-center">
          <p className="font-display text-h3 font-[650]">{t.none_title}</p>
          <Button asChild>
            <Link href="/fivem">
              <ArrowLeft className="h-4 w-4" />
              {t.back_to_shop}
            </Link>
          </Button>
        </div>
      ) : (
        <section aria-labelledby="category-results-heading" className="grid gap-[var(--space-stack)]">
          {/* Screen readers only: the category name already sits above as H1. */}
          <h2 id="category-results-heading" className="sr-only">{t.region_results}</h2>
          {scripts.length > 0 && (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--grid-card)),1fr))] gap-[clamp(1rem,1.2vw,1.75rem)]">
              {scripts.map(card => (
                <li key={card.slug} className="grid">
                  <ProductCard card={card} lang={lang} />
                </li>
              ))}
            </ul>
          )}
          {subscriptions.map(card => (
            <SubscriptionCard key={card.slug} card={card} lang={lang} headingLevel={3} />
          ))}
        </section>
      )}
    </div>
  )
}
