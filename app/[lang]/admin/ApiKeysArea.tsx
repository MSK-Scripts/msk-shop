'use client'

import { useMemo, useState, type FormEvent } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { StatusBadge, type StatusTone } from '@/components/dashboard/StatusBadge'
import { Check, CircleNotch, Copy, EyeClosed, FloppyDisk, Globe, PencilSimple } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { RadioCard } from '@/components/ui/RadioCard'
import { formatDate, formatDateTime, formatNumber, isoDate } from '@/lib/format'
import { fillCopy, type AdminCopy, type Lang } from '@/lib/i18n'
import { KEY_ORIGINS, type KeyOrigin } from '@/lib/keyClassification'
import type { Tier } from '@/lib/tiers'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL, updateApiKey } from './adminRequests'
import { AreaHeader, AreaLoad, NoneText, Pager, RevealValue, pageOf, useAdminCopy, useFlash } from './adminUi'

/** A ticket bot server as `/api/admin/api-keys` sends it: the key shortened. */
export interface ApiKeyRow {
  guildId: string
  guildName: string | null
  apiKey: string
  tier: Tier
  customDomain: string | null
  domainStatus: 'none' | 'pending_dns' | 'active'
  isHosted: boolean
  active: boolean
  createdAt: string
  expiresAt: string | null
  statsExcluded: boolean
  keyOrigin: KeyOrigin
}

const TIERS: Tier[] = ['basic', 'premium', 'premium_plus', 'business']
const TIER_TONE: Record<Tier, StatusTone> = { basic: 'neutral', premium: 'info', premium_plus: 'success', business: 'success' }
const ORIGIN_TONE: Record<KeyOrigin, StatusTone> = { normal: 'neutral', giveaway: 'warning', sponsored: 'info' }

/** The key: shortened, revealed on request with an audit entry, then copyable. */
function ApiKeyCell({ row, c }: { row: ApiKeyRow; c: AdminCopy }) {
  const [full, setFull] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  async function copy() {
    if (!full) return
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* the value stays selectable text */ }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <RevealValue kind="apikey" id={row.guildId} field="apiKey" masked={row.apiKey} record={row.guildName ?? row.guildId} onRevealed={setFull} />
      {full && (
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? c.common.copy.copied : c.common.copy.copy}
        </Button>
      )}
    </span>
  )
}

function apiKeyColumns(c: AdminCopy, lang: Lang, canChange: boolean, onEdit: (row: ApiKeyRow) => void): DataColumn<ApiKeyRow>[] {
  const columns: DataColumn<ApiKeyRow>[] = [
    {
      id: 'server', header: c.apikeys.col_server, className: 'min-w-[14rem]', sortValue: k => k.guildName ?? '',
      cell: k => (
        <div className="grid gap-1">
          <span className="font-semibold">{k.guildName ?? <span className="text-[var(--color-muted-foreground)]">{c.apikeys.unknown}</span>}</span>
          <span className="font-mono text-small text-[var(--color-muted-foreground)]">{k.guildId}</span>
          {(k.isHosted || !k.active) && (
            <span className="flex flex-wrap gap-1.5">
              {k.isHosted && <StatusBadge tone="info">{c.apikeys.hosted}</StatusBadge>}
              {!k.active && <StatusBadge tone="danger">{c.apikeys.inactive}</StatusBadge>}
            </span>
          )}
        </div>
      ),
    },
    { id: 'key', header: c.apikeys.col_key, className: 'min-w-[15rem]', cell: k => <ApiKeyCell row={k} c={c} /> },
    {
      id: 'tier', header: c.apikeys.col_tier, nowrap: true, sortValue: k => TIERS.indexOf(k.tier),
      cell: k => <StatusBadge tone={TIER_TONE[k.tier]}>{c.apikeys.tiers[k.tier]}</StatusBadge>,
    },
    {
      id: 'stats', header: c.apikeys.col_stats, nowrap: true, sortValue: k => k.keyOrigin,
      cell: k => (
        <div className="grid gap-1">
          <StatusBadge tone={ORIGIN_TONE[k.keyOrigin]}>{c.apikeys.origins[k.keyOrigin].label}</StatusBadge>
          {k.statsExcluded && (
            <span className="inline-flex items-center gap-1 text-small text-[var(--color-muted-foreground)]">
              <EyeClosed className="h-4 w-4" />{c.apikeys.excluded}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'domain', header: c.apikeys.col_domain, sortValue: k => k.customDomain,
      cell: k => (k.customDomain
        ? <span className="inline-flex items-center gap-1.5 font-mono text-small"><Globe className="h-4 w-4 text-[var(--color-primary)]" />{k.customDomain}</span>
        : k.domainStatus === 'pending_dns' ? <StatusBadge tone="warning">{c.apikeys.pending_dns}</StatusBadge> : <NoneText />),
    },
    {
      id: 'registered', header: c.apikeys.col_registered, nowrap: true, sortValue: k => Date.parse(k.createdAt) || null,
      cell: k => <time dateTime={isoDate(k.createdAt)} title={formatDateTime(k.createdAt, lang) ?? undefined}>{formatDate(k.createdAt, lang) ?? k.createdAt}</time>,
    },
  ]
  if (canChange) {
    columns.push({
      id: 'actions', header: <span className="sr-only">{c.common.actions}</span>, nowrap: true,
      cell: k => <Button variant="outline" size="sm" onClick={() => onEdit(k)}><PencilSimple className="h-4 w-4" />{c.apikeys.edit}</Button>,
    })
  }
  return columns
}

export function ApiKeysView({ keys, canChange, reload }: { keys: ApiKeyRow[]; canChange: boolean; reload: () => Promise<void> }) {
  const { c, lang } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<ApiKeyRow | null>(null)
  const columns = useMemo(() => apiKeyColumns(c, lang, canChange, setEditing), [c, lang, canChange])

  const q = query.trim().toLowerCase()
  const rows = q
    ? keys.filter(k => k.guildId.includes(q) || (k.guildName ?? '').toLowerCase().includes(q) || (k.customDomain ?? '').toLowerCase().includes(q)
        || k.tier.includes(q) || c.apikeys.tiers[k.tier].toLowerCase().includes(q) || k.keyOrigin.includes(q))
    : keys
  const shown = pageOf(rows, page)

  const empty = keys.length === 0
    ? <EmptyState kind="first-use" title={c.apikeys.empty_title}>{c.apikeys.empty_body}</EmptyState>
    : <EmptyState kind="no-results" title={c.apikeys.none_title} action={<Button variant="outline" onClick={() => setQuery('')}>{c.common.clear_search}</Button>}>{c.apikeys.none_body}</EmptyState>

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {flash}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div role="search" className="w-full max-w-[28rem]">
          <FormField label={c.apikeys.search} hint={c.apikeys.search_hint}>
            {field => <Input {...field} type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} />}
          </FormField>
        </div>
        <p aria-live="polite" className="tabular-nums text-[var(--color-muted-foreground)]">
          {fillCopy(c.apikeys.count, { count: formatNumber(rows.length, lang), total: formatNumber(keys.length, lang) })}
        </p>
      </div>
      <DataTable
        caption={c.apikeys.caption}
        captionHidden
        columns={columns}
        rows={shown.rows}
        rowKey={k => k.guildId}
        empty={empty}
        footer={<Pager page={shown.page} pages={shown.pages} onPage={setPage} />}
      />
      {editing && (
        <EditApiKeyDialog
          row={editing}
          onClose={() => setEditing(null)}
          onDone={async warning => {
            const name = editing.guildName ?? editing.guildId
            setEditing(null)
            setFlash(warning ? { tone: 'warning', text: warning } : { tone: 'success', text: fillCopy(c.apikeys.done, { name }) })
            await reload()
          }}
        />
      )}
    </div>
  )
}

function EditApiKeyDialog({ row, onClose, onDone }: { row: ApiKeyRow; onClose: () => void; onDone: (warning: string | null) => Promise<void> }) {
  const { c } = useAdminCopy()
  const [tier, setTier] = useState<Tier>(row.tier)
  const [excluded, setExcluded] = useState(row.statsExcluded)
  const [origin, setOrigin] = useState<KeyOrigin>(row.keyOrigin)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const dirty = tier !== row.tier || excluded !== row.statsExcluded || origin !== row.keyOrigin

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!dirty) { onClose(); return }
    setBusy(true)
    setFailure(null)
    try {
      const result = await updateApiKey(row.guildId, { tier, statsExcluded: excluded, keyOrigin: origin }, c.apikeys.failed)
      await onDone(typeof result.warning === 'string' ? result.warning : null)
    } catch (err) {
      setFailure(err instanceof Error ? err.message : c.apikeys.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onClose={() => { if (!busy) onClose() }}
      title={fillCopy(c.apikeys.edit_title, { name: row.guildName ?? row.guildId })}
      className="w-[min(100%_-_2rem,36rem)]"
      body={(
        <form id="edit-api-key" onSubmit={submit} className="grid gap-5">
          <fieldset className="grid gap-2" aria-describedby="api-key-tier-hint">
            <legend className="mb-1 font-semibold">{c.apikeys.f_tier}</legend>
            {TIERS.map(t => (
              <RadioCard key={t} name="api-key-tier" value={t} checked={tier === t} onChange={() => setTier(t)}>
                <span className="flex items-center justify-between gap-3 font-semibold">
                  {c.apikeys.tiers[t]}
                  {row.tier === t && <span className="text-small font-normal text-[var(--color-muted-foreground)]">{c.apikeys.current}</span>}
                </span>
              </RadioCard>
            ))}
            <p id="api-key-tier-hint" className="text-small text-[var(--color-muted-foreground)]">{c.apikeys.tier_hint}</p>
          </fieldset>
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input type="checkbox" checked={excluded} onChange={e => setExcluded(e.target.checked)} aria-describedby="api-key-exclude-hint" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]" />
            <span className="grid gap-0.5">
              <span className="font-semibold">{c.apikeys.f_exclude}</span>
              <span id="api-key-exclude-hint" className="text-small text-[var(--color-muted-foreground)]">{c.apikeys.f_exclude_hint}</span>
            </span>
          </label>
          <fieldset className="grid gap-2" aria-describedby="api-key-origin-hint">
            <legend className="mb-1 font-semibold">{c.apikeys.f_origin}</legend>
            {KEY_ORIGINS.map(o => (
              <RadioCard key={o} name="api-key-origin" value={o} checked={origin === o} onChange={() => setOrigin(o)}>
                <span className="font-semibold">{c.apikeys.origins[o].label}</span>
                <span className="text-small text-[var(--color-muted-foreground)]">{c.apikeys.origins[o].description}</span>
              </RadioCard>
            ))}
            <p id="api-key-origin-hint" className="text-small text-[var(--color-muted-foreground)]">{c.apikeys.f_origin_hint}</p>
          </fieldset>
          {failure && <p role="alert" className="font-semibold text-[var(--color-danger)]">{failure}</p>}
        </form>
      )}
    >
      <Button variant="outline" onClick={onClose} disabled={busy}>{c.common.cancel}</Button>
      <Button type="submit" form="edit-api-key" disabled={busy || !dirty} aria-busy={busy || undefined}>
        {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
        {c.apikeys.save}
      </Button>
    </Dialog>
  )
}

export default function ApiKeysArea({ canChange }: { canChange: boolean }) {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<ApiKeyRow[]>(ADMIN_URL.apiKeys, 'keys', c.apikeys.load_failed)
  const description = <><p>{c.apikeys.lead}</p><p>{canChange ? c.apikeys.lead_change : c.apikeys.lead_view}</p></>
  return (
    <>
      <AreaHeader area="apikeys" description={description} />
      <AreaLoad data={data} error={error} retry={reload}>
        {keys => <ApiKeysView keys={keys} canChange={canChange} reload={reload} />}
      </AreaLoad>
    </>
  )
}
