import { NextResponse }       from 'next/server'
import { query, queryOne }   from '@/lib/db'
import { getIgnoredApiKeys } from '@/lib/statsIgnore'

export const dynamic = 'force-dynamic' // always recompute — no caching of live stats

interface CountRow  { total: number }
interface AvgRow    { avg_bytes: number | null }
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
    ] = await Promise.all([
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_transcripts'),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE active = TRUE ${exclude}`, ignored),
      query<TierRow>(`SELECT tier, COUNT(*) AS count FROM ticketbot_guilds WHERE active = TRUE ${exclude} GROUP BY tier`, ignored),
      queryOne<AvgRow>('SELECT AVG(file_size_bytes) AS avg_bytes FROM ticketbot_transcripts'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_attachments'),
      queryOne<AvgRow>('SELECT AVG(file_size_bytes) AS avg_bytes FROM ticketbot_attachments'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_sponsors WHERE active = TRUE'),
    ])

    const tierMap: Record<string, number> = { basic: 0, premium: 0, premium_plus: 0 }
    for (const row of tierRows) tierMap[row.tier] = Number(row.count)

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
    })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
