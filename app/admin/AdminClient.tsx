'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Check, X } from 'lucide-react'
import {
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
  memberHasPermission,
  type AdminPermission,
  type AdminTeamMember,
} from '@/lib/adminPerms'
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
import TeamTab from './TeamTab'
import AuditTab from './AuditTab'

interface TabDef {
  id:    string
  label: string
  perm?: AdminPermission | AdminPermission[]   // tab is hidden unless the member has this permission (array = any of)
}

const ALL_TABS: TabDef[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'payments',  label: 'Payments',   perm: 'payments.view' },
  { id: 'lookup',    label: 'Lookup',     perm: 'payments.view' },
  { id: 'coupons',   label: 'Coupons',    perm: 'coupons.manage' },
  { id: 'giftcards', label: 'Gift cards', perm: 'giftcards.manage' },
  { id: 'bans',      label: 'Bans',       perm: 'bans.manage' },
  { id: 'packages',  label: 'Packages',   perm: 'packages.edit' },
  { id: 'apikeys',   label: 'API keys',   perm: ['api_key.view', 'api_key.change'] },
  { id: 'images',    label: 'Images',     perm: ['images.view', 'images.manage', 'images.moderate'] },
  { id: 'team',      label: 'Team',       perm: 'team.manage' },
  { id: 'audit',     label: 'Audit log',  perm: 'team.manage' },
]

export default function AdminClient({ member }: { member: AdminTeamMember }) {
  const tabs = ALL_TABS.filter(t =>
    !t.perm || (Array.isArray(t.perm) ? t.perm : [t.perm]).some(p => memberHasPermission(member, p)),
  )
  const [active, setActive] = useState(tabs[0].id)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch { /* leave even on network error */ }
    // refresh() nach push(): die Seite entscheidet server-seitig am Cookie,
    // ob sie das Panel oder den Login zeigt, und das Cookie ist gerade weg.
    router.push('/admin')
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
              onClick={() => setActive(tab.id)}
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
            />
          )}
          {active === 'team'      && <TeamTab selfId={member.discordUserId} />}
          {active === 'audit'     && <AuditTab />}
        </div>
      </div>
    </div>
  )
}
