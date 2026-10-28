'use client'

import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { Prohibit } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate, isoDate } from '@/lib/format'
import { fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL, createBan } from './adminRequests'
import { AreaHeader, AreaLoad, NoneText, Pager, RevealValue, pageOf, useAdminCopy, useFlash } from './adminUi'

/** A ban as `/api/admin/bans` sends it: IP and email masked. */
export interface Ban {
  id: number
  time?: string | null
  reason: string
  ip: string | null
  payment_email?: string | null
  user: { ign: string | null; uuid: string | null } | null
}

const playerOf = (b: Ban) => b.user?.ign || b.user?.uuid || null

function banColumns(c: AdminCopy, lang: Lang): DataColumn<Ban>[] {
  const record = (b: Ban) => `${c.bans.col_player} ${playerOf(b) ?? b.id}`
  return [
    {
      id: 'date', header: c.bans.col_date, nowrap: true, sortValue: b => (b.time ? Date.parse(b.time) || null : null),
      cell: b => (b.time ? <time dateTime={isoDate(b.time)}>{formatDate(b.time, lang) ?? b.time}</time> : <NoneText />),
    },
    { id: 'player', header: c.bans.col_player, sortValue: b => playerOf(b), cell: b => <span className="font-semibold break-all">{playerOf(b) ?? c.common.none}</span> },
    { id: 'reason', header: c.bans.col_reason, className: 'min-w-[14rem]', cell: b => b.reason || <NoneText /> },
    { id: 'ip', header: c.bans.col_ip, className: 'min-w-[13rem]', cell: b => <RevealValue kind="ban" id={String(b.id)} field="ip" masked={b.ip} record={record(b)} /> },
    { id: 'email', header: c.bans.col_email, className: 'min-w-[14rem]', cell: b => <RevealValue kind="ban" id={String(b.id)} field="email" masked={b.payment_email} record={record(b)} /> },
  ]
}

export function BansView({ bans, reload }: { bans: Ban[]; reload: () => Promise<void> }) {
  const { c, lang } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const columns = useMemo(() => banColumns(c, lang), [c, lang])
  const q = query.trim().toLowerCase()
  const rows = q ? bans.filter(b => (playerOf(b) ?? '').toLowerCase().includes(q) || (b.reason ?? '').toLowerCase().includes(q)) : bans
  const shown = pageOf(rows, page)

  const empty = bans.length === 0
    ? <EmptyState kind="first-use" title={c.bans.empty_title}>{c.bans.empty_body}</EmptyState>
    : (
      <EmptyState kind="no-results" title={c.bans.none_title} action={<Button variant="outline" onClick={() => setQuery('')}>{c.common.clear_search}</Button>}>
        {c.bans.none_body}
      </EmptyState>
    )

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {flash}
      <CreateBanForm onCreated={async user => { setFlash({ tone: 'success', text: fillCopy(c.bans.done, { user }) }); await reload() }} />
      <div role="search" className="max-w-[28rem]">
        <FormField label={c.bans.search} hint={c.bans.search_hint}>
          {field => <Input {...field} type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} />}
        </FormField>
      </div>
      <DataTable
        caption={c.bans.caption}
        captionHidden
        columns={columns}
        rows={shown.rows}
        rowKey={b => String(b.id)}
        empty={empty}
        footer={<Pager page={shown.page} pages={shown.pages} onPage={setPage} />}
      />
    </div>
  )
}

interface BanErrors { user?: string; reason?: string }

/**
 * A ban cannot be lifted from here, only in the Tebex panel, so creating one
 * asks first (plan 6.3: a confirmation for what cannot be undone here).
 */
export function CreateBanForm({ onCreated, defaults }: {
  onCreated: (user: string) => Promise<void>
  /** Prefilled fields, for a ban started from another record. */
  defaults?: { user?: string; reason?: string; ip?: string }
}) {
  const { c } = useAdminCopy()
  const [user, setUser] = useState(defaults?.user ?? '')
  const [reason, setReason] = useState(defaults?.reason ?? '')
  const [ip, setIp] = useState(defaults?.ip ?? '')
  const [errors, setErrors] = useState<BanErrors>({})
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // On the button, not the form: Enter in a field clicks the default
  // button too, so both ways only validate and open the confirmation.
  function check(e: { preventDefault: () => void }) {
    e.preventDefault()
    const next: BanErrors = {}
    if (!user.trim()) next.user = c.bans.err_user
    if (!reason.trim()) next.reason = c.bans.err_reason
    setErrors(next)
    if (Object.keys(next).length === 0) { setFailure(null); setConfirming(true) }
  }

  async function ban() {
    setBusy(true)
    try {
      await createBan({ user, reason, ip }, c.bans.failed)
      const banned = user.trim()
      setConfirming(false)
      setUser(''); setReason(''); setIp('')
      await onCreated(banned)
    } catch (err) {
      setFailure(err instanceof Error ? err.message : c.bans.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard title={c.bans.create_title} description={c.bans.create_desc} className="max-w-[72rem]">
      <form onSubmit={e => e.preventDefault()} noValidate className="grid gap-5">
        <div className="grid gap-5 @2xl:grid-cols-2">
          <FormField label={c.bans.f_user} hint={c.bans.f_user_hint} error={errors.user} required>
            {field => <Input {...field} value={user} onChange={e => setUser(e.target.value)} autoComplete="off" spellCheck={false} />}
          </FormField>
          <FormField label={c.bans.f_ip} hint={c.bans.f_ip_hint}>
            {field => <Input {...field} value={ip} onChange={e => setIp(e.target.value)} autoComplete="off" spellCheck={false} inputMode="decimal" />}
          </FormField>
          <FormField label={c.bans.f_reason} hint={c.bans.f_reason_hint} error={errors.reason} required className="@2xl:col-span-2">
            {field => <Input {...field} value={reason} onChange={e => setReason(e.target.value)} />}
          </FormField>
        </div>
        <div>
          <Button type="submit" onClick={check}><Prohibit className="h-4 w-4" />{c.bans.submit}</Button>
        </div>
      </form>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void ban()}
        title={fillCopy(c.bans.confirm_title, { user: user.trim() })}
        description={c.bans.confirm_body}
        confirmLabel={c.bans.submit}
        cancelLabel={c.common.cancel}
        busy={busy}
        error={failure}
      />
    </SectionCard>
  )
}

export default function BansArea() {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<Ban[]>(ADMIN_URL.bans, 'bans', c.bans.load_failed)
  return (
    <>
      <AreaHeader area="bans" description={c.bans.lead} />
      <AreaLoad data={data} error={error} retry={reload}>
        {bans => <BansView bans={bans} reload={reload} />}
      </AreaLoad>
    </>
  )
}
