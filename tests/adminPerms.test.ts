import { describe, it, expect } from 'vitest'
import {
  isAdminPermission,
  memberHasPermission,
  parseAdminPermissions,
  type AdminPermission,
  type AdminTeamMember,
} from '@/lib/adminPerms'

function member(partial: Partial<AdminTeamMember>): AdminTeamMember {
  return { discordUserId: '1', displayName: null, isOwner: false, permissions: [], active: true, ...partial }
}

describe('isAdminPermission', () => {
  it('accepts known permissions and rejects anything else', () => {
    expect(isAdminPermission('payments.view')).toBe(true)
    expect(isAdminPermission('team.manage')).toBe(true)
    expect(isAdminPermission('bogus')).toBe(false)
    expect(isAdminPermission(123)).toBe(false)
    expect(isAdminPermission(null)).toBe(false)
  })
})

describe('memberHasPermission', () => {
  it('grants everything to the owner', () => {
    const owner = member({ isOwner: true })
    expect(memberHasPermission(owner, 'team.manage')).toBe(true)
    expect(memberHasPermission(owner, 'payments.refund')).toBe(true)
  })

  it('requires the explicit grant for a non-owner', () => {
    const m = member({ permissions: ['payments.view'] as AdminPermission[] })
    expect(memberHasPermission(m, 'payments.view')).toBe(true)
    expect(memberHasPermission(m, 'payments.refund')).toBe(false)
  })
})

describe('parseAdminPermissions', () => {
  it('handles arrays, JSON strings and junk, dropping unknown entries', () => {
    expect(parseAdminPermissions(['payments.view', 'bogus'])).toEqual(['payments.view'])
    expect(parseAdminPermissions(JSON.stringify(['bans.manage']))).toEqual(['bans.manage'])
    expect(parseAdminPermissions('not json')).toEqual([])
    expect(parseAdminPermissions(null)).toEqual([])
    expect(parseAdminPermissions(42)).toEqual([])
  })
})
