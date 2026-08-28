'use client'

import { useMemo, useState } from 'react'
import {
  Loader2, Search, Pencil, Check, X, Eye, EyeOff, ExternalLink,
  ShieldQuestion, ThumbsUp, ThumbsDown, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useAdminResource } from '@/lib/useAdminResource'
import { ErrorCard } from '@/app/admin/ErrorCard'

interface AdminImage {
  category:    string
  name:        string
  label:       string | null
  tags:        string[]
  ext:         string
  width:       number
  height:      number
  bytes:       number
  version:     number
  status:      string
  source:      string | null
  licenseNote: string | null
  submittedBy: string | null
  updatedAt:   string
  thumb:       string
  url:         string
}

interface ImageList {
  total: number
  page:  number
  per:   number
  items: AdminImage[]
}

interface CategoryStat {
  slug:      string
  name:      string
  isPublic:  boolean
  total:     number
  published: number
  pending:   number
  hidden:    number
  noLabel:   number
  noTags:    number
}

/**
 * Was `/api/admin/images/stats` liefert.
 *
 * `uploadQueue` steht bewusst neben den Kategoriezahlen und nicht darin: eine
 * Einreichung liegt in `msk_image_uploads`, hat also weder eine Kategorie-Zeile
 * in `msk_images` noch Derivate im CDN. Sie unter `pending` einer Kategorie zu
 * mischen haette den Eindruck erweckt, die Datei sei schon da.
 */
interface Figures {
  categories:  CategoryStat[]
  uploadQueue: number
}

interface SyncCategory {
  category:          string
  rows:              number
  files:             number
  directoryGone:     boolean
  missingFile:       string[]
  orphanFile:        string[]
  missingDeriv:      string[]
  missingFileTotal:  number
  orphanFileTotal:   number
  missingDerivTotal: number
}

interface SyncReport {
  root:         string
  problems:     number
  categories:   SyncCategory[]
  unavailable?: string
}

const FILTERS = [
  { id: 'all',      label: 'All' },
  // Absichtlich nicht "Awaiting review": dieser Filter zeigt Zeilen aus
  // `msk_images` mit `status = 'pending'`, nicht die Einreichungen aus dem
  // Uploads-Tab. Zwei Zahlen mit demselben Namen waren genau der Grund, warum
  // die leere Kachel oben niemandem auffiel.
  { id: 'pending',  label: 'Pending rows' },
  { id: 'no_label', label: 'Missing label' },
  { id: 'no_tags',  label: 'Missing tags' },
  { id: 'hidden',   label: 'Hidden' },
] as const
type Filter = (typeof FILTERS)[number]['id']

const PER_PAGE = 40

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'published': return 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
    case 'pending':   return 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
    default:          return 'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  canManage:   boolean
  canModerate: boolean
}

export default function ImagesTab({ canManage, canModerate }: Props) {
  // Query state. Every one of these only ever changes inside an event handler,
  // so the URL below is a plain derived value and there is no setState in an
  // effect anywhere in this file.
  const [category, setCategory] = useState('')
  const [filter, setFilter]     = useState<Filter>('all')
  const [page, setPage]         = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ]               = useState('')

  const listUrl = useMemo(() => {
    const sp = new URLSearchParams()
    if (category) sp.set('category', category)
    if (filter !== 'all') sp.set('filter', filter)
    if (q) sp.set('q', q)
    sp.set('page', String(page))
    sp.set('per',  String(PER_PAGE))
    return `/api/admin/images?${sp.toString()}`
  }, [category, filter, q, page])

  const { data: list, error, reload } = useAdminResource<ImageList>(
    listUrl, 'result', 'Failed to load images.',
  )
  const { data: figures, error: statsError, reload: reloadStats } = useAdminResource<Figures>(
    '/api/admin/images/stats', 'figures', 'Failed to load image figures.',
  )
  const stats = figures?.categories ?? null

  // Inline editor, one row at a time. Keyed by "category/name" because a name
  // alone is not unique — `police` exists as a vehicle and as a ped, which is
  // the whole reason the category sits in the path.
  const [editKey, setEditKey]     = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editTags, setEditTags]   = useState('')
  const [busyKey, setBusyKey]     = useState<string | null>(null)
  const [rowError, setRowError]   = useState<string | null>(null)

  const [sync, setSync]           = useState<SyncReport | null>(null)
  const [syncBusy, setSyncBusy]   = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const totals = useMemo(() => {
    if (!stats) return null
    return stats.reduce(
      (acc, s) => ({
        total:     acc.total + s.total,
        pending:   acc.pending + s.pending,
        hidden:    acc.hidden + s.hidden,
        noLabel:   acc.noLabel + s.noLabel,
        noTags:    acc.noTags + s.noTags,
      }),
      { total: 0, pending: 0, hidden: 0, noLabel: 0, noTags: 0 },
    )
  }, [stats])

  const queue = figures?.uploadQueue ?? 0

  /**
   * Der `pending`-Chip erscheint nur, wenn es etwas zu finden gibt.
   *
   * Kein Codepfad schreibt heute `msk_images.status = 'pending'`: der Ingest
   * laesst die Spalte auf ihrem Default `published`, und die Upload-Freigabe
   * setzt den Wert ausdruecklich. Der Zustand ist also nur ueber ein UPDATE
   * von Hand erreichbar. Der Chip bleibt trotzdem, denn eine solche Zeile
   * waere in der Galerie unsichtbar (dort gilt `status = 'published'`) und
   * ohne ihn im Admin nicht auffindbar: er ist der Ausweg aus dem Zustand,
   * nicht seine Anzeige.
   *
   * Der aktive Filter bleibt sichtbar, auch wenn die Zahl auf 0 faellt. Ein
   * Filter, der wirkt und den man nicht sieht, ist schlimmer als ein Chip zu
   * viel.
   */
  const visibleFilters = FILTERS.filter(
    f => f.id !== 'pending' || (totals?.pending ?? 0) > 0 || filter === 'pending',
  )

  const pages = list ? Math.max(1, Math.ceil(list.total / list.per)) : 1

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQ(searchInput.trim())
    setPage(1)
  }

  const pickCategory = (slug: string) => { setCategory(slug); setPage(1); setEditKey(null) }
  const pickFilter   = (f: Filter)     => { setFilter(f);     setPage(1); setEditKey(null) }

  const openEdit = (img: AdminImage) => {
    setEditKey(`${img.category}/${img.name}`)
    setEditLabel(img.label ?? '')
    setEditTags(img.tags.join(', '))
    setRowError(null)
  }

  const patch = async (img: AdminImage, body: Record<string, unknown>) => {
    const key = `${img.category}/${img.name}`
    setBusyKey(key)
    setRowError(null)
    try {
      const r = await fetch(`/api/admin/images/${img.category}/${img.name}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Update failed.')
      setEditKey(null)
      await reload()
      // The counters move with every edit — a fixed label is one less in
      // "missing label", and that is the number this screen exists for.
      await reloadStats()
    } catch (e) {
      setRowError(e instanceof Error ? e.message : 'Update failed.')
    } finally {
      setBusyKey(null)
    }
  }

  const runSyncCheck = async () => {
    setSyncBusy(true)
    setSyncError(null)
    try {
      const r = await fetch('/api/admin/images/sync-check')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Sync check failed.')
      setSync(d.report as SyncReport)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Sync check failed.')
    } finally {
      setSyncBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        The image CDN inventory behind <span className="font-mono text-xs">cdn.msk-scripts.de</span>.
        {canManage
          ? ' Label and tags are what makes an image findable — a tile nobody can search for might as well not exist.'
          : ' You can view the inventory but not change it.'}
        {' '}Files are only ever written by <span className="font-mono text-xs">scripts/image-ingest.js</span> on the server, never from here.
      </p>

      {/* ---------- figures ---------- */}
      {statsError && <ErrorCard message={statsError} />}

      {!statsError && !stats && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading figures…
        </Card>
      )}

      {stats && totals && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">Images</div>
            <div className="mt-1 text-2xl font-bold">{totals.total.toLocaleString('en-US')}</div>
            <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">{stats.length} categories</div>
          </Card>
          {/*
            Zaehlt die Moderationsschlange aus `msk_image_uploads`, nicht die
            `pending`-Zeilen der Tabelle darunter. Das war der Fehler: die
            Kachel versprach "community uploads" und las eine Spalte, die eine
            Einreichung nie erreicht.
          */}
          <Card className={cn('p-4', queue > 0 && 'border-[var(--color-warning)]/40')}>
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">Awaiting review</div>
            <div className={cn('mt-1 text-2xl font-bold', queue > 0 && 'text-[var(--color-warning)]')}>
              {queue.toLocaleString('en-US')}
            </div>
            <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {queue > 0 ? 'Community uploads — in the Uploads tab' : 'Community uploads'}
              {totals.pending > 0 && ` · ${totals.pending} pending row${totals.pending === 1 ? '' : 's'} here`}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">Missing label</div>
            <div className="mt-1 text-2xl font-bold">{totals.noLabel.toLocaleString('en-US')}</div>
            <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">Not findable by display name</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">Missing tags</div>
            <div className="mt-1 text-2xl font-bold">{totals.noTags.toLocaleString('en-US')}</div>
            <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">{totals.hidden} hidden</div>
          </Card>
        </div>
      )}

      {stats && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Published</th>
                  <th className="px-4 py-2.5 font-medium">Hidden</th>
                  <th className="px-4 py-2.5 font-medium">No label</th>
                  <th className="px-4 py-2.5 font-medium">No tags</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => (
                  <tr key={s.slug} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => pickCategory(s.slug)}
                        className="font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {s.name}
                      </button>
                      {!s.isPublic && (
                        <span className="ml-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-muted-foreground)]">
                          Not listed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{s.published.toLocaleString('en-US')}</td>
                    <td className="px-4 py-2.5">{s.hidden}</td>
                    <td className="px-4 py-2.5">{s.noLabel.toLocaleString('en-US')}</td>
                    <td className="px-4 py-2.5">{s.noTags.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ---------- filters ---------- */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={applySearch} className="flex items-center gap-2">
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search name, label or tags…"
            className="w-56"
            aria-label="Search images"
          />
          <Button type="submit" variant="outline" size="sm">
            <Search className="h-3.5 w-3.5" /> Search
          </Button>
          {q && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setSearchInput(''); setQ(''); setPage(1) }}
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </form>

        <select
          value={category}
          onChange={e => pickCategory(e.target.value)}
          aria-label="Category"
          className="h-8 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 text-xs text-[var(--color-foreground)]"
        >
          <option value="">All categories</option>
          {stats?.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>

        <div className="flex flex-wrap gap-1">
          {visibleFilters.map(f => (
            <button
              key={f.id}
              onClick={() => pickFilter(f.id)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                filter === f.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              )}
            >
              {f.label}
              {f.id === 'pending' && totals && totals.pending > 0 && (
                <span className="ml-1.5 font-bold text-[var(--color-warning)]">{totals.pending}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {rowError && <ErrorCard message={rowError} />}
      {error && <ErrorCard message={error} />}

      {!error && !list && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading images…
        </Card>
      )}

      {/* ---------- inventory ---------- */}
      {!error && list && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[var(--color-muted-foreground)]">
              {list.total.toLocaleString('en-US')} {list.total === 1 ? 'image' : 'images'}
              {pages > 1 && <> · page {list.page} of {pages}</>}
            </span>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); setEditKey(null) }}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => { setPage(p => p + 1); setEditKey(null) }}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {list.items.length === 0 ? (
            <Card className="p-6 text-sm text-[var(--color-muted-foreground)]">No images match.</Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                      <th className="px-4 py-3 font-medium">Image</th>
                      <th className="px-4 py-3 font-medium">Label</th>
                      <th className="px-4 py-3 font-medium">Tags</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.items.map(img => {
                      const key     = `${img.category}/${img.name}`
                      const editing = editKey === key
                      const busy    = busyKey === key
                      const pending = img.status === 'pending'
                      // A pending row is somebody else's upload: resolving it
                      // needs images.moderate, editing our own inventory needs
                      // images.manage. Same split as the API enforces.
                      const mayChangeStatus = pending ? canModerate : canManage

                      return (
                        <tr key={key} className="border-b border-[var(--color-border)] align-top last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              <div className="checker-bg flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
                                {/* eslint-disable-next-line @next/next/no-img-element --
                                    Bewusst kein next/image: die Datei liegt bereits als
                                    160-px-Derivat auf dem CDN, vom Ingest mit sharp erzeugt.
                                    Der Optimizer wuerde sie ein zweites Mal durch den
                                    Node-Prozess schicken, um dasselbe Ergebnis zu bekommen. */}
                                <img
                                  src={img.thumb}
                                  alt=""
                                  loading="lazy"
                                  className="max-h-12 max-w-12 object-contain"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-mono text-xs font-medium break-all">{img.name}</div>
                                <div className="text-xs text-[var(--color-muted-foreground)]">
                                  {img.category} · {img.width}×{img.height} · {formatBytes(img.bytes)}
                                  {img.version > 1 && <> · v{img.version}</>}
                                </div>
                                {img.source && (
                                  <div className="text-xs text-[var(--color-muted-foreground)]">
                                    source: {img.source}
                                  </div>
                                )}
                                {img.submittedBy && (
                                  <div className="text-xs text-[var(--color-muted-foreground)]">
                                    submitted by <span className="font-mono">{img.submittedBy}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {editing ? (
                              <Input
                                value={editLabel}
                                onChange={e => setEditLabel(e.target.value)}
                                placeholder="e.g. Pegassi Zentorno"
                                maxLength={160}
                                aria-label={`Label for ${img.name}`}
                                className="min-w-40"
                              />
                            ) : img.label ? (
                              <span>{img.label}</span>
                            ) : (
                              <span className="text-[var(--color-muted-foreground)]">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {editing ? (
                              <Input
                                value={editTags}
                                onChange={e => setEditTags(e.target.value)}
                                placeholder="comma, separated, tags"
                                maxLength={255}
                                aria-label={`Tags for ${img.name}`}
                                className="min-w-40"
                              />
                            ) : img.tags.length ? (
                              <div className="flex flex-wrap gap-1">
                                {img.tags.map(t => (
                                  <span key={t} className="rounded-sm border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 text-xs text-[var(--color-muted-foreground)]">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[var(--color-muted-foreground)]">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className={cn('inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold', statusBadgeClass(img.status))}>
                              {img.status}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {busy && <Loader2 className="h-4 w-4 animate-spin text-[var(--color-muted-foreground)]" />}

                              {editing ? (
                                <>
                                  <Button
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => patch(img, { label: editLabel, tags: editTags })}
                                  >
                                    <Check className="h-3.5 w-3.5" /> Save
                                  </Button>
                                  <Button variant="outline" size="sm" disabled={busy} onClick={() => setEditKey(null)}>
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {pending && canModerate && (
                                    <>
                                      <Button size="sm" disabled={busy} onClick={() => patch(img, { status: 'published' })}>
                                        <ThumbsUp className="h-3.5 w-3.5" /> Approve
                                      </Button>
                                      <Button variant="danger" size="sm" disabled={busy} onClick={() => patch(img, { status: 'hidden' })}>
                                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                                      </Button>
                                    </>
                                  )}
                                  {!pending && mayChangeStatus && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={busy}
                                      onClick={() => patch(img, { status: img.status === 'published' ? 'hidden' : 'published' })}
                                      title={img.status === 'published' ? 'Hide from the gallery' : 'Publish to the gallery'}
                                    >
                                      {img.status === 'published'
                                        ? <><EyeOff className="h-3.5 w-3.5" /> Hide</>
                                        : <><Eye className="h-3.5 w-3.5" /> Publish</>}
                                    </Button>
                                  )}
                                  {canManage && (
                                    <Button variant="outline" size="sm" disabled={busy} onClick={() => openEdit(img)}>
                                      <Pencil className="h-3.5 w-3.5" /> Edit
                                    </Button>
                                  )}
                                  <a
                                    href={img.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tap-target inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                                    title="Open the original on the CDN"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span className="sr-only">Open {img.name} on the CDN</span>
                                  </a>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ---------- sync check ---------- */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <ShieldQuestion className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              Filesystem check
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
              Compares the CDN directory against the database: rows whose file is gone (the
              gallery shows a tile, the image 404s), files nobody knows about (served, listed
              nowhere) and missing derivatives. Read-only, and it runs only when you click.
              The size comparison stays in <span className="font-mono text-xs">scripts/image-sync-check.js</span> —
              it needs one stat call per row and does not belong behind a button.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={runSyncCheck} disabled={syncBusy}>
            {syncBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Run check
          </Button>
        </div>

        {syncError && <p className="mt-4 text-sm text-[var(--color-danger)]" role="alert">{syncError}</p>}

        {sync && (
          <div className="mt-5 space-y-3">
            {sync.unavailable ? (
              <p className="text-sm text-[var(--color-warning)]">{sync.unavailable}</p>
            ) : (
              <>
                <p className={cn('text-sm font-medium', sync.problems ? 'text-[var(--color-warning)]' : 'text-[var(--color-primary)]')}>
                  {sync.problems
                    ? `${sync.problems} mismatch${sync.problems === 1 ? '' : 'es'} found`
                    : 'No mismatches'}
                  <span className="ml-2 font-mono text-xs font-normal text-[var(--color-muted-foreground)]">{sync.root}</span>
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                        <th className="py-2 pr-4 font-medium">Category</th>
                        <th className="py-2 pr-4 font-medium">Rows</th>
                        <th className="py-2 pr-4 font-medium">Files</th>
                        <th className="py-2 pr-4 font-medium">Findings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sync.categories.map(c => {
                        const findings: string[] = []
                        if (c.directoryGone)     findings.push(`directory missing, ${c.rows} rows point at it`)
                        if (c.missingFileTotal)  findings.push(`${c.missingFileTotal} row(s) without a file: ${c.missingFile.join(', ')}${c.missingFileTotal > c.missingFile.length ? ' …' : ''}`)
                        if (c.orphanFileTotal)   findings.push(`${c.orphanFileTotal} file(s) without a row: ${c.orphanFile.join(', ')}${c.orphanFileTotal > c.orphanFile.length ? ' …' : ''}`)
                        if (c.missingDerivTotal) findings.push(`${c.missingDerivTotal} missing derivative(s): ${c.missingDeriv.join(', ')}${c.missingDerivTotal > c.missingDeriv.length ? ' …' : ''}`)
                        return (
                          <tr key={c.category} className="border-b border-[var(--color-border)] align-top last:border-0">
                            <td className="py-2 pr-4 font-medium">{c.category}</td>
                            <td className="py-2 pr-4">{c.rows.toLocaleString('en-US')}</td>
                            <td className="py-2 pr-4">{c.files.toLocaleString('en-US')}</td>
                            <td className="py-2 pr-4">
                              {findings.length ? (
                                <ul className="space-y-1 text-xs text-[var(--color-warning)]">
                                  {findings.map(f => <li key={f} className="break-all">{f}</li>)}
                                </ul>
                              ) : (
                                <span className="text-xs text-[var(--color-muted-foreground)]">in order</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
