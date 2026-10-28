'use client'

import { useState, type ReactNode } from 'react'
import { ArrowDown, Storefront } from '@/components/icons'
import { AddToCartButton } from '@/components/packages/AddToCartButton'
import { PackagePrice } from '@/components/packages/PackagePrice'
import { RadioCard } from '@/components/ui/RadioCard'
import { optionFor, type BuyOption } from '@/lib/buyOptions'
import type { PackageVariant } from '@/lib/config'
import { legalCopy, packagesTranslations, type Lang } from '@/lib/i18n'

interface Props {
  lang: Lang
  options: BuyOption[]
  /** The variant chosen when the page loads (`?variant=source`), else the first. */
  initial: PackageVariant | null
  /** Subscriptions are priced per month and have no per-server license line. */
  subscription: boolean
  /** Anchor of the requirements section on the page, if it has one. */
  requirementsHref?: string
  /** Name and release line, rendered on the server. */
  heading: ReactNode
  /** Line of benefit and frameworks, rendered on the server. */
  details?: ReactNode
}

/**
 * The buy box of a product page (plan 5.6): the choice between Encrypted and
 * Source as native radio buttons, the price of the choice with VAT, the cart
 * button and who sells.
 *
 * Native radios on purpose (plan 4.7): arrow keys move the choice, a screen
 * reader announces "Encrypted, €19.99, config files open, 1 of 2, selected",
 * and no ARIA has to imitate what the element already is. The input covers its
 * whole label, so a tap anywhere on the option chooses it.
 *
 * The cart button is the one of the old package page, unchanged: same basket
 * routes, same Discord ID and gift dialogs. Only the package changes with the
 * choice.
 */
export function ProductBuyBox({ lang, options, initial, subscription, requirementsHref, heading, details }: Props) {
  const t = packagesTranslations[lang]
  const [chosen, setChosen] = useState<PackageVariant | null>(() => optionFor(options, initial).variant)
  const selected = optionFor(options, chosen)
  const choices = options.filter((o): o is BuyOption & { variant: PackageVariant } => o.variant !== null)

  return (
    <div
      className="@container grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-[clamp(1.125rem,1rem+0.5vw,1.75rem)] shadow-[var(--shadow-card)]"
    >
      {heading}

      {/* In one column (a phone) the description moves below the cart
          button, so name, choice, price and button fit the first screen
          (plan 5.6; measured at 375 x 812: the button ended at 817 px with
          the German text before it). It holds nothing focusable, so the tab
          order stays the order on screen. `product` is the container of the
          page layout in ProductPage. */}
      {details ? <div className="order-1 @min-[56rem]/product:order-none">{details}</div> : null}

      {choices.length > 1 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className="sr-only">{t.buy_legend}</legend>
          <div className="grid grid-cols-1 gap-2.5 @min-[17rem]:grid-cols-2">
            {choices.map(option => (
              <RadioCard
                key={option.variant}
                name="variant"
                value={option.variant}
                checked={selected.variant === option.variant}
                onChange={() => setChosen(option.variant)}
              >
                <span className="font-semibold">
                  {option.variant === 'source' ? t.variant_source : t.variant_encrypted}
                </span>
                <PackagePrice
                  variants={[{ id: option.pkg.id, basePrice: option.basePrice, totalPrice: option.totalPrice }]}
                  lang={lang}
                  perMonth={subscription}
                  amountClassName="text-lead"
                />
                <span className="text-label text-[var(--color-muted-foreground)]">
                  {option.variant === 'source' ? t.variant_line_source : t.variant_line_encrypted}
                </span>
              </RadioCard>
            ))}
          </div>
        </fieldset>
      )}

      <p className="flex flex-wrap items-baseline gap-x-2">
        <PackagePrice
          variants={[{ id: selected.pkg.id, basePrice: selected.basePrice, totalPrice: selected.totalPrice }]}
          lang={lang}
          perMonth={subscription}
          amountClassName="text-h2"
        />
        <span className="text-small text-[var(--color-muted-foreground)]">{t.buy_vat}</span>
      </p>

      <AddToCartButton pkg={selected.pkg} lang={lang} />

      <div className="order-2 grid gap-2 border-t border-[var(--color-border)] pt-4 text-small text-[var(--color-muted-foreground)] @min-[56rem]/product:order-none">
        <p className="flex gap-2">
          <Storefront className="mt-[0.2em] h-4 w-4 shrink-0" />
          <span>
            {/* Draft legal copy 2.1, who sells (§ 5b (1) UWG). */}
            {legalCopy[lang].product_seller}
            {subscription ? null : ` ${t.buy_license}`}
          </span>
        </p>
        <p className="pl-6">{t.buy_delivery}</p>
        {requirementsHref && (
          <a
            href={requirementsHref}
            className="inline-flex min-h-11 items-center gap-1.5 justify-self-start font-semibold text-[var(--color-primary)] hover:underline"
          >
            {t.buy_requirements}
            <ArrowDown className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  )
}
