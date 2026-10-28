'use client'

import { useEffect, useId, useRef } from 'react'
import { ShoppingBag, X } from '@/components/icons'
import { CartLineList } from '@/components/cart/CartLineList'
import { CartSummary } from '@/components/cart/CartSummary'
import { CouponField } from '@/components/cart/CouponField'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { useLang } from '@/components/i18n/LangProvider'
import { Button } from '@/components/ui/Button'
import { cartLines, cartTotals } from '@/lib/cartLines'
import { cartTranslations } from '@/lib/i18n'
import { useCart } from '@/lib/useCart'
import { useCartStore } from '@/store/cart'

/**
 * The cart as a side sheet, opened after every add (plan 5.8). The same
 * lines, coupon and handover to Tebex as the cart page.
 *
 * A native modal <dialog>: showModal() brings the focus trap, Escape, the
 * inert page behind it and the top layer, and the page stops scrolling
 * through a rule in globals.css instead of an inline style set from script.
 */
export function CartDrawer() {
  const { isOpen, closeCart, basket } = useCartStore()
  const { removePackage, isLoading, subtotal, checkoutUrl, giftRecipients } = useCart()
  const { lang } = useLang()
  const t = cartTranslations[lang]
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  const lines = isOpen ? cartLines(basket, giftRecipients) : []
  const totals = cartTotals(basket, subtotal)
  const coupons = (basket?.coupons ?? []).map(c => c.code ?? c.coupon_code ?? '').filter(Boolean)

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={closeCart}
      // A click on the backdrop lands on the dialog element itself.
      onClick={e => { if (e.target === e.currentTarget) closeCart() }}
      className="m-0 ml-auto h-dvh max-h-none w-[min(100%,28rem)] max-w-none border-0 border-l border-[var(--color-border)] bg-[var(--color-card)] p-0 text-[var(--color-card-foreground)] shadow-[var(--shadow-card-hover)] backdrop:bg-black/50"
    >
      {isOpen && (
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3">
            <h2 id={titleId} className="flex items-center gap-2 font-display text-h3 font-[650]">
              <ShoppingBag className="h-5 w-5 text-[var(--color-primary)]" />
              {t.drawer_title}
            </h2>
            <Button variant="ghost" size="icon" onClick={closeCart} aria-label={t.drawer_close}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {lines.length === 0 ? (
            <div className="grid flex-1 content-center justify-items-center gap-4 px-5 text-center">
              <ShoppingBag className="h-10 w-10 text-[var(--color-muted-foreground)]" />
              <p className="font-semibold">{t.empty_title}</p>
              <Button asChild>
                <Link href="/fivem" onClick={closeCart}>{t.browse}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid flex-1 content-start gap-3 overflow-y-auto px-5 py-3">
                <CartLineList lang={lang} lines={lines} onRemove={removePackage} busy={isLoading} compact onNavigate={closeCart} />
                <CouponField lang={lang} />
              </div>
              <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-4">
                <CartSummary
                  lang={lang}
                  totals={totals}
                  coupons={coupons}
                  checkoutUrl={checkoutUrl}
                  headingId={`${titleId}-summary`}
                  compact
                >
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="inline-flex min-h-11 items-center justify-self-center font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline"
                  >
                    {t.view_cart}
                  </Link>
                </CartSummary>
              </div>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}
