'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatusBadge, type StatusTone } from '@/components/dashboard/StatusBadge'
import {
  ArrowCounterClockwise, ArrowLeft, CheckCircle, CircleNotch, Gift, Minus, Warning, type IconComponent,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DAY_MS, paymentKind, type PaymentKind } from '@/lib/adminPayments'
import { formatDateTime, formatMoney, formatNumber, isoDate } from '@/lib/format'
import { fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL, givePackage, refundPayment } from './adminRequests'
import { AreaHeader, AreaLoad, FilterChips, NoneText, Pager, RevealValue, pageOf, useAdminCopy, useCatalog, useFlash } from './adminUi'

/** A payment as `/api/admin/payments` sends it: the email masked. */
export interface Payment {
  id: number | string
  amount: number
  date: string
  currency: { symbol: string; iso_4217: string } | null
  gateway?: { id: string; name: string } | null
  status: string
  email: string
  player: { name: string } | null
  packages: { id?: number; name: string }[]
  creator_code?: string | null
}

const STATUS: Record<PaymentKind, { tone: StatusTone; icon: IconComponent }> = {
  paid:       { tone: 'success', icon: CheckCircle },
  free:       { tone: 'info',    icon: Gift },
  refunded:   { tone: 'neutral', icon: ArrowCounterClockwise },
  chargeback: { tone: 'danger',  icon: Warning },
  other:      { tone: 'neutral', icon: Minus },
}

export function PaymentStatus({ payment, c }: { payment: Pick<Payment, 'amount' | 'status'>; c: AdminCopy }) {
  const kind = paymentKind(payment)
  const s = STATUS[kind]
  return <StatusBadge tone={s.tone} icon={s.icon}>{kind === 'other' ? String(payment.status) : c.payments.status[kind]}</StatusBadge>
}

type KindFilter = 'all' | Exclude<PaymentKind, 'other'>
type Period = '7' | '30' | '90' | 'all'

const money = (p: Pick<Payment, 'amount' | 'currency'>, lang: Lang) => formatMoney(Number(p.amount), p.currency?.iso_4217, lang)

export function paymentColumns(c: AdminCopy, lang: Lang, onDetails: (p: Payment) => void): DataColumn<Payment>[] {
  return [
    {
      id: 'date', header: c.payments.col_date, nowrap: true,
      sortValue: p => Date.parse(p.date) || null,
      cell: p => <time dateTime={isoDate(p.date)} className="tabular-nums">{formatDateTime(p.date, lang) ?? p.date}</time>,
    },
    {
      // The id opens the detail, the one place a payment can be refunded.
      id: 'txn', header: c.payments.col_txn, nowrap: true, sortValue: p => String(p.id),
      cell: p => (
        <Button variant="link" className="min-h-9 px-0 font-mono" onClick={() => onDetails(p)} aria-label={fillCopy(c.payments.details_of, { id: p.id })}>
          {p.id}
        </Button>
      ),
    },
    { id: 'player', header: c.payments.col_player, sortValue: p => p.player?.name ?? null, cell: p => p.player?.name ?? <NoneText /> },
    {
      id: 'packages', header: c.payments.col_packages, className: 'min-w-[10rem]',
      cell: p => (p.packages ?? []).map(pkg => pkg.name).join(', ') || <NoneText />,
    },
    { id: 'amount', header: c.payments.col_amount, numeric: true, nowrap: true, sortValue: p => Number(p.amount), cell: p => money(p, lang) },
    { id: 'status', header: c.payments.col_status, nowrap: true, sortValue: p => paymentKind(p), cell: p => <PaymentStatus payment={p} c={c} /> },
    {
      id: 'email', header: c.payments.col_email,
      cell: p => <RevealValue kind="payment" id={String(p.id)} field="email" masked={p.email} record={`${c.payments.col_txn} ${p.id}`} />,
    },
  ]
}

/** The payments of the latest list, filtered by kind and period (plan 6.6). */
export function filterPayments(payments: readonly Payment[], kind: KindFilter, period: Period, now: number): Payment[] {
  const from = period === 'all' ? -Infinity : now - Number(period) * DAY_MS
  return payments.filter(p => (kind === 'all' || paymentKind(p) === kind) && (period === 'all' || (Date.parse(p.date) || 0) >= from))
}

export function PaymentsView({ payments, now, canCreate, canRefund, reload }: {
  payments: Payment[]
  now: number
  canCreate: boolean
  canRefund: boolean
  reload: () => Promise<void>
}) {
  const { c, lang } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [kind, setKind] = useState<KindFilter>('all')
  const [period, setPeriod] = useState<Period>('all')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)
  const [giving, setGiving] = useState(false)

  const columns = useMemo(() => paymentColumns(c, lang, p => setOpenId(String(p.id))), [c, lang])
  const inPeriod = useMemo(() => filterPayments(payments, 'all', period, now), [payments, period, now])
  const rows = useMemo(() => filterPayments(payments, kind, period, now), [payments, kind, period, now])
  const shown = pageOf(rows, page)
  const open = openId === null ? null : payments.find(p => String(p.id) === openId) ?? null

  const paid = rows.filter(p => paymentKind(p) === 'paid')
  const currency = paid[0]?.currency?.iso_4217 ?? payments[0]?.currency?.iso_4217
  const total = paid.filter(p => p.currency?.iso_4217 === currency).reduce((sum, p) => sum + Number(p.amount), 0)

  const giveButton = canCreate ? (
    <Button onClick={() => setGiving(true)}><Gift className="h-4 w-4" />{c.payments.give}</Button>
  ) : undefined

  if (open) {
    return (
      <>
        <AreaHeader area="payments" description={fillCopy(c.payments.detail_title, { id: open.id })} />
        <PaymentDetail payment={open} canRefund={canRefund} onBack={() => setOpenId(null)} reload={reload} setFlash={setFlash} />
        {flash}
      </>
    )
  }

  const count = (k: KindFilter) => filterPayments(inPeriod, k, 'all', now).length
  const empty = payments.length === 0
    ? <EmptyState kind="first-use" title={c.payments.empty_title}>{c.payments.empty_body}</EmptyState>
    : (
      <EmptyState
        kind="no-results"
        title={c.payments.none_title}
        action={<Button variant="outline" onClick={() => { setKind('all'); setPeriod('all'); setPage(1) }}>{c.common.show_all}</Button>}
      >
        {c.payments.none_body}
      </EmptyState>
    )

  return (
    <>
      <AreaHeader area="payments" description={c.payments.lead} action={giveButton} />
      <div className="grid gap-[var(--app-gutter-y)]">
        {flash}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <FilterChips
            name="payment-kind"
            legend={c.payments.filter_label}
            lang={lang}
            value={kind}
            onChange={k => { setKind(k); setPage(1) }}
            options={(['all', 'paid', 'free', 'refunded', 'chargeback'] as KindFilter[]).map(k => ({ value: k, label: c.payments.kinds[k], count: count(k) }))}
          />
          <FormField label={c.payments.period_label} className="w-full max-w-[14rem]">
            {field => (
              <Select {...field} value={period} onChange={e => { setPeriod(e.target.value as Period); setPage(1) }}>
                {(['7', '30', '90', 'all'] as Period[]).map(p => <option key={p} value={p}>{c.payments.periods[p]}</option>)}
              </Select>
            )}
          </FormField>
        </div>
        <p aria-live="polite" className="font-semibold">
          {fillCopy(c.payments.summary, { count: formatNumber(rows.length, lang), total: formatMoney(total, currency, lang) })}
        </p>
        <DataTable
          caption={c.payments.caption}
          captionHidden
          columns={columns}
          rows={shown.rows}
          rowKey={p => String(p.id)}
          empty={empty}
          footer={<Pager page={shown.page} pages={shown.pages} onPage={setPage} />}
        />
      </div>
      {giving && (
        <GivePackageDialog
          onClose={() => setGiving(false)}
          onDone={async name => {
            setGiving(false)
            setFlash({ tone: 'success', text: fillCopy(c.payments.give_done, { name }) })
            await reload()
          }}
        />
      )}
    </>
  )
}

/** One payment with its facts and, for a paid one, the refund behind a check (plan 6.6). */
export function PaymentDetail({ payment, canRefund, onBack, reload, setFlash }: {
  payment: Payment
  canRefund: boolean
  onBack: () => void
  reload: () => Promise<void>
  setFlash: (f: { tone: 'success' | 'danger'; text: string } | null) => void
}) {
  const { c, lang } = useAdminCopy()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const amount = money(payment, lang)
  const refundable = paymentKind(payment) === 'paid'
  const player = payment.player?.name ?? c.common.none

  async function refund() {
    setBusy(true)
    setError(null)
    try {
      await refundPayment(String(payment.id), c.payments.refund_failed)
      setConfirming(false)
      setFlash({ tone: 'success', text: fillCopy(c.payments.refund_done, { id: payment.id }) })
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : c.payments.refund_failed)
    } finally {
      setBusy(false)
    }
  }

  const facts: Array<[string, ReactNode]> = [
    [c.payments.f_date, formatDateTime(payment.date, lang) ?? payment.date],
    [c.payments.f_player, player],
    [c.payments.f_amount, amount],
    [c.payments.f_status, <PaymentStatus key="s" payment={payment} c={c} />],
    [c.payments.f_email, <RevealValue key="e" kind="payment" id={String(payment.id)} field="email" masked={payment.email} record={`${c.payments.col_txn} ${payment.id}`} size="md" />],
    [c.payments.f_gateway, payment.gateway?.name ?? c.common.none],
    [c.payments.f_creator, payment.creator_code || c.common.none],
    [c.payments.f_packages, (payment.packages ?? []).map(p => p.name).join(', ') || c.common.none],
  ]

  return (
    <div className="grid max-w-[56rem] gap-[var(--app-gutter-y)]">
      <Button variant="ghost" className="w-fit" onClick={onBack}><ArrowLeft className="h-4 w-4" />{c.payments.back}</Button>
      <SectionCard title={fillCopy(c.payments.detail_title, { id: payment.id })}>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
          {facts.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-semibold text-[var(--color-muted-foreground)]">{label}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>
      <SectionCard title={c.payments.refund_section} description={c.payments.refund_desc}>
        {!canRefund ? <p>{c.payments.refund_no_right}</p>
          : !refundable ? <p>{c.payments.refund_only_paid}</p>
          : (
            <Button variant="outline" onClick={() => { setError(null); setConfirming(true) }}>
              <ArrowCounterClockwise className="h-4 w-4" />
              {fillCopy(c.payments.refund_button, { amount })}
            </Button>
          )}
      </SectionCard>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void refund()}
        title={fillCopy(c.payments.refund_title, { amount })}
        description={fillCopy(c.payments.refund_body, { amount, player })}
        confirmLabel={fillCopy(c.payments.refund_button, { amount })}
        cancelLabel={c.common.cancel}
        busy={busy}
        typeToConfirm={{ expected: String(payment.id), label: fillCopy(c.payments.refund_type, { id: payment.id }) }}
        error={error}
      />
    </div>
  )
}

interface GiveErrors { ign?: string; packageId?: string; price?: string }

/** The form of "Give package" in a dialog. The catalog loads when the dialog opens. */
function GivePackageDialog({ onClose, onDone }: { onClose: () => void; onDone: (name: string) => Promise<void> }) {
  const { c } = useAdminCopy()
  const catalog = useCatalog()
  const [ign, setIgn] = useState('')
  const [packageId, setPackageId] = useState('')
  const [price, setPrice] = useState('0')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<GiveErrors>({})
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const next: GiveErrors = {}
    const priceValue = Number(price.replace(',', '.'))
    if (!ign.trim()) next.ign = c.payments.err_ign
    if (!packageId) next.packageId = c.payments.err_package
    if (!price.trim() || !Number.isFinite(priceValue) || priceValue < 0) next.price = c.payments.err_price
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setBusy(true)
    setFailure(null)
    try {
      await givePackage({ ign, packageId: Number(packageId), price: priceValue, note }, c.payments.give_failed)
      await onDone(ign.trim())
    } catch (err) {
      setFailure(err instanceof Error ? err.message : c.payments.give_failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onClose={() => { if (!busy) onClose() }}
      title={c.payments.give_title}
      description={c.payments.give_desc}
      className="w-[min(100%_-_2rem,34rem)]"
      body={(
        <form id="give-package" onSubmit={submit} noValidate className="grid gap-4">
          <FormField label={c.payments.f_ign} hint={c.payments.f_ign_hint} error={errors.ign} required>
            {field => <Input {...field} value={ign} onChange={e => setIgn(e.target.value)} autoComplete="off" />}
          </FormField>
          <FormField label={c.payments.f_package} error={errors.packageId} required>
            {field => (
              <Select {...field} value={packageId} onChange={e => setPackageId(e.target.value)}>
                <option value="">{c.payments.f_package_choose}</option>
                {(catalog?.packages ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            )}
          </FormField>
          <FormField label={c.payments.f_price} hint={c.payments.f_price_hint} error={errors.price} required>
            {field => <Input {...field} value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" className="max-w-[10rem]" />}
          </FormField>
          <FormField label={c.payments.f_note} hint={c.payments.f_note_hint}>
            {field => <Input {...field} value={note} onChange={e => setNote(e.target.value)} />}
          </FormField>
          {failure && <p role="alert" className="font-semibold text-[var(--color-danger)]">{failure}</p>}
        </form>
      )}
    >
      <Button variant="outline" onClick={onClose} disabled={busy}>{c.common.cancel}</Button>
      <Button type="submit" form="give-package" disabled={busy} aria-busy={busy || undefined}>
        {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
        {c.payments.give_submit}
      </Button>
    </Dialog>
  )
}

export default function PaymentsArea({ canCreate, canRefund }: { canCreate: boolean; canRefund: boolean }) {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<Payment[]>(ADMIN_URL.payments, 'payments', c.payments.load_failed)
  // The moment the page opened is the end of every period filter; a filter
  // that moved with the clock would reshuffle the table while it is read.
  const [now] = useState(() => Date.now())
  return (
    <AreaLoad data={data} error={error} retry={reload} header={<AreaHeader area="payments" description={c.payments.lead} />}>
      {payments => <PaymentsView payments={payments} now={now} canCreate={canCreate} canRefund={canRefund} reload={reload} />}
    </AreaLoad>
  )
}
