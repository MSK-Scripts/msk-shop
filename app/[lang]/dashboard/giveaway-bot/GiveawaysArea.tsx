'use client'

import { useMemo, useState } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatusBadge, type StatusTone } from '@/components/dashboard/StatusBadge'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CheckCircle, Pause, Play, Plus, Prohibit, Ticket, type IconComponent } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { GIVEAWAY_NEW_HREF, giveawayDetailHref } from '@/lib/dashboardNav'
import { formatDateTime, formatNumber, formatPercent, isoDate } from '@/lib/format'
import { giveawayDashboardTranslations, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { GiveawayActions } from './GiveawayActions'
import { endOf, matchesFilter, winnerCount, type Giveaway, type GiveawayStatus, type StatusFilter } from './giveawayModel'
import { useGiveawayCopy, useGiveawayData } from './GiveawayProvider'
import { FirstClickTag } from './formParts'

const STATUS: Record<GiveawayStatus, { tone: StatusTone; icon: IconComponent; key: 'status_active' | 'status_paused' | 'status_ended' | 'status_cancelled' }> = {
  ACTIVE:    { tone: 'success', icon: Play,        key: 'status_active' },
  PAUSED:    { tone: 'warning', icon: Pause,       key: 'status_paused' },
  ENDED:     { tone: 'info',    icon: CheckCircle, key: 'status_ended' },
  CANCELLED: { tone: 'neutral', icon: Prohibit,    key: 'status_cancelled' },
}

/** State of a giveaway in word and sign, the same on every page of the dashboard. */
export function GiveawayStatusBadge({ status, lang }: { status: GiveawayStatus; lang: Lang }) {
  const s = STATUS[status] ?? STATUS.ENDED
  return <StatusBadge tone={s.tone} icon={s.icon}>{giveawayDashboardTranslations[lang][s.key]}</StatusBadge>
}

/** The columns of the giveaway table, in the language of the page. */
export function giveawayColumns(lang: Lang): DataColumn<Giveaway>[] {
  const t = giveawayDashboardTranslations[lang]
  return [
    {
      id: 'title',
      header: t.col_giveaway,
      sortValue: g => g.title,
      className: 'min-w-[14rem]',
      cell: g => (
        <div className="grid gap-1">
          <Link href={giveawayDetailHref(g.id)} prefetch={false} className="inline-flex min-h-9 items-center font-semibold text-[var(--color-primary)] hover:underline">
            {g.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-small text-[var(--color-muted-foreground)]">
            <span className="font-mono">{g.id}</span>
            {g.winnerMode === 'FIRST_CLICK' && <FirstClickTag />}
            {g.couponPercent != null && (
              <span className="inline-flex items-center gap-1">
                <Ticket className="h-4 w-4" />
                {t.tag_coupon.replace('{percent}', formatPercent(g.couponPercent, lang))}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: t.col_status,
      nowrap: true,
      cell: g => <GiveawayStatusBadge status={g.status} lang={lang} />,
    },
    {
      id: 'winners',
      header: t.col_winners,
      numeric: true,
      nowrap: true,
      sortValue: g => winnerCount(g),
      cell: g => {
        const n = winnerCount(g)
        return n === null ? <span className="text-[var(--color-muted-foreground)]">–</span> : formatNumber(n, lang)
      },
    },
    {
      id: 'entries',
      header: t.col_entries,
      numeric: true,
      nowrap: true,
      sortValue: g => g.entryCount,
      cell: g => formatNumber(g.entryCount, lang),
    },
    {
      id: 'end',
      header: t.col_end,
      nowrap: true,
      sortValue: g => Date.parse(endOf(g) ?? '') || null,
      cell: g => {
        const end = endOf(g)
        const text = formatDateTime(end, lang)
        if (!text) return <span className="text-[var(--color-muted-foreground)]">{g.status === 'PAUSED' ? t.end_paused : '–'}</span>
        return <time dateTime={isoDate(end)} className="tabular-nums">{text}</time>
      },
    },
    {
      id: 'actions',
      header: <span className="sr-only">{t.col_actions}</span>,
      nowrap: true,
      cell: g => <GiveawayActions giveaway={g} variant="row" />,
    },
  ]
}

const FILTERS: StatusFilter[] = ['all', 'running', 'paused', 'ended']

/**
 * The giveaways of the server (plan 6.5): a table with a status filter,
 * numbers right-aligned, the state in word and sign, and per row one action
 * plus the overflow menu. The bot answers with the newest hundred, newest
 * first; sorting a column orders them here.
 */
export function GiveawaysArea() {
  const { t, lang } = useGiveawayCopy()
  const d = useGiveawayData()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const columns = useMemo(() => giveawayColumns(lang), [lang])
  const rows = useMemo(() => d.giveaways.filter(g => matchesFilter(g, filter)), [d.giveaways, filter])
  const count = (f: StatusFilter) => d.giveaways.filter(g => matchesFilter(g, f)).length
  const label: Record<StatusFilter, string> = { all: t.filter_all, running: t.filter_running, paused: t.filter_paused, ended: t.filter_ended }

  const empty = d.giveaways.length === 0 ? (
    <EmptyState
      kind="first-use"
      title={t.list_empty_title}
      action={<Button asChild><Link href={GIVEAWAY_NEW_HREF} prefetch={false}><Plus className="h-4 w-4" />{t.new_giveaway}</Link></Button>}
    >
      {t.list_empty_body}
    </EmptyState>
  ) : (
    <EmptyState
      kind="no-results"
      title={t.list_none_title}
      action={<Button variant="outline" onClick={() => setFilter('all')}>{t.filter_show_all}</Button>}
    >
      {t.list_none_body}
    </EmptyState>
  )

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      <fieldset className="min-w-0">
        <legend className="sr-only">{t.filter_label}</legend>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <label
              key={f}
              className={cn(
                'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border-[1.5px] px-3.5 font-semibold transition-colors duration-150',
                'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-ring)] has-[:focus-visible]:outline-solid',
                filter === f
                  ? 'border-[var(--color-primary)] bg-[var(--color-accent-soft)] text-[var(--color-primary)]'
                  : 'border-[var(--color-input)] text-[var(--color-foreground)] hover:border-[var(--color-foreground)]',
              )}
            >
              <input type="radio" name="giveaway-filter" value={f} checked={filter === f} onChange={() => setFilter(f)} className="sr-only" />
              {label[f]}
              <span className="tabular-nums text-[var(--color-muted-foreground)]">{formatNumber(count(f), lang)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <DataTable
        caption={t.list_caption}
        captionHidden
        columns={columns}
        rows={rows}
        rowKey={g => g.id}
        empty={empty}
        className="max-w-[80rem]"
      />
    </div>
  )
}
