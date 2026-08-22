import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { loadGiveawayStats }           from '@/lib/giveawayStats'
import StatsClient                     from './StatsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/giveaway/stats', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/giveaway/stats'),
  }
}

export default async function GiveawayStatsPage() {
  const stats = await loadGiveawayStats()
  return <StatsClient stats={stats} />
}
