import { describe, it, expect } from 'vitest'
import { ALL_TABS, visibleTabs, resolveTab, tabHref } from '@/lib/adminTabs'
import type { AdminTeamMember } from '@/lib/adminPerms'

const owner: AdminTeamMember = {
  discordUserId: '1', displayName: 'owner', isOwner: true, permissions: [],
}
const member = (...permissions: string[]): AdminTeamMember => ({
  discordUserId: '2', displayName: 'member', isOwner: false,
  permissions: permissions as AdminTeamMember['permissions'],
})

describe('visibleTabs', () => {
  it('gives the owner every tab', () => {
    expect(visibleTabs(owner)).toHaveLength(ALL_TABS.length)
  })

  it('always leaves overview, so there is a fallback to land on', () => {
    expect(visibleTabs(member()).map(t => t.id)).toEqual(['overview'])
  })

  it('treats an array of permissions as any-of', () => {
    // images.moderate alone is enough for the two image tabs.
    const ids = visibleTabs(member('images.moderate')).map(t => t.id)
    expect(ids).toContain('images')
    expect(ids).toContain('uploads')
    expect(ids).not.toContain('team')
  })
})

describe('resolveTab', () => {
  const tabs = visibleTabs(owner)

  it('honours a tab the member may see', () => {
    expect(resolveTab(tabs, 'images')).toBe('images')
  })

  it('falls back when no tab is asked for', () => {
    expect(resolveTab(tabs, undefined)).toBe('overview')
  })

  /**
   * The reason this lives outside the component. `?tab=` is user input, and
   * the panels render on `active === id` alone. Without this check a link to
   * ?tab=team would open the team panel for someone without team.manage: the
   * routes behind it would answer 403, so no data leaks, but the screen would
   * be a wall of errors instead of an honest "that area is not yours".
   */
  it('refuses a tab the member is not allowed to see', () => {
    const restricted = visibleTabs(member('images.view'))
    expect(resolveTab(restricted, 'team')).toBe('overview')
    expect(resolveTab(restricted, 'images')).toBe('images')
  })

  it('refuses a tab that does not exist at all', () => {
    expect(resolveTab(tabs, 'nonsense')).toBe('overview')
    expect(resolveTab(tabs, '')).toBe('overview')
  })
})

describe('tabHref', () => {
  const tabs = visibleTabs(owner)

  it('keeps /admin clean for the default tab', () => {
    expect(tabHref(tabs, 'overview')).toBe('/admin')
  })

  it('names every other tab in the query', () => {
    expect(tabHref(tabs, 'uploads')).toBe('/admin?tab=uploads')
  })

  it('round-trips through resolveTab', () => {
    for (const tab of tabs) {
      const wanted = new URL(tabHref(tabs, tab.id), 'https://x').searchParams.get('tab') ?? undefined
      expect(resolveTab(tabs, wanted)).toBe(tab.id)
    }
  })
})
