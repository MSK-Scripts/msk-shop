import { loadGiveawayStats }           from '@/lib/giveawayStats'
import StatsClient                     from './StatsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title:       'Giveaway Bot Statistics',
  alternates:  { canonical: '/giveaway/stats' },
  description: 'Anonymous live statistics of the MSK Giveaway Bot across all Discord servers.',
}

export default async function GiveawayStatsPage() {
  const stats = await loadGiveawayStats()
  return <StatsClient stats={stats} />
}
