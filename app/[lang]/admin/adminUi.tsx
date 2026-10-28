'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Notice } from '@/components/dashboard/Notice'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { useLang } from '@/components/i18n/LangProvider'
import { BookOpen, CaretLeft, CaretRight, CircleNotch, Eye, EyeSlash } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { RevealField, RevealKind } from '@/lib/adminReveal'
import type { AdminTabId } from '@/lib/adminTabs'
import { adminCopy, adminLang, fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ADMIN_URL, revealValue } from './adminRequests'

/**
 * The parts every admin area shares (Phase 10): its copy, the page head
 * with the help link, loading and error states, filter chips, pages, and
 * the reveal of a masked value.
 */

/** The admin's copy and the language its dates and numbers follow. */
export function useAdminCopy(): { c: AdminCopy; lang: Lang } {
  const { lang } = useLang()
  return { c: adminCopy(lang), lang: adminLang(lang) }
}

/** Where each area is explained; the notes that used to stand above the tabs live there now (plan 6.6). */
export const ADMIN_GUIDE_URL = 'https://github.com/MSK-Scripts/msk-shop/blob/main/docs/admin-dashboard.md'

/** Head of an admin area: title, what the area is for, the help link and at most one primary action. */
export function AreaHeader({ area, description, action, badge }: {
  area: AdminTabId
  description?: ReactNode
  action?: ReactNode
  badge?: ReactNode
}) {
  const { c } = useAdminCopy()
  return (
    <PageHeader
      title={c.tabs[area]}
      badge={badge}
      action={action}
      description={(
        <div className="grid gap-1.5">
          {description}
          <a
            href={`${ADMIN_GUIDE_URL}#${area}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-fit items-center gap-2 text-[var(--color-primary)] hover:underline"
          >
            <BookOpen className="h-4 w-4" />
            {c.common.help}
          </a>
        </div>
      )}
    />
  )
}

/**
 * A resource that is still loading, failed or arrived. Loading is a skeleton
 * of the list, an error names itself and offers one retry, the data goes to
 * `children`.
 */
export function AreaLoad<T>({ data, error, retry, header, children }: {
  data: T | null
  error: string | null
  retry: () => void
  /** The area's head while there is no data to draw it with. */
  header?: ReactNode
  children: (data: T) => ReactNode
}) {
  const { c } = useAdminCopy()
  if (error && data === null) {
    return (
      <>
        {header}
        <EmptyState
          kind="error"
          title={c.common.load_failed_title}
          action={<Button variant="outline" onClick={retry}>{c.common.retry}</Button>}
        >
          {error}
        </EmptyState>
      </>
    )
  }
  if (data === null) {
    return (
      <>
        {header}
        <div className="grid gap-3" aria-busy="true">
          <span className="sr-only" role="status">{c.common.loading}</span>
          <Skeleton className="h-12 w-full max-w-[72rem]" />
          <Skeleton className="h-64 w-full max-w-[72rem]" />
        </div>
      </>
    )
  }
  return <>{children(data)}</>
}

export interface FlashMessage { tone: 'success' | 'danger' | 'warning'; text: string }

/** The result of the last action, read out politely and dismissable. */
export function useFlash() {
  const [flash, setFlash] = useState<FlashMessage | null>(null)
  const { c } = useAdminCopy()
  const node = flash ? (
    <Notice
      tone={flash.tone}
      role={flash.tone === 'danger' ? 'alert' : 'status'}
      title={flash.text}
      onDismiss={() => setFlash(null)}
      dismissLabel={c.common.dismiss}
    />
  ) : null
  return { flash: node, setFlash }
}

export interface ChipOption<T extends string> {
  value: T
  label: string
  count?: number
}

/** A row of native radio buttons that look like chips (Phase 9 pattern): one choice, arrow keys move it. */
export function FilterChips<T extends string>({ name, legend, options, value, onChange, lang }: {
  name: string
  legend: string
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  lang: Lang
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-small font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <label
            key={o.value}
            className={cn(
              'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border-[1.5px] px-3.5 font-semibold transition-colors duration-150',
              'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-ring)] has-[:focus-visible]:outline-solid',
              value === o.value
                ? 'border-[var(--color-primary)] bg-[var(--color-accent-soft)] text-[var(--color-primary)]'
                : 'border-[var(--color-input)] text-[var(--color-foreground)] hover:border-[var(--color-foreground)]',
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
            {o.count !== undefined && (
              <span className="tabular-nums text-[var(--color-muted-foreground)]">{new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US').format(o.count)}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export const PAGE_SIZE = 25

/** The rows of one page, and how many pages there are. */
export function pageOf<T>(rows: readonly T[], page: number, size = PAGE_SIZE): { rows: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(Math.max(1, page), pages)
  return { rows: rows.slice((current - 1) * size, current * size), page: current, pages }
}

/** Previous and next below a table; nothing when everything fits on one page. */
export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  const { c } = useAdminCopy()
  if (pages <= 1) return null
  return (
    <nav aria-label={c.common.pagination} className="flex flex-wrap items-center gap-3">
      <Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <CaretLeft className="h-4 w-4" />
        {c.common.previous}
      </Button>
      <span className="tabular-nums text-[var(--color-muted-foreground)]" aria-live="polite">
        {fillCopy(c.common.page_of, { page, pages })}
      </span>
      <Button variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {c.common.next}
        <CaretRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}

const FIELD_NAME: Record<RevealField, 'field_email' | 'field_ip' | 'field_api_key'> = {
  email: 'field_email', ip: 'field_ip', apiKey: 'field_api_key',
}

/**
 * A masked value with a Reveal button (plan 7). The full value comes from
 * `/api/admin/reveal`, which records the reveal in the audit log, and lives
 * in this component's state only: hiding it, leaving the page or reloading
 * the list forgets it. Nothing stores or logs it.
 *
 * The button is 36 px inside a dense table and 44 px elsewhere.
 */
export function RevealValue({ kind, id, field, masked, record, className, onRevealed, size = 'sm' }: {
  kind: RevealKind
  id: string
  field: RevealField
  /** What the list sent: the masked form. */
  masked: string | null | undefined
  /** Names the record for a screen reader: "payment 51240". */
  record: string
  className?: string
  /** For a value that is also copied, the API key. */
  onRevealed?: (value: string | null) => void
  /** `sm` (36 px) inside a dense table, `md` (44 px) everywhere else. */
  size?: 'sm' | 'md'
}) {
  const { c } = useAdminCopy()
  const [value, setValue] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!masked) return <span className="text-[var(--color-muted-foreground)]">{c.common.none}</span>

  const label = { field: c.common[FIELD_NAME[field]], record }

  async function reveal() {
    if (busy) return
    setBusy(true)
    setFailed(false)
    try {
      const full = await revealValue(kind, id, field, c.common.reveal_failed)
      setValue(full)
      onRevealed?.(full)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  function hide() {
    setValue(null)
    onRevealed?.(null)
  }

  return (
    <span className={cn('inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1', className)}>
      <span className={cn('min-w-0 break-all font-mono text-small', value === null && 'text-[var(--color-muted-foreground)]')}>
        {value ?? masked}
      </span>
      {value === null ? (
        // Not disabled while it loads: a disabled button drops the focus,
        // and the same button turns into Hide once the value is there.
        <Button variant="ghost" size={size} onClick={reveal} aria-busy={busy || undefined} aria-label={fillCopy(c.common.reveal_label, label)}>
          {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          {c.common.reveal}
        </Button>
      ) : (
        <Button variant="ghost" size={size} onClick={hide} aria-label={fillCopy(c.common.hide_label, label)}>
          <EyeSlash className="h-4 w-4" />
          {c.common.hide_value}
        </Button>
      )}
      {failed && <span role="alert" className="w-full text-small text-[var(--color-danger)]">{c.common.reveal_failed}</span>}
    </span>
  )
}

/** A muted "None" for an empty cell, a word a screen reader can say. */
export function NoneText() {
  const { c } = useAdminCopy()
  return <span className="text-[var(--color-muted-foreground)]">{c.common.none}</span>
}

export interface CatalogItem { id: number; name: string }
export interface Catalog { packages: CatalogItem[]; categories: CatalogItem[] }

/**
 * Packages and categories for the pickers in "Give package" and "Create
 * coupon". One request for both lists; a failure leaves the pickers empty
 * and the route's own validation still answers.
 */
export function useCatalog(): Catalog | null {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  useEffect(() => {
    let alive = true
    fetch(ADMIN_URL.catalog)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d) setCatalog({ packages: d.packages ?? [], categories: d.categories ?? [] }) })
      .catch(() => { /* pickers stay empty */ })
    return () => { alive = false }
  }, [])
  return catalog
}

/**
 * An action that asks first (plan 6.3): `trigger` gets the function that
 * opens the confirmation, and only the confirmation runs the request. One
 * per row, so the dialog knows its record from props and not from a
 * selection somebody else could change in between.
 */
export function ConfirmAction({ trigger, run, title, description, confirmLabel, failMessage, typeToConfirm }: {
  trigger: (open: () => void) => ReactNode
  /** The request. Throwing keeps the dialog open with the message. */
  run: () => Promise<void>
  title: ReactNode
  description: ReactNode
  confirmLabel: string
  failMessage: string
  typeToConfirm?: { expected: string; label: ReactNode }
}) {
  const { c } = useAdminCopy()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await run()
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : failMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {trigger(() => { setError(null); setOpen(true) })}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => void confirm()}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={c.common.cancel}
        busy={busy}
        error={error}
        typeToConfirm={typeToConfirm}
      />
    </>
  )
}
