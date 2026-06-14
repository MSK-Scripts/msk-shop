import { NextResponse }       from 'next/server'
import { query, queryOne }   from '@/lib/db'
import { getIgnoredApiKeys } from '@/lib/statsIgnore'

export const dynamic = 'force-dynamic' // always recompute — no caching of live stats

interface CountRow  { total: number }
interface AvgRow    { avg_bytes: number | null }
interface SumRow    { sum_bytes: number | null }
interface MaxRow    { max_bytes: number | null }
interface TierRow   { tier: string; count: number }

export async function GET() {
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
      sponsors,
      sponsorTierRows,
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
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_sponsors WHERE active = TRUE'),
      query<TierRow>('SELECT tier, COUNT(*) AS count FROM ticketbot_sponsors WHERE active = TRUE GROUP BY tier'),
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

    const sponsorTierMap: Record<string, number> = { basic: 0, premium: 0, premium_plus: 0 }
    for (const row of sponsorTierRows) sponsorTierMap[row.tier] = Number(row.count)

    return NextResponse.json({
      transcripts:         Number(transcripts?.total ?? 0),
      apiKeys:             Number(apiKeys?.total ?? 0),
      tiers: {
        basic:             tierMap.basic,
        premium:           tierMap.premium,
        premium_plus:      tierMap.premium_plus,
      },
      avgTranscriptBytes:  avgTranscript?.avg_bytes ? Math.round(Number(avgTranscript.avg_bytes)) : 0,
      attachments:         Number(attachments?.total ?? 0),
      avgAttachmentBytes:  avgAttachment?.avg_bytes ? Math.round(Number(avgAttachment.avg_bytes)) : 0,
      sponsors:            Number(sponsors?.total ?? 0),
      sponsorTiers: {
        basic:             sponsorTierMap.basic,
        premium:           sponsorTierMap.premium,
        premium_plus:      sponsorTierMap.premium_plus,
      },
      customDomains:              Number(customDomains?.total ?? 0),
      hostedBots:                 Number(hostedBots?.total ?? 0),
      newGuilds30d:               Number(newGuilds30d?.total ?? 0),
      totalStorageBytes:          Number(sumTranscript?.sum_bytes ?? 0) + Number(sumAttachment?.sum_bytes ?? 0),
      transcripts30d:             Number(transcripts30d?.total ?? 0),
      transcriptsWithAttachments: Number(transcriptsWithAttachments?.total ?? 0),
      maxTranscriptBytes:         maxTranscript?.max_bytes ? Number(maxTranscript.max_bytes) : 0,
    })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
