'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ErrorCard } from '@/app/admin/ErrorCard'

interface AuditEntry {
  id:            number
  discordUserId: string
  action:        string
  target:        string | null
  detail:        string | null
  createdAt:     string
}

export default function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/audit')
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? 'Failed to load audit log.')
        return d.entries as AuditEntry[]
      })
      .then(d => { if (!cancelled) setEntries(d) })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load audit log.') })
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <ErrorCard message={error} />
    )
  }
  if (!entries) {
    return (
      <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading audit log…
      </Card>
    )
  }
  if (entries.length === 0) {
    return <Card className="p-6 text-sm text-[var(--color-muted-foreground)]">No actions logged yet.</Card>
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted-foreground)]">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.discordUserId}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.action}</td>
                <td className="px-4 py-3">{e.target ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-foreground)]">{e.detail ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
