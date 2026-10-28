import type { Metadata } from 'next'
import { ArrowDown } from '@/components/icons'
import { ProductBrowser } from '@/components/products/ProductBrowser'
import { SubscriptionCard } from '@/components/products/SubscriptionCard'
import { VariantComparison } from '@/components/products/VariantComparison'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { packagesTranslations } from '@/lib/i18n'
import { loadProducts, productCard } from '@/lib/productView'
import type { Product } from '@/lib/products'
import { alternatesFor, DEFAULT_OG_IMAGE, openGraphFor } from '@/lib/seo'
import { publicPath } from '@/lib/routes'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/fivem', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/fivem'),
    openGraph:   openGraphFor({ url: publicPath(lang, '/fivem'), title: seo.title, description: seo.description }),
    // `twitter` is replaced just as flatly as `openGraph` and therefore has to
    // be set explicitly as well, otherwise the root layout texts remain.
    twitter: {
      card:        'summary_large_image' as const,
      title:       seo.title,
      description: seo.description,
      images:      [DEFAULT_OG_IMAGE],
    },
  }
}

/**
 * The FiveM catalogue (plan 5.5): one card per script, the subscription as a
 * band below, and what Encrypted and Source mean at the end of the page,
 * linked from the sentence above the grid.
 */
export default async function CataloguePage() {
  const [{ lang }, products] = await Promise.all([
    getRequestLang(),
    loadProducts().catch(err => {
      console.warn('[fivem] Tebex unavailable, catalogue empty:', err)
      return [] as Product[]
    }),
  ])
  const t = packagesTranslations[lang]

  const scripts = products.filter(p => p.kind === 'script').map(p => productCard(p, lang))
  const subscriptions = products.filter(p => p.kind === 'subscription').map(p => productCard(p, lang))

  const count = (scripts.length === 1 ? t.count_one : t.count_many)
    .replace('{n}', scripts.length.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'))

  return (
    <div className="container-page grid gap-[var(--space-stack)] py-[clamp(1.5rem,1rem+2vw,4rem)]">
      <header className="grid gap-3">
        <h1 className="font-display text-display font-[750] tracking-[-0.02em]">{t.heading}</h1>
        <p className="text-lead text-[var(--color-muted-foreground)]">
          {count} · {t.subtitle}
        </p>
        {/* The licence difference is the first decision of a purchase. */}
        <p className="max-w-[44rem] text-body text-[var(--color-muted-foreground)]">
          {t.variant_note}{' '}
          <a href="#compare" className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline">
            {t.compare_link}
            <ArrowDown className="h-4 w-4" />
          </a>
        </p>
      </header>

      {scripts.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] px-4 py-16 text-center">
          <p className="font-display text-h3 font-[650]">{t.none_title}</p>
          <p className="text-[var(--color-muted-foreground)]">{t.none_body}</p>
        </div>
      ) : (
        <ProductBrowser lang={lang} cards={scripts} />
      )}

      {subscriptions.map(card => (
        <SubscriptionCard key={card.slug} card={card} lang={lang} />
      ))}

      <section id="compare" aria-labelledby="compare-title" className="mt-[clamp(1rem,0.5rem+2vw,3rem)] grid scroll-mt-[calc(var(--header-height)+1rem)] gap-3">
        <h2 id="compare-title" className="font-display text-h2 font-[700]">{t.compare_heading}</h2>
        <p className="max-w-[34rem] text-body text-[var(--color-muted-foreground)]">{t.compare_intro}</p>
        <VariantComparison id="compare-caption" lang={lang} />
      </section>
    </div>
  )
}
