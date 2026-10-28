'use client'

import { useId, useMemo, useState, type ReactNode, type TextareaHTMLAttributes } from 'react'

import { FormField } from '@/components/dashboard/FormField'
import { WarningCircle, X, Trash, Lightning } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input, fieldClassName } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { useGiveawayCopy, type GiveawayCopy } from './GiveawayProvider'
import {
  DURATION_UNITS, MAX_BONUS, MIN_BONUS, splitPrizes,
  type Channel, type DurationInput, type PrizeMode, type Role, type WinnerMode,
} from './giveawayModel'

/**
 * The building blocks of the giveaway, template and settings forms.
 *
 * Every field sits in a FormField or a FieldGroup: the label points at the
 * control, hint and error are its description, an error sets aria-invalid.
 * Widths follow the expected input (plan 6.5): a number is short, a title
 * long, a text block capped to a readable measure.
 */

/** Width caps by what goes in. */
export const WIDTH = {
  number: 'max-w-[9rem]',
  short:  'max-w-[16rem]',
  select: 'max-w-[28rem]',
  text:   'max-w-[40rem]',
  block:  'max-w-[48rem]',
} as const

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClassName, 'min-h-[7.5rem] resize-y', WIDTH.block, className)} {...props} />
}

/**
 * Several controls under one name, a role list or a number with its unit:
 * a fieldset whose legend looks like the label of a FormField, with hint and
 * error tied to the group.
 */
export function FieldGroup({ legend, hint, error, children, className }: {
  legend: ReactNode
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
  className?: string
}) {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <fieldset aria-describedby={describedBy} aria-invalid={error ? true : undefined} className={cn('grid min-w-0 content-start gap-1.5', className)}>
      <legend className="mb-1.5 font-semibold">{legend}</legend>
      {hint && <p id={`${id}-hint`} className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-small font-semibold text-[var(--color-danger)]">
          <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </fieldset>
  )
}

// ── Choosing several: roles and packages ─────────────────────────────────────

export interface PickItem { id: string | number; label: string; color?: string }

/**
 * A searchable multiple choice with the chosen entries as chips (plan 6.5),
 * instead of a cloud of 45 role chips per list. Native checkboxes in a list
 * that scrolls in itself, so keyboard and screen reader work without script;
 * the search only narrows what the list shows.
 */
export function MultiPicker<Id extends string | number>({ legend, hint, items, value, onChange, copy, emptyLabel }: {
  legend: ReactNode
  hint?: ReactNode
  items: Array<PickItem & { id: Id }>
  value: Id[]
  onChange: (v: Id[]) => void
  copy: { search: string; chosen: string; none: string; noMatch: string; empty: string; remove: string }
  /** What an empty choice means: "Whole cart", "Everyone may enter". */
  emptyLabel?: string
}) {
  const [query, setQuery] = useState('')
  const chosen = useMemo(() => new Set<Id>(value), [value])
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter(i => i.label.toLowerCase().includes(q)) : items
  }, [items, query])
  const toggle = (id: Id) => onChange(chosen.has(id) ? value.filter(v => v !== id) : [...value, id])
  const nameOf = (id: Id) => items.find(i => i.id === id)?.label ?? String(id)

  return (
    <FieldGroup legend={legend} hint={hint} className={WIDTH.text}>
      <ul aria-label={copy.chosen} className="flex flex-wrap gap-2">
        {value.length === 0 && (
          <li className="flex min-h-11 items-center text-small text-[var(--color-muted-foreground)]">{emptyLabel ?? copy.none}</li>
        )}
        {value.map(id => (
          <li key={String(id)} className="inline-flex min-h-11 items-center gap-1 rounded-md border border-[color-mix(in_oklab,var(--color-primary)_45%,transparent)] bg-[var(--color-accent-soft)] pl-3 font-medium">
            {nameOf(id)}
            <button
              type="button"
              onClick={() => toggle(id)}
              aria-label={copy.remove.replace('{name}', nameOf(id))}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 ? (
        <p className="text-small text-[var(--color-muted-foreground)]">{copy.empty}</p>
      ) : (
        <>
          <Input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label={copy.search}
            autoComplete="off"
            className="mt-1"
          />
          <ul className="max-h-60 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-card)] py-1">
            {shown.length === 0 && (
              <li className="px-3 py-2.5 text-small text-[var(--color-muted-foreground)]">{copy.noMatch.replace('{q}', query.trim())}</li>
            )}
            {shown.map(item => (
              <li key={String(item.id)}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 hover:bg-[var(--color-muted)]">
                  <input
                    type="checkbox"
                    checked={chosen.has(item.id)}
                    onChange={() => toggle(item.id)}
                    className="h-5 w-5 shrink-0 accent-[var(--color-primary)]"
                  />
                  {item.color && item.color !== '#000000' && (
                    <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  )}
                  <span className="min-w-0 break-words">{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </FieldGroup>
  )
}

export function roleItems(roles: Role[]): Array<PickItem & { id: string }> {
  return roles.map(r => ({ id: r.id, label: `@${r.name}`, color: r.color }))
}

export function roleCopy(t: GiveawayCopy) {
  return { search: t.pick_search_roles, chosen: t.pick_chosen, none: t.pick_none, noMatch: t.pick_no_match, empty: t.pick_no_roles, remove: t.pick_remove }
}

// ── Single choices ───────────────────────────────────────────────────────────

export function RoleSelect({ label, hint, roles, value, onChange }: {
  label: string; hint?: string; roles: Role[]; value: string | null; onChange: (v: string | null) => void
}) {
  const { t } = useGiveawayCopy()
  return (
    <FormField label={label} hint={hint}>
      {field => (
        <Select {...field} value={value ?? ''} onChange={e => onChange(e.target.value || null)} className={WIDTH.select}>
          <option value="">{t.s_none_option}</option>
          {roles.map(r => <option key={r.id} value={r.id}>@{r.name}</option>)}
        </Select>
      )}
    </FormField>
  )
}

export function ChannelSelect({ label, hint, channels, value, onChange, placeholder, error, required }: {
  label: string; hint?: string; channels: Channel[]; value: string; onChange: (v: string) => void
  /** The empty first option: "Choose a channel" or "None". */
  placeholder: string
  error?: string
  required?: boolean
}) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {field => (
        <Select {...field} value={value} onChange={e => onChange(e.target.value)} className={WIDTH.select}>
          <option value="">{placeholder}</option>
          {channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
        </Select>
      )}
    </FormField>
  )
}

// ── Bonus entries ────────────────────────────────────────────────────────────

/**
 * Bonus entries per role. Not a multiple choice but a mapping: each role
 * carries a count, hence one row per role with its number.
 */
export function BonusEditor({ roles, value, onChange }: {
  roles: Role[]; value: Record<string, number>; onChange: (v: Record<string, number>) => void
}) {
  const { t } = useGiveawayCopy()
  const current = value ?? {}
  const entries = Object.entries(current)
  const available = roles.filter(r => !(r.id in current))
  const nameOf = (id: string) => `@${roles.find(r => r.id === id)?.name ?? id}`

  const set = (id: string, amount: number) => onChange({ ...current, [id]: amount })
  const remove = (id: string) => {
    const next = { ...current }
    delete next[id]
    onChange(next)
  }

  return (
    <FieldGroup legend={t.s_bonus} hint={t.s_bonus_hint} className={WIDTH.text}>
      {entries.length === 0 && <p className="text-small text-[var(--color-muted-foreground)]">{t.s_bonus_none}</p>}
      {entries.length > 0 && (
        <ul className="grid gap-2">
          {entries.map(([id, amount]) => (
            <li key={id} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate font-medium">{nameOf(id)}</span>
              <span aria-hidden className="text-[var(--color-muted-foreground)]">+</span>
              <Input
                type="number" min={MIN_BONUS} max={MAX_BONUS} inputMode="numeric"
                value={amount}
                aria-label={t.s_bonus_amount.replace('{name}', nameOf(id))}
                onChange={e => set(id, Number(e.target.value))}
                className="w-24"
              />
              <Button
                type="button" variant="ghost" size="icon" className="h-11 w-11"
                aria-label={t.s_bonus_remove.replace('{name}', nameOf(id))}
                onClick={() => remove(id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 && (
        // The value stays empty: the select is a way of adding, not a state.
        <Select
          value=""
          aria-label={t.s_bonus_add}
          onChange={e => { if (e.target.value) set(e.target.value, MIN_BONUS) }}
          className={cn('mt-1', WIDTH.select)}
        >
          <option value="">{t.s_bonus_add}</option>
          {available.map(r => <option key={r.id} value={r.id}>@{r.name}</option>)}
        </Select>
      )}
    </FieldGroup>
  )
}

// ── Prizes, winners, draw ────────────────────────────────────────────────────

/**
 * Prize list, distribution mode and number of winners.
 *
 * With "one prize per winner" the number of winners is no longer a separate
 * input but the length of the list. The field is therefore locked and kept in
 * sync, instead of letting the user submit first and then read an error message.
 */
export function PrizeFields({ prizes, setPrizes, mode, setMode, winners, setWinners, errors }: {
  prizes: string; setPrizes: (v: string) => void
  mode: PrizeMode; setMode: (v: PrizeMode) => void
  winners: string; setWinners: (v: string) => void
  errors: { prizes?: string; winners?: string }
}) {
  const { t } = useGiveawayCopy()
  const individual = mode === 'INDIVIDUAL'
  const count = splitPrizes(prizes).length
  const shownWinners = individual ? String(Math.max(count, 1)) : winners
  return (
    <>
      <FormField label={t.f_prizes} hint={t.f_prizes_hint} error={errors.prizes}>
        {field => <Textarea {...field} value={prizes} rows={4} maxLength={2000} onChange={e => setPrizes(e.target.value)} />}
      </FormField>
      <FormField label={t.f_prize_mode} hint={individual ? t.prize_mode_hint : undefined}>
        {field => (
          <Select {...field} value={mode} onChange={e => setMode(e.target.value as PrizeMode)} className={WIDTH.select}>
            <option value="ALL">{t.mode_all}</option>
            <option value="INDIVIDUAL">{t.mode_individual}</option>
          </Select>
        )}
      </FormField>
      <FormField label={t.f_winners} hint={individual ? t.f_winners_locked : undefined} error={errors.winners} required>
        {field => (
          <Input
            {...field}
            type="number" min={1} max={100} inputMode="numeric"
            value={shownWinners}
            disabled={individual}
            onChange={e => setWinners(e.target.value)}
            className={WIDTH.number}
          />
        )}
      </FormField>
    </>
  )
}

/**
 * The winner-selection picker. The hint only shows for FIRST_CLICK: that is
 * where the meaning of the button in the giveaway changes and three things
 * work differently (no bonus entries, no withdrawing, the duration as a
 * deadline). RANDOM has nothing to explain.
 */
export function DrawModeField({ mode, setMode, editing = false, error }: {
  mode: WinnerMode; setMode: (v: WinnerMode) => void; editing?: boolean; error?: string
}) {
  const { t } = useGiveawayCopy()
  const hint = mode === 'FIRST_CLICK' ? `${t.draw_first_click_hint}${editing ? ` ${t.draw_first_click_edit_hint}` : ''}` : undefined
  return (
    <FormField label={t.f_draw_mode} hint={hint} error={error}>
      {field => (
        <Select {...field} value={mode} onChange={e => setMode(e.target.value as WinnerMode)} className={WIDTH.select}>
          <option value="RANDOM">{t.draw_random}</option>
          <option value="FIRST_CLICK">{t.draw_first_click}</option>
        </Select>
      )}
    </FormField>
  )
}

/** A duration as a number and a unit (plan 6.5). */
export function DurationField({ label, hint, value, onChange, error }: {
  label: string; hint?: string; value: DurationInput; onChange: (v: DurationInput) => void; error?: string
}) {
  const { t } = useGiveawayCopy()
  const unitLabel = { m: t.unit_minutes, h: t.unit_hours, d: t.unit_days }
  return (
    <FormField label={label} hint={hint} error={error} required>
      {field => (
        <div className="flex flex-wrap items-center gap-3">
          <Input
            {...field}
            type="number" min={1} inputMode="numeric"
            value={value.amount}
            onChange={e => onChange({ ...value, amount: e.target.value })}
            className={WIDTH.number}
          />
          <Select
            value={value.unit}
            aria-label={t.unit_label}
            onChange={e => onChange({ ...value, unit: e.target.value as DurationInput['unit'] })}
            className="w-auto min-w-[9rem]"
          >
            {DURATION_UNITS.map(u => <option key={u} value={u}>{unitLabel[u]}</option>)}
          </Select>
        </div>
      )}
    </FormField>
  )
}

/** The small sign for "first click wins" next to a title. */
export function FirstClickTag() {
  const { t } = useGiveawayCopy()
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-label font-semibold text-[var(--color-primary)]">
      <Lightning className="h-3.5 w-3.5" weight="bold" />
      {t.draw_badge_fast}
    </span>
  )
}

/** A number field with its unit after it: "30 days". */
export function NumberWithUnit({ label, hint, unit, value, onChange, min = 0, max, error }: {
  label: string; hint?: string; unit: string; value: string | number; onChange: (v: string) => void
  min?: number; max?: number; error?: string
}) {
  return (
    <FormField label={label} hint={hint} error={error}>
      {field => (
        <div className="flex items-center gap-3">
          <Input
            {...field}
            type="number" min={min} max={max} inputMode="numeric"
            value={value}
            onChange={e => onChange(e.target.value)}
            className={WIDTH.number}
          />
          <span className="text-[var(--color-muted-foreground)]">{unit}</span>
        </div>
      )}
    </FormField>
  )
}
