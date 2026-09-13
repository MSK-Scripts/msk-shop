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
export interface TabDef {
  id:    string
  label: string
  /** Tab stays hidden without this permission. An array means: one of them is enough. */
  perm?: AdminPermission | AdminPermission[]
}

export const ALL_TABS: TabDef[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'payments',  label: 'Payments',   perm: 'payments.view' },
  { id: 'lookup',    label: 'Lookup',     perm: 'payments.view' },
  { id: 'coupons',   label: 'Coupons',    perm: 'coupons.manage' },
  { id: 'giftcards', label: 'Gift cards', perm: 'giftcards.manage' },
  { id: 'bans',      label: 'Bans',       perm: 'bans.manage' },
  { id: 'packages',  label: 'Packages',   perm: 'packages.edit' },
  { id: 'apikeys',   label: 'API keys',   perm: ['api_key.view', 'api_key.change'] },
  { id: 'images',    label: 'Images',     perm: ['images.view', 'images.manage', 'images.moderate'] },
  { id: 'uploads',   label: 'Uploads',    perm: ['images.view', 'images.manage', 'images.moderate'] },
  { id: 'team',      label: 'Team',       perm: 'team.manage' },
  { id: 'audit',     label: 'Audit log',  perm: 'team.manage' },
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
