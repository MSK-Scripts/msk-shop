'use client'

import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatGrid, StatTile, type StatTrend } from '@/components/dashboard/StatTile'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CaretRight, CheckCircle, Warning } from '@/components/icons'
import { percentChange, type SalesSummary } from '@/lib/adminPayments'
import { visibleTabs, ALL_TABS, tabHref, type AdminTabId } from '@/lib/adminTabs'
import type { AdminTeamMember } from '@/lib/adminPerms'
import { formatMoney, formatNumber, formatPercent } from '@/lib/format'
import { fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL } from './adminRequests'
import { AreaHeader, AreaLoad, useAdminCopy } from './adminUi'

type Section<T> = { ok: true; data: T } | { ok: false } | null

export interface OverviewData {
  sales: Section<SalesSummary>
  apiKeys: Section<{ recent: number; previous: number }>
  images: Section<{ pendingUploads: number; missingLabel: number }>
}

/** The address of an area as a link target; the language comes from LocaleLink. */
const areaHref = (id: AdminTabId) => tabHref(ALL_TABS, id)

function trendOf(current: number, previous: number | null, c: AdminCopy, lang: Lang, rising: 'good' | 'bad'): StatTrend | undefined {
  const pct = percentChange(current, previous)
  if (pct === null) return undefined
  if (pct === 0) return { direction: 'flat', meaning: 'neutral', label: c.overview.trend_same }
  const up = pct > 0
  const meaning = up === (rising === 'good') ? 'good' : 'bad'
  return {
    direction: up ? 'up' : 'down',
    meaning,
    label: fillCopy(up ? c.overview.trend_up : c.overview.trend_down, { percent: formatPercent(Math.abs(pct), lang) }),
  }
}

interface AttentionItem { id: string; text: string; area: AdminTabId }

/** What needs a look, only the points that are not zero (plan 6.6). */
export function attentionItems(data: OverviewData, c: AdminCopy, lang: Lang): AttentionItem[] {
  const items: AttentionItem[] = []
  const n = (value: number) => formatNumber(value, lang)
  if (data.images?.ok && data.images.data.pendingUploads > 0) {
    const count = data.images.data.pendingUploads
    items.push({ id: 'uploads', area: 'uploads', text: count === 1 ? c.overview.att_upload : fillCopy(c.overview.att_uploads, { count: n(count) }) })
  }
  if (data.images?.ok && data.images.data.missingLabel > 0) {
    const count = data.images.data.missingLabel
    items.push({ id: 'labels', area: 'images', text: count === 1 ? c.overview.att_label : fillCopy(c.overview.att_labels, { count: n(count) }) })
  }
  if (data.sales?.ok && data.sales.data.chargebacks > 0) {
    const count = data.sales.data.chargebacks
    items.push({ id: 'chargebacks', area: 'payments', text: count === 1 ? c.overview.att_chargeback : fillCopy(c.overview.att_chargebacks, { count: n(count) }) })
  }
  return items
}

/** The figures and the attention list, from data the overview route computed. */
export function OverviewView({ data, member }: { data: OverviewData; member: AdminTeamMember }) {
  const { c, lang } = useAdminCopy()
  const failed = <span className="text-small text-[var(--color-danger)]">{c.overview.figure_failed}</span>
  const tiles = []

  if (data.sales) {
    const s = data.sales.ok ? data.sales.data : null
    const partial = s && !s.complete ? c.overview.partial : undefined
    tiles.push(
      <StatTile
        key="revenue"
        label={c.overview.revenue}
        value={s ? formatMoney(s.revenue, s.currency, lang) : '–'}
        hint={s ? partial : failed}
        trend={s ? trendOf(s.revenue, s.previousRevenue, c, lang, 'good') : undefined}
        href={areaHref('payments')}
      />,
      <StatTile
        key="payments"
        label={c.overview.payments}
        value={s ? formatNumber(s.payments, lang) : '–'}
        hint={s ? fillCopy(c.overview.free_count, { count: formatNumber(s.free, lang) }) : failed}
        href={areaHref('payments')}
      />,
      <StatTile
        key="refunds"
        label={c.overview.refunds}
        value={s ? formatNumber(s.refunds, lang) : '–'}
        hint={s ? fillCopy(c.overview.chargebacks, { count: formatNumber(s.chargebacks, lang) }) : failed}
        href={areaHref('payments')}
      />,
    )
  }
  if (data.apiKeys) {
    const k = data.apiKeys.ok ? data.apiKeys.data : null
    tiles.push(
      <StatTile
        key="keys"
        label={c.overview.new_keys}
        value={k ? formatNumber(k.recent, lang) : '–'}
        hint={k ? fillCopy(c.overview.keys_previous, { count: formatNumber(k.previous, lang) }) : failed}
        trend={k ? trendOf(k.recent, k.previous, c, lang, 'good') : undefined}
        href={areaHref('apikeys')}
      />,
    )
  }

  const attention = attentionItems(data, c, lang)
  const opens = visibleTabs(member).length

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      <p className="text-[var(--color-muted-foreground)]">
        {member.isOwner ? c.overview.owner_access : fillCopy(c.overview.member_access, { count: opens, total: ALL_TABS.length })}
      </p>

      {tiles.length > 0 ? <StatGrid>{tiles}</StatGrid> : <p>{c.overview.no_figures}</p>}

      {(data.sales || data.images) && (
        <SectionCard title={c.overview.attention} className="max-w-[72rem]">
          {attention.length === 0 ? (
            <p className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
              <CheckCircle className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
              {c.overview.attention_none}
            </p>
          ) : (
            <ul className="grid gap-1">
              {attention.map(item => (
                <li key={item.id}>
                  <Link
                    href={areaHref(item.area)}
                    prefetch={false}
                    className="flex min-h-11 items-center gap-3 rounded-md px-2 font-semibold hover:bg-[var(--color-muted)]"
                  >
                    <Warning className="h-5 w-5 shrink-0 text-[var(--color-warning)]" />
                    <span className="min-w-0 flex-1">{item.text}</span>
                    <span className="hidden text-small font-normal text-[var(--color-muted-foreground)] sm:inline">{c.tabs[item.area]}</span>
                    <CaretRight className="h-4 w-4 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}
    </div>
  )
}

const NO_FIGURES: OverviewData = { sales: null, apiKeys: null, images: null }

function OverviewLoader({ member }: { member: AdminTeamMember }) {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<OverviewData>(ADMIN_URL.overview, 'overview', c.overview.load_failed)
  return (
    <AreaLoad data={data} error={error} retry={reload}>
      {d => <OverviewView data={d} member={member} />}
    </AreaLoad>
  )
}

export default function OverviewArea({ member }: { member: AdminTeamMember }) {
  const { c } = useAdminCopy()
  // Without any permission the route has nothing to count and would refuse;
  // the page says so instead of asking.
  const counts = member.isOwner || member.permissions.length > 0
  return (
    <>
      <AreaHeader area="overview" description={c.overview.lead} />
      {counts ? <OverviewLoader member={member} /> : <OverviewView data={NO_FIGURES} member={member} />}
    </>
  )
}
