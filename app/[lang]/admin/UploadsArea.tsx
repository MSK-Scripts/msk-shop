'use client'

import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { Notice } from '@/components/dashboard/Notice'
import { StatusBadge, type StatusTone } from '@/components/dashboard/StatusBadge'
import { ArrowSquareOut, CircleNotch, ThumbsDown, ThumbsUp } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatBytes, formatDateTime, isoDate } from '@/lib/format'
import { fillCopy } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL, decideUpload } from './adminRequests'
import { AreaHeader, AreaLoad, FilterChips, useAdminCopy, useFlash, type FlashMessage } from './adminUi'
import type { ImageFigures } from './ImagesArea'

/** A submission as `/api/admin/image-uploads` sends it: an address in the note masked. */
export interface Upload {
  id: string
  category: string
  name: string
  label: string | null
  tags: string[]
  originalFilename: string | null
  width: number
  height: number
  bytes: number
  submittedBy: string
  submittedName: string | null
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejectReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  hasFile: boolean
}

type QueueFilter = 'pending' | 'approved' | 'rejected' | 'all'
const STATUS_TONE: Record<Upload['status'], StatusTone> = { pending: 'warning', approved: 'success', rejected: 'neutral' }

/** One submission with its preview and, while it waits, the decision. */
export function UploadCard({ upload, categories, canModerate, onDecided, initialReason = '' }: {
  upload: Upload
  categories: Array<{ slug: string; name: string }>
  canModerate: boolean
  onDecided: (message: FlashMessage) => Promise<void>
  /** A reason to start from, such as one used for the previous upload. */
  initialReason?: string
}) {
  const { c, lang } = useAdminCopy()
  const u = upload
  // Empty means "as submitted"; its own state, so a refiling is visible as one.
  const [target, setTarget] = useState(u.category)
  const [reason, setReason] = useState(initialReason)
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  async function decide(decision: { approve: string } | { reject: string }) {
    setBusy(true)
    setFailure(null)
    try {
      await decideUpload(u.id, decision, c.uploads.failed)
      setConfirming(false)
      await onDecided({ tone: 'success', text: fillCopy('approve' in decision ? c.uploads.approved : c.uploads.rejected, { name: u.name }) })
    } catch (e) {
      setFailure(e instanceof Error ? e.message : c.uploads.failed)
    } finally {
      setBusy(false)
    }
  }

  function askReject() {
    if (!reason.trim()) { setReasonError(c.uploads.err_reason); return }
    setReasonError(null)
    setFailure(null)
    setConfirming(true)
  }

  const meta = [u.category, `${u.width}×${u.height}`, formatBytes(u.bytes, lang), u.originalFilename ? fillCopy(c.uploads.sent_as, { file: u.originalFilename }) : null]

  return (
    <li className="@container rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-[clamp(1rem,0.8rem+0.6vw,1.5rem)]">
      <div className="grid gap-5 @2xl:grid-cols-[10rem_minmax(0,1fr)]">
        <div className="checker-bg flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg">
          {u.hasFile ? (
            /* eslint-disable-next-line @next/next/no-img-element -- the file sits in quarantine and streams from an authenticated route; next/image has no session to fetch it with. */
            <img src={`/api/admin/image-uploads/${u.id}/preview`} alt={fillCopy(c.uploads.preview_alt, { name: u.name })} className="max-h-40 max-w-40 object-contain" />
          ) : (
            <span className="px-2 text-center text-small text-[var(--color-muted-foreground)]">{c.uploads.file_removed}</span>
          )}
        </div>
        <div className="grid min-w-0 content-start gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="grid min-w-0 gap-0.5">
              <h2 className="break-all font-mono font-semibold">{u.name}</h2>
              <p className="text-small text-[var(--color-muted-foreground)]">{meta.filter(Boolean).join(' · ')}</p>
            </div>
            <StatusBadge tone={STATUS_TONE[u.status]}>{c.uploads.status[u.status]}</StatusBadge>
          </div>
          <p>
            {u.label ?? <span className="text-[var(--color-muted-foreground)]">{c.uploads.no_label}</span>}
            {u.tags.length > 0 && <span className="ml-2 text-small text-[var(--color-muted-foreground)]">{u.tags.join(', ')}</span>}
          </p>
          {u.note && <p className="max-w-[65ch] rounded-md bg-[var(--color-muted)] p-3 text-small">{u.note}</p>}
          <p className="text-small text-[var(--color-muted-foreground)]">
            {fillCopy(c.uploads.by, { name: u.submittedName ?? c.uploads.unknown, id: u.submittedBy })}
            {' · '}
            <time dateTime={isoDate(u.createdAt)}>{formatDateTime(u.createdAt, lang) ?? u.createdAt}</time>
          </p>
          {u.status !== 'pending' && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small">
              {u.rejectReason && <span>{u.rejectReason}</span>}
              {u.status === 'approved' && (
                <a href={`/tools/images/${u.category}/${u.name}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-[var(--color-primary)] hover:underline">
                  <ArrowSquareOut className="h-4 w-4" />{c.uploads.in_gallery}
                </a>
              )}
            </p>
          )}
          {u.status === 'pending' && canModerate && (
            <div className="grid gap-4 border-t border-[var(--color-border)] pt-4 @3xl:grid-cols-2">
              <div className="grid content-start gap-3">
                {categories.length > 0 && (
                  <FormField label={c.uploads.f_category}>
                    {field => (
                      <Select {...field} value={target} onChange={e => setTarget(e.target.value)} disabled={busy}>
                        {categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
                      </Select>
                    )}
                  </FormField>
                )}
                {target !== u.category && <Notice tone="warning">{fillCopy(c.uploads.refiled, { to: target, from: u.category })}</Notice>}
                <div>
                  <Button onClick={() => void decide({ approve: target })} disabled={busy} aria-busy={busy || undefined}>
                    {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                    {c.uploads.approve}
                  </Button>
                </div>
              </div>
              <div className="grid content-start gap-3">
                <FormField label={c.uploads.f_reason} hint={c.uploads.f_reason_hint} error={reasonError}>
                  {field => <Input {...field} value={reason} onChange={e => setReason(e.target.value)} maxLength={255} />}
                </FormField>
                <div>
                  <Button variant="outline" onClick={askReject} disabled={busy}><ThumbsDown className="h-4 w-4" />{c.uploads.reject}</Button>
                </div>
              </div>
              {failure && !confirming && <p role="alert" className="font-semibold text-[var(--color-danger)] @3xl:col-span-2">{failure}</p>}
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void decide({ reject: reason.trim() })}
        title={fillCopy(c.uploads.reject_title, { name: u.name })}
        description={c.uploads.reject_body}
        confirmLabel={c.uploads.reject_confirm}
        cancelLabel={c.common.cancel}
        busy={busy}
        error={failure}
      />
    </li>
  )
}

export function UploadsList({ uploads, filter, categories, canModerate, onDecided }: {
  uploads: Upload[]
  filter: QueueFilter
  categories: Array<{ slug: string; name: string }>
  canModerate: boolean
  onDecided: (message: FlashMessage) => Promise<void>
}) {
  const { c } = useAdminCopy()
  if (uploads.length === 0) {
    return filter === 'pending'
      ? <EmptyState kind="first-use" title={c.uploads.empty_pending_title}>{c.uploads.empty_pending_body}</EmptyState>
      : <EmptyState kind="no-results" title={c.uploads.empty_title}>{c.uploads.empty_body}</EmptyState>
  }
  return (
    <ul className="grid max-w-[72rem] gap-4">
      {uploads.map(u => <UploadCard key={u.id} upload={u} categories={categories} canModerate={canModerate} onDecided={onDecided} />)}
    </ul>
  )
}

export default function UploadsArea({ canModerate }: { canModerate: boolean }) {
  const { c, lang } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [filter, setFilter] = useState<QueueFilter>('pending')
  const url = useMemo(() => ADMIN_URL.uploads(filter), [filter])
  const { data, error, reload } = useAdminResource<Upload[]>(url, 'uploads', c.uploads.load_failed)
  // The categories come from the figures route, which accepts the same
  // permissions. If it fails the selector is left out and an approval goes
  // into the submitted category: a loading error must not block moderation.
  const { data: figures } = useAdminResource<ImageFigures>(ADMIN_URL.imageStats, 'figures', c.images.figures_failed)

  return (
    <>
      <AreaHeader area="uploads" description={<><p>{c.uploads.lead}</p><p>{canModerate ? c.uploads.lead_moderate : c.uploads.lead_view}</p></>} />
      <div className="grid gap-[var(--app-gutter-y)]">
        {flash}
        <FilterChips
          name="upload-filter"
          legend={c.uploads.filter_label}
          lang={lang}
          value={filter}
          onChange={setFilter}
          options={(['pending', 'approved', 'rejected', 'all'] as QueueFilter[]).map(f => ({ value: f, label: c.uploads.filters[f] }))}
        />
        <AreaLoad data={data} error={error} retry={reload}>
          {uploads => (
            <UploadsList
              uploads={uploads}
              filter={filter}
              categories={figures?.categories ?? []}
              canModerate={canModerate}
              onDecided={async message => { setFlash(message); await reload() }}
            />
          )}
        </AreaLoad>
      </div>
    </>
  )
}
