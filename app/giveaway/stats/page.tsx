import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { loadGiveawayStats }           from '@/lib/giveawayStats'
import StatsClient                     from './StatsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return {
  title:       'Giveaway Bot Statistics',
  alternates:  alternatesFor(lang, '/giveaway/stats'),
  description: 'Anonymous live statistics of the MSK Giveaway Bot across all Discord servers.',
}
}

export default async function GiveawayStatsPage() {
  const stats = await loadGiveawayStats()
  return <StatsClient stats={stats} />
}
