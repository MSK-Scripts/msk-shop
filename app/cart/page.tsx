'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Trash2, ExternalLink, ShoppingBag, Loader2 } from 'lucide-react'
import { useCart } from '@/lib/useCart'
import { useCartStore } from '@/store/cart'

export default function CartPage() {
  const { basket, isLoading, removePackage, total, subtotal, currency, checkoutUrl, refreshBasket, giftRecipients } = useCart()
  const { openCart } = useCartStore()

  useEffect(() => {
    refreshBasket()
    // Strip any status/redirect params from URL (e.g. ?status=cancelled after Tebex redirect)
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
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <span className="msk-label">Store</span>
        <h1 className="text-3xl font-extrabold text-white mt-1">Your Cart</h1>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center gap-4">
          <ShoppingBag size={48} className="text-dim opacity-30" />
          <p className="text-muted text-lg font-semibold">Your cart is empty</p>
          <Link href="/" className="msk-btn-primary">Browse Packages</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Items */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {packages.map((item) => {
              const itemPrice = item.paid_price ?? item.in_basket?.price ?? 0
              const basePrice = item.base_price ?? 0
              return (
                <div key={item.id} className="bg-surface border border-borderlt rounded-xl p-4 flex items-center gap-4">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{item.name}</p>
                    {(item.in_basket?.gift_username || item.in_basket?.gift_username_id || giftRecipients[item.id]) && (() => {
                      const gift = giftRecipients[item.id]
                      const name = item.in_basket?.gift_username ?? item.in_basket?.gift_username_id ?? gift?.username
                      const dId = gift?.discordId
                      return (
                        <div className="mt-0.5">
                          <p className="text-[10px] text-[#5865F2] font-medium">
                            🎁 Gift for {name}
                          </p>
                          {dId && (
                            <p className="text-[10px] text-dim font-mono">
                              Discord: {dId}
                            </p>
                          )}
                        </div>
                      )
                    })()}
                    <p className="text-accent font-bold text-sm mt-0.5">
                      {formatPrice(itemPrice)}
                    </p>
                    {(item.discount ?? 0) > 0 && (
                      <p className="text-xs text-dim line-through mt-0.5">€{basePrice.toFixed(2)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removePackage(item.id)}
                    disabled={isLoading}
                    className="text-dim hover:text-danger transition-colors p-2 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}

            {/* Active coupon notice */}
            {hasCoupon && (
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                <p className="text-xs text-accent font-semibold mb-1">Active coupon</p>
                {coupons.map(c => (
                  <div key={c.code ?? c.coupon_code} className="flex items-center justify-between">
                    <span className="text-accent font-mono text-sm font-bold">{c.code ?? c.coupon_code}</span>
                    {checkoutUrl && (
                      <a href={checkoutUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-dim hover:text-danger transition-colors">
                        Remove at checkout
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add coupon via cart drawer */}
            {!hasCoupon && (
              <button
                onClick={openCart}
                className="msk-btn-ghost text-xs py-2.5 justify-center"
              >
                Have a coupon code? Open cart →
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-surface border border-borderlt rounded-xl p-5 sticky top-20">
              <h2 className="text-sm font-bold text-white mb-4 pb-3 border-b border-borderlt">
                Order Summary
              </h2>

              <div className="flex flex-col gap-2 mb-4">
                {packages.map((item) => {
                  const itemPrice = item.paid_price ?? item.in_basket?.price ?? 0
                  return (
                    <div key={item.id} className="flex justify-between text-xs text-muted">
                      <span className="truncate mr-2">{item.name}</span>
                      <span className="shrink-0">{formatPrice(itemPrice)}</span>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-1.5 py-3 border-t border-borderlt mb-4">
                {hasDiscount && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Subtotal</span>
                      <span className="text-muted line-through">€{effectiveSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-accent">Coupon</span>
                      <span className="text-accent font-semibold">-€{discount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-accent font-bold text-xl">
                    €{finalTotal.toFixed(2)} {currency}
                  </span>
                </div>
              </div>

              {checkoutUrl ? (
                <a href={checkoutUrl}
                className="msk-btn-primary w-full justify-center py-3">
                Proceed to Checkout
                </a>
              ) : (
                <button disabled className="msk-btn-primary w-full justify-center py-3 opacity-50 cursor-not-allowed">
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </button>
              )}

              <Link href="/" className="msk-btn-ghost w-full justify-center mt-2 text-xs">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
