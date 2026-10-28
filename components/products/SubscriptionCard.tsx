import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight } from '@/components/icons'
import { PackagePrice } from '@/components/packages/PackagePrice'
import { packagesTranslations, type Lang } from '@/lib/i18n'
import type { ProductCardData } from '@/lib/productView'

/**
 * The subscription under the script grid, as a band rather than a fourth
 * card: it is not a script but every script, and the framework filter does
 * not apply to it. Said positively (plan 5.5): what you get first, the trial
 * character in the same sentence, the price per month.
 */
export function SubscriptionCard({ card, lang, headingLevel = 2 }: { card: ProductCardData; lang: Lang; headingLevel?: 2 | 3 }) {
  const t = packagesTranslations[lang]
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <article className="group relative flex flex-wrap items-center gap-x-8 gap-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-[clamp(1.125rem,1rem+0.6vw,2rem)] py-[clamp(1rem,0.9rem+0.4vw,1.5rem)] transition-colors duration-150 hover:border-[var(--color-primary)]">
      <div className="grid min-w-[min(100%,18rem)] flex-1 gap-1">
        <span className="kicker">{t.sub_kicker}</span>
        <Heading className="font-display text-h3 font-[650]">
          <Link
            href={card.href}
            prefetch={false}
            className="after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {card.name}
          </Link>
        </Heading>
        {card.summary && (
          <p
            lang={card.summary.lang !== lang ? card.summary.lang : undefined}
            className="max-w-[44rem] text-small text-[var(--color-muted-foreground)]"
          >
            {card.summary.text}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <PackagePrice variants={card.variants} lang={lang} perMonth amountClassName="text-h3" />
          <span className="text-label text-[var(--color-muted-foreground)]">{t.card_vat}</span>
        </p>
        <span aria-hidden className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary)]">
          {t.card_view}
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  )
}
