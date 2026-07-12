'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Coupon {
  id:        number
  code:      string
  discount:  { type: string; percentage: number; value: number }
  effective: { type: string }
}

const selectClass =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]'

export default function CouponsTab() {
  const [coupons, setCoupons]         = useState<Coupon[] | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [code, setCode]               = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'value'>('percentage')
  const [amount, setAmount]           = useState('')
  const [effectiveOn, setEffectiveOn] = useState<'cart' | 'package' | 'category'>('cart')
  const [ids, setIds]                 = useState('')
  const [busy, setBusy]               = useState(false)
  const [formError, setFormError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await fetch('/api/admin/coupons')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Failed to load coupons.')
      setCoupons(d.coupons as Coupon[])
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load coupons.') }
  }, [])
  useEffect(() => { load() }, [load])

  const create = async () => {
    if (busy) return
    setBusy(true); setFormError(null)
    try {
      const r = await fetch('/api/admin/coupons', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim(), discountType, amount: Number(amount), effectiveOn, ids }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Failed to create coupon.')
      setCode(''); setAmount(''); setIds(''); setEffectiveOn('cart')
      await load()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Failed to create coupon.') }
    finally { setBusy(false) }
  }

  const remove = async (id: number) => {
    if (!window.confirm(`Delete coupon #${id}?`)) return
    try {
      const r = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Delete failed.')
      await load()
    } catch (e) { window.alert(e instanceof Error ? e.message : 'Delete failed.') }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-bold tracking-tight">Create coupon</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Code</label>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="SUMMER10" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Amount</label>
            <Input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="10" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Discount type</label>
            <select value={discountType} onChange={e => setDiscountType(e.target.value as 'percentage' | 'value')} className={`mt-1 ${selectClass}`}>
              <option value="percentage">Percentage (%)</option>
              <option value="value">Fixed value</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Applies to</label>
            <select value={effectiveOn} onChange={e => setEffectiveOn(e.target.value as 'cart' | 'package' | 'category')} className={`mt-1 ${selectClass}`}>
              <option value="cart">Whole cart</option>
              <option value="package">Package(s)</option>
              <option value="category">Category(ies)</option>
            </select>
          </div>
          {effectiveOn !== 'cart' && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">{effectiveOn === 'package' ? 'Package' : 'Category'} IDs (comma separated)</label>
              <Input value={ids} onChange={e => setIds(e.target.value)} placeholder="123, 456" className="mt-1" />
            </div>
          )}
        </div>
        {formError && <p className="mt-3 text-sm text-[var(--color-danger)]">{formError}</p>}
        <div className="mt-4">
          <Button onClick={create} disabled={busy || !code.trim() || !amount.trim()}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create coupon
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-danger)]">
          <AlertCircle className="h-4 w-4" /> {error}
        </Card>
      )}

      {!error && !coupons && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading coupons…
        </Card>
      )}

      {!error && coupons && coupons.length === 0 && (
        <Card className="p-6 text-sm text-[var(--color-muted-foreground)]">No coupons yet.</Card>
      )}

      {!error && coupons && coupons.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Applies to</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 font-mono">{c.code}</td>
                    <td className="px-4 py-3">
                      {c.discount?.type === 'percentage' ? `${c.discount.percentage}%` : c.discount?.value}
                    </td>
                    <td className="px-4 py-3 capitalize">{c.effective?.type ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => remove(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
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
