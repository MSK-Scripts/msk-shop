'use client'

import { useMemo, useState } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { Notice } from '@/components/dashboard/Notice'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { formatDay, formatDayMonth, formatNumber } from '@/lib/format'
import type { Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { fetchHistory } from './giveawayApi'
import { HISTORY_RANGES, type HistoryDay, type HistoryRange } from './giveawayModel'
import { useGiveawayCopy, useGiveawayData, type GiveawayCopy } from './GiveawayProvider'

type Series = 'entries' | 'created' | 'ended'
const SERIES: Series[] = ['entries', 'created', 'ended']

/** Totals of a period and its busiest day by entries, for the summary in words. */
export function historySummary(days: HistoryDay[]) {
  const total = { created: 0, ended: 0, entries: 0 }
  let peak: HistoryDay | null = null
  for (const day of days) {
    total.created += day.created
    total.ended += day.ended
    total.entries += day.entries
    if (day.entries > 0 && (!peak || day.entries > peak.entries)) peak = day
  }
  return { total, peak }
}

/** The summary a screen reader gets in place of the chart, and everyone else below it. */
export function historySentence(t: GiveawayCopy, lang: Lang, range: number, days: HistoryDay[]): string {
  const { total, peak } = historySummary(days)
  if (total.created + total.ended + total.entries === 0) return t.hist_quiet
  const sum = t.hist_summary
    .replace('{days}', formatNumber(range, lang))
    .replace('{created}', formatNumber(total.created, lang))
    .replace('{ended}', formatNumber(total.ended, lang))
    .replace('{entries}', formatNumber(total.entries, lang))
  if (!peak) return sum
  return `${sum} ${t.hist_peak.replace('{date}', formatDay(peak.date, lang) ?? peak.date).replace('{n}', formatNumber(peak.entries, lang))}`
}

/**
 * Activity of the server over time (plan 6.5): giveaways created, giveaways
 * ended and entries, per day, over 30 or 90 days.
 *
 * Three small charts on one time axis instead of one with two scales: entries
 * run in the hundreds where giveaways run in ones, and on a shared scale the
 * giveaways would be a flat line. Each chart is scaled to its own highest day,
 * and says that number.
 *
 * Hand-written SVG, as the resource chart on /stats: a chart library would
 * inject styles at runtime, which the nonce CSP blocks. The SVG is hidden from
 * screen readers; the sentence above it and the table below say the same.
 *
 * Only a bot of the scheduling release has `/history`. Without it the
 * overview leaves this card out (OverviewArea).
 */
export function HistoryCard() {
  const { t, lang } = useGiveawayCopy()
  const d = useGiveawayData()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const history = d.history
  const days = useMemo(() => history?.history ?? [], [history])
  if (!history) return null
  const range = history.days

  async function pick(next: HistoryRange) {
    if (next === range || busy) return
    setBusy(true)
    setFailed(false)
    try {
      const res = await fetchHistory(next)
      if (res.history) d.setHistory(res.history)
      else setFailed(true)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const label: Record<Series, string> = { entries: t.hist_entries, created: t.hist_created, ended: t.hist_ended }
  const first = days[0]?.date
  const last = days[days.length - 1]?.date

  return (
    <SectionCard
      title={t.hist_title}
      description={t.hist_desc}
      actions={
        <fieldset className="min-w-0">
          <legend className="sr-only">{t.hist_range}</legend>
          <div className="flex flex-wrap gap-2">
            {HISTORY_RANGES.map(n => (
              <label
                key={n}
                className={cn(
                  'inline-flex min-h-11 cursor-pointer items-center rounded-md border-[1.5px] px-3.5 font-semibold transition-colors duration-150',
                  'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-ring)] has-[:focus-visible]:outline-solid',
                  range === n
                    ? 'border-[var(--color-primary)] bg-[var(--color-accent-soft)] text-[var(--color-primary)]'
                    : 'border-[var(--color-input)] text-[var(--color-foreground)] hover:border-[var(--color-foreground)]',
                )}
              >
                <input
                  type="radio" name="giveaway-history-range" value={n} checked={range === n}
                  onChange={() => void pick(n)} disabled={busy} className="sr-only"
                />
                {t.hist_days.replace('{n}', formatNumber(n, lang))}
              </label>
            ))}
          </div>
        </fieldset>
      }
    >
      <div className="grid max-w-[80rem] gap-5" aria-busy={busy || undefined}>
        {failed && <Notice tone="danger" role="alert">{t.hist_err}</Notice>}
        <p className="max-w-[65ch]">{historySentence(t, lang, range, days)}</p>

        <div className={cn('grid gap-4 transition-opacity duration-150', busy && 'opacity-60')}>
          {SERIES.map(key => (
            <SeriesChart key={key} days={days} series={key} label={label[key]} lang={lang} t={t} />
          ))}
          {first && last && (
            <div aria-hidden className="flex justify-between text-small tabular-nums text-[var(--color-muted-foreground)]">
              <span>{formatDayMonth(first, lang)}</span>
              <span>{formatDayMonth(last, lang)}</span>
            </div>
          )}
        </div>

        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-[var(--color-primary)] hover:underline">
            {t.hist_table}
          </summary>
          <HistoryTable days={days} range={range} />
        </details>
      </div>
    </SectionCard>
  )
}

/**
 * One series as bars, one per day, scaled to its own highest day. The title
 * of each day carries date and number for a pointer; the hit area is the full
 * height of the day, so a quiet day can be pointed at as well.
 */
function SeriesChart({ days, series, label, lang, t }: {
  days: HistoryDay[]; series: Series; label: string; lang: Lang; t: GiveawayCopy
}) {
  const values = days.map(day => day[series])
  const total = values.reduce((a, b) => a + b, 0)
  const max = Math.max(0, ...values)
  const step = 10
  const height = 48
  const width = Math.max(1, values.length) * step

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="font-semibold">
          {label}
          <span className="ml-2 tabular-nums">{formatNumber(total, lang)}</span>
        </span>
        <span className="text-small tabular-nums text-[var(--color-muted-foreground)]">
          {t.hist_max.replace('{n}', formatNumber(max, lang))}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-12 w-full"
        aria-hidden="true"
        focusable="false"
      >
        <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke="var(--color-border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {values.map((v, i) => {
          // A day with anything at all stays visible next to a busy one.
          const h = v > 0 ? Math.max(3, (v / Math.max(1, max)) * (height - 2)) : 0
          return (
            <g key={days[i].date}>
              <title>{`${formatDay(days[i].date, lang)}: ${formatNumber(v, lang)}`}</title>
              <rect x={i * step} y="0" width={step} height={height} fill="transparent" />
              {h > 0 && <rect x={i * step + 1.5} y={height - h} width={step - 3} height={h} fill="var(--color-primary)" />}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** The table view of the chart: every day of the period, the newest first. */
function HistoryTable({ days, range }: { days: HistoryDay[]; range: number }) {
  const { t, lang } = useGiveawayCopy()
  const rows = useMemo(() => [...days].reverse(), [days])
  const columns: DataColumn<HistoryDay>[] = [
    {
      id: 'date', header: t.hist_col_date, nowrap: true, sortValue: r => r.date,
      cell: r => <time dateTime={r.date} className="tabular-nums">{formatDay(r.date, lang)}</time>,
    },
    { id: 'created', header: t.hist_created, numeric: true, sortValue: r => r.created, cell: r => formatNumber(r.created, lang) },
    { id: 'ended', header: t.hist_ended, numeric: true, sortValue: r => r.ended, cell: r => formatNumber(r.ended, lang) },
    { id: 'entries', header: t.hist_entries, numeric: true, sortValue: r => r.entries, cell: r => formatNumber(r.entries, lang) },
  ]
  return (
    <DataTable
      caption={t.hist_caption.replace('{days}', formatNumber(range, lang))}
      columns={columns}
      rows={rows}
      rowKey={r => r.date}
      empty={<p className="text-[var(--color-muted-foreground)]">{t.hist_quiet}</p>}
      className="mt-3 max-w-[48rem]"
    />
  )
}
