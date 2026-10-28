'use client'

import { useState } from 'react'

import { FormField, FormSection } from '@/components/dashboard/FormField'
import { SaveBar } from '@/components/dashboard/SaveBar'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { Copy, X } from '@/components/icons'
import { Input, fieldClassName } from '@/components/ui/Input'
import { fillCopy } from '@/lib/i18n'
import { NEWS_POPUP_LIMITS, isAllowedHref, type NewsPopupSettings } from '@/lib/newsPopup'
import { useAdminResource } from '@/lib/useAdminResource'
import { cn } from '@/lib/utils'
import { ADMIN_URL, saveNewsPopup } from './adminRequests'
import { AreaHeader, AreaLoad, useAdminCopy, useFlash } from './adminUi'

/** Empty text and link mean "no button", which is how the API stores it. */
interface ButtonDraft { label: string; href: string }

export interface NewsPopupDraft {
  enabled: boolean
  title: string
  text: string
  button: ButtonDraft
  secondButton: ButtonDraft
  coupon: string
}

const toButton = (b: { label: string; href: string } | null): ButtonDraft => (b ? { label: b.label, href: b.href } : { label: '', href: '' })
const fromButton = (d: ButtonDraft) => (d.label.trim() && d.href.trim() ? { label: d.label.trim(), href: d.href.trim() } : null)

export function toDraft(s: NewsPopupSettings): NewsPopupDraft {
  return { enabled: s.enabled, title: s.title, text: s.text, button: toButton(s.button), secondButton: toButton(s.secondButton), coupon: s.coupon ?? '' }
}

/** What goes to the route: the same shape the old tab sent. */
export function fromDraft(d: NewsPopupDraft): NewsPopupSettings {
  return {
    enabled: d.enabled, title: d.title, text: d.text,
    button: fromButton(d.button), secondButton: fromButton(d.secondButton),
    coupon: d.coupon.trim() ? d.coupon.trim() : null,
  }
}

/**
 * A button is fine when both fields are empty, or when both are filled and
 * the link is allowed. A link the API would drop is named at its field: the
 * difference between "my button vanished" and "the link has to start with /".
 */
function buttonErrors(d: ButtonDraft, c: ReturnType<typeof useAdminCopy>['c']): { label?: string; href?: string } {
  const label = d.label.trim()
  const href = d.href.trim()
  if (!label && !href) return {}
  if (href && !isAllowedHref(href)) return { href: c.newspopup.err_link }
  if (!label) return { label: c.newspopup.err_pair }
  if (!href) return { href: c.newspopup.err_pair }
  return {}
}

/** A copy of the popup's look, not the component: `NewsPopup` is fixed to the corner and would leave this panel. */
export function NewsPopupPreview({ draft }: { draft: NewsPopupDraft }) {
  const { c } = useAdminCopy()
  const primary = fromButton(draft.button)
  const secondary = fromButton(draft.secondButton)
  return (
    <div className="grid gap-2">
      <div className={cn('w-full max-w-[26rem] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card-hover)]', !draft.enabled && 'opacity-60')}>
        <div className="h-1 w-full bg-[var(--color-brand)]" />
        <div className="grid gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-lead font-bold leading-snug">{draft.title || <span className="text-[var(--color-muted-foreground)]">{c.newspopup.no_title}</span>}</p>
            <X className="mt-1 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
          </div>
          <p className="whitespace-pre-line text-small text-[var(--color-muted-foreground)]">{draft.text || c.newspopup.no_text}</p>
          {draft.coupon.trim() && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2">
              <code className="font-mono text-small">{draft.coupon.trim()}</code>
              <Copy className="h-4 w-4 text-[var(--color-muted-foreground)]" />
            </div>
          )}
          {(primary || secondary) && (
            <div className="flex flex-wrap gap-2">
              {primary && <span className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-small font-semibold text-[var(--color-primary-foreground)]">{primary.label}</span>}
              {secondary && <span className="rounded-md border-[1.5px] border-[var(--color-input)] px-3 py-2 text-small font-semibold">{secondary.label}</span>}
            </div>
          )}
        </div>
      </div>
      {!draft.enabled && <p className="text-small text-[var(--color-muted-foreground)]">{c.newspopup.preview_off}</p>}
    </div>
  )
}

export function NewsPopupEditor({ loaded, onSaved }: { loaded: NewsPopupSettings; onSaved: () => Promise<void> }) {
  const { c } = useAdminCopy()
  const { flash, setFlash } = useFlash()
  const [base, setBase] = useState(() => toDraft(loaded))
  const [draft, setDraft] = useState(base)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(base)
  const errors = { button: buttonErrors(draft.button, c), secondButton: buttonErrors(draft.secondButton, c) }
  const invalid = Object.keys(errors.button).length > 0 || Object.keys(errors.secondButton).length > 0

  const set = <K extends keyof NewsPopupDraft>(key: K, value: NewsPopupDraft[K]) => setDraft(d => ({ ...d, [key]: value }))

  async function save() {
    if (busy || invalid) return
    setBusy(true)
    try {
      // Redraw from what was stored, not from what was sent: a field the
      // route rejected has to disappear in front of the admin.
      const stored = toDraft(await saveNewsPopup(fromDraft(draft), c.newspopup.failed))
      setBase(stored)
      setDraft(stored)
      setFlash({ tone: 'success', text: c.newspopup.saved })
      await onSaved()
    } catch (e) {
      setFlash({ tone: 'danger', text: e instanceof Error ? e.message : c.newspopup.failed })
    } finally {
      setBusy(false)
    }
  }

  const buttonFields = (key: 'button' | 'secondButton', title: string) => {
    const d = draft[key]
    const err = errors[key]
    return (
      <fieldset className="grid gap-3">
        <legend className="mb-1 font-semibold">{title}</legend>
        <div className="grid gap-4 @2xl:grid-cols-2">
          <FormField label={c.newspopup.f_btn_label} error={err.label}>
            {field => <Input {...field} value={d.label} maxLength={NEWS_POPUP_LIMITS.label} onChange={e => set(key, { ...d, label: e.target.value })} />}
          </FormField>
          <FormField label={c.newspopup.f_btn_link} hint={c.newspopup.f_btn_link_hint} error={err.href}>
            {field => <Input {...field} value={d.href} maxLength={NEWS_POPUP_LIMITS.href} onChange={e => set(key, { ...d, href: e.target.value })} spellCheck={false} />}
          </FormField>
        </div>
      </fieldset>
    )
  }

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {flash}
      <div className="grid items-start gap-[var(--app-gutter-y)] min-[90rem]:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
        <SectionCard title={c.tabs.newspopup}>
          <FormSection title={c.newspopup.s_visibility} description={c.newspopup.s_visibility_desc}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3">
              <input type="checkbox" checked={draft.enabled} onChange={e => set('enabled', e.target.checked)} aria-describedby="news-enabled-hint" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]" />
              <span className="grid gap-0.5">
                <span className="font-semibold">{c.newspopup.f_enabled}</span>
                <span id="news-enabled-hint" className="text-small text-[var(--color-muted-foreground)]">{c.newspopup.f_enabled_hint}</span>
              </span>
            </label>
          </FormSection>
          <FormSection title={c.newspopup.s_content} description={c.newspopup.s_content_desc}>
            <FormField label={c.newspopup.f_title}>
              {field => <Input {...field} value={draft.title} maxLength={NEWS_POPUP_LIMITS.title} onChange={e => set('title', e.target.value)} />}
            </FormField>
            <FormField label={c.newspopup.f_text} hint={fillCopy(c.newspopup.f_text_count, { count: draft.text.length, max: NEWS_POPUP_LIMITS.text })}>
              {field => <textarea {...field} value={draft.text} maxLength={NEWS_POPUP_LIMITS.text} rows={6} onChange={e => set('text', e.target.value)} className={cn(fieldClassName, 'min-h-32')} />}
            </FormField>
          </FormSection>
          <FormSection title={c.newspopup.s_buttons} description={c.newspopup.s_buttons_desc}>
            {buttonFields('button', c.newspopup.primary)}
            {buttonFields('secondButton', c.newspopup.secondary)}
          </FormSection>
          <FormSection title={c.newspopup.s_coupon} description={c.newspopup.s_coupon_desc}>
            <FormField label={c.newspopup.f_coupon} hint={c.newspopup.f_coupon_hint}>
              {field => <Input {...field} value={draft.coupon} maxLength={NEWS_POPUP_LIMITS.coupon} onChange={e => set('coupon', e.target.value)} className="max-w-[20rem] font-mono" spellCheck={false} />}
            </FormField>
          </FormSection>
        </SectionCard>
        <SectionCard title={c.newspopup.preview} description={c.newspopup.preview_desc} className="min-[90rem]:sticky min-[90rem]:top-[calc(var(--app-topbar)+1.5rem)]">
          <NewsPopupPreview draft={draft} />
        </SectionCard>
      </div>
      <SaveBar
        show={dirty}
        message={c.common.unsaved}
        saveLabel={c.common.save}
        discardLabel={c.common.discard}
        onSave={() => void save()}
        onDiscard={() => setDraft(base)}
        busy={busy}
      />
    </div>
  )
}

export default function NewsPopupArea() {
  const { c } = useAdminCopy()
  const { data, error, reload } = useAdminResource<NewsPopupSettings>(ADMIN_URL.newsPopup, 'settings', c.newspopup.load_failed)
  return (
    <>
      <AreaHeader area="newspopup" description={c.newspopup.lead} />
      <AreaLoad data={data} error={error} retry={reload}>
        {settings => <NewsPopupEditor loaded={settings} onSaved={reload} />}
      </AreaLoad>
    </>
  )
}
