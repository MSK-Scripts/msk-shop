'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, Plus, Ban } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface GiftCard {
  id:      number
  code:    string
  balance: { starting: string; remaining: string; currency: string }
  void:    boolean
}

export default function GiftCardsTab() {
  const [cards, setCards]     = useState<GiftCard[] | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [amount, setAmount]   = useState('')
  const [note, setNote]       = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [busy, setBusy]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await fetch('/api/admin/giftcards')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Failed to load gift cards.')
      setCards(d.giftCards as GiftCard[])
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load gift cards.') }
  }, [])
  useEffect(() => { load() }, [load])

  const create = async () => {
    if (busy) return
    setBusy(true); setFormError(null)
    try {
      const r = await fetch('/api/admin/giftcards', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: Number(amount), note: note.trim() || undefined, expiresAt: expiresAt || undefined }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Failed to create gift card.')
      setAmount(''); setNote(''); setExpiresAt('')
      await load()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Failed to create gift card.') }
    finally { setBusy(false) }
  }

  const topUp = async (id: number) => {
    const input = window.prompt('Top-up amount:')
    if (input === null) return
    const value = Number(input)
    if (!Number.isFinite(value) || value <= 0) { window.alert('Enter a number greater than 0.'); return }
    try {
      const r = await fetch(`/api/admin/giftcards/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: value }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Top-up failed.')
      await load()
    } catch (e) { window.alert(e instanceof Error ? e.message : 'Top-up failed.') }
  }

  const voidCard = async (id: number) => {
    if (!window.confirm(`Void gift card #${id}? This disables it.`)) return
    try {
      const r = await fetch(`/api/admin/giftcards/${id}`, { method: 'DELETE' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Void failed.')
      await load()
    } catch (e) { window.alert(e instanceof Error ? e.message : 'Void failed.') }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-bold tracking-tight">Create gift card</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Amount</label>
            <Input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="25" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Expires (optional)</label>
            <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Note (optional)</label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Support goodwill" className="mt-1" />
          </div>
        </div>
        {formError && <p className="mt-3 text-sm text-[var(--color-danger)]">{formError}</p>}
        <div className="mt-4">
          <Button onClick={create} disabled={busy || !amount.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create gift card
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-danger)]">
          <AlertCircle className="h-4 w-4" /> {error}
        </Card>
      )}

      {!error && !cards && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading gift cards…
        </Card>
      )}

      {!error && cards && cards.length === 0 && (
        <Card className="p-6 text-sm text-[var(--color-muted-foreground)]">No gift cards yet.</Card>
      )}

      {!error && cards && cards.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {cards.map(c => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 font-mono">{c.code}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {c.balance?.remaining} / {c.balance?.starting} {c.balance?.currency}
                    </td>
                    <td className="px-4 py-3">
                      {c.void
                        ? <span className="text-[var(--color-danger)]">Void</span>
                        : <span className="text-[var(--color-primary)]">Active</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!c.void && (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => topUp(c.id)}>Top up</Button>
                          <Button variant="outline" size="sm" onClick={() => voidCard(c.id)}>
                            <Ban className="h-3.5 w-3.5" /> Void
                          </Button>
                        </div>
                      )}
                    </td>
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
