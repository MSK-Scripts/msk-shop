'use client'

import { useState } from 'react'
import { Loader2, Check, X, Copy } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useAdminResource } from '@/lib/useAdminResource'
import { ErrorCard } from '@/app/admin/ErrorCard'
import {
  NEWS_POPUP_DEFAULT, NEWS_POPUP_LIMITS, isAllowedHref,
  type NewsPopupSettings,
} from '@/lib/newsPopup'

/**
 * The site-wide announcement popup, editable instead of deployed.
 *
 * The preview on the right is built from the same fields the form writes, so
 * what an admin checks before saving is what visitors get. It is a copy of the
 * real component's markup rather than the component itself: `NewsPopup` is
 * `position: fixed` and would jump out of this panel into the corner of the
 * admin dashboard.
 */

/** Empty label + href means "no button", which is how the API stores it. */
interface ButtonDraft { label: string; href: string }

const emptyButton = (): ButtonDraft => ({ label: '', href: '' })

const toDraft = (b: { label: string; href: string } | null): ButtonDraft =>
  b ? { label: b.label, href: b.href } : emptyButton()

const fromDraft = (d: ButtonDraft) =>
  d.label.trim() && d.href.trim() ? { label: d.label.trim(), href: d.href.trim() } : null

export default function NewsPopupTab() {
  const { data: loaded, error, reload } = useAdminResource<NewsPopupSettings>(
    '/api/admin/news-popup', 'settings', 'Failed to load the news popup settings.',
  )

  // Form state is seeded from the loaded value on first render after it
  // arrives. `seeded` rather than an effect, so nothing calls setState from an
  // effect (react-hooks/set-state-in-effect is an error in this project).
  const [seeded, setSeeded] = useState(false)
  const [form, setForm] = useState<NewsPopupSettings>(NEWS_POPUP_DEFAULT)
  const [buttonDraft, setButtonDraft] = useState<ButtonDraft>(emptyButton)
  const [secondDraft, setSecondDraft] = useState<ButtonDraft>(emptyButton)

  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (loaded && !seeded) {
    setSeeded(true)
    setForm(loaded)
    setButtonDraft(toDraft(loaded.button))
    setSecondDraft(toDraft(loaded.secondButton))
  }

  const set = <K extends keyof NewsPopupSettings>(key: K, value: NewsPopupSettings[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  // A href that is filled in but not allowed would be dropped silently by the
  // API. Saying so here is the difference between "my button vanished" and
  // "the link has to start with / or https://".
  const badHref = (d: ButtonDraft) => d.href.trim().length > 0 && !isAllowedHref(d.href.trim())
  const hrefProblem = badHref(buttonDraft) || badHref(secondDraft)

  const save = async () => {
    if (busy || hrefProblem) return
    setBusy(true); setFormError(null); setSaved(false)
    try {
      const settings: NewsPopupSettings = {
        ...form,
        button:       fromDraft(buttonDraft),
        secondButton: fromDraft(secondDraft),
        coupon:       form.coupon?.trim() ? form.coupon.trim() : null,
      }
      const r = await fetch('/api/admin/news-popup', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ settings }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Save failed.')
      // Redraw from what was stored, not from what was sent: a rejected field
      // has to disappear in front of the admin, not look saved.
      setForm(d.settings)
      setButtonDraft(toDraft(d.settings.button))
      setSecondDraft(toDraft(d.settings.secondButton))
      setSaved(true)
      await reload()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed.')
    } finally { setBusy(false) }
  }

  if (error) return <ErrorCard message={error} />
  if (!loaded) {
    return (
      <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading news popup…
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        The announcement shown bottom-right on every page, once per browser session.
        Saving takes effect within 30 seconds, no deploy needed.
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ── Form ──────────────────────────────────────────────────────── */}
        <Card className="space-y-5 p-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => set('enabled', e.target.checked)}
              className="mt-0.5 accent-[var(--color-primary)]"
            />
            <span>
              <span className="font-medium">Show the popup</span>
              <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                Off hides it everywhere, the text below is kept for next time.
              </span>
            </span>
          </label>

          <div>
            <label className="text-sm font-medium" htmlFor="np-title">Title</label>
            <Input
              id="np-title"
              value={form.title}
              maxLength={NEWS_POPUP_LIMITS.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Support services limited"
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="np-text">Text</label>
            <textarea
              id="np-text"
              value={form.text}
              maxLength={NEWS_POPUP_LIMITS.text}
              onChange={e => set('text', e.target.value)}
              rows={5}
              placeholder="Two blank lines make a paragraph."
              className="mt-1.5 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {form.text.length} / {NEWS_POPUP_LIMITS.text} characters. Line breaks are kept.
            </p>
          </div>

          {[
            { label: 'Primary button',   draft: buttonDraft, setDraft: setButtonDraft, id: 'b1' },
            { label: 'Secondary button', draft: secondDraft, setDraft: setSecondDraft, id: 'b2' },
          ].map(({ label, draft, setDraft, id }) => (
            <div key={id}>
              <label className="text-sm font-medium">{label}</label>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                <Input
                  value={draft.label}
                  maxLength={NEWS_POPUP_LIMITS.label}
                  onChange={e => { setDraft(d => ({ ...d, label: e.target.value })); setSaved(false) }}
                  placeholder="Label"
                />
                <Input
                  value={draft.href}
                  maxLength={NEWS_POPUP_LIMITS.href}
                  onChange={e => { setDraft(d => ({ ...d, href: e.target.value })); setSaved(false) }}
                  placeholder="/ticketbot/verify"
                  className={badHref(draft) ? 'border-[var(--color-danger)]' : undefined}
                />
              </div>
              {badHref(draft) ? (
                <p className="mt-1 text-xs text-[var(--color-danger)]">
                  The link has to start with / for an internal page, or with https://
                </p>
              ) : (
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                  Leave both empty to hide this button.
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="text-sm font-medium" htmlFor="np-coupon">Coupon code</label>
            <Input
              id="np-coupon"
              value={form.coupon ?? ''}
              maxLength={NEWS_POPUP_LIMITS.coupon}
              onChange={e => set('coupon', e.target.value)}
              placeholder="Optional, e.g. NEWSHOP20"
              className="mt-1.5"
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Shown as a field visitors can copy. Empty hides it.
            </p>
          </div>

          {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}

          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={busy || hrefProblem}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)]">
                <Check className="h-4 w-4" /> Saved, live within 30 s
              </span>
            )}
          </div>
        </Card>

        {/* ── Preview ───────────────────────────────────────────────────── */}
        <div>
          <p className="mb-2 font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Preview
          </p>
          <div
            className={cn(
              'w-80 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl',
              !form.enabled && 'opacity-50',
            )}
          >
            <div className="h-0.5 w-full bg-gradient-to-r from-[var(--color-primary)]/40 via-[var(--color-primary)] to-[var(--color-primary)]/40" />
            <div className="p-4">
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <p className="text-sm font-bold leading-snug">
                  {form.title || <span className="text-[var(--color-muted-foreground)]">(no title)</span>}
                </p>
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" />
              </div>
              <p className="mb-3.5 whitespace-pre-line text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                {form.text || '(no text)'}
              </p>
              {form.coupon?.trim() && (
                <div className="mb-3.5 flex items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2.5 py-1.5">
                  <code className="font-mono text-xs">{form.coupon.trim()}</code>
                  <Copy className="h-3 w-3 text-[var(--color-muted-foreground)]" />
                </div>
              )}
              {(fromDraft(buttonDraft) || fromDraft(secondDraft)) && (
                <div className="flex gap-2">
                  {fromDraft(buttonDraft) && (
                    <span className="rounded-md bg-[var(--color-primary)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-primary-foreground)]">
                      {buttonDraft.label}
                    </span>
                  )}
                  {fromDraft(secondDraft) && (
                    <span className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold">
                      {secondDraft.label}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {!form.enabled && (
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
              Switched off, visitors see nothing.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
