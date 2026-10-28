'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { useLang } from '@/components/i18n/LangProvider'
import {
  ArrowCounterClockwise, ArrowSquareOut, CaretLeft, CaretRight, CircleNotch, MagnifyingGlass, Paperclip,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatBytes, formatDate, formatNumber, formatRetention, isoDate } from '@/lib/format'
import { dashboardTranslations, type Lang } from '@/lib/i18n'
import { TIER_CONFIG, type Tier } from '@/lib/tiers'
import { DOCS_URL, tierLabel } from './OverviewArea'
import {
  fetchTranscripts, TRANSCRIPT_PAGE_SIZE, type TranscriptItem, type TranscriptQuery,
} from './ticketBotApi'

const EMPTY_QUERY: TranscriptQuery = { ticketId: '', from: '', to: '', attachmentsOnly: false, page: 1 }

/** Only render https:// links; never trust the stored value blindly. */
function safeUrl(url: string): string | null {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

/** The columns of the transcript table, in the language of the page. */
export function transcriptColumns(lang: Lang): DataColumn<TranscriptItem>[] {
  const t = dashboardTranslations[lang]
  return [
    {
      id: 'ticket',
      header: t.tx_col_ticket,
      cell: row => <span className="font-semibold tabular-nums">#{row.ticketId}</span>,
      sortValue: row => row.ticketId,
      nowrap: true,
    },
    {
      id: 'created',
      header: t.tx_col_created,
      cell: row => <time dateTime={isoDate(row.createdAt)}>{formatDate(row.createdAt, lang) ?? '–'}</time>,
      sortValue: row => Date.parse(row.createdAt) || null,
      nowrap: true,
    },
    {
      id: 'size',
      header: t.tx_col_size,
      cell: row => formatBytes(row.sizeBytes, lang),
      sortValue: row => row.sizeBytes,
      numeric: true,
      nowrap: true,
    },
    {
      id: 'attachments',
      header: t.tx_col_attachments,
      cell: row => row.hasAttachments
        ? <span className="inline-flex items-center gap-1.5"><Paperclip className="h-4 w-4" />{t.tx_yes}</span>
        : <span className="text-[var(--color-muted-foreground)]">{t.tx_no}</span>,
      nowrap: true,
    },
    {
      id: 'expires',
      header: t.tx_col_expires,
      cell: row => <time dateTime={isoDate(row.expiresAt)}>{formatDate(row.expiresAt, lang) ?? '–'}</time>,
      sortValue: row => Date.parse(row.expiresAt) || null,
      nowrap: true,
    },
    {
      id: 'open',
      header: <span className="sr-only">{t.tx_col_open}</span>,
      cell: row => {
        const href = safeUrl(row.url)
        if (!href) return <span className="text-[var(--color-muted-foreground)]">–</span>
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.tx_open_label.replace('{n}', String(row.ticketId))}
            className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-[var(--color-primary)] underline underline-offset-2"
          >
            {t.tx_open}
            <ArrowSquareOut className="h-4 w-4" />
          </a>
        )
      },
      nowrap: true,
    },
  ]
}

/**
 * The transcripts of one server (plan 6.4): filters, the table with sortable
 * columns, sizes right-aligned, pages below, and how long the plan keeps a
 * transcript. There is nothing to delete here: transcripts end on their own
 * when their retention runs out, and no route removes one by hand.
 *
 * The server answers one page at a time, newest first; sorting a column
 * orders the page that is shown.
 */
export function TranscriptsArea({ guildId, tier }: { guildId: string; tier: Tier }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]

  // Draft values of the form, and the query the shown page belongs to.
  const [draft, setDraft] = useState<TranscriptQuery>(EMPTY_QUERY)
  const [applied, setApplied] = useState<TranscriptQuery>(EMPTY_QUERY)
  const [items, setItems] = useState<TranscriptItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Fetch and apply a page. Every state update happens after the await, so
  // the mount effect causes no extra render pass.
  const runQuery = useCallback(async (query: TranscriptQuery) => {
    try {
      const { ok, data } = await fetchTranscripts(guildId, query)
      if (!ok) { setError(true); setItems([]); setTotal(0); return }
      setError(false)
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setError(true); setItems([]); setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [guildId])

  useEffect(() => {
    async function run() { await runQuery(EMPTY_QUERY) }
    void run()
  }, [runQuery])

  function load(query: TranscriptQuery) {
    setApplied(query)
    setLoading(true)
    setError(false)
    void runQuery(query)
  }

  const apply = () => load({ ...draft, page: 1 })
  const reset = () => { setDraft(EMPTY_QUERY); load(EMPTY_QUERY) }
  const goTo = (page: number) => load({ ...applied, page })

  const filtered = applied.ticketId.trim() !== '' || applied.from !== '' || applied.to !== '' || applied.attachmentsOnly
  const totalPages = Math.max(1, Math.ceil(total / TRANSCRIPT_PAGE_SIZE))
  const columns = useMemo(() => transcriptColumns(lang), [lang])
  const retention = formatRetention(TIER_CONFIG[tier].storageDays, lang)

  const empty = loading ? (
    <div role="status" className="flex items-center justify-center gap-2 px-4 py-10 text-[var(--color-muted-foreground)]">
      <CircleNotch className="h-5 w-5 animate-spin" />
      {t.tx_loading}
    </div>
  ) : error ? (
    <EmptyState
      kind="error"
      title={t.tx_error}
      action={<Button variant="outline" onClick={() => load(applied)}>{t.tx_retry}</Button>}
    />
  ) : filtered ? (
    <EmptyState
      kind="no-results"
      title={t.tx_noresults_title}
      action={<Button variant="outline" onClick={reset}><ArrowCounterClockwise className="h-4 w-4" />{t.tx_reset}</Button>}
    >
      {t.tx_noresults_body}
    </EmptyState>
  ) : (
    <EmptyState
      kind="first-use"
      title={t.tx_empty_title}
      action={
        <Button asChild variant="outline">
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            {t.tx_empty_action}
            <ArrowSquareOut className="h-4 w-4" />
            <span className="sr-only">{t.opens_new_tab}</span>
          </a>
        </Button>
      }
    >
      {t.tx_empty_body}
    </EmptyState>
  )

  return (
    <div className="grid max-w-[72rem] gap-[var(--app-gutter-y)]">
      <p className="max-w-[65ch] text-[var(--color-muted-foreground)]">
        {t.tx_retention.replace('{plan}', tierLabel(t, tier)).replace('{period}', retention)}
      </p>

      <form
        aria-label={t.tx_filters}
        className="grid gap-4 @2xl:grid-cols-[minmax(0,10rem)_minmax(0,12rem)_minmax(0,12rem)_1fr] @2xl:items-end"
        onSubmit={e => { e.preventDefault(); apply() }}
      >
        <FormField label={t.tx_filter_ticket}>
          {field => (
            <Input
              {...field}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={draft.ticketId}
              onChange={e => setDraft(d => ({ ...d, ticketId: e.target.value }))}
            />
          )}
        </FormField>
        <FormField label={t.tx_filter_from}>
          {field => (
            <Input {...field} type="date" value={draft.from} onChange={e => setDraft(d => ({ ...d, from: e.target.value }))} />
          )}
        </FormField>
        <FormField label={t.tx_filter_to}>
          {field => (
            <Input {...field} type="date" value={draft.to} onChange={e => setDraft(d => ({ ...d, to: e.target.value }))} />
          )}
        </FormField>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={draft.attachmentsOnly}
            onChange={e => setDraft(d => ({ ...d, attachmentsOnly: e.target.checked }))}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
          {t.tx_filter_attachments}
        </label>
        <div className="flex flex-wrap gap-3 @2xl:col-span-full">
          <Button type="submit" disabled={loading}>
            <MagnifyingGlass className="h-4 w-4" />
            {t.tx_search}
          </Button>
          <Button type="button" variant="outline" onClick={reset} disabled={loading}>
            <ArrowCounterClockwise className="h-4 w-4" />
            {t.tx_reset}
          </Button>
        </div>
      </form>

      <DataTable
        caption={t.tx_caption}
        captionHidden
        columns={columns}
        rows={loading || error ? [] : items}
        rowKey={row => row.id}
        initialSort={{ column: 'created', direction: 'desc' }}
        empty={empty}
        footer={!loading && !error && total > 0 && (
          <nav aria-label={t.tx_pagination} className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-small text-[var(--color-muted-foreground)]" aria-live="polite">
              {t.tx_page_of.replace('{page}', formatNumber(applied.page, lang)).replace('{total}', formatNumber(totalPages, lang))}
              {' · '}
              {(total === 1 ? t.tx_total_one : t.tx_total).replace('{n}', formatNumber(total, lang))}
            </p>
            {totalPages > 1 && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => goTo(applied.page - 1)} disabled={applied.page <= 1}>
                  <CaretLeft className="h-4 w-4" />
                  {t.tx_prev}
                </Button>
                <Button variant="outline" onClick={() => goTo(applied.page + 1)} disabled={applied.page >= totalPages}>
                  {t.tx_next}
                  <CaretRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </nav>
        )}
      />
    </div>
  )
}
