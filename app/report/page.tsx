import type { Metadata } from 'next'
import { Suspense } from 'react'

import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { ReportClient } from './ReportClient'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/report', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/report'),
  }
}

export default function ReportPage() {
  // `useSearchParams` (die vorbelegte URL) braucht eine Suspense-Grenze,
  // sonst verweigert Next den Build der Seite.
  return (
    <Suspense>
      <ReportClient />
    </Suspense>
  )
}
