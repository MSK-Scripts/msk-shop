'use client'

import { useMemo, useState, type FormEvent } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { RowMenu } from '@/components/dashboard/RowMenu'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { CircleNotch, Plus, Prohibit } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { formatMoney } from '@/lib/format'
import { fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL, createGiftCard, topUpGiftCard, voidGiftCard } from './adminRequests'
import { AreaHeader, AreaLoad, ConfirmAction, NoneText, Pager, pageOf, useAdminCopy, useFlash } from './adminUi'

export interface GiftCard {
  id: number
  code: string
  balance: { starting: string; remaining: string; currency: string }
  note: string | null
  void: boolean
}

function giftCardColumns(c: AdminCopy, lang: Lang, onTopUp: (g: GiftCard) => void, onVoided: (g: GiftCard) => Promise<void>): DataColumn<GiftCard>[] {
  return [
    { id: 'code', header: c.giftcards.col_code, nowrap: true, sortValue: g => g.code, cell: g => <span className="font-mono font-semibold">{g.code}</span> },
    {
      id: 'balance', header: c.giftcards.col_balance, numeric: true, nowrap: true, sortValue: g => Number(g.balance?.remaining ?? 0),
      cell: g => fillCopy(c.giftcards.balance, {
        remaining: formatMoney(Number(g.balance?.remaining ?? 0), g.balance?.currency, lang),
        starting: formatMoney(Number(g.balance?.starting ?? 0), g.balance?.currency, lang),
      }),
    },
    { id: 'note', header: c.giftcards.col_note, className: 'min-w-[12rem]', cell: g => g.note || <NoneText /> },
    {
      id: 'status', header: c.giftcards.col_status, nowrap: true, sortValue: g => (g.void ? 1 : 0),
      cell: g => (g.void
        ? <StatusBadge tone="neutral" icon={Prohibit}>{c.giftcards.voided}</StatusBadge>
        : <StatusBadge tone="success">{c.giftcards.active}</StatusBadge>),
    },
    {
      id: 'actions', header: <span className="sr-only">{c.common.actions}</span>, nowrap: true,
      cell: g => (g.void ? null : (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onTopUp(g)}><Plus className="h-4 w-4" />{c.giftcards.top_up}</Button>
          <ConfirmAction
            title={fillCopy(c.giftcards.void_title, { code: g.code })}
            description={c.giftcards.void_body}
            confirmLabel={c.giftcards.void_confirm}
            failMessage={c.giftcards.void_failed}
            run={async () => { await voidGiftCard(g.id, c.giftcards.void_failed); await onVoided(g) }}
            trigger={open => (
              <RowMenu
                label={fillCopy(c.common.more_actions, { name: g.code })}
                items={[{ id: 'void', label: c.giftcards.void, icon: Prohibit, danger: true, onSelect: open }]}
              />
            )}
          />
        </div>
      )),
    },
  ]
}

export function GiftCardsView({ cards, reload }: { cards: GiftCard[]; reload: () => Promise<void> }) {
  const { c, lang } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [page, setPage] = useState(1)
  const [toppingUp, setToppingUp] = useState<GiftCard | null>(null)
  const columns = useMemo(() => giftCardColumns(c, lang, setToppingUp, async g => {
    setFlash({ tone: 'success', text: fillCopy(c.giftcards.void_done, { code: g.code }) })
    await reload()
  }), [c, lang, setFlash, reload])
  const shown = pageOf(cards, page)

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {flash}
      <CreateGiftCardForm onCreated={async () => { setFlash({ tone: 'success', text: c.giftcards.done }); await reload() }} />
      <DataTable
        caption={c.giftcards.caption}
        captionHidden
        columns={columns}
        rows={shown.rows}
        rowKey={g => String(g.id)}
        empty={<EmptyState kind="first-use" title={c.giftcards.empty_title}>{c.giftcards.empty_body}</EmptyState>}
        footer={<Pager page={shown.page} pages={shown.pages} onPage={setPage} />}
      />
      {toppingUp && (
        <TopUpDialog
          card={toppingUp}
          onClose={() => setToppingUp(null)}
          onDone={async () => {
            setFlash({ tone: 'success', text: fillCopy(c.giftcards.top_up_done, { code: toppingUp.code }) })
            setToppingUp(null)
            await reload()
          }}
        />
      )}
    </div>
  )
}

function CreateGiftCardForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const { c } = useAdminCopy()
  const [amount, setAmount] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount.replace(',', '.'))
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) { setError(c.giftcards.err_amount); return }
    setError(null)
    setFailure(null)
    setBusy(true)
    try {
      await createGiftCard({ amount: value, note, expiresAt }, c.giftcards.failed)
      setAmount(''); setNote(''); setExpiresAt('')
      await onCreated()
    } catch (err) {
      setFailure(err instanceof Error ? err.message : c.giftcards.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard title={c.giftcards.create_title} description={c.giftcards.create_desc} className="max-w-[72rem]">
      <form onSubmit={submit} noValidate className="grid gap-5">
        <div className="grid gap-5 @2xl:grid-cols-3">
          <FormField label={c.giftcards.f_amount} error={error} required>
            {field => <Input {...field} value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" />}
          </FormField>
          <FormField label={c.giftcards.f_expires} hint={c.giftcards.f_expires_hint}>
            {field => <Input {...field} type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />}
          </FormField>
          <FormField label={c.giftcards.f_note} hint={c.giftcards.f_note_hint}>
            {field => <Input {...field} value={note} onChange={e => setNote(e.target.value)} />}
          </FormField>
        </div>
        {failure && <p role="alert" className="font-semibold text-[var(--color-danger)]">{failure}</p>}
        <div>
          <Button type="submit" disabled={busy} aria-busy={busy || undefined}>
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {c.giftcards.submit}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

function TopUpDialog({ card, onClose, onDone }: { card: GiftCard; onClose: () => void; onDone: () => Promise<void> }) {
  const { c } = useAdminCopy()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount.replace(',', '.'))
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) { setError(c.giftcards.err_amount); return }
    setBusy(true)
    setError(null)
    try {
      await topUpGiftCard(card.id, value, c.giftcards.top_up_failed)
      await onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : c.giftcards.top_up_failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onClose={() => { if (!busy) onClose() }}
      title={fillCopy(c.giftcards.top_up_title, { code: card.code })}
      description={c.giftcards.top_up_desc}
      body={(
        <form id="gift-card-top-up" onSubmit={submit} noValidate>
          <FormField label={c.giftcards.f_top_up} error={error} required>
            {field => <Input {...field} value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" className="max-w-[10rem]" />}
          </FormField>
        </form>
      )}
    >
      <Button variant="outline" onClick={onClose} disabled={busy}>{c.common.cancel}</Button>
      <Button type="submit" form="gift-card-top-up" disabled={busy} aria-busy={busy || undefined}>
        {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {c.giftcards.top_up}
      </Button>
    </Dialog>
  )
}

export default function GiftCardsArea() {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<GiftCard[]>(ADMIN_URL.giftcards, 'giftCards', c.giftcards.load_failed)
  return (
    <>
      <AreaHeader area="giftcards" description={c.giftcards.lead} />
      <AreaLoad data={data} error={error} retry={reload}>
        {cards => <GiftCardsView cards={cards} reload={reload} />}
      </AreaLoad>
    </>
  )
}
