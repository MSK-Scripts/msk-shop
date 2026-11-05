import { describe, expect, it } from 'vitest'

import { inviteCode, memberCountFrom } from '@/lib/discordMembers'

/**
 * The member count under the hero comes from Discord's invite endpoint. A
 * malformed answer must drop the figure instead of showing a wrong number.
 */

describe('inviteCode', () => {
  it('reads the code from the usual invite forms', () => {
    expect(inviteCode('https://discord.gg/5hHSBRHvJE')).toBe('5hHSBRHvJE')
    expect(inviteCode('https://discord.com/invite/5hHSBRHvJE')).toBe('5hHSBRHvJE')
    expect(inviteCode('https://discordapp.com/invite/abc-123/')).toBe('abc-123')
  })

  it('rejects anything that is not an invite link', () => {
    expect(inviteCode('https://discord.gg/')).toBeNull()
    expect(inviteCode('https://evil.example/discord.gg/abc')).toBeNull()
    expect(inviteCode('https://discord.gg/abc?x=1')).toBeNull()
  })
})

describe('memberCountFrom', () => {
  it('takes approximate_member_count', () => {
    expect(memberCountFrom({ approximate_member_count: 627, approximate_presence_count: 126 })).toBe(627)
  })

  it('returns null for a missing, zero, negative or non-integer count', () => {
    expect(memberCountFrom({})).toBeNull()
    expect(memberCountFrom({ approximate_member_count: 0 })).toBeNull()
    expect(memberCountFrom({ approximate_member_count: -3 })).toBeNull()
    expect(memberCountFrom({ approximate_member_count: 12.5 })).toBeNull()
    expect(memberCountFrom({ approximate_member_count: '627' })).toBeNull()
    expect(memberCountFrom(null)).toBeNull()
    expect(memberCountFrom('627')).toBeNull()
  })
})
