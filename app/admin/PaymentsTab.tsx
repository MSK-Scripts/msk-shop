'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, Gift, Undo2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from './StatusBadge'

interface Payment {
  id:       string
  amount:   number
  date:     string
  currency: { symbol: string; iso_4217: string }
  status:   string
  email:    string
  player:   { name: string } | null
  packages: { name: string }[]
}

export default function PaymentsTab({ canCreate, canRefund }: { canCreate: boolean; canRefund: boolean }) {
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [error, setError]       = useState<string | null>(null)

  // "Give package" modal state
  const [showGive, setShowGive]     = useState(false)
  const [ign, setIgn]               = useState('')
  const [packageId, setPackageId]   = useState('')
  const [price, setPrice]           = useState('0')
  const [note, setNote]             = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)
  const [refundingId, setRefundingId] = useState<string | null>(null)

  const closeGive = () => {
    if (submitting) return
    setShowGive(false)
    setIgn(''); setPackageId(''); setPrice('0'); setNote(''); setFormError(null)
  }

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await fetch('/api/admin/payments')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Failed to load payments.')
      setPayments(d.payments as Payment[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payments.')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const givePackage = async () => {
    if (submitting) return
    setSubmitting(true); setFormError(null)
    try {
      const r = await fetch('/api/admin/payments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ign:      ign.trim(),
          packages: [{ id: Number(packageId) }],
          price:    Number(price),
          note:     note.trim() || undefined,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Failed to create payment.')
      setShowGive(false)
      setIgn(''); setPackageId(''); setPrice('0'); setNote('')
      await load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create payment.')
    } finally {
      setSubmitting(false)
    }
  }

  const refund = async (txn: string) => {
    if (refundingId) return
    if (!window.confirm(`Refund payment ${txn}? This cannot be undone.`)) return
    setRefundingId(txn)
    try {
      const r = await fetch(`/api/admin/payments/${encodeURIComponent(txn)}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'refund' }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Refund failed.')
      await load()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Refund failed.')
    } finally {
      setRefundingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setShowGive(true); setFormError(null) }}>
            <Gift className="h-4 w-4" /> Give package
          </Button>
        </div>
      )}

      {error && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-danger)]">
          <AlertCircle className="h-4 w-4" /> {error}
        </Card>
      )}

      {!error && !payments && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading payments…
        </Card>
      )}

      {!error && payments && payments.length === 0 && (
        <Card className="p-6 text-sm text-[var(--color-muted-foreground)]">No payments found.</Card>
      )}

      {!error && payments && payments.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium">Packages</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  {canRefund && <th className="px-4 py-3 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{p.date}</td>
                    <td className="px-4 py-3">{p.player?.name ?? '—'}</td>
                    <td className="px-4 py-3">{(p.packages ?? []).map(pkg => pkg.name).join(', ') || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">{p.currency?.symbol}{p.amount}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{p.email}</td>
                    {canRefund && (
                      <td className="px-4 py-3 text-right">
                        {p.status.toLowerCase() === 'complete' && (
                          <Button variant="outline" size="sm" onClick={() => refund(p.id)} disabled={refundingId !== null}>
                            {refundingId === p.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Undo2 className="h-3.5 w-3.5" />} Refund
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Give package modal */}
      {showGive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeGive}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold tracking-tight">Give a package</h3>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Creates a manual payment. Set price to 0 to give it for free.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Recipient (username / IGN)</label>
                <Input value={ign} onChange={e => setIgn(e.target.value)} placeholder="Notch" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Package ID</label>
                <Input value={packageId} onChange={e => setPackageId(e.target.value)} inputMode="numeric" placeholder="123456" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Note (optional)</label>
                <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Giveaway winner" className="mt-1" />
              </div>
            </div>
            {formError && <p className="mt-3 text-sm text-[var(--color-danger)]">{formError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeGive} disabled={submitting}>Cancel</Button>
              <Button onClick={givePackage} disabled={submitting || !ign.trim() || !packageId.trim()}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Create
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
