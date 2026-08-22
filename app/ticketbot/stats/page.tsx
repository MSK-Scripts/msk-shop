import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { query, queryOne }    from '@/lib/db'
import { getIgnoredApiKeys } from '@/lib/statsIgnore'
import StatsClient            from './StatsClient'
import type { Stats }         from './StatsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return {
  title:       'Bot Statistics',
  alternates:  alternatesFor(lang, '/ticketbot/stats'),
  description: 'Anonymous live statistics of the MSK Ticket Bot across all servers.',
}
}

interface CountRow { total: number }
interface AvgRow   { avg_bytes: number | null }
interface SumRow   { sum_bytes: number | null }
interface MaxRow   { max_bytes: number | null }
interface TierRow  { tier: string; count: number }

const EMPTY_STATS: Stats = {
  available:                  false,
  transcripts:                0,
  apiKeys:                    0,
  tiers:                      { basic: 0, premium: 0, premium_plus: 0 },
  avgTranscriptBytes:         0,
  attachments:                0,
  avgAttachmentBytes:         0,
  subscriptions:              0,
  subscriptionTiers:          { basic: 0, premium: 0, premium_plus: 0 },
  customDomains:              0,
  hostedBots:                 0,
  newGuilds30d:               0,
  totalStorageBytes:          0,
  transcripts30d:             0,
  transcriptsWithAttachments: 0,
  maxTranscriptBytes:         0,
}

async function loadStats(): Promise<Stats> {
  try {
    const ignored    = getIgnoredApiKeys()
    const hasIgnored = ignored.length > 0
    const exclude    = hasIgnored
      ? `AND api_key NOT IN (${ignored.map(() => '?').join(', ')})`
      : ''

    const [
      transcripts,
      apiKeys,
      tierRows,
      avgTranscript,
      attachments,
      avgAttachment,
      subscriptions,
      subscriptionTierRows,
      customDomains,
      hostedBots,
      newGuilds30d,
      sumTranscript,
      sumAttachment,
      transcripts30d,
      transcriptsWithAttachments,
      maxTranscript,
    ] = await Promise.all([
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_transcripts'),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE active = TRUE ${exclude}`, ignored),
      query<TierRow>(`SELECT tier, COUNT(*) AS count FROM ticketbot_guilds WHERE active = TRUE ${exclude} GROUP BY tier`, ignored),
      queryOne<AvgRow>('SELECT AVG(file_size_bytes) AS avg_bytes FROM ticketbot_transcripts'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_attachments'),
      queryOne<AvgRow>('SELECT AVG(file_size_bytes) AS avg_bytes FROM ticketbot_attachments'),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE active = TRUE AND stripe_subscription_id IS NOT NULL AND tier <> 'basic' ${exclude}`, ignored),
      query<TierRow>(`SELECT tier, COUNT(*) AS count FROM ticketbot_guilds WHERE active = TRUE AND stripe_subscription_id IS NOT NULL AND tier <> 'basic' ${exclude} GROUP BY tier`, ignored),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE active = TRUE AND domain_status = 'active' ${exclude}`, ignored),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE active = TRUE AND is_hosted = 1 ${exclude}`, ignored),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE active = TRUE AND created_at >= NOW() - INTERVAL 30 DAY ${exclude}`, ignored),
      queryOne<SumRow>('SELECT SUM(file_size_bytes) AS sum_bytes FROM ticketbot_transcripts'),
      queryOne<SumRow>('SELECT SUM(file_size_bytes) AS sum_bytes FROM ticketbot_attachments'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_transcripts WHERE created_at >= NOW() - INTERVAL 30 DAY'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_transcripts WHERE has_attachments = TRUE'),
      queryOne<MaxRow>('SELECT MAX(file_size_bytes) AS max_bytes FROM ticketbot_transcripts'),
    ])

    const tierMap: Record<string, number> = { basic: 0, premium: 0, premium_plus: 0 }
    for (const row of tierRows) tierMap[row.tier] = Number(row.count)

    const subscriptionTierMap: Record<string, number> = { basic: 0, premium: 0, premium_plus: 0 }
    for (const row of subscriptionTierRows) subscriptionTierMap[row.tier] = Number(row.count)

    return {
      available:                  true,
      transcripts:                Number(transcripts?.total ?? 0),
      apiKeys:                    Number(apiKeys?.total ?? 0),
      tiers:                      tierMap,
      avgTranscriptBytes:         avgTranscript?.avg_bytes ? Math.round(Number(avgTranscript.avg_bytes)) : 0,
      attachments:                Number(attachments?.total ?? 0),
      avgAttachmentBytes:         avgAttachment?.avg_bytes ? Math.round(Number(avgAttachment.avg_bytes)) : 0,
      subscriptions:              Number(subscriptions?.total ?? 0),
      subscriptionTiers:          subscriptionTierMap,
      customDomains:              Number(customDomains?.total ?? 0),
      hostedBots:                 Number(hostedBots?.total ?? 0),
      newGuilds30d:               Number(newGuilds30d?.total ?? 0),
      totalStorageBytes:          Number(sumTranscript?.sum_bytes ?? 0) + Number(sumAttachment?.sum_bytes ?? 0),
      transcripts30d:             Number(transcripts30d?.total ?? 0),
      transcriptsWithAttachments: Number(transcriptsWithAttachments?.total ?? 0),
      maxTranscriptBytes:         maxTranscript?.max_bytes ? Number(maxTranscript.max_bytes) : 0,
    }
  } catch (err) {
    console.error('[Stats] DB error:', err)
    return EMPTY_STATS
  }
}

export default async function StatsPage() {
  const stats = await loadStats()
  return <StatsClient stats={stats} />
}
