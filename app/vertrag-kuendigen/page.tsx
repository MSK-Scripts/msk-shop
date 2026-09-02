import type { Metadata } from 'next'

import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { CancellationClient } from './CancellationClient'

// Indexierbar wie die Widerrufsseite: § 312k verlangt eine Schaltfläche, die
// ständig und unmittelbar verfügbar ist.
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/vertrag-kuendigen', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/vertrag-kuendigen'),
  }
}

export default function CancellationPage() {
  return <CancellationClient />
}
