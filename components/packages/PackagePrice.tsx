'use client'

import { useSalePricesStore } from '@/store/salePrices'
import { formatEuro, resolveDisplayPrice } from '@/lib/price'
import { packagesTranslations, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/** One variant's prices as the server knows them, without a visitor's sale. */
export interface PriceSource {
  id: number
  basePrice: number
  totalPrice: number
}

interface Props {
  /** The variants the price stands for; with more than one it reads "from" the cheapest. */
  variants: PriceSource[]
  lang: Lang
  /** For the subscription: "/ month" after the amount. */
  perMonth?: boolean
  className?: string
  /** Classes of the amount itself, for the size of the context. */
  amountClassName?: string
}

/**
 * A price in the format of the page language (`19,99 €`, `€19.99`), with the
 * visitor's personal sale if Tebex reports one for their basket.
 *
 * The sale prices arrive in the browser after the page (SalePriceFetcher), so
 * the server and the first render show the catalogue price, and the sale
 * replaces it once known. Server markup and hydration therefore agree.
 */
export function PackagePrice({ variants, lang, perMonth, className, amountClassName }: Props) {
  const { prices } = useSalePricesStore()
  const t = packagesTranslations[lang]

  const shown = variants.map(v => resolveDisplayPrice(v.basePrice, v.totalPrice, prices[v.id]))
  if (shown.length === 0) return null
  const cheapest = shown.reduce((a, b) => (b.price < a.price ? b : a))

  const amount = cheapest.isFree ? t.card_free : formatEuro(cheapest.price, lang)
  const label = variants.length > 1 && !cheapest.isFree ? t.card_from.replace('{price}', amount) : amount

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      {cheapest.hasDiscount && (
        <s className="text-small font-normal text-[var(--color-muted-foreground)]">
          {formatEuro(cheapest.original, lang)}
        </s>
      )}
      <span className={cn('font-display font-bold tabular-nums', amountClassName)}>
        {label}
        {perMonth && !cheapest.isFree ? <span className="font-sans text-small font-normal"> {t.card_per_month}</span> : null}
      </span>
      {cheapest.hasDiscount && (
        <span className="text-label font-semibold text-[var(--color-sale)]">
          {t.card_sale} −{cheapest.discountPct}%
        </span>
      )}
    </span>
  )
}
