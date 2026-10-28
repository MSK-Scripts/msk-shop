import type { ReactNode } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight, ArrowSquareOut, CircleNotch } from '@/components/icons'
import { LinkedText } from '@/components/legal/LinkedText'
import { Button } from '@/components/ui/Button'
import type { CartTotals } from '@/lib/cartLines'
import { cartTranslations, layoutTranslations, legalCopy, LEGAL_LINKS, type Lang } from '@/lib/i18n'
import { formatEuro } from '@/lib/price'
import { cn } from '@/lib/utils'

/**
 * The handover to Tebex (plan 5.8, draft legal copy 2.2), shared by the cart
 * page and the drawer: the total including VAT before the jump, the notice
 * who sells, and a main button that says where it leads.
 *
 * The button is a plain link to the checkout address Tebex returned with the
 * basket, the only thing it ever links to. Until that address is there it
 * stays a disabled button, so nothing can lead anywhere else.
 *
 * The button does not say "order with obligation to pay": the order is placed
 * in the Tebex checkout, and that button is Tebex' (§ 312j BGB, answer F3).
 */
export function CartSummary({
  lang, totals, coupons, checkoutUrl, headingId, compact = false, children,
}: {
  lang: Lang
  totals: CartTotals
  /** Codes of the coupons in the basket, for the discount line. */
  coupons: string[]
  checkoutUrl: string | null
  headingId: string
  /** The drawer: the heading is for screen readers only. */
  compact?: boolean
  /** Below the button, e.g. "Continue shopping". */
  children?: ReactNode
}) {
  const t = cartTranslations[lang]
  const lc = legalCopy[lang]
  const tl = layoutTranslations[lang]
  const money = (value: number) => (value === 0 ? t.free : formatEuro(value, lang))
  const [totalLabel, totalAfter = ''] = lc.cart_total.split('{total}')

  return (
    <section aria-labelledby={headingId} className="grid gap-4">
      <h2 id={headingId} className={cn('font-display text-h3 font-[650]', compact && 'sr-only')}>{t.summary}</h2>

      {totals.discount > 0 && (
        <dl className="grid gap-1.5 text-small">
          <div className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-[var(--color-muted-foreground)]">{t.subtotal}</dt>
            <dd className="tabular-nums">{money(totals.subtotal)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-[var(--color-muted-foreground)]">{t.coupon.replace('{code}', coupons.join(', '))}</dt>
            <dd className="tabular-nums">−{formatEuro(totals.discount, lang)}</dd>
          </div>
        </dl>
      )}

      <div className={cn('grid gap-2', !compact && 'border-t border-[var(--color-border)] pt-4')}>
        <p className="text-small text-[var(--color-muted-foreground)]">
          <LinkedText
            template={lc.cart_seller}
            link={text => (
              <Link href={LEGAL_LINKS.terms} className="whitespace-nowrap font-semibold text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-hover)]">
                {text}
              </Link>
            )}
          />
        </p>
        <p className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="font-semibold">{totalLabel.trim()}</span>
          <span className="font-display text-h3 font-bold tabular-nums">
            {formatEuro(totals.total, lang)}{totalAfter}
          </span>
        </p>
      </div>

      {checkoutUrl ? (
        <Button asChild size="lg" className="w-full">
          <a href={checkoutUrl}>
            {lc.cart_button}
            <ArrowRight className="h-5 w-5 shrink-0" />
          </a>
        </Button>
      ) : (
        <Button disabled size="lg" className="w-full">
          <CircleNotch className="h-5 w-5 shrink-0 animate-spin" />
          {t.loading_checkout}
        </Button>
      )}

      <p className="text-small text-[var(--color-muted-foreground)]">
        {t.checkout_note}{' '}
        <a
          href={LEGAL_LINKS.tebexTerms}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-hover)]"
        >
          {t.tebex_terms}
          <ArrowSquareOut className="h-4 w-4" />
          <span className="sr-only"> {tl.nav_new_tab}</span>
        </a>
      </p>

      {/* The same three claims, in the same words, as the trust line of the
          footer (draft 2.4): no refund promise beyond it. */}
      {!compact && (
        <ul className="grid gap-1 border-t border-[var(--color-border)] pt-4 text-small text-[var(--color-muted-foreground)]">
          <li>{tl.footer_trust_license}</li>
          <li>{tl.footer_trust_statutory}</li>
          <li>{tl.footer_trust_refund}</li>
        </ul>
      )}

      {children}
    </section>
  )
}
