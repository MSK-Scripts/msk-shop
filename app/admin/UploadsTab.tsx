'use client'

import { useMemo, useState } from 'react'
import { Loader2, ThumbsUp, ThumbsDown, ExternalLink, Clock } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useJsonResource } from '@/lib/useAdminResource'
import { ErrorCard } from '@/app/admin/ErrorCard'

interface Upload {
  id:               string
  category:         string
  name:             string
  label:            string | null
  tags:             string[]
  originalFilename: string | null
  width:            number
  height:           number
  bytes:            number
  submittedBy:      string
  submittedName:    string | null
  note:             string | null
  status:           'pending' | 'approved' | 'rejected'
  rejectReason:     string | null
  reviewedBy:       string | null
  reviewedAt:       string | null
  createdAt:        string
  hasFile:          boolean
}

/**
 * Only the two fields the selector needs.
 *
 * The list comes from `/api/admin/images/stats`, because the categories are
 * already there and that route accepts the same three permissions as this view.
 * A dedicated endpoint would have queried the same table a second time.
 */
interface Figures {
  categories: Array<{ slug: string; name: string }>
}

const TABS = [
  { id: 'pending',  label: 'Awaiting review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all',      label: 'All' },
] as const
type QueueFilter = (typeof TABS)[number]['id']

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadsTab({ canModerate }: { canModerate: boolean }) {
  const [filter, setFilter] = useState<QueueFilter>('pending')

  const url = useMemo(() => `/api/admin/image-uploads?status=${filter}`, [filter])
  const { data: uploads, error, reload } = useJsonResource<Upload[]>(
    url, 'uploads', 'Failed to load the queue.',
  )

  // If the call fails, `categories` stays empty and the row shows no selector.
  // Approving still works, just into the submitted category: a loading error
  // here must not block moderation.
  const { data: figures } = useJsonResource<Figures>(
    '/api/admin/images/stats', 'figures', 'Failed to load categories.',
  )
  const categories = figures?.categories ?? []

  const [busyId, setBusyId]   = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)
  // Rejection reasons, keyed by upload id. A reason is mandatory server-side:
  // a rejection without one is a silent disappearance for the submitter.
  const [reasons, setReasons] = useState<Record<string, string>>({})
  // Target category per submission. Empty means "leave it as submitted", which
  // is why this is its own state and not a prefilled field: that way the code
  // can tell whether somebody actively refiled it.
  const [targets, setTargets] = useState<Record<string, string>>({})

  const decide = async (u: Upload, decision: 'approve' | 'reject') => {
    if (busyId) return
    const reason = (reasons[u.id] ?? '').trim()
    if (decision === 'reject' && !reason) {
      setRowError('Please give a reason before rejecting.')
      return
    }

    setBusyId(u.id)
    setRowError(null)
    try {
      // The category only travels with an approval. A rejection writes no file,
      // and its category is the submitter's own statement, which stays on
      // record as exactly that.
      const body = decision === 'reject'
        ? { decision, reason }
        : { decision, category: targets[u.id] ?? u.category }

      const r = await fetch(`/api/admin/image-uploads/${u.id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error ?? 'Decision failed.')
      await reload()
    } catch (e) {
      setRowError(e instanceof Error ? e.message : 'Decision failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Images submitted through <span className="font-mono text-xs">/images/upload</span>.
        A pending file sits in quarantine outside any DocumentRoot; approving is the one action
        that puts it into the public CDN.
        {canModerate
          ? ' It was re-encoded by sharp on arrival, so what you see below is our own PNG, not the submitted bytes. The category a submitter picked is a suggestion — set the one you want before approving.'
          : ' You can see the queue but not decide on it.'}
      </p>

      <div className="flex flex-wrap gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setFilter(tab.id); setRowError(null) }}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              filter === tab.id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {rowError && <ErrorCard message={rowError} />}
      {error && <ErrorCard message={error} />}

      {!error && !uploads && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading queue…
        </Card>
      )}

      {!error && uploads && uploads.length === 0 && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Clock className="h-4 w-4" />
          {filter === 'pending' ? 'Nothing waiting. ' : 'Nothing here. '}
          {filter === 'pending' && 'The queue is empty.'}
        </Card>
      )}

      {!error && uploads && uploads.map(u => {
        const busy = busyId === u.id
        return (
          <Card key={u.id} className="p-5">
            <div className="flex flex-wrap gap-5">
              <div className="checker-bg flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {u.hasFile ? (
                  /* eslint-disable-next-line @next/next/no-img-element --
                     Die Datei liegt in der Quarantaene und wird von einer
                     authentifizierten Route gestreamt. next/image koennte sie
                     gar nicht holen, es hat keine Sitzung. */
                  <img
                    src={`/api/admin/image-uploads/${u.id}/preview`}
                    alt={`Submission ${u.name}`}
                    className="max-h-40 max-w-40 object-contain"
                  />
                ) : (
                  <span className="px-2 text-center text-xs text-[var(--color-muted-foreground)]">
                    File removed after the decision
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <div className="font-mono text-sm font-medium break-all">{u.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {u.category} · {u.width}×{u.height} · {formatBytes(u.bytes)}
                    {u.originalFilename && <> · sent as {u.originalFilename}</>}
                  </div>
                </div>

                <div className="text-sm">
                  {u.label
                    ? <span>{u.label}</span>
                    : <span className="text-[var(--color-muted-foreground)]">no label</span>}
                  {u.tags.length > 0 && (
                    <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                      {u.tags.join(', ')}
                    </span>
                  )}
                </div>

                {u.note && (
                  <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-2.5 text-xs">
                    {u.note}
                  </p>
                )}

                <div className="text-xs text-[var(--color-muted-foreground)]">
                  by {u.submittedName ?? 'unknown'} <span className="font-mono">{u.submittedBy}</span>
                  {' · '}{new Date(u.createdAt).toLocaleString('en-GB')}
                </div>

                {u.status !== 'pending' && (
                  <div className="text-xs">
                    <span className={cn(
                      'inline-block rounded-sm border px-2 py-0.5 font-semibold',
                      u.status === 'approved'
                        ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
                    )}>
                      {u.status}
                    </span>
                    {u.rejectReason && (
                      <span className="ml-2 text-[var(--color-muted-foreground)]">{u.rejectReason}</span>
                    )}
                    {u.status === 'approved' && (
                      <a
                        href={`/images/${u.category}/${u.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> in the gallery
                      </a>
                    )}
                  </div>
                )}

                {u.status === 'pending' && canModerate && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button size="sm" disabled={busy} onClick={() => decide(u, 'approve')}>
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                      Approve
                    </Button>
                    {categories.length > 0 && (
                      <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                        into
                        <select
                          value={targets[u.id] ?? u.category}
                          onChange={e => setTargets(t => ({ ...t, [u.id]: e.target.value }))}
                          disabled={busy}
                          aria-label={`Category to approve ${u.name} into`}
                          className="h-8 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 text-xs text-[var(--color-foreground)]"
                        >
                          {categories.map(c => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <Input
                      value={reasons[u.id] ?? ''}
                      onChange={e => setReasons(r => ({ ...r, [u.id]: e.target.value }))}
                      placeholder="Reason for rejecting…"
                      maxLength={255}
                      aria-label={`Rejection reason for ${u.name}`}
                      className="h-8 max-w-xs text-xs"
                    />
                    <Button variant="danger" size="sm" disabled={busy} onClick={() => decide(u, 'reject')}>
                      <ThumbsDown className="h-3.5 w-3.5" /> Reject
                    </Button>
                    {(targets[u.id] ?? u.category) !== u.category && (
                      <span className="w-full text-xs text-[var(--color-warning)]">
                        Filed under <span className="font-mono">{targets[u.id]}</span> instead of the
                        submitted <span className="font-mono">{u.category}</span>. Rejecting ignores this.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
