'use client'

import { useMemo, useState, type FormEvent } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { Notice } from '@/components/dashboard/Notice'
import { RowMenu } from '@/components/dashboard/RowMenu'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatusBadge, type StatusTone } from '@/components/dashboard/StatusBadge'
import { CircleNotch, Plus, Trash } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RadioCard } from '@/components/ui/RadioCard'
import { formatDate, formatMoney, formatNumber, formatPercent, isoDate } from '@/lib/format'
import { fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL, createCoupon, deleteCoupon } from './adminRequests'
import { AreaHeader, AreaLoad, ConfirmAction, FilterChips, NoneText, Pager, pageOf, useAdminCopy, useCatalog, useFlash } from './adminUi'

type CouponState = 'active' | 'scheduled' | 'expired' | 'used_up'

export interface Coupon {
  id: number
  code: string
  discount: { type: string; percentage: number; value: number }
  effective: { type?: string }
  expiresAt: string | null
  redeemsLeft: number | null
  username: string | null
  note: string | null
  state: CouponState
}

export interface CouponPayload {
  coupons: Coupon[]
  counts: Record<CouponState, number> & { total: number }
  truncated: boolean
}

const STATE_TONE: Record<CouponState, StatusTone> = { active: 'success', scheduled: 'info', expired: 'neutral', used_up: 'neutral' }

function couponColumns(c: AdminCopy, lang: Lang, onDeleted: (coupon: Coupon) => Promise<void>): DataColumn<Coupon>[] {
  return [
    { id: 'code', header: c.coupons.col_code, nowrap: true, sortValue: x => x.code, cell: x => <span className="font-mono font-semibold">{x.code}</span> },
    {
      id: 'discount', header: c.coupons.col_discount, numeric: true, nowrap: true,
      sortValue: x => (x.discount?.type === 'percentage' ? x.discount.percentage : x.discount?.value),
      cell: x => (x.discount?.type === 'percentage' ? formatPercent(x.discount.percentage, lang) : formatMoney(Number(x.discount?.value ?? 0), null, lang)),
    },
    {
      id: 'applies', header: c.coupons.col_applies, nowrap: true,
      cell: x => c.coupons.applies[(x.effective?.type ?? 'cart') as keyof typeof c.coupons.applies] ?? x.effective?.type ?? <NoneText />,
    },
    {
      id: 'expires', header: c.coupons.col_expires, nowrap: true, sortValue: x => (x.expiresAt ? Date.parse(x.expiresAt) : null),
      cell: x => (x.expiresAt ? <time dateTime={isoDate(x.expiresAt)}>{formatDate(x.expiresAt, lang) ?? x.expiresAt}</time> : c.coupons.never),
    },
    {
      id: 'left', header: c.coupons.col_left, numeric: true, nowrap: true, sortValue: x => x.redeemsLeft,
      cell: x => (x.redeemsLeft === null ? c.coupons.unlimited : formatNumber(x.redeemsLeft, lang)),
    },
    { id: 'status', header: c.coupons.col_status, nowrap: true, cell: x => <StatusBadge tone={STATE_TONE[x.state]}>{c.coupons.states[x.state]}</StatusBadge> },
    { id: 'note', header: c.coupons.col_note, className: 'min-w-[12rem]', cell: x => x.note || x.username || <NoneText /> },
    {
      id: 'actions', header: <span className="sr-only">{c.common.actions}</span>, nowrap: true,
      cell: x => (
        <ConfirmAction
          title={fillCopy(c.coupons.delete_title, { code: x.code })}
          description={c.coupons.delete_body}
          confirmLabel={c.coupons.delete_confirm}
          failMessage={c.coupons.delete_failed}
          run={async () => { await deleteCoupon(x.id, c.coupons.delete_failed); await onDeleted(x) }}
          trigger={open => (
            <RowMenu
              label={fillCopy(c.common.more_actions, { name: x.code })}
              items={[{ id: 'delete', label: c.coupons.delete, icon: Trash, danger: true, onSelect: open }]}
            />
          )}
        />
      ),
    },
  ]
}

export function CouponsView({ payload, reload }: { payload: CouponPayload; reload: () => Promise<void> }) {
  const { c, lang } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [filter, setFilter] = useState<'usable' | 'all'>('usable')
  const [page, setPage] = useState(1)
  const columns = useMemo(() => couponColumns(c, lang, async x => {
    setFlash({ tone: 'success', text: fillCopy(c.coupons.delete_done, { code: x.code }) })
    await reload()
  }), [c, lang, setFlash, reload])
  const rows = filter === 'usable' ? payload.coupons.filter(x => x.state === 'active') : payload.coupons
  const shown = pageOf(rows, page)

  const empty = payload.coupons.length === 0
    ? <EmptyState kind="first-use" title={c.coupons.empty_title}>{c.coupons.empty_body}</EmptyState>
    : (
      <EmptyState kind="no-results" title={c.coupons.none_title} action={<Button variant="outline" onClick={() => setFilter('all')}>{c.common.show_all}</Button>}>
        {c.coupons.none_body}
      </EmptyState>
    )

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {flash}
      <CreateCouponForm onCreated={async code => { setFlash({ tone: 'success', text: fillCopy(c.coupons.done, { code }) }); await reload() }} />
      {payload.truncated && <Notice tone="warning" title={c.coupons.truncated} />}
      <FilterChips
        name="coupon-filter"
        legend={c.coupons.filter_label}
        lang={lang}
        value={filter}
        onChange={f => { setFilter(f); setPage(1) }}
        options={[
          { value: 'usable', label: c.coupons.filter_usable, count: payload.counts.active },
          { value: 'all', label: c.coupons.filter_all, count: payload.counts.total },
        ]}
      />
      <DataTable
        caption={c.coupons.caption}
        captionHidden
        columns={columns}
        rows={shown.rows}
        rowKey={x => String(x.id)}
        empty={empty}
        footer={<Pager page={shown.page} pages={shown.pages} onPage={setPage} />}
      />
    </div>
  )
}

interface CouponErrors { code?: string; amount?: string; ids?: string }

function CreateCouponForm({ onCreated }: { onCreated: (code: string) => Promise<void> }) {
  const { c } = useAdminCopy()
  const catalog = useCatalog()
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'value'>('percentage')
  const [amount, setAmount] = useState('')
  const [effectiveOn, setEffectiveOn] = useState<'cart' | 'package' | 'category'>('cart')
  const [ids, setIds] = useState<string[]>([])
  const [errors, setErrors] = useState<CouponErrors>({})
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const options = (effectiveOn === 'package' ? catalog?.packages : catalog?.categories) ?? []

  function toggle(id: string) {
    setIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount.replace(',', '.'))
    const next: CouponErrors = {}
    if (!code.trim()) next.code = c.coupons.err_code
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) next.amount = c.coupons.err_amount
    if (effectiveOn !== 'cart' && ids.length === 0) next.ids = c.coupons.err_ids
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setBusy(true)
    setFailure(null)
    try {
      await createCoupon({ code, discountType, amount: value, effectiveOn, ids: effectiveOn === 'cart' ? [] : ids }, c.coupons.failed)
      const created = code.trim()
      setCode(''); setAmount(''); setIds([]); setEffectiveOn('cart')
      await onCreated(created)
    } catch (err) {
      setFailure(err instanceof Error ? err.message : c.coupons.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard title={c.coupons.create_title} description={c.coupons.create_desc} className="max-w-[72rem]">
      <form onSubmit={submit} noValidate className="grid gap-5">
        <FormField label={c.coupons.f_code} hint={c.coupons.f_code_hint} error={errors.code} required>
          {field => <Input {...field} value={code} onChange={e => setCode(e.target.value)} autoComplete="off" spellCheck={false} className="max-w-[20rem] font-mono" />}
        </FormField>
        <div className="grid gap-5 @2xl:grid-cols-2">
          <fieldset className="grid content-start gap-2">
            <legend className="mb-1.5 font-semibold">{c.coupons.f_type}</legend>
            {(['percentage', 'value'] as const).map(t => (
              <RadioCard key={t} name="coupon-type" value={t} checked={discountType === t} onChange={() => setDiscountType(t)}>
                <span className="font-semibold">{t === 'percentage' ? c.coupons.type_percentage : c.coupons.type_value}</span>
              </RadioCard>
            ))}
          </fieldset>
          <FormField
            label={c.coupons.f_amount}
            hint={discountType === 'percentage' ? c.coupons.f_amount_pct : c.coupons.f_amount_val}
            error={errors.amount}
            required
          >
            {field => <Input {...field} value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" className="max-w-[10rem]" />}
          </FormField>
        </div>
        <div className="grid gap-4">
          <fieldset className="grid gap-2 @xl:grid-cols-3">
            <legend className="mb-1.5 font-semibold">{c.coupons.f_applies}</legend>
            {(['cart', 'package', 'category'] as const).map(t => (
              <RadioCard key={t} name="coupon-applies" value={t} checked={effectiveOn === t} onChange={() => { setEffectiveOn(t); setIds([]) }}>
                <span className="font-semibold">{c.coupons.applies[t]}</span>
              </RadioCard>
            ))}
          </fieldset>
          {effectiveOn !== 'cart' && (
            <fieldset aria-describedby="coupon-ids-hint" className="grid gap-2">
              <legend className="font-semibold">{effectiveOn === 'package' ? c.coupons.f_packages : c.coupons.f_categories}</legend>
              <p id="coupon-ids-hint" className={errors.ids ? 'text-small font-semibold text-[var(--color-danger)]' : 'text-small text-[var(--color-muted-foreground)]'}>
                {errors.ids ?? c.coupons.f_pick_hint}
              </p>
              <div className="grid max-h-72 gap-1 overflow-y-auto rounded-md border border-[var(--color-border)] p-2 sm:grid-cols-2">
                {options.map(o => (
                  <label key={o.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2 hover:bg-[var(--color-muted)]">
                    <input type="checkbox" checked={ids.includes(String(o.id))} onChange={() => toggle(String(o.id))} className="h-5 w-5 accent-[var(--color-primary)]" />
                    <span className="min-w-0">{o.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
        {failure && <p role="alert" className="font-semibold text-[var(--color-danger)]">{failure}</p>}
        <div>
          <Button type="submit" disabled={busy} aria-busy={busy || undefined}>
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {c.coupons.submit}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

export default function CouponsArea() {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<CouponPayload>(ADMIN_URL.coupons, 'result', c.coupons.load_failed)
  return (
    <>
      <AreaHeader area="coupons" description={c.coupons.lead} />
      <AreaLoad data={data} error={error} retry={reload}>
        {payload => <CouponsView payload={payload} reload={reload} />}
      </AreaLoad>
    </>
  )
}
