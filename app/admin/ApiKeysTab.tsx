'use client'

import { useMemo, useState } from 'react'
import { Loader2, AlertCircle, Pencil, Eye, EyeOff, Copy, Check, Globe, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useAdminResource } from '@/lib/useAdminResource'
import { ErrorCard } from '@/app/admin/ErrorCard'

type Tier = 'basic' | 'premium' | 'premium_plus'

interface ApiKey {
  guildId:      string
  guildName:    string | null
  apiKey:       string
  tier:         Tier
  customDomain: string | null
  domainStatus: 'none' | 'pending_dns' | 'active'
  isHosted:     boolean
  active:       boolean
  createdAt:    string
  expiresAt:    string | null
}

const TIER_LABELS: Record<Tier, string> = {
  basic:        'Basic',
  premium:      'Premium',
  premium_plus: 'Premium+',
}
const TIER_ORDER: Tier[] = ['basic', 'premium', 'premium_plus']

function tierBadgeClass(tier: Tier): string {
  switch (tier) {
    case 'premium_plus': return 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
    case 'premium':      return 'border-[var(--color-info)]/30 bg-[var(--color-info)]/10 text-[var(--color-info)]'
    default:             return 'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
  }
}

function maskKey(key: string): string {
  if (key.length <= 12) return '••••'
  return `${key.slice(0, 8)}…${key.slice(-4)}`
}

export default function ApiKeysTab({ canChange }: { canChange: boolean }) {
  const { data: keys, error, reload } = useAdminResource<ApiKey[]>(
    '/api/admin/api-keys', 'keys', 'Failed to load API keys.',
  )
  const [search, setSearch] = useState('')
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  const [editing, setEditing]   = useState<ApiKey | null>(null)
  const [newTier, setNewTier]   = useState<Tier>('basic')
  const [busy, setBusy]         = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice]     = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!keys) return null
    const q = search.trim().toLowerCase()
    if (!q) return keys
    return keys.filter(k =>
      k.guildId.includes(q) ||
      (k.guildName ?? '').toLowerCase().includes(q) ||
      (k.customDomain ?? '').toLowerCase().includes(q) ||
      k.tier.includes(q),
    )
  }, [keys, search])

  const toggleReveal = (guildId: string) => {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(guildId)) next.delete(guildId); else next.add(guildId)
      return next
    })
  }

  const copyKey = async (k: ApiKey) => {
    try {
      await navigator.clipboard.writeText(k.apiKey)
      setCopied(k.guildId)
      setTimeout(() => setCopied(c => (c === k.guildId ? null : c)), 1500)
    } catch { /* clipboard unavailable */ }
  }

  const openEdit = (k: ApiKey) => { setEditing(k); setNewTier(k.tier); setFormError(null) }
  const closeEdit = () => { if (!busy) setEditing(null) }

  const save = async () => {
    if (!editing || busy) return
    if (newTier === editing.tier) { setEditing(null); return }
    setBusy(true); setFormError(null)
    try {
      const r = await fetch(`/api/admin/api-keys/${editing.guildId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tier: newTier }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Update failed.')
      setEditing(null)
      setNotice(typeof d.warning === 'string' ? d.warning : null)
      await reload()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Update failed.') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Every registered ticket bot API key with its guild, tier and custom domain.
        {canChange
          ? ' Changing a tier is a manual override. Stripe billing and the daily cleanup still apply.'
          : ' You can view API keys but not change them.'}
      </p>

      {notice && (
        <Card className="flex items-start justify-between gap-3 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4 text-sm text-[var(--color-warning)]">
          <span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {notice}</span>
          <button onClick={() => setNotice(null)} className="shrink-0 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
        </Card>
      )}

      {error && (
        <ErrorCard message={error} />
      )}

      {!error && !keys && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading API keys…
        </Card>
      )}

      {!error && keys && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search guild, name, domain or tier…"
              className="max-w-xs"
            />
            <span className="text-sm text-[var(--color-muted-foreground)]">
              {filtered?.length ?? 0} of {keys.length}
            </span>
          </div>

          {filtered && filtered.length === 0 ? (
            <Card className="p-6 text-sm text-[var(--color-muted-foreground)]">No API keys match.</Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                      <th className="px-4 py-3 font-medium">Guild</th>
                      <th className="px-4 py-3 font-medium">API key</th>
                      <th className="px-4 py-3 font-medium">Tier</th>
                      <th className="px-4 py-3 font-medium">Custom domain</th>
                      {canChange && <th className="px-4 py-3 font-medium" />}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered!.map(k => (
                      <tr key={k.guildId} className="border-b border-[var(--color-border)] last:border-0 align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {k.guildName ?? <span className="text-[var(--color-muted-foreground)]">Unknown</span>}
                            {k.isHosted && (
                              <span className="ml-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-muted-foreground)]">
                                Hosted
                              </span>
                            )}
                            {!k.active && (
                              <span className="ml-2 rounded-full border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-danger)]">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-[var(--color-muted-foreground)]">{k.guildId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {revealed.has(k.guildId) ? k.apiKey : maskKey(k.apiKey)}
                            </span>
                            <button
                              onClick={() => toggleReveal(k.guildId)}
                              className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                              title={revealed.has(k.guildId) ? 'Hide' : 'Reveal'}
                            >
                              {revealed.has(k.guildId) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => copyKey(k)}
                              className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                              title="Copy full key"
                            >
                              {copied === k.guildId ? <Check className="h-3.5 w-3.5 text-[var(--color-primary)]" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-block rounded-full border px-2 py-0.5 text-xs font-semibold', tierBadgeClass(k.tier))}>
                            {TIER_LABELS[k.tier]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {k.customDomain ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                              <span className="font-mono text-xs">{k.customDomain}</span>
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted-foreground)]">
                              {k.domainStatus === 'pending_dns' ? 'Pending DNS' : '—'}
                            </span>
                          )}
                        </td>
                        {canChange && (
                          <td className="px-4 py-3 text-right">
                            <Button variant="outline" size="sm" onClick={() => openEdit(k)}>
                              <Pencil className="h-3.5 w-3.5" /> Tier
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeEdit}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold tracking-tight">Change tier</h3>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {editing.guildName ?? editing.guildId}
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium">Tier</label>
              <div className="mt-2 space-y-2">
                {TIER_ORDER.map(t => (
                  <label
                    key={t}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors',
                      newTier === t
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
                    )}
                  >
                    <input
                      type="radio"
                      name="tier"
                      value={t}
                      checked={newTier === t}
                      onChange={() => setNewTier(t)}
                      className="accent-[var(--color-primary)]"
                    />
                    <span className="font-medium">{TIER_LABELS[t]}</span>
                    {editing.tier === t && (
                      <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">current</span>
                    )}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                Downgrading to Basic disables custom domains and attachments at the next cleanup run.
              </p>
            </div>
            {formError && <p className="mt-3 text-sm text-[var(--color-danger)]">{formError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeEdit} disabled={busy}>Cancel</Button>
              <Button onClick={save} disabled={busy || newTier === editing.tier}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
