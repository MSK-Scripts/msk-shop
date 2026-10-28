'use client'

import { useMemo, useState } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { DAY_MS } from '@/lib/adminPayments'
import { formatDateTime, formatRelative, isoDate } from '@/lib/format'
import { fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL } from './adminRequests'
import { AreaHeader, AreaLoad, Pager, pageOf, useAdminCopy } from './adminUi'
import type { TeamMember } from './TeamArea'

/** An entry as `/api/admin/audit` sends it: target and detail with every address masked. */
export interface AuditEntry {
  id: number
  discordUserId: string
  adminName: string | null
  action: string
  target: string | null
  detail: string | null
  createdAt: string
}

type Period = 'all' | '1' | '7' | '30'

function parseDetail(detail: string | null): Record<string, unknown> {
  if (!detail) return {}
  try {
    const value = JSON.parse(detail)
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

/**
 * The entry as a sentence, "Musiker15 approved the upload opengewerk-logo"
 * (plan 6.6). People by name: the admin from the log, a team member who is
 * the target by the team list. An action the copy does not know yet still
 * reads, as admin, code and target.
 */
export function auditSentence(e: AuditEntry, c: AdminCopy, names: ReadonlyMap<string, string>): string {
  const admin = e.adminName ?? names.get(e.discordUserId) ?? fillCopy(c.audit.former, { id: e.discordUserId })
  const detail = parseDetail(e.detail)
  const target = e.target ?? ''
  const template = c.audit.sentences[e.action]
  if (!template) return fillCopy(c.audit.fallback, { admin, action: e.action, target }).trim()

  const values: Record<string, string> = { admin, target }
  if (e.action.startsWith('team.')) values.target = names.get(target) ?? target
  if (e.action === 'payment.status') values.status = String(detail.status ?? '')
  if (e.action.startsWith('image_upload.')) values.name = String(detail.name ?? target)
  if (e.action === 'data.reveal') {
    const [kind, id] = target.split(':')
    values.field = c.audit.reveal_fields[String(detail.field)] ?? String(detail.field ?? '')
    values.record = fillCopy(c.audit.record_kinds[kind] ?? `${kind} {id}`, { id: id ?? '' })
  }
  return fillCopy(template, values)
}

export function auditColumns(c: AdminCopy, lang: Lang, names: ReadonlyMap<string, string>, now: number): DataColumn<AuditEntry>[] {
  return [
    {
      id: 'time', header: c.audit.col_time, nowrap: true, sortValue: e => Date.parse(e.createdAt) || null,
      cell: e => (
        <time dateTime={isoDate(e.createdAt)} title={formatDateTime(e.createdAt, lang) ?? undefined} className="grid">
          <span>{formatRelative(e.createdAt, lang, now)}</span>
          <span className="text-small text-[var(--color-muted-foreground)]">{formatDateTime(e.createdAt, lang)}</span>
        </time>
      ),
    },
    {
      id: 'what', header: c.audit.col_what, className: 'min-w-[18rem]',
      cell: e => (
        <div className="grid gap-1">
          <span>{auditSentence(e, c, names)}</span>
          {e.detail && (
            <details className="text-small">
              <summary className="inline-flex min-h-9 cursor-pointer items-center text-[var(--color-primary)]">{c.audit.details}</summary>
              <pre className="mt-1 max-w-[60ch] overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-[var(--color-muted)] p-2 font-mono">{e.detail}</pre>
            </details>
          )}
        </div>
      ),
    },
  ]
}

/** The group of an action code for the filter: "image_upload.approve" belongs to "image_upload". */
const groupOf = (action: string) => action.split('.')[0]

export function AuditView({ entries, team, now }: { entries: AuditEntry[]; team: TeamMember[]; now: number }) {
  const { c, lang } = useAdminCopy()
  const [person, setPerson] = useState('')
  const [action, setAction] = useState('')
  const [period, setPeriod] = useState<Period>('all')
  const [page, setPage] = useState(1)

  const names = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of team) if (m.displayName) map.set(m.discordUserId, m.displayName)
    for (const e of entries) if (e.adminName) map.set(e.discordUserId, e.adminName)
    return map
  }, [team, entries])
  const columns = useMemo(() => auditColumns(c, lang, names, now), [c, lang, names, now])

  const people = [...new Set(entries.map(e => e.discordUserId))]
  const groups = [...new Set(entries.map(e => groupOf(e.action)))]
  const from = period === 'all' ? -Infinity : now - Number(period) * DAY_MS
  const rows = entries.filter(e => (!person || e.discordUserId === person)
    && (!action || groupOf(e.action) === action)
    && (period === 'all' || (Date.parse(e.createdAt) || 0) >= from))
  const shown = pageOf(rows, page)
  const reset = () => { setPerson(''); setAction(''); setPeriod('all'); setPage(1) }

  const empty = entries.length === 0
    ? <EmptyState kind="first-use" title={c.audit.empty_title}>{c.audit.empty_body}</EmptyState>
    : <EmptyState kind="no-results" title={c.audit.none_title} action={<Button variant="outline" onClick={reset}>{c.common.show_all}</Button>}>{c.audit.none_body}</EmptyState>

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      <div className="grid max-w-[60rem] gap-4 @2xl:grid-cols-3">
        <FormField label={c.audit.f_person}>
          {field => (
            <Select {...field} value={person} onChange={e => { setPerson(e.target.value); setPage(1) }}>
              <option value="">{c.audit.everyone}</option>
              {people.map(id => <option key={id} value={id}>{names.get(id) ?? fillCopy(c.audit.former, { id })}</option>)}
            </Select>
          )}
        </FormField>
        <FormField label={c.audit.f_action}>
          {field => (
            <Select {...field} value={action} onChange={e => { setAction(e.target.value); setPage(1) }}>
              <option value="">{c.audit.all_actions}</option>
              {groups.map(g => <option key={g} value={g}>{c.audit.action_groups[g] ?? g}</option>)}
            </Select>
          )}
        </FormField>
        <FormField label={c.audit.f_period}>
          {field => (
            <Select {...field} value={period} onChange={e => { setPeriod(e.target.value as Period); setPage(1) }}>
              {(['all', '1', '7', '30'] as Period[]).map(p => <option key={p} value={p}>{c.audit.periods[p]}</option>)}
            </Select>
          )}
        </FormField>
      </div>
      <DataTable
        caption={c.audit.caption}
        captionHidden
        columns={columns}
        rows={shown.rows}
        rowKey={e => String(e.id)}
        empty={empty}
        footer={<Pager page={shown.page} pages={shown.pages} onPage={setPage} />}
        className="max-w-[72rem]"
      />
    </div>
  )
}

export default function AuditArea() {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<AuditEntry[]>(ADMIN_URL.audit, 'entries', c.audit.load_failed)
  // Same permission as the log; names the people an entry is about.
  const { data: team } = useAdminResource<TeamMember[]>(ADMIN_URL.team, 'members', c.team.load_failed)
  const [now] = useState(() => Date.now())
  return (
    <>
      <AreaHeader area="audit" description={c.audit.lead} />
      <AreaLoad data={data} error={error} retry={reload}>
        {entries => <AuditView entries={entries} team={team ?? []} now={now} />}
      </AreaLoad>
    </>
  )
}
