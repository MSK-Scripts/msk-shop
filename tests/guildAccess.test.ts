import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

vi.mock('@/lib/db', () => ({ query: vi.fn() }))

import { query } from '@/lib/db'
import {
  accessState, accessGraceEndsAt, isAccessStale, reconcileGuildAccess,
  ACCESS_GRACE_DAYS, ACCESS_STALE_HOURS,
} from '@/lib/guildAccess'

const DAY  = 86_400_000
const HOUR = 3_600_000
const NOW  = Date.UTC(2026, 8, 12, 12, 0, 0)

const row = (lost: Date | null, checked: Date | null = new Date(NOW)) =>
  ({ access_lost_at: lost, access_checked_at: checked })

describe('accessState', () => {
  it('is ok while access_lost_at is null', () => {
    expect(accessState(row(null), NOW)).toBe('ok')
  })

  it('is grace inside the window and revoked after it', () => {
    const justLost = new Date(NOW - 1 * DAY)
    const almost   = new Date(NOW - (ACCESS_GRACE_DAYS * DAY - HOUR))
    const past     = new Date(NOW - (ACCESS_GRACE_DAYS * DAY + HOUR))

    expect(accessState(row(justLost), NOW)).toBe('grace')
    expect(accessState(row(almost),   NOW)).toBe('grace')
    expect(accessState(row(past),     NOW)).toBe('revoked')
  })

  it('accepts a date that came through JSON as a string', () => {
    const iso = new Date(NOW - 2 * DAY).toISOString()
    expect(accessState({ access_lost_at: iso, access_checked_at: null }, NOW)).toBe('grace')
  })

  // An unreadable value must not read as "rights gone" - that would strip
  // access on a parsing accident. Same stance as canManageGuild, opposite
  // direction, because here the safe answer is the permissive one.
  it('treats an unreadable timestamp as ok rather than revoked', () => {
    for (const bad of ['', 'nonsense', 0, null, undefined, NaN]) {
      expect(accessState({ access_lost_at: bad, access_checked_at: null }, NOW)).toBe('ok')
    }
  })
})

describe('accessGraceEndsAt', () => {
  it('is null while access is fine', () => {
    expect(accessGraceEndsAt(row(null))).toBeNull()
  })

  it('is the loss date plus the grace period', () => {
    const lost = new Date(NOW - 3 * DAY)
    expect(accessGraceEndsAt(row(lost))).toBe(lost.getTime() + ACCESS_GRACE_DAYS * DAY)
  })
})

describe('isAccessStale', () => {
  // Every row predating the columns has NULL here, and those are exactly the
  // ones nobody ever verified. Counting them as fresh would mean the feature
  // silently does nothing for the existing customer base.
  it('counts a never-checked row as stale', () => {
    expect(isAccessStale({ access_checked_at: null, access_lost_at: null }, NOW)).toBe(true)
  })

  it('is false just inside and true just outside the window', () => {
    const fresh = new Date(NOW - (ACCESS_STALE_HOURS * HOUR - HOUR))
    const old   = new Date(NOW - (ACCESS_STALE_HOURS * HOUR + HOUR))
    expect(isAccessStale({ access_checked_at: fresh, access_lost_at: null }, NOW)).toBe(false)
    expect(isAccessStale({ access_checked_at: old,   access_lost_at: null }, NOW)).toBe(true)
  })
})

describe('reconcileGuildAccess', () => {
  const USER = '111111111111111111'
  const A    = '222222222222222222'
  const B    = '333333333333333333'

  beforeEach(() => {
    vi.clearAllMocks()
    ;(query as Mock).mockResolvedValue({ affectedRows: 1 })
  })

  // The single most important behaviour here. Absence of a guild is what marks
  // a row as lost, so an answer we could not trust must write NOTHING - not
  // even access_checked_at, which would otherwise refresh the staleness clock
  // on the strength of a fetch we just rejected.
  it('writes nothing when the guild list was not complete', async () => {
    const res = await reconcileGuildAccess(USER, [A], false)
    expect(res).toEqual({ skipped: true, restored: 0, lost: 0 })
    expect(query).not.toHaveBeenCalled()
  })

  it('writes nothing without a discord user id', async () => {
    const res = await reconcileGuildAccess('', [A], true)
    expect(res.skipped).toBe(true)
    expect(query).not.toHaveBeenCalled()
  })

  it('confirms the listed guilds and marks the rest', async () => {
    await reconcileGuildAccess(USER, [A], true)
    expect(query).toHaveBeenCalledTimes(2)

    const [restoreSql, restoreParams] = (query as Mock).mock.calls[0]
    expect(restoreSql).toContain('access_lost_at = NULL')
    expect(restoreSql).toContain('guild_id IN (?)')
    expect(restoreParams).toEqual([USER, A])

    const [loseSql, loseParams] = (query as Mock).mock.calls[1]
    expect(loseSql).toContain('guild_id NOT IN (?)')
    // COALESCE is what keeps the FIRST sighting, so the grace period runs from
    // when the rights went missing and not from the latest login.
    expect(loseSql).toContain('COALESCE(access_lost_at, NOW())')
    expect(loseParams).toEqual([USER, A])
  })

  it('marks everything this person owns when they manage nothing', async () => {
    // `IN ()` is a MySQL syntax error, so the empty list is its own statement.
    await reconcileGuildAccess(USER, [], true)
    expect(query).toHaveBeenCalledTimes(1)
    const [sql, params] = (query as Mock).mock.calls[0]
    expect(sql).not.toContain('IN (')
    expect(sql).toContain('COALESCE(access_lost_at, NOW())')
    expect(params).toEqual([USER])
  })

  it('dedupes and drops non-snowflakes before they reach SQL', async () => {
    await reconcileGuildAccess(USER, [A, A, 'nope', '12', '', B], true)
    const [sql, params] = (query as Mock).mock.calls[0]
    expect(sql).toContain('IN (?, ?)')
    expect(params).toEqual([USER, A, B])
  })

  it('reports counts and survives an unexpected result shape', async () => {
    ;(query as Mock)
      .mockResolvedValueOnce({ affectedRows: 2 })
      .mockResolvedValueOnce([])
    const res = await reconcileGuildAccess(USER, [A], true)
    expect(res).toEqual({ skipped: false, restored: 2, lost: 0 })
  })
})
