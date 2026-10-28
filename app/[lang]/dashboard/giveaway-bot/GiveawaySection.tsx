'use client'

import type { ReactNode } from 'react'

import { EmptyState } from '@/components/dashboard/EmptyState'
import { ArrowsClockwise } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { GiveawaySection as Section } from '@/lib/dashboardNav'
import { GiveawaysArea } from './GiveawaysArea'
import { FlashNotice, useGiveawayCopy, useGiveawayData } from './GiveawayProvider'
import { OverviewArea } from './OverviewArea'
import { SettingsArea } from './SettingsArea'
import { StoreArea } from './StoreArea'
import { TemplatesArea } from './TemplatesArea'

/**
 * Shows its page once the dashboard's data is there: placeholders while it
 * loads (plan 6.3, skeletons for tiles and lists), the failure with a way to
 * try again, the page after that.
 */
export function GiveawayLoadGate({ children }: { children: ReactNode }) {
  const { t } = useGiveawayCopy()
  const d = useGiveawayData()
  if (d.loading) {
    return (
      <div role="status" className="grid gap-[var(--app-gutter-y)]">
        <span className="sr-only">{t.loading}</span>
        <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @5xl:grid-cols-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64 max-w-[80rem]" />
      </div>
    )
  }
  if (d.error) {
    return (
      <EmptyState
        kind="error"
        title={t.err_load_title}
        action={<Button variant="outline" onClick={() => void d.loadAll()}><ArrowsClockwise className="h-4 w-4" />{t.retry}</Button>}
      >
        {d.error}
      </EmptyState>
    )
  }
  return <>{children}</>
}

/**
 * One area of the dashboard. Since Phase 9 each area is a module of its own;
 * this only picks it. The store exists for the server owner only, as its tab
 * did: anyone else gets nothing here, and the page sends them on before.
 */
export function GiveawaySection({ section }: { section: Section }) {
  const d = useGiveawayData()
  return (
    <GiveawayLoadGate>
      {section === 'overview' && <div className="grid gap-4"><FlashNotice /><OverviewArea /></div>}
      {section === 'giveaways' && <div className="grid gap-4"><FlashNotice /><GiveawaysArea /></div>}
      {section === 'templates' && <div className="grid gap-4"><FlashNotice /><TemplatesArea /></div>}
      {section === 'settings' && <SettingsArea />}
      {section === 'store' && d.owner && <StoreArea />}
    </GiveawayLoadGate>
  )
}
