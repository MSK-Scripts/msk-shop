'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from '@/components/icons'
import {
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
  memberHasPermission,
  type AdminTeamMember,
} from '@/lib/adminPerms'
import { visibleTabs, resolveTab, tabHref, type AdminTabId } from '@/lib/adminTabs'
import { useLang } from '@/components/i18n/LangProvider'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { Badge } from '@/components/ui/Badge'
import { adminCopy } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { AdminShell } from './AdminShell'
import PaymentsTab from './PaymentsTab'
import LookupTab from './LookupTab'
import CouponsTab from './CouponsTab'
import GiftCardsTab from './GiftCardsTab'
import BansTab from './BansTab'
import PackagesTab from './PackagesTab'
import ApiKeysTab from './ApiKeysTab'
import ImagesTab from './ImagesTab'
import UploadsTab from './UploadsTab'
import NewsPopupTab from './NewsPopupTab'
import TeamTab from './TeamTab'
import AuditTab from './AuditTab'

export default function AdminClient({ member, initialTab }: { member: AdminTeamMember; initialTab?: string }) {
  const tabs = visibleTabs(member)

  // The server has already read `?tab=` and passes it in as a prop, so there
  // is nothing to fetch from `window` here and no difference
  // between server render and hydration.
  const [active, setActive] = useState(() => resolveTab(tabs, initialTab))
  const router = useRouter()
  // The dashboard itself is single-language, its ADDRESS is not: the proxy
  // answers `/de/admin` just like `/admin`, and somebody browsing in German
  // should still be after switching tabs. `tabHref` deliberately keeps
  // returning the language-less path; the prefix is added here.
  const { lang, localize } = useLang()

  /**
   * Switch tabs and update the address bar along with it, so that F5 does not
   * fall back to "Overview".
   *
   * `history.replaceState` instead of `router.replace`: the page is
   * `force-dynamic`, so a real navigation would trigger the session check and
   * database query and rebuild every tab, just to change a
   * string in the address bar. And `replace` instead of `push`,
   * because otherwise ten tab switches leave ten entries in the history and
   * the back button no longer leads out of the dashboard.
   */
  const selectTab = (id: string) => {
    setActive(id)
    window.history.replaceState(null, '', localize(tabHref(tabs, id)))
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch { /* leave even on network error */ }
    // refresh() after push(): the page decides server-side from the cookie
    // whether it shows the panel or the login, and the cookie has just gone.
    router.push(localize('/admin'))
    router.refresh()
  }

  const c = adminCopy(lang)
  const activeTab = active as AdminTabId

  return (
    <AdminShell member={member} active={active} onSelect={selectTab} onSignOut={handleLogout}>
      <PageHeader
        title={c.tabs[activeTab]}
        badge={member.isOwner ? <Badge variant="primary">{c.owner}</Badge> : undefined}
      />

      {/* Panels */}
      <div>
        {active === 'overview' && (
          <SectionCard
            title={c.overview_title}
            description={member.isOwner ? c.overview_owner : c.overview_member}
          >
            <ul className="divide-y divide-[var(--color-border)]">
              {ADMIN_PERMISSIONS.map(perm => {
                const granted = memberHasPermission(member, perm)
                return (
                  <li key={perm} className="flex items-center gap-3 py-2.5">
                    {granted ? (
                      <Check className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-label={c.granted} />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-label={c.not_granted} />
                    )}
                    <span className={cn('text-sm', !granted && 'text-[var(--color-muted-foreground)]')}>
                      <span className="font-medium">{PERMISSION_LABELS[perm].label}</span>
                      <span className="text-[var(--color-muted-foreground)]"> {PERMISSION_LABELS[perm].description}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </SectionCard>
        )}

          {active === 'payments' && (
            <PaymentsTab
              canCreate={memberHasPermission(member, 'payments.create')}
              canRefund={memberHasPermission(member, 'payments.refund')}
            />
          )}
          {active === 'lookup'    && <LookupTab />}
          {active === 'coupons'   && <CouponsTab />}
          {active === 'giftcards' && <GiftCardsTab />}
          {active === 'bans'      && <BansTab />}
          {active === 'packages'  && <PackagesTab />}
          {active === 'apikeys'   && <ApiKeysTab canChange={memberHasPermission(member, 'api_key.change')} />}
          {active === 'images'    && (
            <ImagesTab
              canManage={memberHasPermission(member, 'images.manage')}
              canModerate={memberHasPermission(member, 'images.moderate')}
              canDelete={memberHasPermission(member, 'images.delete')}
            />
          )}
          {active === 'uploads'   && (
            <UploadsTab canModerate={memberHasPermission(member, 'images.moderate')} />
          )}
          {active === 'newspopup' && <NewsPopupTab />}
          {active === 'team'      && <TeamTab selfId={member.discordUserId} />}
          {active === 'audit'     && <AuditTab />}
      </div>
    </AdminShell>
  )
}
