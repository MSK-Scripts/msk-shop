import type { Metadata } from 'next'

import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { WithdrawalClient } from './WithdrawalClient'

// Bewusst **kein** `robots: noindex`. Die Schaltfläche muss während der
// gesamten Widerrufsfrist ohne Hürde auffindbar sein; eine Seite, die niemand
// über eine Suche findet, arbeitet gegen genau diesen Zweck.
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
