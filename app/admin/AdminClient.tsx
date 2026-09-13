'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Check, X } from 'lucide-react'
import {
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
  memberHasPermission,
  type AdminTeamMember,
} from '@/lib/adminPerms'
import { visibleTabs, resolveTab, tabHref } from '@/lib/adminTabs'
import { useLang } from '@/components/i18n/LangProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import PaymentsTab from './PaymentsTab'
import LookupTab from './LookupTab'
import CouponsTab from './CouponsTab'
import GiftCardsTab from './GiftCardsTab'
import BansTab from './BansTab'
import PackagesTab from './PackagesTab'
import ApiKeysTab from './ApiKeysTab'
import ImagesTab from './ImagesTab'
import UploadsTab from './UploadsTab'
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
  const { localize } = useLang()

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

  return (
    <div className="container-page py-10 md:py-14">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Signed in as {member.displayName ?? member.discordUserId}
              {member.isOwner && (
                <span className="ml-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                  Owner
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>

        {/* Tab bar */}
        <div className="mt-8 flex gap-1 border-b border-[var(--color-border)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={cn(
                'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                active === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        <div className="mt-6">
          {active === 'overview' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold tracking-tight">Your permissions</h2>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {member.isOwner
                  ? 'You are the owner and have every permission.'
                  : 'These control which actions you can perform.'}
              </p>
              <ul className="mt-4 divide-y divide-[var(--color-border)]">
                {ADMIN_PERMISSIONS.map(perm => {
                  const granted = memberHasPermission(member, perm)
                  return (
                    <li key={perm} className="flex items-center gap-3 py-2.5">
                      {granted ? (
                        <Check className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                      )}
                      <span className={cn('text-sm', !granted && 'text-[var(--color-muted-foreground)]')}>
                        <span className="font-medium">{PERMISSION_LABELS[perm].label}</span>
                        <span className="text-[var(--color-muted-foreground)]"> {PERMISSION_LABELS[perm].description}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Card>
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
          {active === 'team'      && <TeamTab selfId={member.discordUserId} />}
          {active === 'audit'     && <AuditTab />}
        </div>
      </div>
    </div>
  )
}
