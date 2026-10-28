'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField, FormSection } from '@/components/dashboard/FormField'
import { Notice } from '@/components/dashboard/Notice'
import { RowMenu } from '@/components/dashboard/RowMenu'
import { SaveBar } from '@/components/dashboard/SaveBar'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { ArrowLeft, CircleNotch, PencilSimple, ShieldCheck, Trash, UserPlus } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ADMIN_PERMISSIONS, ROLE_TEMPLATES, type AdminPermission, type RoleTemplate } from '@/lib/adminPerms'
import { ADMIN_NAV_GROUPS, PERMISSION_GROUP } from '@/lib/adminTabs'
import { fillCopy, type AdminCopy } from '@/lib/i18n'
import { useAdminResource } from '@/lib/useAdminResource'
import { ADMIN_URL, addTeamMember, removeTeamMember, updateTeamMember } from './adminRequests'
import { AreaHeader, AreaLoad, ConfirmAction, useAdminCopy, useFlash, type FlashMessage } from './adminUi'

export interface TeamMember {
  discordUserId: string
  displayName: string | null
  isOwner: boolean
  permissions: AdminPermission[]
  active: boolean
}

const nameOf = (m: Pick<TeamMember, 'displayName' | 'discordUserId'>) => m.displayName ?? m.discordUserId
const TEMPLATES = Object.keys(ROLE_TEMPLATES) as RoleTemplate[]
/** Groups that have permissions, in the order of the sidebar. */
const PERMISSION_GROUPS = ADMIN_NAV_GROUPS.filter(g => g !== 'start').map(group => ({
  group: group as Exclude<typeof group, 'start'>,
  permissions: ADMIN_PERMISSIONS.filter(p => PERMISSION_GROUP[p] === group),
}))

/** Starting points that set the boxes, and the boxes grouped like the navigation. */
function PermissionPicker({ selected, onChange, idPrefix, sections }: {
  selected: ReadonlySet<AdminPermission>
  onChange: (next: Set<AdminPermission>) => void
  idPrefix: string
  /** Group headings as FormSections (editor) or as fieldsets (add form). */
  sections: boolean
}) {
  const { c } = useAdminCopy()
  const toggle = (p: AdminPermission) => {
    const next = new Set(selected)
    if (next.has(p)) next.delete(p); else next.add(p)
    onChange(next)
  }
  const templates = (
    <div className="flex flex-wrap items-start gap-2">
      {TEMPLATES.map(t => (
        <Button key={t} variant="outline" onClick={() => onChange(new Set(ROLE_TEMPLATES[t]))} title={c.team.templates[t].description}>
          {c.team.templates[t].label}
        </Button>
      ))}
    </div>
  )
  const boxes = (perms: readonly AdminPermission[]) => (
    <div className="grid gap-1 @2xl:grid-cols-2">
      {perms.map(p => (
        <label key={p} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-sm px-1 py-1.5 hover:bg-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={selected.has(p)}
            onChange={() => toggle(p)}
            aria-describedby={`${idPrefix}-${p}-desc`}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
          />
          <span className="grid gap-0.5">
            <span className="font-semibold">{c.permissions[p].label}</span>
            <span id={`${idPrefix}-${p}-desc`} className="text-small text-[var(--color-muted-foreground)]">{c.permissions[p].description}</span>
          </span>
        </label>
      ))}
    </div>
  )

  if (sections) {
    return (
      <>
        <FormSection title={c.team.s_templates} description={c.team.s_templates_desc}>{templates}</FormSection>
        {PERMISSION_GROUPS.map(({ group, permissions }) => (
          <FormSection key={group} title={c.groups[group]} description={fillCopy(c.team.group_desc, { group: c.groups[group] })}>
            {boxes(permissions)}
          </FormSection>
        ))}
      </>
    )
  }
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <p className="font-semibold">{c.team.s_templates}</p>
        <p className="text-small text-[var(--color-muted-foreground)]">{c.team.s_templates_desc}</p>
        {templates}
      </div>
      {PERMISSION_GROUPS.map(({ group, permissions }) => (
        <fieldset key={group} className="grid gap-1">
          <legend className="mb-1 font-semibold">{c.groups[group]}</legend>
          {boxes(permissions)}
        </fieldset>
      ))}
    </div>
  )
}

function teamColumns(c: AdminCopy, selfId: string, onEdit: (m: TeamMember) => void, onRemoved: (m: TeamMember) => Promise<void>): DataColumn<TeamMember>[] {
  return [
    {
      id: 'member', header: c.team.col_member, sortValue: m => nameOf(m), className: 'min-w-[14rem]',
      cell: m => (
        <div className="grid gap-0.5">
          <span className="flex flex-wrap items-center gap-2 font-semibold">
            {nameOf(m)}
            {m.discordUserId === selfId && <span className="text-small font-normal text-[var(--color-muted-foreground)]">({c.team.you})</span>}
            {m.isOwner && <StatusBadge tone="success" icon={ShieldCheck}>{c.owner}</StatusBadge>}
          </span>
          <span className="font-mono text-small text-[var(--color-muted-foreground)]">{m.discordUserId}</span>
        </div>
      ),
    },
    {
      id: 'status', header: c.team.col_status, nowrap: true, sortValue: m => (m.active ? 0 : 1),
      cell: m => (m.active ? <StatusBadge tone="success">{c.team.active}</StatusBadge> : <StatusBadge tone="neutral">{c.team.inactive}</StatusBadge>),
    },
    {
      id: 'perms', header: c.team.col_perms, nowrap: true, sortValue: m => (m.isOwner ? ADMIN_PERMISSIONS.length + 1 : m.permissions.length),
      cell: m => (m.isOwner ? c.team.all_perms : fillCopy(c.team.perm_count, { count: m.permissions.length, total: ADMIN_PERMISSIONS.length })),
    },
    {
      id: 'actions', header: <span className="sr-only">{c.common.actions}</span>, nowrap: true,
      cell: m => (m.isOwner ? null : (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(m)}><PencilSimple className="h-4 w-4" />{c.team.edit}</Button>
          {m.discordUserId !== selfId && (
            <ConfirmAction
              title={fillCopy(c.team.remove_title, { name: nameOf(m) })}
              description={c.team.remove_body}
              confirmLabel={c.team.remove_confirm}
              failMessage={c.team.remove_failed}
              run={async () => { await removeTeamMember(m.discordUserId, c.team.remove_failed); await onRemoved(m) }}
              trigger={open => (
                <RowMenu
                  label={fillCopy(c.common.more_actions, { name: nameOf(m) })}
                  items={[{ id: 'remove', label: c.team.remove, icon: Trash, danger: true, onSelect: open }]}
                />
              )}
            />
          )}
        </div>
      )),
    },
  ]
}

export function TeamView({ members, selfId, reload }: { members: TeamMember[]; selfId: string; reload: () => Promise<void> }) {
  const { c } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [editingId, setEditingId] = useState<string | null>(null)
  const columns = useMemo(() => teamColumns(c, selfId, m => setEditingId(m.discordUserId), async m => {
    setFlash({ tone: 'success', text: fillCopy(c.team.removed, { name: nameOf(m) }) })
    await reload()
  }), [c, selfId, setFlash, reload])
  const editing = editingId ? members.find(m => m.discordUserId === editingId && !m.isOwner) ?? null : null

  if (editing) {
    return (
      <MemberEditor
        key={editing.discordUserId}
        member={editing}
        self={editing.discordUserId === selfId}
        onBack={() => setEditingId(null)}
        onSaved={async message => { setFlash(message); await reload() }}
        flash={flash}
      />
    )
  }

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {flash}
      <DataTable
        caption={c.team.caption}
        captionHidden
        columns={columns}
        rows={members}
        rowKey={m => m.discordUserId}
        empty={<EmptyState kind="first-use" title={c.team.empty_title}>{c.team.empty_body}</EmptyState>}
        className="max-w-[72rem]"
      />
      <AddMemberForm onAdded={async name => { setFlash({ tone: 'success', text: fillCopy(c.team.add_done, { name }) }); await reload() }} />
    </div>
  )
}

/** The permissions of one member, grouped like the navigation, with a save bar (plan 6.6). */
export function MemberEditor({ member, self, onBack, onSaved, flash }: {
  member: TeamMember
  self: boolean
  onBack: () => void
  onSaved: (message: FlashMessage) => Promise<void>
  flash: ReactNode
}) {
  const { c } = useAdminCopy()
  const [perms, setPerms] = useState<Set<AdminPermission>>(() => new Set(member.permissions))
  const [active, setActive] = useState(member.active)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const original = new Set(member.permissions)
  const dirty = active !== member.active || perms.size !== original.size || [...perms].some(p => !original.has(p))

  async function save() {
    setBusy(true)
    setFailure(null)
    try {
      // In the order of the list, so the stored array reads like the form.
      await updateTeamMember(member.discordUserId, { permissions: ADMIN_PERMISSIONS.filter(p => perms.has(p)), active }, c.team.failed)
      await onSaved({ tone: 'success', text: fillCopy(c.team.saved, { name: nameOf(member) }) })
    } catch (e) {
      setFailure(e instanceof Error ? e.message : c.team.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid max-w-[72rem] gap-[var(--app-gutter-y)]">
      <Button variant="ghost" className="w-fit" onClick={onBack}><ArrowLeft className="h-4 w-4" />{c.team.back}</Button>
      {flash}
      {failure && <Notice tone="danger" role="alert" title={failure} />}
      <SectionCard title={fillCopy(c.team.editor_title, { name: nameOf(member) })} description={<span className="font-mono">{member.discordUserId}</span>}>
        {self && <Notice tone="info" className="mb-5">{c.team.self_note}</Notice>}
        <FormSection title={c.team.s_access} description={c.team.s_access_desc}>
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} aria-describedby="member-active-hint" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]" />
            <span className="grid gap-0.5">
              <span className="font-semibold">{c.team.f_active}</span>
              <span id="member-active-hint" className="text-small text-[var(--color-muted-foreground)]">{c.team.f_active_hint}</span>
            </span>
          </label>
        </FormSection>
        <PermissionPicker selected={perms} onChange={setPerms} idPrefix={`member-${member.discordUserId}`} sections />
      </SectionCard>
      <SaveBar
        show={dirty}
        message={c.common.unsaved}
        saveLabel={c.team.save}
        discardLabel={c.common.discard}
        onSave={() => void save()}
        onDiscard={() => { setPerms(new Set(member.permissions)); setActive(member.active) }}
        busy={busy}
      />
    </div>
  )
}

function AddMemberForm({ onAdded }: { onAdded: (name: string) => Promise<void> }) {
  const { c } = useAdminCopy()
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [perms, setPerms] = useState<Set<AdminPermission>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{5,32}$/.test(id.trim())) { setError(c.team.err_id); return }
    setError(null)
    setFailure(null)
    setBusy(true)
    try {
      await addTeamMember({ discordUserId: id, displayName: name, permissions: ADMIN_PERMISSIONS.filter(p => perms.has(p)) }, c.team.add_failed)
      const added = name.trim() || id.trim()
      setId(''); setName(''); setPerms(new Set())
      await onAdded(added)
    } catch (err) {
      setFailure(err instanceof Error ? err.message : c.team.add_failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard title={c.team.add_title} description={c.team.add_desc} className="max-w-[72rem]">
      <form onSubmit={submit} noValidate className="grid gap-5">
        <div className="grid gap-5 @2xl:grid-cols-2">
          <FormField label={c.team.f_id} hint={c.team.f_id_hint} error={error} required>
            {field => <Input {...field} value={id} onChange={e => setId(e.target.value)} inputMode="numeric" autoComplete="off" className="font-mono" />}
          </FormField>
          <FormField label={c.team.f_name} hint={c.team.f_name_hint}>
            {field => <Input {...field} value={name} onChange={e => setName(e.target.value)} autoComplete="off" />}
          </FormField>
        </div>
        <PermissionPicker selected={perms} onChange={setPerms} idPrefix="new-member" sections={false} />
        {failure && <p role="alert" className="font-semibold text-[var(--color-danger)]">{failure}</p>}
        <div>
          <Button type="submit" disabled={busy} aria-busy={busy || undefined}>
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {c.team.add_submit}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

export default function TeamArea({ selfId }: { selfId: string }) {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<TeamMember[]>(ADMIN_URL.team, 'members', c.team.load_failed)
  return (
    <>
      <AreaHeader area="team" description={c.team.lead} />
      <AreaLoad data={data} error={error} retry={reload}>
        {members => <TeamView members={members} selfId={selfId} reload={reload} />}
      </AreaLoad>
    </>
  )
}
