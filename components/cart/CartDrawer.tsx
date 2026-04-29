'use client'

import { useEffect, useState } from 'react'
import { X, ShoppingBag, Trash2, Tag, Loader2, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useCart } from '@/lib/useCart'

export function CartDrawer() {
  const { isOpen, closeCart, basket } = useCartStore()
  const { removePackage, applyCode, removeCode, isLoading, total, subtotal, currency, checkoutUrl, itemCount, giftRecipients } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [showCoupon, setShowCoupon] = useState(false)

  // Coupons derived early — available in handlers too
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
      setCouponError('Please remove the active coupon first.')
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
      setCouponError('This coupon cannot be applied to the items in your cart.')
    } else {
      setCouponError('Invalid or expired coupon code.')
    }
  }

  if (!isOpen) return null

  // Price breakdown
  const finalTotal = basket?.total_price ?? total
  const hasCoupon = coupons.length > 0
  const effectiveSubtotal = subtotal ?? finalTotal
  const discount = hasCoupon ? Math.max(0, effectiveSubtotal - finalTotal) : 0
  const hasDiscount = discount > 0.005

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closeCart} />

      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-surface border-l border-borderlt flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-borderlt shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-accent" />
            <h2 className="text-white font-bold">Cart</h2>
            {itemCount > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="text-muted hover:text-text transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!basket?.packages || basket.packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingBag size={40} className="text-dim opacity-50" />
              <p className="text-dim text-sm">Your cart is empty</p>
              <button onClick={closeCart} className="msk-btn-primary text-xs px-4 py-2">
                Browse Packages
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {basket.packages.map((item) => {
                const itemPrice = item.paid_price ?? item.in_basket?.price ?? 0
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-surface2 rounded-lg border border-borderlt">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
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
                      <p className="text-xs text-accent font-bold mt-0.5">
                        {itemPrice === 0 ? 'Free' : `€${itemPrice.toFixed(2)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removePackage(item.id)}
                      disabled={isLoading}
                      className="text-dim hover:text-danger transition-colors p-1 shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {basket?.packages && basket.packages.length > 0 && (
          <div className="border-t border-borderlt px-5 py-4 flex flex-col gap-3 shrink-0">

            {/* Active coupons */}
            {hasCoupon && (
              <div className="flex flex-col gap-1.5">
                {coupons.map((c) => {
                  const code = c.code ?? c.coupon_code ?? ''
                  return (
                    <div key={code} className="flex items-center justify-between bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag size={12} className="text-accent" />
                        <span className="text-xs text-accent font-mono font-bold">{code}</span>
                      </div>
                      <button
                      onClick={() => removeCode(code)}
                        disabled={isLoading}
                      title="Remove coupon"
                      className="text-dim hover:text-danger transition-colors disabled:opacity-50"
                      >
                      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                      </button>
                    </div>
                  )
                })}
                {/* Info note removed — coupon can now be removed directly */}
              </div>
            )}

            {/* Coupon input — only show if no coupon active */}
            {!hasCoupon && (
              <>
                <button
                  onClick={() => { setShowCoupon(!showCoupon); setCouponError('') }}
                  className="flex items-center gap-2 text-xs text-muted hover:text-text transition-colors"
                >
                  <Tag size={13} />
                  Have a coupon code?
                  <ChevronDown size={12} className={`ml-auto transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
                </button>

                {showCoupon && (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value); setCouponError('') }}
                      placeholder="Enter coupon code..."
                      className="msk-input text-xs flex-1 py-2"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponInput.trim()}
                      className="msk-btn-primary px-3 text-xs py-2 shrink-0"
                    >
                      {couponLoading ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                    </button>
                  </form>
                )}
              </>
            )}

            {couponError && (
              <p className="text-danger text-xs -mt-1">{couponError}</p>
            )}

            {/* Price breakdown */}
            <div className="border-t border-borderlt pt-3 flex flex-col gap-1.5">
              {hasDiscount && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs">Subtotal</span>
                    <span className="text-muted text-xs line-through">€{effectiveSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-accent text-xs flex items-center gap-1">
                      <Tag size={10} /> Coupon
                    </span>
                    <span className="text-accent text-xs font-semibold">-€{discount.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-semibold">Total</span>
                <span className="text-accent font-bold text-lg">
                  €{finalTotal.toFixed(2)} {currency}
                </span>
              </div>
            </div>

            {checkoutUrl ? (
              <a
                href={checkoutUrl}
                className="msk-btn-primary w-full justify-center"
              >
                Proceed to Checkout
              </a>
            ) : (
              <button disabled className="msk-btn-primary w-full justify-center opacity-50 cursor-not-allowed">
                Loading checkout...
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
