'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Form input primitives for the bot config editor.
// All Tailwind + MSK tokens, no runtime <style> injection (CSP-safe), native
// controls where possible (<select>, <input type="color">) for free a11y.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { SelectOption, IdKind } from '@/lib/botconfig/schema'
import type { Lang } from '@/lib/i18n'

const INPUT =
  'w-full bg-surface2 border border-borderlt rounded-lg px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-dim focus:border-accent focus:outline-none transition-colors'

// ── Field wrapper: label + optional help + optional error ────────────────────

export function Field({
  label, help, error, htmlFor, children,
}: {
  label: string
  help?: string
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {help && !error && <p className="text-xs text-muted-foreground leading-relaxed">{help}</p>}
      {error && <p className="text-xs text-danger leading-relaxed">{error}</p>}
    </div>
  )
}

// ── Toggle (switch) ──────────────────────────────────────────────────────────

export function Toggle({
  checked, onChange, label, help,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  help?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {help && <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{help}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-borderlt'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────────────────────

export function Select({
  value, onChange, options, lang,
}: {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  lang: Lang
}) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} className={INPUT}>
      {/* Keep an unknown current value visible instead of silently snapping to option 0 */}
      {value && !options.some(o => o.value === value) && <option value={value}>{value}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label[lang]}</option>
      ))}
    </select>
  )
}

// ── Text field ───────────────────────────────────────────────────────────────

export function TextField({
  value, onChange, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={INPUT}
    />
  )
}

// ── Textarea ─────────────────────────────────────────────────────────────────

export function TextArea({
  value, onChange, rows = 4, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <textarea
      value={value ?? ''}
      rows={rows}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`${INPUT} font-mono resize-y`}
    />
  )
}

// ── Number ───────────────────────────────────────────────────────────────────

export function NumberInput({
  value, onChange, min, max,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  const [text, setText] = useState(String(value ?? 0))
  const ref = useRef<HTMLInputElement>(null)
  // Sync local text when the model value changes from outside, but never while
  // the user is actively typing in this field.
  useEffect(() => {
    if (document.activeElement !== ref.current) setText(String(value ?? 0))
  }, [value])
  return (
    <input
      ref={ref}
      type="number"
      value={text}
      min={min}
      max={max}
      onChange={e => setText(e.target.value)}
      onBlur={() => {
        let n = Number(text)
        if (!Number.isFinite(n)) n = min ?? 0
        if (min !== undefined && n < min) n = min
        if (max !== undefined && n > max) n = max
        setText(String(n))
        onChange(n)
      }}
      className={INPUT}
    />
  )
}

// ── Color picker ─────────────────────────────────────────────────────────────

export function ColorPicker({
  value, onChange, emptyHint,
}: {
  value: string
  onChange: (v: string) => void
  emptyHint?: string
}) {
  const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value ?? '')
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={isHex ? value : '#5eb131'}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-9 rounded-lg border border-borderlt bg-surface2 cursor-pointer shrink-0"
        aria-label="Color"
      />
      <input
        type="text"
        value={value ?? ''}
        placeholder={emptyHint ?? '#rrggbb'}
        onChange={e => onChange(e.target.value)}
        className={`${INPUT} font-mono`}
      />
    </div>
  )
}

// ── Emoji ────────────────────────────────────────────────────────────────────

export function EmojiInput({
  value, onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="text"
      value={value ?? ''}
      placeholder="💡 or <:name:id>"
      onChange={e => onChange(e.target.value)}
      className={`${INPUT} w-24`}
    />
  )
}

// ── Tag input for Discord ID lists ───────────────────────────────────────────

const SNOWFLAKE_RE = /^\d{17,20}$/

export function TagInput({
  value, onChange, idKind,
}: {
  value: string[]
  onChange: (v: string[]) => void
  idKind?: IdKind
}) {
  const [draft, setDraft] = useState('')
  const items = Array.isArray(value) ? value : []

  const commit = (raw: string) => {
    const parts = raw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
    if (parts.length === 0) return
    const next = [...items]
    for (const p of parts) if (!next.includes(p)) next.push(p)
    onChange(next)
    setDraft('')
  }

  const remove = (id: string) => onChange(items.filter(x => x !== id))

  return (
    <div className={`${INPUT} flex flex-wrap items-center gap-1.5 min-h-[42px] py-1.5`}>
      {items.map(id => {
        const bad = !SNOWFLAKE_RE.test(id)
        return (
          <span
            key={id}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono ${
              bad ? 'bg-danger/15 text-danger border border-danger/40' : 'bg-accent/15 text-accent border border-accent/30'
            }`}
            title={bad ? 'Not a valid Discord ID (17–20 digits)' : idKind}
          >
            {id}
            <button type="button" onClick={() => remove(id)} className="opacity-70 hover:opacity-100">
              <X size={11} />
            </button>
          </span>
        )
      })}
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(draft) }
          else if (e.key === 'Backspace' && draft === '' && items.length) remove(items[items.length - 1])
        }}
        onBlur={() => commit(draft)}
        placeholder={items.length ? '' : 'ID + Enter'}
        className="flex-1 min-w-[80px] bg-transparent text-sm text-foreground placeholder:text-dim focus:outline-none"
      />
    </div>
  )
}
