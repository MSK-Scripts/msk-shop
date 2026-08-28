import type { AdminPermission } from '@/lib/adminPerms'
import { memberHasPermission, type AdminTeamMember } from '@/lib/adminPerms'

/**
 * Welche Reiter das Admin-Dashboard hat und wer sie sehen darf.
 *
 * Steht neben der Komponente und nicht darin, weil "welchen Reiter bekommt
 * dieses Mitglied" eine Rechtefrage ist und keine Darstellungsfrage. Sie wird
 * seit der Adresszeile auch von zwei Seiten gestellt: beim Aufbau der Leiste
 * und beim Auswerten von `?tab=`, und ein Wunsch aus der Adresszeile ist eine
 * Nutzereingabe.
 *
 * Die Routen sind davon unabhaengig abgesichert (`adminRoute`). Ein Reiter, den
 * jemand aufzwingt, koennte also keine Daten zeigen, aber er saehe eine
 * Oberflaeche voller 403-Meldungen statt der ehrlichen Auskunft, dass es
 * diesen Bereich fuer ihn nicht gibt.
 */
export interface TabDef {
  id:    string
  label: string
  /** Reiter bleibt verborgen ohne dieses Recht. Array heisst: eines davon genuegt. */
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
 * Den Reiter aus `?tab=` aufloesen, mit dem ersten erlaubten als Rueckfall.
 *
 * Faellt bewusst still zurueck statt zu meckern: ein veralteter Bookmark auf
 * einen entfernten Reiter, oder ein Recht, das jemandem entzogen wurde, sind
 * beide keine Fehlbedienung. Und weil `visibleTabs` immer mindestens
 * "Overview" enthaelt, gibt es diesen Rueckfall garantiert.
 */
export function resolveTab(tabs: TabDef[], wanted: string | undefined): string {
  return tabs.some(t => t.id === wanted) ? wanted! : tabs[0].id
}

/**
 * Die Adresse zu einem Reiter.
 *
 * Der erste Reiter bekommt keinen Parameter, damit `/admin` die Adresse des
 * Dashboards bleibt und nicht zu `/admin?tab=overview` wird, sobald jemand
 * einmal hin und her klickt.
 */
export function tabHref(tabs: TabDef[], id: string): string {
  return id === tabs[0].id ? '/admin' : `/admin?tab=${encodeURIComponent(id)}`
}
