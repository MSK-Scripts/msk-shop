'use client'

import { useMemo, useState, type FormEvent } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { RowMenu } from '@/components/dashboard/RowMenu'
import { CircleNotch, EyeSlash, FloppyDisk, PencilSimple } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import type { PackageVariant } from '@/lib/config'
import { formatMoney } from '@/lib/format'
import { fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL, updatePackage } from './adminRequests'
import { AreaHeader, AreaLoad, ConfirmAction, NoneText, useAdminCopy, useFlash } from './adminUi'

/** A package as `/api/admin/packages` sends it, with the product it is sold under. */
export interface AdminPackage {
  id: number
  name: string
  price: number
  currency: string
  product: string
  productSlug: string
  variant: PackageVariant | null
}

export interface ProductRow {
  slug: string
  name: string
  encrypted?: AdminPackage
  source?: AdminPackage
  /** A package that is neither Encrypted nor Source: the subscription, a bundle. */
  single?: AdminPackage
}

/** Encrypted and Source of one script in one row, in the order the catalog has them. */
export function productRows(packages: readonly AdminPackage[]): ProductRow[] {
  const rows = new Map<string, ProductRow>()
  for (const p of packages) {
    const row = rows.get(p.productSlug) ?? { slug: p.productSlug, name: p.product }
    row[p.variant ?? 'single'] = p
    rows.set(p.productSlug, row)
  }
  return [...rows.values()]
}

type Slot = 'encrypted' | 'source' | 'single'

function packageColumns(c: AdminCopy, lang: Lang, withSingle: boolean, onEdit: (p: AdminPackage) => void, onHidden: (p: AdminPackage) => Promise<void>): DataColumn<ProductRow>[] {
  const cell = (row: ProductRow, slot: Slot) => {
    const p = row[slot]
    if (!p) return <NoneText />
    const variant = c.packages.variants[slot]
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="font-semibold tabular-nums">{formatMoney(p.price, p.currency, lang)}</span>
        <ConfirmAction
          title={fillCopy(c.packages.hide_title, { name: p.name })}
          description={c.packages.hide_body}
          confirmLabel={c.packages.hide_confirm}
          failMessage={c.packages.hide_failed}
          run={async () => { await updatePackage(p.id, { disabled: true }, c.packages.hide_failed); await onHidden(p) }}
          trigger={open => (
            <RowMenu
              label={fillCopy(c.common.more_actions, { name: `${row.name} ${variant}` })}
              items={[
                { id: 'edit', label: fillCopy(c.packages.edit, { variant }), icon: PencilSimple, onSelect: () => onEdit(p) },
                { id: 'hide', label: fillCopy(c.packages.hide, { variant }), icon: EyeSlash, danger: true, onSelect: open },
              ]}
            />
          )}
        />
      </div>
    )
  }
  const columns: DataColumn<ProductRow>[] = [
    { id: 'product', header: c.packages.col_product, sortValue: r => r.name, className: 'min-w-[14rem]', cell: r => <span className="font-semibold">{r.name}</span> },
    { id: 'encrypted', header: c.packages.variants.encrypted, numeric: true, nowrap: true, sortValue: r => r.encrypted?.price ?? null, cell: r => cell(r, 'encrypted') },
    { id: 'source', header: c.packages.variants.source, numeric: true, nowrap: true, sortValue: r => r.source?.price ?? null, cell: r => cell(r, 'source') },
  ]
  if (withSingle) {
    columns.push({ id: 'single', header: c.packages.variants.single, numeric: true, nowrap: true, sortValue: r => r.single?.price ?? null, cell: r => cell(r, 'single') })
  }
  return columns
}

export function PackagesView({ packages, reload }: { packages: AdminPackage[]; reload: () => Promise<void> }) {
  const { c, lang } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [editing, setEditing] = useState<AdminPackage | null>(null)

  const rows = useMemo(() => productRows(packages), [packages])
  const withSingle = rows.some(r => r.single)
  const columns = useMemo(() => packageColumns(c, lang, withSingle, setEditing, async p => {
    setFlash({ tone: 'success', text: fillCopy(c.packages.hide_done, { name: p.name }) })
    await reload()
  }), [c, lang, withSingle, setFlash, reload])

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {flash}
      <DataTable
        caption={c.packages.caption}
        captionHidden
        columns={columns}
        rows={rows}
        rowKey={r => r.slug}
        empty={<EmptyState kind="first-use" title={c.packages.empty_title}>{c.packages.empty_body}</EmptyState>}
        className="max-w-[72rem]"
      />
      {editing && (
        <EditPackageDialog
          pkg={editing}
          onClose={() => setEditing(null)}
          onDone={async text => { setFlash({ tone: 'success', text }); setEditing(null); await reload() }}
        />
      )}
    </div>
  )
}

/**
 * Name and price of one package. Only what changed is sent: the Plugin API
 * stores the price as an integer, and a name-only edit must not rewrite it.
 */
function EditPackageDialog({ pkg, onClose, onDone }: { pkg: AdminPackage; onClose: () => void; onDone: (message: string) => Promise<void> }) {
  const { c } = useAdminCopy()
  const [name, setName] = useState(pkg.name)
  const [price, setPrice] = useState(String(pkg.price))
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(price.replace(',', '.'))
    const next: { name?: string; price?: string } = {}
    if (!name.trim()) next.name = c.packages.err_name
    if (!price.trim() || !Number.isFinite(value) || value < 0) next.price = c.packages.err_price
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const fields: { name?: string; price?: number } = {}
    if (name.trim() !== pkg.name) fields.name = name.trim()
    if (value !== pkg.price) fields.price = value
    if (Object.keys(fields).length === 0) { await onDone(c.packages.unchanged); return }
    setBusy(true)
    setFailure(null)
    try {
      await updatePackage(pkg.id, fields, c.packages.edit_failed)
      await onDone(fillCopy(c.packages.edit_done, { name: fields.name ?? pkg.name }))
    } catch (err) {
      setFailure(err instanceof Error ? err.message : c.packages.edit_failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onClose={() => { if (!busy) onClose() }}
      title={fillCopy(c.packages.edit_title, { name: pkg.name })}
      description={c.packages.edit_desc}
      className="w-[min(100%_-_2rem,34rem)]"
      body={(
        <form id="edit-package" onSubmit={submit} noValidate className="grid gap-4">
          <FormField label={c.packages.f_name} error={errors.name} required>
            {field => <Input {...field} value={name} onChange={e => setName(e.target.value)} />}
          </FormField>
          <FormField label={fillCopy(c.packages.f_price, { currency: pkg.currency })} hint={c.packages.f_price_hint} error={errors.price} required>
            {field => <Input {...field} value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" className="max-w-[10rem]" />}
          </FormField>
          {failure && <p role="alert" className="font-semibold text-[var(--color-danger)]">{failure}</p>}
        </form>
      )}
    >
      <Button variant="outline" onClick={onClose} disabled={busy}>{c.common.cancel}</Button>
      <Button type="submit" form="edit-package" disabled={busy} aria-busy={busy || undefined}>
        {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
        {c.packages.edit_submit}
      </Button>
    </Dialog>
  )
}

export default function PackagesArea() {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<AdminPackage[]>(ADMIN_URL.packages, 'packages', c.packages.load_failed)
  return (
    <>
      <AreaHeader area="packages" description={c.packages.lead} />
      <AreaLoad data={data} error={error} retry={reload}>
        {packages => <PackagesView packages={packages} reload={reload} />}
      </AreaLoad>
    </>
  )
}
