'use client'

import { useMemo, useState, type FormEvent } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { Notice } from '@/components/dashboard/Notice'
import { RowMenu, type RowMenuItem } from '@/components/dashboard/RowMenu'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatGrid, StatTile } from '@/components/dashboard/StatTile'
import { StatusBadge, type StatusTone } from '@/components/dashboard/StatusBadge'
import {
  ArrowSquareOut, ArrowsClockwise, CircleNotch, Eye, EyeSlash, FloppyDisk, MagnifyingGlass, PencilSimple,
  ThumbsDown, ThumbsUp, Trash,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatBytes, formatNumber } from '@/lib/format'
import { fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL, deleteImage, runImageSyncCheck, updateImage } from './adminRequests'
import { AreaHeader, AreaLoad, ConfirmAction, FilterChips, NoneText, Pager, useAdminCopy, useFlash, type FlashMessage } from './adminUi'

export interface AdminImage {
  category: string
  name: string
  label: string | null
  tags: string[]
  ext: string
  width: number
  height: number
  bytes: number
  version: number
  status: string
  source: string | null
  licenseNote: string | null
  submittedBy: string | null
  updatedAt: string
  thumb: string
  url: string
}

export interface ImageList { total: number; page: number; per: number; items: AdminImage[] }

export interface CategoryStat {
  slug: string; name: string; isPublic: boolean
  total: number; published: number; pending: number; hidden: number; noLabel: number; noTags: number
}

/** `uploadQueue` counts the submissions, which live in their own table (see the stats route). */
export interface ImageFigures { categories: CategoryStat[]; uploadQueue: number }

interface SyncCategory {
  category: string; rows: number; files: number; directoryGone: boolean
  missingFile: string[]; orphanFile: string[]; missingDeriv: string[]
  missingFileTotal: number; orphanFileTotal: number; missingDerivTotal: number
}
interface SyncReport { root: string; problems: number; categories: SyncCategory[]; unavailable?: string }

type Filter = 'all' | 'pending' | 'no_label' | 'no_tags' | 'hidden'
export interface ImageQuery { category: string; filter: Filter; q: string; page: number }

const PER_PAGE = 40
const STATUS_TONE: Record<string, StatusTone> = { published: 'success', pending: 'warning', hidden: 'neutral' }

export function imageListUrl(query: ImageQuery): string {
  const sp = new URLSearchParams()
  if (query.category) sp.set('category', query.category)
  if (query.filter !== 'all') sp.set('filter', query.filter)
  if (query.q) sp.set('q', query.q)
  sp.set('page', String(query.page))
  sp.set('per', String(PER_PAGE))
  return ADMIN_URL.images(sp)
}

export function ImageFiguresView({ figures, onCategory }: { figures: ImageFigures; onCategory: (slug: string) => void }) {
  const { c, lang } = useAdminCopy()
  const stats = figures.categories
  const sum = (k: 'total' | 'noLabel' | 'noTags' | 'hidden' | 'pending') => stats.reduce((n, s) => n + s[k], 0)
  const n = (v: number) => formatNumber(v, lang)
  const columns: DataColumn<CategoryStat>[] = [
    {
      id: 'category', header: c.images.col_category, sortValue: s => s.name,
      cell: s => (
        <span className="inline-flex flex-wrap items-center gap-2">
          <Button variant="link" className="min-h-9 font-semibold" onClick={() => onCategory(s.slug)}>{s.name}</Button>
          {!s.isPublic && <StatusBadge tone="neutral">{c.images.not_listed}</StatusBadge>}
        </span>
      ),
    },
    { id: 'published', header: c.images.col_published, numeric: true, sortValue: s => s.published, cell: s => n(s.published) },
    { id: 'hidden', header: c.images.col_hidden, numeric: true, sortValue: s => s.hidden, cell: s => n(s.hidden) },
    { id: 'no_label', header: c.images.col_no_label, numeric: true, sortValue: s => s.noLabel, cell: s => n(s.noLabel) },
    { id: 'no_tags', header: c.images.col_no_tags, numeric: true, sortValue: s => s.noTags, cell: s => n(s.noTags) },
  ]
  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      <StatGrid>
        <StatTile label={c.images.stat_images} value={n(sum('total'))} hint={fillCopy(c.images.stat_categories, { count: n(stats.length) })} />
        <StatTile label={c.images.stat_queue} value={n(figures.uploadQueue)} hint={c.images.stat_queue_hint} href="/admin?tab=uploads" />
        <StatTile label={c.images.stat_label} value={n(sum('noLabel'))} hint={c.images.stat_label_hint} />
        <StatTile label={c.images.stat_tags} value={n(sum('noTags'))} hint={fillCopy(c.images.stat_hidden, { count: n(sum('hidden')) })} />
      </StatGrid>
      <DataTable
        caption={c.images.categories_caption}
        columns={columns}
        rows={stats}
        rowKey={s => s.slug}
        empty={<NoneText />}
        className="max-w-[72rem]"
      />
    </div>
  )
}

interface Permissions { canManage: boolean; canModerate: boolean; canDelete: boolean }

function imageColumns(c: AdminCopy, lang: Lang, perms: Permissions, act: {
  edit: (img: AdminImage) => void
  status: (img: AdminImage, status: string) => void
  /** Runs inside the confirmation; throwing keeps it open. */
  remove: (img: AdminImage) => Promise<void>
}): DataColumn<AdminImage>[] {
  return [
    {
      id: 'image', header: c.images.col_image, className: 'min-w-[16rem]', sortValue: i => i.name,
      cell: i => (
        <div className="flex items-start gap-3">
          <div className="checker-bg flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element -- the 160 px derivative already sits on the CDN; the optimizer would only send it through Node a second time. */}
            <img src={i.thumb} alt="" loading="lazy" className="max-h-12 max-w-12 object-contain" />
          </div>
          <div className="grid min-w-0 gap-0.5">
            <span className="break-all font-mono font-semibold">{i.name}</span>
            <span className="text-small text-[var(--color-muted-foreground)]">
              {[i.category, `${i.width}×${i.height}`, formatBytes(i.bytes, lang), i.version > 1 ? fillCopy(c.images.meta_version, { version: i.version }) : null].filter(Boolean).join(' · ')}
            </span>
            {i.source && <span className="text-small text-[var(--color-muted-foreground)]">{fillCopy(c.images.source, { source: i.source })}</span>}
            {i.submittedBy && <span className="text-small text-[var(--color-muted-foreground)]">{fillCopy(c.images.submitted_by, { id: i.submittedBy })}</span>}
          </div>
        </div>
      ),
    },
    { id: 'label', header: c.images.col_label, sortValue: i => i.label, cell: i => i.label || <NoneText /> },
    {
      id: 'tags', header: c.images.col_tags, className: 'min-w-[10rem]',
      cell: i => (i.tags.length ? (
        <span className="flex flex-wrap gap-1">
          {i.tags.map(t => <span key={t} className="rounded-sm border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 text-small">{t}</span>)}
        </span>
      ) : <NoneText />),
    },
    {
      id: 'status', header: c.images.col_status, nowrap: true, sortValue: i => i.status,
      cell: i => <StatusBadge tone={STATUS_TONE[i.status] ?? 'neutral'}>{c.images.status[i.status] ?? i.status}</StatusBadge>,
    },
    {
      id: 'actions', header: <span className="sr-only">{c.common.actions}</span>, nowrap: true,
      cell: i => {
        const pending = i.status === 'pending'
        // A pending row is someone's submission: resolving it needs
        // images.moderate, our own inventory needs images.manage. Same
        // split as the route enforces.
        const mayChangeStatus = pending ? perms.canModerate : perms.canManage
        const items: RowMenuItem[] = []
        if (pending && perms.canModerate) items.push({ id: 'reject', label: c.images.reject, icon: ThumbsDown, onSelect: () => act.status(i, 'hidden') })
        if (!pending && mayChangeStatus) {
          items.push(i.status === 'published'
            ? { id: 'hide', label: c.images.hide, icon: EyeSlash, onSelect: () => act.status(i, 'hidden') }
            : { id: 'publish', label: c.images.publish, icon: Eye, onSelect: () => act.status(i, 'published') })
        }
        items.push({ id: 'open', label: c.images.open, icon: ArrowSquareOut, external: i.url })
        // A pending row is never deleted here; the route refuses it too.
        const deletable = perms.canDelete && !pending
        const menu = (open?: () => void) => (
          <RowMenu
            label={fillCopy(c.common.more_actions, { name: i.name })}
            items={open ? [...items, { id: 'delete', label: c.images.delete, icon: Trash, danger: true, onSelect: open }] : items}
          />
        )
        return (
          <div className="flex items-center justify-end gap-2">
            {pending && perms.canModerate
              ? <Button size="sm" onClick={() => act.status(i, 'published')}><ThumbsUp className="h-4 w-4" />{c.images.approve}</Button>
              : perms.canManage && <Button variant="outline" size="sm" onClick={() => act.edit(i)}><PencilSimple className="h-4 w-4" />{c.images.edit}</Button>}
            {deletable ? (
              <ConfirmAction
                title={fillCopy(c.images.delete_title, { name: i.name })}
                description={c.images.delete_body}
                confirmLabel={c.images.delete_confirm}
                failMessage={c.images.delete_failed}
                typeToConfirm={{ expected: i.name, label: fillCopy(c.images.delete_type, { name: i.name }) }}
                run={() => act.remove(i)}
                trigger={open => menu(open)}
              />
            ) : menu()}
          </div>
        )
      },
    },
  ]
}

export function ImagesInventory({ list, categories, perms, query, onQuery, reload, setFlash }: {
  list: ImageList
  categories: CategoryStat[]
  perms: Permissions
  query: ImageQuery
  onQuery: (next: Partial<ImageQuery>) => void
  reload: () => Promise<void>
  setFlash: (f: FlashMessage | null) => void
}) {
  const { c, lang } = useAdminCopy()
  const [editing, setEditing] = useState<AdminImage | null>(null)

  async function setStatus(img: AdminImage, status: string) {
    try {
      await updateImage(img.category, img.name, { status }, c.images.update_failed)
      setFlash({ tone: 'success', text: fillCopy(c.images.saved, { name: img.name }) })
      await reload()
    } catch (e) {
      setFlash({ tone: 'danger', text: e instanceof Error ? e.message : c.images.update_failed })
    }
  }

  async function remove(img: AdminImage) {
    const result = await deleteImage(img.category, img.name, c.images.delete_failed)
    // The row is gone but the files may not be: the route says so, and
    // someone deleting for a legal reason has to hear it.
    setFlash(result.warning ? { tone: 'warning', text: String(result.warning) } : { tone: 'success', text: fillCopy(c.images.deleted, { name: img.name }) })
    await reload()
  }

  const columns = imageColumns(c, lang, perms, {
    edit: setEditing,
    status: (i, s) => void setStatus(i, s),
    remove,
  })
  const pages = Math.max(1, Math.ceil(list.total / list.per))
  const pendingRows = categories.reduce((n, s) => n + s.pending, 0)
  const filters: Filter[] = ['all', 'pending', 'no_label', 'no_tags', 'hidden']
  // The pending chip only when there is something to find, or while it is the active filter.
  const shownFilters = filters.filter(f => f !== 'pending' || pendingRows > 0 || query.filter === 'pending')

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      <SearchAndCategory categories={categories} query={query} onQuery={onQuery} />
      <FilterChips
        name="image-filter"
        legend={c.images.filter_label}
        lang={lang}
        value={query.filter}
        onChange={f => onQuery({ filter: f, page: 1 })}
        options={shownFilters.map(f => ({ value: f, label: c.images.filters[f], count: f === 'pending' ? pendingRows : undefined }))}
      />
      <p aria-live="polite" className="font-semibold">{fillCopy(c.images.count, { count: formatNumber(list.total, lang) })}</p>
      <DataTable
        caption={c.images.caption}
        captionHidden
        columns={columns}
        rows={list.items}
        rowKey={i => `${i.category}/${i.name}`}
        empty={<EmptyState kind="no-results" title={c.images.empty_title}>{c.images.empty_body}</EmptyState>}
        footer={<Pager page={list.page} pages={pages} onPage={p => onQuery({ page: p })} />}
      />
      {editing && (
        <EditImageDialog
          image={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onDone={async () => { setFlash({ tone: 'success', text: fillCopy(c.images.saved, { name: editing.name }) }); setEditing(null); await reload() }}
        />
      )}
    </div>
  )
}

function SearchAndCategory({ categories, query, onQuery }: { categories: CategoryStat[]; query: ImageQuery; onQuery: (next: Partial<ImageQuery>) => void }) {
  const { c } = useAdminCopy()
  const [input, setInput] = useState(query.q)
  function submit(e: FormEvent) {
    e.preventDefault()
    onQuery({ q: input.trim(), page: 1 })
  }
  return (
    <div className="flex flex-wrap items-end gap-4">
      <form role="search" onSubmit={submit} className="flex min-w-0 flex-1 basis-80 flex-wrap items-end gap-3">
        <FormField label={c.images.search} hint={c.images.search_hint} className="min-w-0 flex-1 basis-56">
          {field => <Input {...field} type="search" value={input} onChange={e => setInput(e.target.value)} />}
        </FormField>
        <Button type="submit" variant="outline"><MagnifyingGlass className="h-4 w-4" />{c.images.search}</Button>
        {query.q && <Button type="button" variant="ghost" onClick={() => { setInput(''); onQuery({ q: '', page: 1 }) }}>{c.common.clear_search}</Button>}
      </form>
      <FormField label={c.images.f_category} className="w-full max-w-[16rem]">
        {field => (
          <Select {...field} value={query.category} onChange={e => onQuery({ category: e.target.value, page: 1 })}>
            <option value="">{c.images.all_categories}</option>
            {categories.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </Select>
        )}
      </FormField>
    </div>
  )
}

function EditImageDialog({ image, categories, onClose, onDone }: {
  image: AdminImage
  categories: CategoryStat[]
  onClose: () => void
  onDone: () => Promise<void>
}) {
  const { c } = useAdminCopy()
  const [label, setLabel] = useState(image.label ?? '')
  const [tags, setTags] = useState(image.tags.join(', '))
  const [category, setCategory] = useState(image.category)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const moving = category !== image.category

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFailure(null)
    try {
      await updateImage(image.category, image.name, { label, tags, category }, c.images.update_failed)
      await onDone()
    } catch (err) {
      setFailure(err instanceof Error ? err.message : c.images.update_failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onClose={() => { if (!busy) onClose() }}
      title={fillCopy(c.images.edit_title, { name: image.name })}
      className="w-[min(100%_-_2rem,36rem)]"
      body={(
        <form id="edit-image" onSubmit={submit} className="grid gap-4">
          <FormField label={c.images.f_label} hint={c.images.f_label_hint}>
            {field => <Input {...field} value={label} onChange={e => setLabel(e.target.value)} maxLength={160} />}
          </FormField>
          <FormField label={c.images.f_tags} hint={c.images.f_tags_hint}>
            {field => <Input {...field} value={tags} onChange={e => setTags(e.target.value)} maxLength={255} />}
          </FormField>
          <FormField label={c.images.f_move}>
            {field => (
              <Select {...field} value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </Select>
            )}
          </FormField>
          {moving && <Notice tone="warning">{fillCopy(c.images.move_warning, { path: `/${category}/${image.name}.${image.ext}` })}</Notice>}
          {failure && <p role="alert" className="font-semibold text-[var(--color-danger)]">{failure}</p>}
        </form>
      )}
    >
      <Button variant="outline" onClick={onClose} disabled={busy}>{c.common.cancel}</Button>
      <Button type="submit" form="edit-image" disabled={busy} aria-busy={busy || undefined}>
        {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
        {moving ? c.images.save_move : c.images.save}
      </Button>
    </Dialog>
  )
}

function SyncCheck() {
  const { c, lang } = useAdminCopy()
  const [report, setReport] = useState<SyncReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      setReport(await runImageSyncCheck<SyncReport>(c.images.sync_failed))
    } catch (e) {
      setError(e instanceof Error ? e.message : c.images.sync_failed)
    } finally {
      setBusy(false)
    }
  }

  const findings = (s: SyncCategory): string[] => {
    const more = (total: number, shown: string[]) => `${shown.join(', ')}${total > shown.length ? ' …' : ''}`
    const out: string[] = []
    if (s.directoryGone) out.push(fillCopy(c.images.sync_dir_gone, { rows: formatNumber(s.rows, lang) }))
    if (s.missingFileTotal) out.push(fillCopy(c.images.sync_missing_file, { count: s.missingFileTotal, names: more(s.missingFileTotal, s.missingFile) }))
    if (s.orphanFileTotal) out.push(fillCopy(c.images.sync_orphan, { count: s.orphanFileTotal, names: more(s.orphanFileTotal, s.orphanFile) }))
    if (s.missingDerivTotal) out.push(fillCopy(c.images.sync_deriv, { count: s.missingDerivTotal, names: more(s.missingDerivTotal, s.missingDeriv) }))
    return out
  }

  const columns: DataColumn<SyncCategory>[] = [
    { id: 'category', header: c.images.col_category, cell: s => <span className="font-semibold">{s.category}</span> },
    { id: 'rows', header: c.images.col_rows, numeric: true, cell: s => formatNumber(s.rows, lang) },
    { id: 'files', header: c.images.col_files, numeric: true, cell: s => formatNumber(s.files, lang) },
    {
      id: 'findings', header: c.images.col_findings, className: 'min-w-[16rem]',
      cell: s => {
        const f = findings(s)
        return f.length
          ? <ul className="grid gap-1 text-small">{f.map(x => <li key={x} className="break-all">{x}</li>)}</ul>
          : <span className="text-[var(--color-muted-foreground)]">{c.images.sync_in_order}</span>
      },
    },
  ]

  return (
    <SectionCard
      title={c.images.sync_title}
      description={c.images.sync_desc}
      className="max-w-[72rem]"
      actions={(
        <Button variant="outline" onClick={run} disabled={busy} aria-busy={busy || undefined}>
          {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ArrowsClockwise className="h-4 w-4" />}
          {c.images.sync_run}
        </Button>
      )}
    >
      {error && <Notice tone="danger" role="alert" title={error} />}
      {report && (report.unavailable
        ? <Notice tone="warning" title={report.unavailable} />
        : (
          <div className="grid gap-3">
            <Notice
              tone={report.problems ? 'warning' : 'success'}
              role="status"
              title={report.problems === 0 ? c.images.sync_clean : report.problems === 1 ? c.images.sync_problem : fillCopy(c.images.sync_problems, { count: formatNumber(report.problems, lang) })}
            >
              <span className="font-mono">{report.root}</span>
            </Notice>
            <DataTable caption={c.images.sync_caption} captionHidden columns={columns} rows={report.categories} rowKey={s => s.category} empty={<NoneText />} />
          </div>
        ))}
    </SectionCard>
  )
}

export default function ImagesArea({ canManage, canModerate, canDelete }: Permissions) {
  const { c } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [query, setQuery] = useState<ImageQuery>({ category: '', filter: 'all', q: '', page: 1 })
  const listUrl = useMemo(() => imageListUrl(query), [query])
  const { data: list, error, reload } = useAdminResource<ImageList>(listUrl, 'result', c.images.load_failed)
  const { data: figures, error: figuresError, reload: reloadFigures } = useAdminResource<ImageFigures>(ADMIN_URL.imageStats, 'figures', c.images.figures_failed)
  const onQuery = (next: Partial<ImageQuery>) => setQuery(q => ({ ...q, ...next }))
  const reloadAll = async () => { await reload(); await reloadFigures() }
  const permissions = useMemo(() => ({ canManage, canModerate, canDelete }), [canManage, canModerate, canDelete])

  return (
    <>
      <AreaHeader area="images" description={<><p>{c.images.lead}</p><p>{canManage ? c.images.lead_manage : c.images.lead_view}</p></>} />
      <div className="grid gap-[var(--app-gutter-y)]">
        {flash}
        <AreaLoad data={figures} error={figuresError} retry={reloadFigures}>
          {f => <ImageFiguresView figures={f} onCategory={slug => onQuery({ category: slug, page: 1 })} />}
        </AreaLoad>
        <AreaLoad data={list} error={error} retry={reload}>
          {l => (
            <ImagesInventory
              list={l}
              categories={figures?.categories ?? []}
              perms={permissions}
              query={query}
              onQuery={onQuery}
              reload={reloadAll}
              setFlash={setFlash}
            />
          )}
        </AreaLoad>
        <SyncCheck />
      </div>
    </>
  )
}
