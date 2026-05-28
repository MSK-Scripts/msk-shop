'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Trash2, ShoppingBag, Loader2, ArrowLeft, Tag, ShieldCheck, Lock, Globe } from 'lucide-react'
import { useCart } from '@/lib/useCart'
import { useCartStore } from '@/store/cart'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CartPage() {
  const {
    basket, isLoading, removePackage, removeCode,
    total, subtotal, currency, checkoutUrl,
    refreshBasket, giftRecipients,
  } = useCart()
  const { openCart } = useCartStore()

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

  const packages = basket?.packages ?? []
  const coupons = basket?.coupons ?? []
  const hasCoupon = coupons.length > 0
  const finalTotal = basket?.total_price ?? total
  const effectiveSubtotal = subtotal ?? finalTotal
  const discount = hasCoupon ? Math.max(0, effectiveSubtotal - finalTotal) : 0
  const hasDiscount = discount > 0.005

  function formatPrice(price: number | undefined | null): string {
    const p = price ?? 0
    return p === 0 ? 'Free' : `€${p.toFixed(2)}`
  }

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-10">
        <span className="eyebrow">Checkout</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Your Cart</h1>
      </header>

      {packages.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[var(--color-border)] py-24 text-center">
          <ShoppingBag className="h-12 w-12 text-[var(--color-muted-foreground)] opacity-50" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Browse our packages to add something to your cart.
            </p>
          </div>
          <Button asChild>
            <Link href="/packages">
              <ArrowLeft className="h-4 w-4" />
              Browse Packages
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Items */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            {packages.map(item => {
              const itemPrice = item.paid_price ?? item.in_basket?.price ?? 0
              const basePrice = item.base_price ?? 0
              const itemHasDiscount = (item.discount ?? 0) > 0
              return (
                <Card key={item.id} className="flex items-center gap-4 p-4">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    {(item.in_basket?.gift_username || item.in_basket?.gift_username_id || giftRecipients[item.id]) && (() => {
                      const gift = giftRecipients[item.id]
                      const name = item.in_basket?.gift_username ?? item.in_basket?.gift_username_id ?? gift?.username
                      const dId = gift?.discordId
                      return (
                        <div className="mt-0.5">
                          <p className="text-[0.625rem] font-medium text-[var(--color-discord)]">
                            🎁 Gift for {name}
                          </p>
                          {dId && (
                            <p className="font-mono text-[0.625rem] text-[var(--color-muted-foreground)]">
                              Discord: {dId}
                            </p>
                          )}
                        </div>
                      )
                    })()}
                    <p className="mt-1 font-mono text-sm font-bold text-[var(--color-primary)]">
                      {formatPrice(itemPrice)}
                    </p>
                    {itemHasDiscount && (
                      <p className="mt-0.5 font-mono text-xs text-[var(--color-muted-foreground)] line-through">
                        €{basePrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePackage(item.id)}
                    disabled={isLoading}
                    className="h-9 w-9 text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              )
            })}

            {/* Active coupon notice */}
            {hasCoupon && (
              <Card className="border-[color-mix(in_oklab,var(--color-primary)_30%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-primary)_8%,var(--color-card))] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    Active coupon
                  </p>
                </div>
                {coupons.map(c => {
                  const code = c.code ?? c.coupon_code ?? ''
                  return (
                    <div key={code} className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-[var(--color-primary)]">{code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCode(code)}
                        disabled={isLoading}
                        className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]"
                      >
                        Remove
                      </Button>
                    </div>
                  )
                })}
              </Card>
            )}

            {!hasCoupon && (
              <Button variant="outline" onClick={openCart} className="w-full justify-center">
                <Tag className="h-3.5 w-3.5" />
                Have a coupon code? Open cart →
              </Button>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 p-6">
              <h2 className="mb-4 border-b border-[var(--color-border)] pb-3 font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                Order Summary
              </h2>

              <div className="mb-4 flex flex-col gap-2">
                {packages.map(item => {
                  const itemPrice = item.paid_price ?? item.in_basket?.price ?? 0
                  return (
                    <div key={item.id} className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
                      <span className="mr-2 truncate">{item.name}</span>
                      <span className="shrink-0 font-mono">{formatPrice(itemPrice)}</span>
                    </div>
                  )
                })}
              </div>

              <div className="mb-4 flex flex-col gap-1.5 border-t border-[var(--color-border)] py-3">
                {hasDiscount && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-muted-foreground)]">Subtotal</span>
                      <span className="font-mono text-[var(--color-muted-foreground)] line-through">
                        €{effectiveSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-primary)]">Coupon</span>
                      <span className="font-mono font-semibold text-[var(--color-primary)]">
                        −€{discount.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-mono text-2xl font-bold tracking-tight text-[var(--color-primary)]">
                    €{finalTotal.toFixed(2)} <span className="text-xs text-[var(--color-muted-foreground)]">{currency}</span>
                  </span>
                </div>
              </div>

              {checkoutUrl ? (
                <Button asChild size="lg" className="w-full">
                  <a href={checkoutUrl}>Proceed to Checkout</a>
                </Button>
              ) : (
                <Button disabled size="lg" className="w-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </Button>
              )}

              <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
                <Link href="/packages">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Continue Shopping
                </Link>
              </Button>

              {/* Trust-Signals */}
              <ul className="mt-5 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-muted-foreground)]">
                <li className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
                  SSL-encrypted checkout
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
                  EU VAT included
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
                  Powered by Tebex
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
