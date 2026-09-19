import { query, queryOne } from '@/lib/db'
import { TIER_CONFIG }     from '@/lib/tiers'

/**
 * The public ticket bot figures, loaded once and shared by the two places that
 * show them: `app/ticketbot/stats/page.tsx` (first render) and
 * `app/api/stats/route.ts` (the 60 s poll behind it).
 *
 * Both used to carry their own copy of these sixteen queries, byte for byte.
 * That is the arrangement `lib/giveawayStats.ts` already avoids for the
 * giveaway side, and the copies had started to matter: this change adds two
 * counts and alters the exclusion rule in every single query, which is
 * thirty-odd edits in two files that have to agree, or a page whose first
 * render disagrees with its own refresh a second later.
 *
 * ## What "excluded" means
 *
 * A key with `stats_excluded = 1` is gone from every figure here, including
 * the totals. Decided on 19.09.2026: the alternative was to keep counting it
 * and name the number of excluded keys in a footnote, which is the more honest
 * arrangement but tells visitors about internal test servers. The figures are
 * a sales argument, not an audit.
 */

interface CountRow { total: number }
interface AvgRow   { avg_bytes: number | null }
interface SumRow   { sum_bytes: number | null }
interface MaxRow   { max_bytes: number | null }
interface TierRow  { tier: string; count: number }

export interface Stats {
  available:                  boolean
  transcripts:                number
  apiKeys:                    number
  tiers:                      Record<string, number>
  avgTranscriptBytes:         number
  attachments:                number
  avgAttachmentBytes:         number
  subscriptions:              number
  subscriptionTiers:          Record<string, number>
  /**
   * Keys whose origin is recorded as a giveaway or as sponsoring.
   *
   * Counted, not derived. Until 19.09.2026 the page computed
   * `premium + premium_plus + business - subscriptions` and called the result
   * giveaways, so a sponsored key and the owner's own paid-tier test server
   * were both reported as giveaway prizes.
   */
  giveawayKeys:               number
  sponsoredKeys:              number
  customDomains:              number
  hostedBots:                 number
  newGuilds30d:               number
  totalStorageBytes:          number
  transcripts30d:             number
  transcriptsWithAttachments: number
  maxTranscriptBytes:         number
}

/**
 * All tiers at 0. The queries only return rows for tiers that actually exist;
 * without this preset the key is missing and the display renders `NaN`
 * instead of a 0. Derived from `TIER_CONFIG` so a future tier cannot bring
 * the bug back.
 */
const zeroTiers = (): Record<string, number> =>
  Object.fromEntries(Object.keys(TIER_CONFIG).map(tier => [tier, 0]))

/** What the page shows when the database is unreachable. */
export const EMPTY_STATS: Stats = {
  available:                  false,
  transcripts:                0,
  apiKeys:                    0,
  tiers:                      zeroTiers(),
  avgTranscriptBytes:         0,
  attachments:                0,
  avgAttachmentBytes:         0,
  subscriptions:              0,
  subscriptionTiers:          zeroTiers(),
  giveawayKeys:               0,
  sponsoredKeys:              0,
  customDomains:              0,
  hostedBots:                 0,
  newGuilds30d:               0,
  totalStorageBytes:          0,
  transcripts30d:             0,
  transcriptsWithAttachments: 0,
  maxTranscriptBytes:         0,
}

/**
 * Every guild-level query carries this. A literal rather than a parameter
 * list: the exclusion now lives in a column, so there is nothing to bind and
 * nothing to keep in sync between the fragment and its arguments. The old
 * version built `AND api_key NOT IN (?, ?, ?)` and passed the same array to
 * sixteen queries, six of which did not use it.
 */
const COUNTED = 'active = TRUE AND stats_excluded = 0'

/** Loads every figure, or `EMPTY_STATS` if the database is unreachable. */
export async function loadTicketbotStats(): Promise<Stats> {
  try {
    const [
      transcripts,
      apiKeys,
      tierRows,
      avgTranscript,
      attachments,
      avgAttachment,
      subscriptions,
      subscriptionTierRows,
      giveawayKeys,
      sponsoredKeys,
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
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE ${COUNTED}`),
      query<TierRow>(`SELECT tier, COUNT(*) AS count FROM ticketbot_guilds WHERE ${COUNTED} GROUP BY tier`),
      queryOne<AvgRow>('SELECT AVG(file_size_bytes) AS avg_bytes FROM ticketbot_transcripts'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_attachments'),
      queryOne<AvgRow>('SELECT AVG(file_size_bytes) AS avg_bytes FROM ticketbot_attachments'),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE ${COUNTED} AND stripe_subscription_id IS NOT NULL AND tier <> 'basic'`),
      query<TierRow>(`SELECT tier, COUNT(*) AS count FROM ticketbot_guilds WHERE ${COUNTED} AND stripe_subscription_id IS NOT NULL AND tier <> 'basic' GROUP BY tier`),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE ${COUNTED} AND key_origin = 'giveaway'`),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE ${COUNTED} AND key_origin = 'sponsored'`),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE ${COUNTED} AND domain_status = 'active'`),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE ${COUNTED} AND is_hosted = 1`),
      queryOne<CountRow>(`SELECT COUNT(*) AS total FROM ticketbot_guilds WHERE ${COUNTED} AND created_at >= NOW() - INTERVAL 30 DAY`),
      queryOne<SumRow>('SELECT SUM(file_size_bytes) AS sum_bytes FROM ticketbot_transcripts'),
      queryOne<SumRow>('SELECT SUM(file_size_bytes) AS sum_bytes FROM ticketbot_attachments'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_transcripts WHERE created_at >= NOW() - INTERVAL 30 DAY'),
      queryOne<CountRow>('SELECT COUNT(*) AS total FROM ticketbot_transcripts WHERE has_attachments = TRUE'),
      queryOne<MaxRow>('SELECT MAX(file_size_bytes) AS max_bytes FROM ticketbot_transcripts'),
    ])

    const tierMap = zeroTiers()
    for (const row of tierRows) tierMap[row.tier] = Number(row.count)

    const subscriptionTierMap = zeroTiers()
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
      giveawayKeys:               Number(giveawayKeys?.total ?? 0),
      sponsoredKeys:              Number(sponsoredKeys?.total ?? 0),
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
