'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'
import { useCartStore } from '@/store/cart'

export default function CheckoutContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const { clearBasket } = useCartStore()

  useEffect(() => {
    if (status === 'complete') {
      clearBasket()
    }
  }, [status, clearBasket])

  if (status === 'complete') {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <CheckCircle size={56} className="text-accent mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-white mb-3">Payment Successful!</h1>
        <p className="text-muted text-sm mb-8">
          Thank you for your purchase. You will receive a confirmation email shortly.
          Your download should be available immediately.
        </p>
        <Link href="/" className="msk-btn-primary">
          Back to Shop
        </Link>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <XCircle size={56} className="text-danger mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-white mb-3">Payment Cancelled</h1>
        <p className="text-muted text-sm mb-8">
          Your payment was cancelled. Your cart items are still saved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/cart" className="msk-btn-primary">Back to Cart</Link>
          <Link href="/" className="msk-btn-ghost">Browse Packages</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-extrabold text-white mb-3">Checkout</h1>
      <p className="text-muted text-sm mb-8">
        Add items to your cart and proceed to checkout from the cart page.
      </p>
      <Link href="/cart" className="msk-btn-primary">View Cart</Link>
    </div>
  )
}