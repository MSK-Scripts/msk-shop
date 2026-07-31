'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  FileText, ExternalLink, Search, RotateCcw, Paperclip,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import { dashboardTranslations, type Lang } from '@/lib/i18n'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface TranscriptItem {
  id:             string
  ticketId:       number
  url:            string
  sizeBytes:      number
  hasAttachments: boolean
  createdAt:      string
  expiresAt:      string
}

const PAGE_SIZE = 20

interface Query {
  ticketId: string; from: string; to: string; attachmentsOnly: boolean; page: number
}

const EMPTY_QUERY: Query = { ticketId: '', from: '', to: '', attachmentsOnly: false, page: 1 }

function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

/** Only render https:// links — never trust the stored value blindly. */
function safeUrl(url: string): string | null {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

export default function TranscriptsCard({ lang, guildId }: { lang: Lang; guildId: string }) {
  const t = dashboardTranslations[lang]
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'

  // Applied filters (used in the fetch) vs. the draft input values.
  const [ticketId, setTicketId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [attachmentsOnly, setAttachmentsOnly] = useState(false)
  const [page, setPage] = useState(1)

  const [items, setItems] = useState<TranscriptItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: '2-digit' })

  // Fetch and apply a result set. Every state update happens after the await,
  // so the initial effect below causes no extra render pass. Flipping `loading`
  // back on is the caller's job — `loading` already starts out true.
  const runQuery = useCallback(async (opts: Query) => {
    const qs = new URLSearchParams()
    qs.set('guildId', guildId)
    qs.set('page', String(opts.page))
    qs.set('pageSize', String(PAGE_SIZE))
    if (opts.ticketId.trim()) qs.set('ticketId', opts.ticketId.trim())
    if (opts.from) qs.set('from', opts.from)
    if (opts.to) qs.set('to', opts.to)
    if (opts.attachmentsOnly) qs.set('attachments', '1')
    try {
      const res = await fetch(`/api/transcripts?${qs.toString()}`, { cache: 'no-store' })
      if (!res.ok) { setError(true); setItems([]); setTotal(0); return }
      const data = await res.json()
      setError(false)
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setError(true); setItems([]); setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [guildId])

  /** Re-query from a user action — shows the spinner right away. */
  const load = useCallback((opts: Query) => {
    setLoading(true)
    setError(false)
    return runQuery(opts)
  }, [runQuery])

  // Initial load.
  useEffect(() => {
    async function run() { await runQuery(EMPTY_QUERY) }
    run()
  }, [runQuery])

  const applyFilters = () => {
    setPage(1)
    load({ ticketId, from, to, attachmentsOnly, page: 1 })
  }

  const resetFilters = () => {
    setTicketId(''); setFrom(''); setTo(''); setAttachmentsOnly(false); setPage(1)
    load(EMPTY_QUERY)
  }

  const goToPage = (p: number) => {
    setPage(p)
    load({ ticketId, from, to, attachmentsOnly, page: p })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <Card className="mt-4 p-6">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <FileText className="h-4 w-4 text-[var(--color-primary)]" />
        <h2 className="text-base font-bold">{t.tx_title}</h2>
        {total > 0 && (
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
            {t.tx_count.replace('{n}', String(total))}
          </span>
        )}
      </div>
      <p className="mb-5 text-sm text-[var(--color-muted-foreground)]">{t.tx_desc}</p>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{t.tx_filter_ticket}</label>
          <Input
            type="number"
            inputMode="numeric"
            value={ticketId}
            onChange={e => setTicketId(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyFilters() }}
            placeholder="123"
            className="w-28"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{t.tx_filter_from}</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{t.tx_filter_to}</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm text-[var(--color-muted-foreground)]">
          <input
            type="checkbox"
            checked={attachmentsOnly}
            onChange={e => setAttachmentsOnly(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          {t.tx_filter_attachments}
        </label>
        <div className="flex gap-2 pb-0.5">
          <Button size="sm" onClick={applyFilters} disabled={loading}>
            <Search className="h-3.5 w-3.5" />
            {t.tx_search}
          </Button>
          <Button size="sm" variant="outline" onClick={resetFilters} disabled={loading}>
            <RotateCcw className="h-3.5 w-3.5" />
            {t.tx_reset}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)] text-left text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <th className="px-4 py-2.5 font-semibold">{t.tx_col_ticket}</th>
              <th className="px-4 py-2.5 font-semibold">{t.tx_col_created}</th>
              <th className="px-4 py-2.5 font-semibold">{t.tx_col_size}</th>
              <th className="px-4 py-2.5 font-semibold">{t.tx_col_attachments}</th>
              <th className="px-4 py-2.5 font-semibold">{t.tx_col_expires}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t.tx_col_open}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted-foreground)]">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  {t.tx_loading}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-danger)]">{t.tx_error}</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted-foreground)]">{t.tx_empty}</td>
              </tr>
            ) : (
              items.map(item => {
                const href = safeUrl(item.url)
                return (
                  <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/50">
                    <td className="px-4 py-2.5 font-mono font-semibold">#{item.ticketId}</td>
                    <td className="px-4 py-2.5 text-[var(--color-muted-foreground)]">{fmtDate(item.createdAt)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-muted-foreground)]">{formatBytes(item.sizeBytes)}</td>
                    <td className="px-4 py-2.5">
                      {item.hasAttachments
                        ? <span className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)]"><Paperclip className="h-3 w-3" />{t.tx_yes}</span>
                        : <span className="text-[var(--color-muted-foreground)]">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-muted-foreground)]">{fmtDate(item.expiresAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                        >
                          {t.tx_open}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[var(--color-muted-foreground)]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {t.tx_page_of.replace('{page}', String(page)).replace('{total}', String(totalPages))}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
              {t.tx_prev}
            </Button>
            <Button size="sm" variant="outline" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
              {t.tx_next}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
