import { Suspense } from 'react'
import CheckoutContent from './CheckoutContent'
import type { Metadata } from 'next'
import { getRequestLang } from '@/lib/serverLang'
import { pageSeo } from '@/lib/pageSeo'

/**
 * Eigener Titel statt des Vorgabewerts aus dem Root-Layout. Kein `alternates`:
 * die Seite ist noindex, ein Canonical oder hreflang darauf wäre ein Signal
 * für etwas, das gar nicht in den Index soll.
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