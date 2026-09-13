import type { Metadata } from 'next'

import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { WithdrawalClient } from './WithdrawalClient'

// Deliberately **no** `robots: noindex`. The button must be findable without
// any obstacle for the whole withdrawal period; a page that nobody finds
// through a search works against exactly that purpose.
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/vertrag-widerrufen', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/vertrag-widerrufen'),
  }
}

export default function WithdrawalPage() {
  return <WithdrawalClient />
}
