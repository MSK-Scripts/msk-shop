import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

/**
 * The public giveaway statistics read the bot's database directly. Since the
 * bot can schedule a giveaway, a row may be SCHEDULED: created, not posted,
 * without entries. Such a row is neither running nor over, and it must not
 * pull down the average of the giveaways that did run.
 */

vi.mock('@/lib/giveawayDb', () => ({ giveawayQuery: vi.fn(), giveawayQueryOne: vi.fn() }))

import { giveawayQuery, giveawayQueryOne } from '@/lib/giveawayDb'
import { loadGiveawayStats } from '@/lib/giveawayStats'

/** Counts per status as the database holds them; the fake answers the WHERE it is given. */
const ROWS: Record<string, number> = { SCHEDULED: 3, ACTIVE: 2, PAUSED: 1, ENDED: 4, CANCELLED: 0 }
const total = Object.values(ROWS).reduce((a, b) => a + b, 0)

beforeEach(() => {
  ;(giveawayQueryOne as Mock).mockImplementation(async (sql: string) => {
    if (sql.includes('FROM `Giveaway`')) {
      const where = /status = '(\w+)'/.exec(sql)
      return { total: where ? ROWS[where[1]] ?? 0 : total }
    }
    if (sql.includes('FROM `Entry` GROUP BY')) return { total: 40 }
    if (sql.includes('FROM `Entry`')) return { total: 70 }
    return { total: 1 }
  })
  ;(giveawayQuery as Mock).mockImplementation(async (sql: string) => {
    if (sql.includes('GROUP BY status')) return Object.entries(ROWS).map(([k, count]) => ({ k, count }))
    return [{ k: 'en', count: 1 }]
  })
})

describe('public giveaway statistics with scheduled giveaways', () => {
  it('counts only ACTIVE as running', async () => {
    const stats = await loadGiveawayStats()
    expect(stats.activeGiveaways).toBe(2)
  })

  it('keeps scheduled ones apart in the status breakdown, never under running or ended', async () => {
    const { status } = await loadGiveawayStats()
    expect(status).toEqual({ SCHEDULED: 3, ACTIVE: 2, PAUSED: 1, ENDED: 4, CANCELLED: 0 })
  })

  it('averages the entries over the giveaways that started', async () => {
    const stats = await loadGiveawayStats()
    expect(stats.giveaways).toBe(10)
    // 70 entries over the 7 that were posted, not over all 10.
    expect(stats.avgEntries).toBe(10)
  })

  it('has a zero for scheduled ones when the database is unreachable', async () => {
    ;(giveawayQueryOne as Mock).mockRejectedValue(new Error('ECONNREFUSED'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stats = await loadGiveawayStats()
    spy.mockRestore()
    expect(stats.available).toBe(false)
    expect(stats.status.SCHEDULED).toBe(0)
  })
})
