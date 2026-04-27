import { Suspense } from 'react'
import CheckoutContent from './CheckoutContent'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-24">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}