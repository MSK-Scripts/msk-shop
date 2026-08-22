'use client'

import { useState } from 'react'
import { Loader2, Pencil, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAdminResource } from '@/lib/useAdminResource'
import { ErrorCard } from '@/app/admin/ErrorCard'

interface Package {
  id:       number
  name:     string
  price:    number
  currency: string
}

export default function PackagesTab() {
  const { data: packages, error, reload } = useAdminResource<Package[]>(
    '/api/admin/packages', 'packages', 'Failed to load packages.',
  )

  const [editing, setEditing]   = useState<Package | null>(null)
  const [name, setName]         = useState('')
  const [price, setPrice]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [disablingId, setDisablingId] = useState<number | null>(null)

  const openEdit = (p: Package) => {
    setEditing(p); setName(p.name); setPrice(String(p.price)); setFormError(null)
  }
  const closeEdit = () => { if (!busy) setEditing(null) }

  const save = async () => {
    if (!editing || busy) return
    // Only send fields the admin actually changed — otherwise a name-only edit
    // would rewrite the price too (and the Plugin API stores price as an integer,
    // so blindly re-sending a decimal could corrupt it).
    const fields: { name?: string; price?: number } = {}
    if (name.trim() !== editing.name) fields.name = name.trim()
    const newPrice = Number(price)
    if (Number.isFinite(newPrice) && newPrice !== editing.price) fields.price = newPrice

    if (Object.keys(fields).length === 0) { setEditing(null); return }

    setBusy(true); setFormError(null)
    try {
      const r = await fetch(`/api/admin/packages/${editing.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(fields),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Update failed.')
      setEditing(null)
      await reload()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Update failed.') }
    finally { setBusy(false) }
  }

  const disable = async (p: Package) => {
    if (disablingId) return
    if (!window.confirm(`Disable "${p.name}"? It will be hidden from the store.`)) return
    setDisablingId(p.id)
    try {
      const r = await fetch(`/api/admin/packages/${p.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ disabled: true }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Disable failed.')
      await reload()
    } catch (e) { window.alert(e instanceof Error ? e.message : 'Disable failed.') }
    finally { setDisablingId(null) }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Only name, price and visibility are editable via the API. Disabled packages are hidden here (re-enable them in the Tebex panel).
      </p>

      {error && (
        <ErrorCard message={error} />
      )}

      {!error && !packages && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading packages…
        </Card>
      )}

      {!error && packages && packages.length === 0 && (
        <Card className="p-6 text-sm text-[var(--color-muted-foreground)]">No packages found.</Card>
      )}

      {!error && packages && packages.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {packages.map(p => (
                  <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{p.price} {p.currency}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => disable(p)} disabled={disablingId !== null}>
                          {disablingId === p.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <EyeOff className="h-3.5 w-3.5" />} Disable
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeEdit}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold tracking-tight">Edit package</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Price ({editing.currency})</label>
                <Input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" className="mt-1" />
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Only sent if changed. Verify the price on the store after saving.</p>
              </div>
            </div>
            {formError && <p className="mt-3 text-sm text-[var(--color-danger)]">{formError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeEdit} disabled={busy}>Cancel</Button>
              <Button onClick={save} disabled={busy || !name.trim()}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
