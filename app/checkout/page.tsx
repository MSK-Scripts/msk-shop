import { Suspense } from 'react'
import CheckoutContent from './CheckoutContent'
import type { Metadata } from 'next'
import { getRequestLang } from '@/lib/serverLang'
import { pageSeo } from '@/lib/pageSeo'

/**
 * Own title instead of the default from the root layout. No `alternates`:
 * the page is noindex; a canonical or hreflang on it would be a signal
 * for something that is not meant to be in the index at all.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/checkout', lang)
  return {
    title:       seo.title,
    description: seo.description,
    robots:      { index: false, follow: false },
  }
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center" />}>
      <CheckoutContent />
    </Suspense>
  )
}