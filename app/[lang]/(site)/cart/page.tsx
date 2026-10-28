'use client'

import { useEffect } from 'react'
import { useLang } from '@/components/i18n/LangProvider'
import { ArrowLeft, ShoppingBag } from '@/components/icons'
import { CartLineList } from '@/components/cart/CartLineList'
import { CartSummary } from '@/components/cart/CartSummary'
import { CouponField } from '@/components/cart/CouponField'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { PageHead } from '@/components/page/PageHead'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cartLines, cartTotals } from '@/lib/cartLines'
import { cartTranslations, packagesTranslations } from '@/lib/i18n'
import { useCart } from '@/lib/useCart'
import { useHydrated } from '@/lib/useHydrated'

/**
 * `/en/cart`, `/de/warenkorb` (plan 5.8): the packages with their variant,
 * the coupon, and the handover to Tebex with the total including VAT.
 *
 * The basket lives in the browser (persisted store), so nothing of it is
 * rendered on the server. Until hydration a placeholder holds the place;
 * rendering "empty" first would flash the empty state at every visitor with
 * a full cart and break hydration.
 */
export default function CartPage() {
  const {
    basket, isLoading, removePackage, subtotal, checkoutUrl, refreshBasket, giftRecipients,
  } = useCart()
  const { lang } = useLang()
  const hydrated = useHydrated()
  const t = cartTranslations[lang]

  useEffect(() => {
    refreshBasket()
    if (typeof window !== 'undefined' && window.location.search) {
      const url = new URL(window.location.href)
      ;['status', 'discordLinked', 'discord_id', 'success'].forEach(p => url.searchParams.delete(p))
      if (url.search !== window.location.search) {
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [refreshBasket])

  const lines = hydrated ? cartLines(basket, giftRecipients) : []
  const totals = cartTotals(basket, subtotal)
  const coupons = (basket?.coupons ?? []).map(c => c.code ?? c.coupon_code ?? '').filter(Boolean)

  return (
    <div className="container-page grid gap-[var(--space-stack)] pb-[var(--space-section)] pt-[clamp(1rem,0.5rem+1.5vw,3rem)]">
      <PageHead
        id="cart-title"
        crumbs={[{ label: packagesTranslations[lang].breadcrumb_home, href: '/' }, { label: t.breadcrumb }]}
        title={t.heading}
      />

      {!hydrated ? (
        <div aria-hidden className="grid gap-3">
          <Skeleton className="h-24 w-full max-w-[48rem]" />
          <Skeleton className="h-24 w-full max-w-[48rem]" />
        </div>
      ) : lines.length === 0 ? (
        <div className="grid max-w-[40rem] justify-items-start gap-4 border-t border-[var(--color-border)] pt-[var(--space-stack)]">
          <ShoppingBag className="h-10 w-10 text-[var(--color-muted-foreground)]" />
          <h2 className="font-display text-h3 font-[650]">{t.empty_title}</h2>
          <p className="text-[var(--color-muted-foreground)]">{t.empty_body}</p>
          <Button asChild>
            <Link href="/fivem">{t.browse}</Link>
          </Button>
        </div>
      ) : (
        <div className="@container">
          {/* Capped at 100rem: on UWQHD the summary would otherwise drift a
              screen width away from the lines it sums up. */}
          <div className="grid max-w-[100rem] items-start gap-[var(--space-stack)] @min-[56rem]:grid-cols-[minmax(0,1fr)_clamp(21rem,34cqi,30rem)] @min-[56rem]:gap-x-[clamp(2rem,1rem+2vw,4.5rem)]">
            <div className="grid min-w-0 gap-4">
              <CartLineList lang={lang} lines={lines} onRemove={removePackage} busy={isLoading} />
              <CouponField lang={lang} />
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-[clamp(1.125rem,1rem+0.5vw,1.75rem)] shadow-[var(--shadow-card)] @min-[56rem]:sticky @min-[56rem]:top-[calc(var(--header-height)+1.5rem)]">
              <CartSummary
                lang={lang}
                totals={totals}
                coupons={coupons}
                checkoutUrl={checkoutUrl}
                headingId="cart-summary-title"
              >
                <Link
                  href="/fivem"
                  className="inline-flex min-h-11 items-center gap-1.5 justify-self-start font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t.continue_shopping}
                </Link>
              </CartSummary>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
