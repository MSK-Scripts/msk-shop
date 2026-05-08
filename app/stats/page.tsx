import { query, queryOne } from '@/lib/db'
import StatsClient         from './StatsClient'
import type { Stats }      from './StatsClient'

export const revalidate = 300

export const metadata = {
  title:       'Bot Statistics – MSK Scripts',
  description: 'Anonymous live statistics of the MSK Ticket Bot across all servers.',
}

interface CountRow { total: number }
interface AvgRow   { avg_bytes: number | null }
interface TierRow  { tier: string; count: number }

const EMPTY_STATS: Stats = {
  available:          false,
  transcripts:        0,
  apiKeys:            0,
  tiers:              { basic: 0, premium: 0, premium_plus: 0 },
  avgTranscriptBytes: 0,
  attachments:        0,
  avgAttachmentBytes: 0,
  sponsors:           0,
}

async function loadStats(): Promise<Stats> {
  try {
    const [
      transcripts,
      apiKeys,
      tierRows,
      avgTranscript,
      attachments,
      avgAttachment,
      sponsors,
    ] = await Promise.all([
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_transcripts'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE active = TRUE'),
      query<TierRow>('SELECT tier, COUNT(*) AS count FROM ticketbot_guilds WHERE active = TRUE GROUP BY tier'),
      queryOne<AvgRow>('SELECT AVG(file_size_bytes) AS avg_bytes FROM ticketbot_transcripts'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_attachments'),
      queryOne<AvgRow>('SELECT AVG(file_size_bytes) AS avg_bytes FROM ticketbot_attachments'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_sponsors WHERE active = TRUE'),
    ])

    const tierMap: Record<string, number> = { basic: 0, premium: 0, premium_plus: 0 }
    for (const row of tierRows) tierMap[row.tier] = Number(row.count)

    return {
      available:          true,
      transcripts:        Number(transcripts?.total ?? 0),
      apiKeys:            Number(apiKeys?.total ?? 0),
      tiers:              tierMap,
      avgTranscriptBytes: avgTranscript?.avg_bytes ? Math.round(Number(avgTranscript.avg_bytes)) : 0,
      attachments:        Number(attachments?.total ?? 0),
      avgAttachmentBytes: avgAttachment?.avg_bytes ? Math.round(Number(avgAttachment.avg_bytes)) : 0,
      sponsors:           Number(sponsors?.total ?? 0),
    }
  } catch {
    return EMPTY_STATS
  }
}

export default async function StatsPage() {
  const stats = await loadStats()
  return <StatsClient stats={stats} />
}
