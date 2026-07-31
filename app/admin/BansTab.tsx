'use client'

import { useState } from 'react'
import { Loader2, AlertCircle, Ban } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAdminResource } from '@/lib/useAdminResource'

interface BanEntry {
  id:     number
  reason: string
  ip:     string | null
  user:   { ign: string | null; uuid: string | null }
}

export default function BansTab() {
  const { data: bans, error, reload } = useAdminResource<BanEntry[]>(
    '/api/admin/bans', 'bans', 'Failed to load bans.',
  )
  const [user, setUser]     = useState('')
  const [reason, setReason] = useState('')
  const [ip, setIp]         = useState('')
  const [busy, setBusy]     = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const create = async () => {
    if (busy) return
    setBusy(true); setFormError(null)
    try {
      const r = await fetch('/api/admin/bans', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user: user.trim(), reason: reason.trim(), ip: ip.trim() || undefined }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Failed to create ban.')
      setUser(''); setReason(''); setIp('')
      await reload()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Failed to create ban.') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Note: Tebex&apos;s API can create and list bans but cannot lift them. To remove a ban, use the Tebex control panel.
      </p>
      <Card className="p-6">
        <h3 className="text-lg font-bold tracking-tight">Ban a player</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">User (username / UUID)</label>
            <Input value={user} onChange={e => setUser(e.target.value)} placeholder="Notch" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">IP (optional)</label>
            <Input value={ip} onChange={e => setIp(e.target.value)} placeholder="1.2.3.4" className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Reason</label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Chargeback fraud" className="mt-1" />
          </div>
        </div>
        {formError && <p className="mt-3 text-sm text-[var(--color-danger)]">{formError}</p>}
        <div className="mt-4">
          <Button onClick={create} disabled={busy || !user.trim() || !reason.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Create ban
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-danger)]">
          <AlertCircle className="h-4 w-4" /> {error}
        </Card>
      )}

      {!error && !bans && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading bans…
        </Card>
      )}

      {!error && bans && bans.length === 0 && (
        <Card className="p-6 text-sm text-[var(--color-muted-foreground)]">No bans yet.</Card>
      )}

      {!error && bans && bans.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {bans.map(b => (
                  <tr key={b.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3">{b.user?.ign ?? b.user?.uuid ?? '—'}</td>
                    <td className="px-4 py-3">{b.reason || '—'}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{b.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
