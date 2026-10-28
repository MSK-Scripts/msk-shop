import type { AdminPermission } from '@/lib/adminPerms'
import { memberHasPermission, type AdminTeamMember } from '@/lib/adminPerms'

/**
 * Which tabs the admin dashboard has and who may see them.
 *
 * Lives next to the component and not inside it, because "which tab does this
 * member get" is a permission question, not a presentation question. Since the
 * address bar came into play it is also asked from two sides: when building the
 * tab bar and when evaluating `?tab=`, and a wish from the address bar is user
 * input.
 *
 * The routes are secured independently of this (`adminRoute`). A tab someone
 * forces open could therefore not show any data, but they would see a UI full
 * of 403 messages instead of the honest answer that this area does not exist
 * for them.
 */
/** Sidebar group of a tab (plan 6.6). The labels live in `adminTranslations`. */
export type AdminNavGroup = 'start' | 'sales' | 'ticketbot' | 'cdn' | 'website' | 'team'

export const ADMIN_TAB_IDS = [
  'overview', 'payments', 'lookup', 'coupons', 'giftcards', 'packages', 'bans',
  'apikeys', 'images', 'uploads', 'newspopup', 'team', 'audit',
] as const
export type AdminTabId = typeof ADMIN_TAB_IDS[number]

export interface TabDef {
  id:    AdminTabId
  group: AdminNavGroup
  /** Tab stays hidden without this permission. An array means: one of them is enough. */
  perm?: AdminPermission | AdminPermission[]
}

// Labels moved to `adminTranslations` in lib/i18n.ts with Phase 7 of the
// redesign: the admin is English only (E3), but every string goes through
// the table so German can follow without touching a component.
export const ALL_TABS: TabDef[] = [
  { id: 'overview',  group: 'start' },
  { id: 'payments',  group: 'sales',     perm: 'payments.view' },
  { id: 'lookup',    group: 'sales',     perm: 'payments.view' },
  { id: 'coupons',   group: 'sales',     perm: 'coupons.manage' },
  { id: 'giftcards', group: 'sales',     perm: 'giftcards.manage' },
  { id: 'packages',  group: 'sales',     perm: 'packages.edit' },
  { id: 'bans',      group: 'sales',     perm: 'bans.manage' },
  { id: 'apikeys',   group: 'ticketbot', perm: ['api_key.view', 'api_key.change'] },
  { id: 'images',    group: 'cdn',       perm: ['images.view', 'images.manage', 'images.moderate'] },
  { id: 'uploads',   group: 'cdn',       perm: ['images.view', 'images.manage', 'images.moderate'] },
  { id: 'newspopup', group: 'website',   perm: 'news_popup.manage' },
  { id: 'team',      group: 'team',      perm: 'team.manage' },
  { id: 'audit',     group: 'team',      perm: 'team.manage' },
]

export function visibleTabs(member: AdminTeamMember): TabDef[] {
  return ALL_TABS.filter(t =>
    !t.perm || (Array.isArray(t.perm) ? t.perm : [t.perm]).some(p => memberHasPermission(member, p)),
  )
}

/**
 * Resolve the tab from `?tab=`, falling back to the first allowed one.
 *
 * Deliberately falls back silently instead of complaining: an outdated bookmark
 * to a removed tab, or a permission that was revoked from someone, are neither
 * of them a user error. And because `visibleTabs` always contains at least
 * "Overview", this fallback is guaranteed to exist.
 */
export function resolveTab(tabs: TabDef[], wanted: string | undefined): string {
  return tabs.some(t => t.id === wanted) ? wanted! : tabs[0].id
}

/**
 * The address of a tab.
 *
 * The first tab gets no parameter, so that `/admin` stays the address of the
 * dashboard and does not turn into `/admin?tab=overview` as soon as someone
 * clicks back and forth once.
 */
export function tabHref(tabs: TabDef[], id: string): string {
  return id === tabs[0].id ? '/admin' : `/admin?tab=${encodeURIComponent(id)}`
}

/** Sidebar groups of the admin in the order of plan 6.6. */
export const ADMIN_NAV_GROUPS: readonly AdminNavGroup[] = ['start', 'sales', 'ticketbot', 'cdn', 'website', 'team']

export interface AdminNavSection {
  group: AdminNavGroup
  tabs: TabDef[]
}

/**
 * The tabs the member may see, grouped for the sidebar (Phase 7). A group
 * without a visible tab is left out instead of shown empty.
 *
 * Built on `visibleTabs` and nothing else, so the sidebar can never offer a
 * tab that `resolveTab` would refuse.
 */
export function adminNavSections(member: AdminTeamMember): AdminNavSection[] {
  const visible = new Set(visibleTabs(member).map(t => t.id))
  return ADMIN_NAV_GROUPS
    .map(group => ({ group, tabs: ALL_TABS.filter(t => t.group === group && visible.has(t.id)) }))
    .filter(section => section.tabs.length > 0)
}
