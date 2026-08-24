'use client'

import { useEffect, useState } from 'react'
import { X, ShoppingBag, Trash2, Tag, Loader2, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useCart } from '@/lib/useCart'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLang } from '@/components/i18n/LangProvider'
import { cartTranslations } from '@/lib/i18n'

export function CartDrawer() {
  const { isOpen, closeCart, basket } = useCartStore()
  const {
    removePackage, applyCode, removeCode, isLoading,
    total, subtotal, currency, checkoutUrl, itemCount, giftRecipients,
  } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [showCoupon, setShowCoupon] = useState(false)
  const { lang } = useLang()
  const t = cartTranslations[lang]

  const coupons = basket?.coupons ?? []

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCart()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [closeCart])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault()
    if (!couponInput.trim()) return
    if (coupons.length > 0) {
      setCouponError(t.err_coupon_active)
      return
    }
    setCouponLoading(true)
    setCouponError('')
    const result = await applyCode(couponInput.trim())
    setCouponLoading(false)
    if (result === true) {
      setCouponInput('')
      setShowCoupon(false)
    } else if (result === 'not_applicable') {
      setCouponError(t.err_coupon_scope)
    } else {
      setCouponError(t.err_coupon_invalid)
    }
  }

  if (!isOpen) return null

  const finalTotal = basket?.total_price ?? total
  const hasCoupon = coupons.length > 0
  const effectiveSubtotal = subtotal ?? finalTotal
  const discount = hasCoupon ? Math.max(0, effectiveSubtotal - finalTotal) : 0
  const hasDiscount = discount > 0.005

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl"
        role="dialog"
        aria-label={t.drawer_aria}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="font-bold">{t.drawer_title}</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[0.625rem] font-bold leading-none text-[var(--color-primary-foreground)]">
                {itemCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart} aria-label={t.drawer_close} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!basket?.packages || basket.packages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="h-10 w-10 text-[var(--color-muted-foreground)] opacity-50" aria-hidden="true" />
              <p className="text-sm text-[var(--color-muted-foreground)]">{t.empty_title}</p>
              <Button onClick={closeCart} size="sm">{t.browse}</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {basket.packages.map(item => {
                const itemPrice = item.paid_price ?? item.in_basket?.price ?? 0
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3"
                  >
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      {(item.in_basket?.gift_username || item.in_basket?.gift_username_id || giftRecipients[item.id]) && (() => {
                        const gift = giftRecipients[item.id]
                        const name = item.in_basket?.gift_username ?? item.in_basket?.gift_username_id ?? gift?.username
                        const dId = gift?.discordId
                        return (
                          <div className="mt-0.5">
                            <p className="text-[0.625rem] font-medium text-[var(--color-discord-text)]">
                              🎁 {t.gift_for.replace('{name}', String(name))}
                            </p>
                            {dId && (
                              <p className="font-mono text-[0.625rem] text-[var(--color-muted-foreground)]">
                                Discord: {dId}
                              </p>
                            )}
                          </div>
                        )
                      })()}
                      <p className="mt-0.5 font-mono text-xs font-bold text-[var(--color-primary)]">
                        {itemPrice === 0 ? t.free : `${itemPrice.toFixed(2)}€`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePackage(item.id)}
                      disabled={isLoading}
                      className="h-8 w-8 text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]"
                      aria-label={t.remove_item.replace('{name}', item.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {basket?.packages && basket.packages.length > 0 && (
          <div className="flex shrink-0 flex-col gap-3 border-t border-[var(--color-border)] px-5 py-4">

            {/* Active coupons */}
            {hasCoupon && (
              <div className="flex flex-col gap-1.5">
                {coupons.map(c => {
                  const code = c.code ?? c.coupon_code ?? ''
                  return (
                    <div
                      key={code}
                      className="flex items-center justify-between rounded-lg border border-[color-mix(in_oklab,var(--color-primary)_30%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-primary)_8%,transparent)] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 text-[var(--color-primary)]" aria-hidden="true" />
                        <span className="font-mono text-xs font-bold text-[var(--color-primary)]">{code}</span>
                      </div>
                      <button
                        onClick={() => removeCode(code)}
                        disabled={isLoading}
                        title={t.coupon_remove}
                        className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-danger)] disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Coupon input — nur wenn kein Coupon aktiv */}
            {!hasCoupon && (
              <>
                <button
                  onClick={() => { setShowCoupon(!showCoupon); setCouponError('') }}
                  className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                >
                  <Tag className="h-3 w-3" aria-hidden="true" />
                  {t.have_coupon}
                  <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
                </button>

                {showCoupon && (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <Input
                      type="text"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value); setCouponError('') }}
                      placeholder={t.coupon_placeholder}
                      className="flex-1 py-2 text-xs"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t.coupon_apply}
                    </Button>
                  </form>
                )}
              </>
            )}

            {couponError && (
              <p className="-mt-1 text-xs text-[var(--color-danger)]">{couponError}</p>
            )}

            {/* Price-Breakdown */}
            <div className="flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3">
              {hasDiscount && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-muted-foreground)]">{t.subtotal}</span>
                    <span className="font-mono text-[var(--color-muted-foreground)] line-through">
                      {effectiveSubtotal.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-[var(--color-primary)]">
                      <Tag className="h-2.5 w-2.5" aria-hidden="true" /> {t.coupon}
                    </span>
                    <span className="font-mono font-semibold text-[var(--color-primary)]">
                      −{discount.toFixed(2)}€
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.total}</span>
                <span className="font-mono text-lg font-bold text-[var(--color-primary)]">
                  {finalTotal.toFixed(2)}€ <span className="text-xs text-[var(--color-muted-foreground)]">{currency}</span>
                </span>
              </div>
            </div>

            {checkoutUrl ? (
              <Button asChild className="w-full">
                <a href={checkoutUrl}>{t.checkout}</a>
              </Button>
            ) : (
              <Button disabled className="w-full">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.loading_checkout}
              </Button>
            )}

            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
              {t.checkout_note}
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
