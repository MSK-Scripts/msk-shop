import { describe, expect, it } from 'vitest'

import { ADMIN_PERMISSIONS, type AdminPermission, type AdminTeamMember } from '@/lib/adminPerms'
import { ALL_TABS, adminNavSections, resolveTab, visibleTabs } from '@/lib/adminTabs'
import {
  giveawayHref, giveawaySections, ticketBotHref, ticketBotSectionOf, ticketBotSections,
} from '@/lib/dashboardNav'

/**
 * Which navigation entries each dashboard offers, and to whom (Phase 7).
 *
 * The entries replace the tabs of the three dashboards and carry the same
 * rules the tabs had: hosting only in a plan with hosting, the Tebex store
 * only for the owner of the server, admin areas only with their permission.
 * The pages and API routes behind each entry check again; these rules decide
 * what is offered, and an entry offered by mistake would at best show a wall
 * of refusals and at worst lead someone into an area that is not theirs.
 */

const owner: AdminTeamMember = {
  discordUserId: '1', displayName: 'owner', isOwner: true, permissions: [], active: true,
}
const member = (...permissions: AdminPermission[]): AdminTeamMember => ({
  discordUserId: '2', displayName: 'member', isOwner: false, permissions, active: true,
})
const navIds = (m: AdminTeamMember) => adminNavSections(m).flatMap(s => s.tabs.map(t => t.id))

describe('ticket bot entries', () => {
  it('offers hosting only in the plans that include it', () => {
    expect(ticketBotSections('basic')).toEqual(['overview', 'domains', 'transcripts'])
    expect(ticketBotSections('premium')).toEqual(['overview', 'domains', 'transcripts'])
    expect(ticketBotSections('premium_plus')).toContain('hosting')
    expect(ticketBotSections('business')).toContain('hosting')
  })

  it('gives every area of a server an address of its own', () => {
    expect(ticketBotHref('123456789012345678', 'overview')).toBe('/dashboard/ticket-bot/123456789012345678')
    expect(ticketBotHref('123456789012345678', 'transcripts')).toBe('/dashboard/ticket-bot/123456789012345678/transcripts')
  })

  it('reads the area back from an address, and never takes the sign-in page for a server', () => {
    expect(ticketBotSectionOf('/dashboard/ticket-bot/123456789012345678/hosting')).toBe('hosting')
    expect(ticketBotSectionOf('/dashboard/ticket-bot/123456789012345678')).toBe('overview')
    expect(ticketBotSectionOf('/dashboard/ticket-bot/verify')).toBeNull()
    expect(ticketBotSectionOf('/dashboard/ticket-bot/123456789012345678/nonsense')).toBeNull()
  })
})

describe('giveaway bot entries', () => {
  it('offers the Tebex store to the server owner only', () => {
    expect(giveawaySections(false)).not.toContain('store')
    expect(giveawaySections(true)).toContain('store')
    expect(giveawaySections(false)).toEqual(['overview', 'giveaways', 'templates', 'settings'])
  })

  it('keeps the overview at the old dashboard address', () => {
    expect(giveawayHref('overview')).toBe('/dashboard/giveaway-bot')
  })
})

describe('admin entries', () => {
  it('gives the owner every tab', () => {
    expect(navIds(owner).sort()).toEqual(ALL_TABS.map(t => t.id).sort())
  })

  it('gives a member without permissions the overview alone', () => {
    expect(adminNavSections(member())).toEqual([{ group: 'start', tabs: [expect.objectContaining({ id: 'overview' })] }])
  })

  it('shows a group only with a tab the member may open', () => {
    const sections = adminNavSections(member('payments.view'))
    expect(sections.map(s => s.group)).toEqual(['start', 'sales'])
    expect(navIds(member('payments.view'))).toEqual(['overview', 'payments', 'lookup'])
  })

  /**
   * The sidebar and `?tab=` must agree: an entry `resolveTab` would refuse is
   * a link into an area the member has no right to, and a tab `resolveTab`
   * accepts but the sidebar hides is unreachable. Checked for every single
   * permission, so a new tab with a new permission is covered without edits.
   */
  it.each(ADMIN_PERMISSIONS)('offers exactly the tabs visibleTabs allows for %s', perm => {
    const m = member(perm)
    const allowed = visibleTabs(m).map(t => t.id)
    expect(navIds(m).sort()).toEqual([...allowed].sort())
    for (const id of navIds(m)) expect(resolveTab(visibleTabs(m), id)).toBe(id)
  })

  it('never offers a team or audit entry without team.manage', () => {
    const everythingElse = ADMIN_PERMISSIONS.filter(p => p !== 'team.manage')
    const ids = navIds(member(...everythingElse))
    expect(ids).not.toContain('team')
    expect(ids).not.toContain('audit')
  })
})
