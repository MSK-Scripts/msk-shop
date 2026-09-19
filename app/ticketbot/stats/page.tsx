import type { Metadata } from 'next'
import { alternatesFor }      from '@/lib/seo'
import { pageSeo }            from '@/lib/pageSeo'
import { getRequestLang }     from '@/lib/serverLang'
import { loadTicketbotStats } from '@/lib/ticketbotStats'
import StatsClient            from './StatsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/ticketbot/stats', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/ticketbot/stats'),
  }
}

export default async function StatsPage() {
  const stats = await loadTicketbotStats()
  return <StatsClient stats={stats} />
}
