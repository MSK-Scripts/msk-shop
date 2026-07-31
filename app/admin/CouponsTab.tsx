'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { selectClass } from './styles'
import { useAdminResource } from '@/lib/useAdminResource'

interface Coupon {
  id:        number
  code:      string
  discount:  { type: string; percentage: number; value: number }
  effective: { type: string }
  expire?:   { expire_never?: boolean; date?: string | null }
}

interface CatalogItem { id: number; name: string }

export default function CouponsTab() {
  const { data: coupons, error, reload } = useAdminResource<Coupon[]>(
    '/api/admin/coupons', 'coupons', 'Failed to load coupons.',
  )
  const [packages, setPackages]       = useState<CatalogItem[]>([])
  const [categories, setCategories]   = useState<CatalogItem[]>([])

  const [code, setCode]               = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'value'>('percentage')
  const [amount, setAmount]           = useState('')
  const [effectiveOn, setEffectiveOn] = useState<'cart' | 'package' | 'category'>('cart')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [busy, setBusy]               = useState(false)
  const [formError, setFormError]     = useState<string | null>(null)

  // Catalog for the package/category picker.
  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/catalog')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d) { setPackages(d.packages); setCategories(d.categories) } })
      .catch(() => { /* pickers stay empty */ })
    return () => { cancelled = true }
  }, [])

  const create = async () => {
    if (busy) return
    setBusy(true); setFormError(null)
    try {
      const r = await fetch('/api/admin/coupons', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim(), discountType, amount: Number(amount), effectiveOn, ids: selectedIds.join(',') }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Failed to create coupon.')
      setCode(''); setAmount(''); setSelectedIds([]); setEffectiveOn('cart')
      await reload()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Failed to create coupon.') }
    finally { setBusy(false) }
  }

  const remove = async (id: number) => {
    if (!window.confirm(`Delete coupon #${id}?`)) return
    try {
      const r = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Delete failed.')
      await reload()
    } catch (e) { window.alert(e instanceof Error ? e.message : 'Delete failed.') }
  }

  const options = effectiveOn === 'package' ? packages : categories

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
            <select value={effectiveOn} onChange={e => { setEffectiveOn(e.target.value as 'cart' | 'package' | 'category'); setSelectedIds([]) }} className={`mt-1 ${selectClass}`}>
              <option value="cart">Whole cart</option>
              <option value="package">Package(s)</option>
              <option value="category">Category(ies)</option>
            </select>
          </div>
          {effectiveOn !== 'cart' && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Select {effectiveOn === 'package' ? 'package(s)' : 'category(ies)'}</label>
              <select
                multiple
                value={selectedIds}
                onChange={e => setSelectedIds(Array.from(e.target.selectedOptions, o => o.value))}
                className={`mt-1 h-40 ${selectClass}`}
              >
                {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Hold Ctrl/Cmd to select more than one.</p>
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
                  <th className="px-4 py-3 font-medium">Expires</th>
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
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted-foreground)]">
                      {c.expire?.expire_never ? 'Never' : (c.expire?.date || '—')}
                    </td>
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
