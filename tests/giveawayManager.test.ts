import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

vi.mock('@/lib/giveawayDb', () => ({ giveawayQuery: vi.fn() }))
vi.mock('@/lib/discordGuilds', () => ({ fetchGuildMemberRoles: vi.fn() }))

import { giveawayQuery }         from '@/lib/giveawayDb'
import { fetchGuildMemberRoles } from '@/lib/discordGuilds'
import { resolveManagerGuilds }  from '@/lib/giveawayManager'

const G1   = '222222222222222222'
const G2   = '333333333333333333'
const ROLE = '444444444444444444'

beforeEach(() => { vi.clearAllMocks() })

describe('resolveManagerGuilds', () => {
  it('returns a guild where the user holds the manager role', async () => {
    ;(giveawayQuery as Mock).mockResolvedValue([{ guildId: G1, managerRole: ROLE }])
    ;(fetchGuildMemberRoles as Mock).mockResolvedValue(['999', ROLE])

    await expect(resolveManagerGuilds('tok', [G1])).resolves.toEqual([G1])
  })

  it('skips a guild where the user has other roles only', async () => {
    ;(giveawayQuery as Mock).mockResolvedValue([{ guildId: G1, managerRole: ROLE }])
    ;(fetchGuildMemberRoles as Mock).mockResolvedValue(['999'])

    await expect(resolveManagerGuilds('tok', [G1])).resolves.toEqual([])
  })

  // Nothing to look up means no Discord traffic at all, which is the normal
  // case: an ordinary admin login never reaches this path.
  it('asks Discord nothing when no candidate has a manager role', async () => {
    ;(giveawayQuery as Mock).mockResolvedValue([])
    await expect(resolveManagerGuilds('tok', [G1, G2])).resolves.toEqual([])
    expect(fetchGuildMemberRoles).not.toHaveBeenCalled()
  })

  it('asks Discord nothing for an empty candidate list', async () => {
    await expect(resolveManagerGuilds('tok', [])).resolves.toEqual([])
    expect(giveawayQuery).not.toHaveBeenCalled()
    expect(fetchGuildMemberRoles).not.toHaveBeenCalled()
  })

  it('only queries guilds that are snowflakes, deduped', async () => {
    ;(giveawayQuery as Mock).mockResolvedValue([])
    await resolveManagerGuilds('tok', [G1, G1, 'nope', '7', G2])
    const [sql, params] = (giveawayQuery as Mock).mock.calls[0]
    expect(sql).toContain('managerRole IS NOT NULL')
    expect(sql).toContain('IN (?, ?)')
    expect(params).toEqual([G1, G2])
  })

  // Fail closed, in all three directions. "Cannot say" is never a yes - the
  // same rule the unreadable-bitfield branch of canManageGuild follows.
  it('grants nothing when the role lookup cannot answer', async () => {
    ;(giveawayQuery as Mock).mockResolvedValue([{ guildId: G1, managerRole: ROLE }])
    ;(fetchGuildMemberRoles as Mock).mockResolvedValue(null)
    await expect(resolveManagerGuilds('tok', [G1])).resolves.toEqual([])
  })

  it('grants nothing when the giveaway database is unreachable', async () => {
    ;(giveawayQuery as Mock).mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(resolveManagerGuilds('tok', [G1])).resolves.toEqual([])
    expect(fetchGuildMemberRoles).not.toHaveBeenCalled()
  })

  it('grants nothing without an access token', async () => {
    await expect(resolveManagerGuilds('', [G1])).resolves.toEqual([])
    expect(giveawayQuery).not.toHaveBeenCalled()
  })

  it('caps the number of member lookups', async () => {
    // 40 candidates with a manager role; only the cap may be looked up.
    const many = Array.from({ length: 40 }, (_, i) => String(500000000000000000 + i))
    ;(giveawayQuery as Mock).mockResolvedValue(many.map(id => ({ guildId: id, managerRole: ROLE })))
    ;(fetchGuildMemberRoles as Mock).mockResolvedValue([ROLE])

    const res = await resolveManagerGuilds('tok', many)
    expect((fetchGuildMemberRoles as Mock).mock.calls.length).toBe(25)
    expect(res).toHaveLength(25)
  })

  it('handles several candidates across batches', async () => {
    ;(giveawayQuery as Mock).mockResolvedValue([
      { guildId: G1, managerRole: ROLE },
      { guildId: G2, managerRole: '555555555555555555' },
    ])
    ;(fetchGuildMemberRoles as Mock).mockImplementation(async (_t: string, id: string) =>
      id === G1 ? [ROLE] : ['irrelevant'])

    await expect(resolveManagerGuilds('tok', [G1, G2])).resolves.toEqual([G1])
  })
})
