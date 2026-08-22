import { Suspense } from 'react'
import CheckoutContent from './CheckoutContent'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center" />}>
      <CheckoutContent />
    </Suspense>
  )
}