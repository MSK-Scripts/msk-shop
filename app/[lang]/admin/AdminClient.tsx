'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { EmptyState } from '@/components/dashboard/EmptyState'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { useLang } from '@/components/i18n/LangProvider'
import { Button } from '@/components/ui/Button'
import { memberHasPermission, type AdminPermission, type AdminTeamMember } from '@/lib/adminPerms'
import { ALL_TABS, requiredPermissions, resolveArea, tabHref, visibleTabs, type AdminTabId } from '@/lib/adminTabs'
import { fillCopy } from '@/lib/i18n'
import { signOut } from './adminRequests'
import { AdminShell, permissionList } from './AdminShell'
import { AreaHeader, useAdminCopy } from './adminUi'
import ApiKeysArea from './ApiKeysArea'
import AuditArea from './AuditArea'
import BansArea from './BansArea'
import CouponsArea from './CouponsArea'
import GiftCardsArea from './GiftCardsArea'
import ImagesArea from './ImagesArea'
import LookupArea from './LookupArea'
import NewsPopupArea from './NewsPopupArea'
import OverviewArea from './OverviewArea'
import PackagesArea from './PackagesArea'
import PaymentsArea from './PaymentsArea'
import TeamArea from './TeamArea'
import UploadsArea from './UploadsArea'

/**
 * The page of an area the member may not open (plan 6.6): the area's name,
 * the permission it needs, and the way back. No area component is mounted,
 * so nothing is requested; the routes would refuse anyway.
 */
export function LockedArea({ id }: { id: AdminTabId }) {
  const { c, lang } = useAdminCopy()
  const tab = ALL_TABS.find(t => t.id === id)
  return (
    <>
      <AreaHeader area={id} />
      <EmptyState
        kind="unavailable"
        headingLevel="h2"
        title={c.locked_title}
        action={<Button asChild variant="outline"><Link href="/admin" prefetch={false}>{c.locked_action}</Link></Button>}
      >
        {fillCopy(c.locked_body, { permissions: permissionList(tab ? requiredPermissions(tab) : [], c, lang) })}
      </EmptyState>
    </>
  )
}

/** The content of one area for the member, with the permissions it acts on. */
export function AdminArea({ id, member }: { id: AdminTabId; member: AdminTeamMember }) {
  const can = (p: AdminPermission) => memberHasPermission(member, p)
  switch (id) {
    case 'overview':  return <OverviewArea member={member} />
    case 'payments':  return <PaymentsArea canCreate={can('payments.create')} canRefund={can('payments.refund')} />
    case 'lookup':    return <LookupArea />
    case 'coupons':   return <CouponsArea />
    case 'giftcards': return <GiftCardsArea />
    case 'packages':  return <PackagesArea />
    case 'bans':      return <BansArea />
    case 'apikeys':   return <ApiKeysArea canChange={can('api_key.change')} />
    case 'images':    return <ImagesArea canManage={can('images.manage')} canModerate={can('images.moderate')} canDelete={can('images.delete')} />
    case 'uploads':   return <UploadsArea canModerate={can('images.moderate')} />
    case 'newspopup': return <NewsPopupArea />
    case 'team':      return <TeamArea selfId={member.discordUserId} />
    case 'audit':     return <AuditArea />
  }
}

export default function AdminClient({ member, initialTab }: { member: AdminTeamMember; initialTab?: string }) {
  const tabs = visibleTabs(member)

  // The server has already read `?tab=` and passes it in as a prop, so there
  // is nothing to fetch from `window` here and no difference between server
  // render and hydration. A known area the member may not open stays the
  // area and says why (plan 6.6); anything unknown falls back to Overview.
  const [area, setArea] = useState(() => resolveArea(member, initialTab))
  const router = useRouter()
  // The dashboard itself is single-language, its ADDRESS is not: the proxy
  // answers `/de/admin` just like `/admin`. `tabHref` keeps returning the
  // language-less path; the prefix is added here.
  const { localize } = useLang()

  /**
   * Switch areas and update the address bar along with it, so that F5 does
   * not fall back to "Overview".
   *
   * `history.replaceState` instead of `router.replace`: the page is
   * `force-dynamic`, so a real navigation would trigger the session check and
   * the database query just to change a string in the address bar. And
   * `replace` instead of `push`, so the back button still leads out.
   */
  const selectTab = (id: string) => {
    setArea(resolveArea(member, id))
    window.history.replaceState(null, '', localize(tabHref(tabs, id)))
  }

  const handleLogout = async () => {
    await signOut()
    // refresh() after push(): the page decides server-side from the cookie
    // whether it shows the panel or the login, and the cookie has just gone.
    router.push(localize('/admin'))
    router.refresh()
  }

  return (
    <AdminShell member={member} active={area.id} onSelect={selectTab} onSignOut={handleLogout}>
      {area.locked ? <LockedArea id={area.id} /> : <AdminArea key={area.id} id={area.id} member={member} />}
    </AdminShell>
  )
}
