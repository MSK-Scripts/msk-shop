'use client'

import { useState, type FormEvent } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatGrid, StatTile } from '@/components/dashboard/StatTile'
import { CircleNotch, MagnifyingGlass } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate, formatMoney, formatNumber } from '@/lib/format'
import { fillCopy } from '@/lib/i18n'
import { lookupPlayer } from './adminRequests'
import { AreaHeader, NoneText, useAdminCopy } from './adminUi'
import { PaymentStatus } from './PaymentsArea'

interface LookupPayment {
  txn_id: string
  time?: number
  price: string | number
  currency: string
  status: string
}

/** What `/api/admin/lookup` passes on from Tebex, any address in it masked. */
export interface LookupResult {
  player: { id: string; username: string } | null
  banCount: number
  chargebackRate: number
  payments: LookupPayment[]
}

/** The player Tebex found, with bans, chargeback rate and payments. */
export function LookupResultView({ result }: { result: LookupResult }) {
  const { c, lang } = useAdminCopy()
  const name = result.player?.username ?? c.common.none
  const columns: DataColumn<LookupPayment>[] = [
    { id: 'txn', header: c.lookup.col_txn, nowrap: true, cell: p => <span className="font-mono">{p.txn_id}</span> },
    {
      id: 'date', header: c.lookup.col_date, nowrap: true, sortValue: p => p.time ?? null,
      cell: p => (p.time ? formatDate(p.time * 1000, lang) : null) ?? <NoneText />,
    },
    {
      id: 'price', header: c.lookup.col_price, numeric: true, nowrap: true, sortValue: p => Number(p.price),
      cell: p => formatMoney(Number(p.price), p.currency, lang),
    },
    { id: 'status', header: c.lookup.col_status, nowrap: true, cell: p => <PaymentStatus payment={{ amount: Number(p.price), status: p.status }} c={c} /> },
  ]
  return (
    <SectionCard
      title={name}
      description={result.player?.id ? fillCopy(c.lookup.tebex_id, { id: result.player.id }) : undefined}
      className="max-w-[72rem]"
    >
      <div className="grid gap-5">
        <StatGrid>
          <StatTile label={c.lookup.bans} value={formatNumber(Number(result.banCount ?? 0), lang)} />
          {/* As Tebex reports it; the API does not document whether this is a share or a percentage. */}
          <StatTile label={c.lookup.chargeback_rate} value={formatNumber(Number(result.chargebackRate ?? 0), lang)} />
          <StatTile label={c.lookup.purchases} value={formatNumber(result.payments?.length ?? 0, lang)} />
        </StatGrid>
        <DataTable
          caption={fillCopy(c.lookup.caption, { name })}
          columns={columns}
          rows={result.payments ?? []}
          rowKey={p => p.txn_id}
          empty={<EmptyState kind="first-use" title={c.lookup.empty_title}>{c.lookup.empty_body}</EmptyState>}
        />
      </div>
    </SectionCard>
  )
}

export default function LookupArea() {
  const { c } = useAdminCopy()
  const [user, setUser] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [result, setResult] = useState<LookupResult | null>(null)
  const [busy, setBusy] = useState(false)

  async function search(e: FormEvent) {
    e.preventDefault()
    if (!user.trim()) { setFieldError(c.lookup.err_user); return }
    setFieldError(null)
    setFailure(null)
    setBusy(true)
    try {
      setResult(await lookupPlayer<LookupResult>(user, c.lookup.failed))
    } catch (err) {
      setResult(null)
      setFailure(err instanceof Error ? err.message : c.lookup.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AreaHeader area="lookup" description={c.lookup.lead} />
      <div className="grid gap-[var(--app-gutter-y)]">
        <form onSubmit={search} noValidate role="search" className="flex max-w-[40rem] flex-wrap items-end gap-3">
          <FormField label={c.lookup.f_user} hint={c.lookup.f_user_hint} error={fieldError ?? failure} className="min-w-0 flex-1 basis-64">
            {field => <Input {...field} value={user} onChange={e => setUser(e.target.value)} autoComplete="off" spellCheck={false} />}
          </FormField>
          <Button type="submit" disabled={busy} aria-busy={busy || undefined}>
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <MagnifyingGlass className="h-4 w-4" />}
            {c.lookup.submit}
          </Button>
        </form>
        {result
          ? <LookupResultView result={result} />
          : <EmptyState kind="first-use" title={c.lookup.start_title}>{c.lookup.start_body}</EmptyState>}
      </div>
    </>
  )
}
