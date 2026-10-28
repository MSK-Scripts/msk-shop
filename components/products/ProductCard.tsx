import Image from 'next/image'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight } from '@/components/icons'
import { PackagePrice } from '@/components/packages/PackagePrice'
import { Badge } from '@/components/ui/Badge'
import { packagesTranslations, type Lang } from '@/lib/i18n'
import type { ProductCardData } from '@/lib/productView'

interface Props {
  card: ProductCardData
  lang: Lang
  /** Heading level of the name, so the card fits the outline of its page. */
  headingLevel?: 2 | 3
}

/**
 * One product in a grid: screenshot, name, one line of benefit, frameworks,
 * price "from", and a link to the product page (plan 5.5). Every card carries
 * the same fields in the same places.
 *
 * No cart button: the choice between Encrypted and Source belongs on the
 * product page, and a button here would have to make it for the visitor.
 *
 * The whole card is one link, through the name: its `::after` covers the card,
 * so the link has the name as its accessible name instead of the text of the
 * whole card read out in one breath. No hooks, so server pages and the
 * client-side catalogue filter render the same card.
 */
export function ProductCard({ card, lang, headingLevel = 3 }: Props) {
  const t = packagesTranslations[lang]
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const subscription = card.kind === 'subscription'

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)] shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card-hover)]">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-muted)]">
        {card.image ? (
          <Image
            src={card.image}
            // The name right below is the link; the picture adds nothing a
            // screen reader would need twice.
            alt=""
            fill
            // The grid never makes a card wider than about 30rem plus a gap
            // (`--grid-card`), and on a phone it is the full width.
            sizes="(max-width: 640px) 100vw, 520px"
            // Screenshots of a UI: the top holds the title bar and the
            // navigation, which say most about what is shown.
            className="object-cover object-top"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center px-4 text-center font-display text-h3 font-semibold text-[var(--color-muted-foreground)]">
            {card.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-[clamp(1rem,0.8rem+0.4vw,1.375rem)]">
        <Heading className="font-display text-product font-[750] leading-tight [font-stretch:112%]">
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
            className="line-clamp-3 text-small text-[var(--color-muted-foreground)]"
          >
            {card.summary.text}
          </p>
        )}

        {card.frameworks.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t.facet_framework}>
            {card.frameworks.map(f => (
              <li key={f}>
                <Badge className="text-label normal-case tracking-normal">{f}</Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="flex-1" />

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 pt-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <PackagePrice
              variants={card.variants}
              lang={lang}
              perMonth={subscription}
              amountClassName="text-h3"
            />
            <span className="text-label text-[var(--color-muted-foreground)]">{t.card_vat}</span>
          </p>
          <span aria-hidden className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary)]">
            {t.card_view}
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  )
}
