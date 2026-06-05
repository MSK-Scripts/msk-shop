import { cookies, headers }            from 'next/headers'
import { loadGiveawayStats }           from '@/lib/giveawayStats'
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang'
import StatsClient                     from './StatsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title:       'Giveaway Bot Statistics – MSK Scripts',
  description: 'Anonymous live statistics of the MSK Giveaway Bot across all Discord servers.',
}

export default async function GiveawayStatsPage() {
  const [stats, cookieStore, headerStore] = await Promise.all([
    loadGiveawayStats(),
    cookies(),
    headers(),
  ])
  const initialLang = resolveLang(
    cookieStore.get(LANG_COOKIE_NAME)?.value,
    headerStore.get('accept-language'),
  )
  return <StatsClient stats={stats} initialLang={initialLang} />
}
