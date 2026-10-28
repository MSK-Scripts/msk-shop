'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CircleNotch as Loader2, WarningCircle } from '@/components/icons'

import { useLang } from '@/components/i18n/LangProvider'
import { legalFormTranslations, layoutTranslations } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'
import { LegalFormShell, Field, FormCard, INPUT_CLASS, TEXTAREA_CLASS } from '@/components/legal/LegalFormShell'

// ── Notice procedure under Art. 16 DSA──────────────────────────────────────
//
// The four mandatory details of the provision: a sufficiently substantiated
// explanation, a clear statement of the location (URL), name and email, and
// the statement of accuracy and completeness.
//
// The URL is prefilled from `?url=` so that a "Report" link next to an image
// or a results page already carries the location. The value is still
// editable and is checked server-side: it comes from the address bar and is
// therefore user input, no matter who set the link.

interface Done { title: string; text: string }

export function ReportClient() {
  const { lang } = useLang()
  const params = useSearchParams()
  const t  = legalFormTranslations[lang]
  const tl = layoutTranslations[lang]

  // Derived initial value instead of `setState` in an effect: the
  // query parameter is already fixed on the first render.
  const [contentUrl, setContentUrl] = useState(() => params.get('url') ?? '')
  const [reason,     setReason]     = useState('')
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [declared,   setDeclared]   = useState(false)
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [sending,    setSending]    = useState(false)
  const [done,       setDone]       = useState<Done | null>(null)

  const messageFor = (field: string): string | undefined => {
    const code = errors[field]
    if (!code) return undefined
    if (field === 'email'        && code === 'invalid') return t.err_email
    if (field === 'declaredTrue')                        return t.report_err_declaration
    return t.err_required
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSending(true)
    try {
      const res = await fetch('/api/legal/report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contentUrl, reason, name, email, declaredTrue: declared, lang }),
      })

      if (res.status === 429) { setErrors({ _: t.err_rate }); return }

      let data: { errors?: Record<string, string>; timestamp?: string } | null = null
      try { data = await res.json() } catch { /* no usable body */ }

      if (!res.ok) {
        if (data?.errors) setErrors(data.errors)
        else setErrors({ _: t.err_generic })
        return
      }

      setDone({
        title: t.report_done_title,
        text:  t.report_done_text
          .replace('{timestamp}', data?.timestamp ?? '')
          .replace('{email}', email),
      })
    } catch {
      setErrors({ _: t.err_network })
    } finally {
      setSending(false)
    }
  }

  return (
    <LegalFormShell
      breadcrumb={tl.legal_report}
      title={t.report_title}
      intro={t.report_intro}
      done={done}
    >
      <FormCard>
      <form onSubmit={submit} noValidate className="grid gap-5">
        <Field
          id="contentUrl" label={t.report_url}
          hint={t.report_url_hint} error={messageFor('contentUrl')}
        >
          <input
            id="contentUrl" name="contentUrl" type="url" required
            className={INPUT_CLASS}
            value={contentUrl} onChange={e => setContentUrl(e.target.value)}
            aria-invalid={errors.contentUrl ? true : undefined}
            aria-describedby={errors.contentUrl ? 'contentUrl-error' : 'contentUrl-hint'}
          />
        </Field>

        <Field
          id="reason" label={t.report_reason}
          hint={t.report_reason_hint} error={messageFor('reason')}
        >
          <textarea
            id="reason" name="reason" rows={5} required
            className={TEXTAREA_CLASS}
            value={reason} onChange={e => setReason(e.target.value)}
            aria-invalid={errors.reason ? true : undefined}
            aria-describedby={errors.reason ? 'reason-error' : 'reason-hint'}
          />
        </Field>

        <Field id="name" label={t.field_name} error={messageFor('name')}>
          <input
            id="name" name="name" type="text" autoComplete="name" required
            className={INPUT_CLASS}
            value={name} onChange={e => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </Field>

        <Field id="email" label={t.field_email} error={messageFor('email')}>
          <input
            id="email" name="email" type="email" autoComplete="email" required
            className={INPUT_CLASS}
            value={email} onChange={e => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </Field>

        {/* Art. 16 Abs. 2 lit. d DSA. Without this statement the notice is
            not a notice within the meaning of the regulation, so it is
            mandatory and is additionally checked in the route. */}
        <div className="grid gap-1.5">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
            <input
              type="checkbox" required
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
              checked={declared} onChange={e => setDeclared(e.target.checked)}
              aria-invalid={errors.declaredTrue ? true : undefined}
              aria-describedby={errors.declaredTrue ? 'declared-error' : undefined}
            />
            <span>{t.report_declaration}</span>
          </label>
          {errors.declaredTrue && (
            <p id="declared-error" role="alert" className="flex items-start gap-1.5 text-small font-semibold text-[var(--color-danger)]">
              <WarningCircle className="mt-[0.2em] h-4 w-4 shrink-0" />
              {messageFor('declaredTrue')}
            </p>
          )}
        </div>

        {errors._ && (
          <p role="alert" className="text-small font-semibold text-[var(--color-danger)]">{errors._}</p>
        )}

        <Button type="submit" disabled={sending} className="justify-self-start">
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {sending ? t.submitting : t.report_submit}
        </Button>
      </form>
      </FormCard>
    </LegalFormShell>
  )
}
