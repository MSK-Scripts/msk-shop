'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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
      <div className="container-page py-20 md:py-24">
        <div className="mx-auto max-w-lg text-center">
          <Card className="p-8">
            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-[var(--color-primary)]" />
            <h1 className="mb-3 text-2xl font-bold tracking-tight">Payment Successful!</h1>
            <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
              Thank you for your purchase. You will receive a confirmation email shortly.
              Your download should be available immediately.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Shop
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="container-page py-20 md:py-24">
        <div className="mx-auto max-w-lg text-center">
          <Card className="p-8">
            <XCircle className="mx-auto mb-4 h-14 w-14 text-[var(--color-danger)]" />
            <h1 className="mb-3 text-2xl font-bold tracking-tight">Payment Cancelled</h1>
            <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
              Your payment was cancelled. Your cart items are still saved.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/cart">Back to Cart</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/packages">Browse Packages</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-20 md:py-24">
      <div className="mx-auto max-w-lg text-center">
        <Card className="p-8">
          <h1 className="mb-3 text-2xl font-bold tracking-tight">Checkout</h1>
          <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
            Add items to your cart and proceed to checkout from the cart page.
          </p>
          <Button asChild>
            <Link href="/cart">View Cart</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
