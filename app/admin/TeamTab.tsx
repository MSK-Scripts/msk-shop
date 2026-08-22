'use client'

import { useState } from 'react'
import { Loader2, UserPlus, Trash2 } from 'lucide-react'
import { ADMIN_PERMISSIONS, PERMISSION_LABELS, type AdminPermission } from '@/lib/adminPerms'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAdminResource } from '@/lib/useAdminResource'
import { ErrorCard } from '@/app/admin/ErrorCard'

interface Member {
  discordUserId: string
  displayName:   string | null
  isOwner:       boolean
  permissions:   AdminPermission[]
  active:        boolean
}

function PermissionChecks({ selected, onToggle }: { selected: Set<AdminPermission>; onToggle: (p: AdminPermission) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ADMIN_PERMISSIONS.map(p => (
        <label key={p} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={selected.has(p)} onChange={() => onToggle(p)} className="accent-[var(--color-primary)]" />
          {PERMISSION_LABELS[p].label}
        </label>
      ))}
    </div>
  )
}

function MemberRow({ m, selfId, onChanged }: { m: Member; selfId: string; onChanged: () => void }) {
  const [perms, setPerms]   = useState<Set<AdminPermission>>(new Set(m.permissions))
  const [active, setActive] = useState(m.active)
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  const toggle = (p: AdminPermission) =>
    setPerms(prev => { const n = new Set(prev); if (n.has(p)) n.delete(p); else n.add(p); return n })

  const save = async () => {
    if (busy) return
    setBusy(true); setErr(null)
    try {
      const r = await fetch(`/api/admin/team/${m.discordUserId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ permissions: [...perms], active }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Save failed.')
      onChanged()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed.') }
    finally { setBusy(false) }
  }

  const remove = async () => {
    if (busy) return
    if (!window.confirm(`Remove ${m.displayName ?? m.discordUserId} from the admin team?`)) return
    setBusy(true); setErr(null)
    try {
      const r = await fetch(`/api/admin/team/${m.discordUserId}`, { method: 'DELETE' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Remove failed.')
      onChanged()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Remove failed.'); setBusy(false) }
  }

  if (m.isOwner) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{m.displayName ?? m.discordUserId}</span>
            <span className="ml-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">Owner</span>
          </div>
          <span className="text-xs text-[var(--color-muted-foreground)]">All permissions</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-medium">{m.displayName ?? m.discordUserId}</span>
          <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">{m.discordUserId}</span>
          {m.discordUserId === selfId && <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">(you)</span>}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="accent-[var(--color-primary)]" />
          Active
        </label>
      </div>
      <div className="mt-4">
        <PermissionChecks selected={perms} onToggle={toggle} />
      </div>
      {err && <p className="mt-3 text-sm text-[var(--color-danger)]">{err}</p>}
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </Button>
        <Button variant="outline" size="sm" onClick={remove} disabled={busy}>
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </Button>
      </div>
    </Card>
  )
}

export default function TeamTab({ selfId }: { selfId: string }) {
  const { data: members, error, reload } = useAdminResource<Member[]>(
    '/api/admin/team', 'members', 'Failed to load team.',
  )

  const [newId, setNewId]     = useState('')
  const [newName, setNewName] = useState('')
  const [newPerms, setNewPerms] = useState<Set<AdminPermission>>(new Set())
  const [busy, setBusy]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const add = async () => {
    if (busy) return
    setBusy(true); setFormError(null)
    try {
      const r = await fetch('/api/admin/team', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ discordUserId: newId.trim(), displayName: newName.trim() || undefined, permissions: [...newPerms] }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Failed to add member.')
      setNewId(''); setNewName(''); setNewPerms(new Set())
      await reload()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Failed to add member.') }
    finally { setBusy(false) }
  }

  const toggleNew = (p: AdminPermission) =>
    setNewPerms(prev => { const n = new Set(prev); if (n.has(p)) n.delete(p); else n.add(p); return n })

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight"><UserPlus className="h-5 w-5" /> Add team member</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Discord user id</label>
            <Input value={newId} onChange={e => setNewId(e.target.value)} inputMode="numeric" placeholder="123456789012345678" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Display name (optional)</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane" className="mt-1" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-sm font-medium">Permissions</span>
          <div className="mt-2"><PermissionChecks selected={newPerms} onToggle={toggleNew} /></div>
        </div>
        {formError && <p className="mt-3 text-sm text-[var(--color-danger)]">{formError}</p>}
        <div className="mt-4">
          <Button onClick={add} disabled={busy || !newId.trim()}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Add member
          </Button>
        </div>
      </Card>

      {error && (
        <ErrorCard message={error} />
      )}

      {!error && !members && (
        <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
        </Card>
      )}

      {!error && members && members.map(m => (
        <MemberRow key={m.discordUserId} m={m} selfId={selfId} onChanged={reload} />
      ))}
    </div>
  )
}
