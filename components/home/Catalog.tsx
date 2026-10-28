import { Section, TextLink } from '@/components/home/Section'
import { ProductCard } from '@/components/products/ProductCard'
import { SubscriptionCard } from '@/components/products/SubscriptionCard'
import { homeTranslations, type Lang } from '@/lib/i18n'
import { groupProducts, type Product } from '@/lib/products'
import { fromPrice, productCard } from '@/lib/productView'
import type { TebexPackage } from '@/types/tebex'

/**
 * The paid catalogue, in full, on the homepage: one card per script with the
 * card of the catalogue page (screenshot first, frameworks, price "from"), and
 * the subscription as a band below.
 *
 * Server component on purpose: no add-to-cart button here. A single button
 * would have to pick one of the two variants for the visitor, and picking for
 * them is exactly what the product page with its choice is for.
 */

/** The configured scripts, in the order of the product table. */
function scripts(all: TebexPackage[]): Product[] {
  return groupProducts(all).filter(p => p.kind === 'script' && p.configured)
}

/** The cheapest paid script, or null without Tebex data. Shared with the hero. */
export function cheapestScript(all: TebexPackage[]): number | null {
  const prices = scripts(all).map(fromPrice).filter(v => v > 0)
  return prices.length > 0 ? Math.min(...prices) : null
}

export function Catalog({ lang, packages: all }: { lang: Lang; packages: TebexPackage[] }) {
  const t = homeTranslations[lang]

  // Fail-soft: without Tebex (CI builds without secrets) the section drops
  // out instead of breaking the prerender. The page loads the packages once.
  const products = groupProducts(all)
  const cards = products.filter(p => p.kind === 'script' && p.configured).map(p => productCard(p, lang))
  if (cards.length === 0) return null
  const subscription = products.find(p => p.kind === 'subscription' && p.configured)

  return (
    // No top rule: the proof line above already draws one.
    <Section
      className="border-t-0"
      id="catalog-title"
      kicker={t.catalog_kicker}
      title={t.catalog_heading}
      intro={t.catalog_subtitle}
      action={<TextLink href="/fivem">{t.catalog_all}</TextLink>}
    >
      {/* The grid of the catalogue page: columns from the card minimum, so
          the scripts stay in one row wherever three fit. */}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--grid-card)),1fr))] gap-[clamp(1rem,1.2vw,1.75rem)]">
        {cards.map(card => (
          <li key={card.slug} className="grid">
            <ProductCard card={card} lang={lang} />
          </li>
        ))}
      </ul>

      {subscription && (
        <div className="mt-[clamp(1rem,1.2vw,1.75rem)]">
          <SubscriptionCard card={productCard(subscription, lang)} lang={lang} headingLevel={3} />
        </div>
      )}
    </Section>
  )
}
