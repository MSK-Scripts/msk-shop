'use client'

import { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from './StatusBadge'

interface LookupPayment {
  txn_id:   string
  price:    string | number
  currency: string
  status:   string
}

interface LookupResult {
  player:         { id: string; username: string }
  banCount:       number
  chargebackRate: number
  payments:       LookupPayment[]
}

export default function LookupTab() {
  const [user, setUser]       = useState('')
  const [result, setResult]   = useState<LookupResult | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const search = async () => {
    const q = user.trim()
    if (!q || loading) return
    setLoading(true); setError(null); setResult(null)
    try {
      const r = await fetch(`/api/admin/lookup?user=${encodeURIComponent(q)}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Lookup failed.')
      setResult(d.result as LookupResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <label className="text-sm font-medium">Player lookup</label>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Search by username or UUID.</p>
        <div className="mt-3 flex gap-2">
          <Input
            value={user}
            onChange={e => setUser(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') search() }}
            placeholder="Notch or 069a79f4-…"
          />
          <Button onClick={search} disabled={loading || !user.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Look up
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
      </Card>

      {result && (
        <Card className="p-6">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-lg font-bold tracking-tight">{result.player?.username ?? '—'}</h3>
            <span className="text-sm text-[var(--color-muted-foreground)]">ID {result.player?.id ?? '—'}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span>Bans: <span className="font-semibold">{result.banCount ?? 0}</span></span>
            <span>Chargeback rate: <span className="font-semibold">{result.chargebackRate ?? 0}</span></span>
          </div>

          {result.payments?.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                    <th className="px-3 py-2 font-medium">Transaction</th>
                    <th className="px-3 py-2 font-medium">Price</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.payments.map(p => (
                    <tr key={p.txn_id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{p.txn_id}</td>
                      <td className="whitespace-nowrap px-3 py-2">{p.price} {p.currency}</td>
                      <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
