import type { Metadata } from 'next'

import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { parseContractChoice } from '@/lib/withdrawalChoice'
import { WithdrawalClient } from './WithdrawalClient'

// Deliberately **no** `robots: noindex`. The button must be findable without
// any obstacle for the whole withdrawal period; a page that nobody finds
// through a search works against exactly that purpose.
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/withdraw-contract', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/withdraw-contract'),
  }
}

// `?contract=subscription` (order confirmation, account page) preselects the
// contract, so a subscriber reaches the form without the extra question.
export default async function WithdrawalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { contract } = await searchParams
  return <WithdrawalClient initialChoice={parseContractChoice(contract)} />
}
