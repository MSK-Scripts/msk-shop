'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useLang } from '@/components/i18n/LangProvider'
import { legalFormTranslations, layoutTranslations } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'
import { LegalFormShell, Field, INPUT_CLASS } from '@/components/legal/LegalFormShell'

// ── Meldeverfahren nach Art. 16 DSA ─────────────────────────────────────────
//
// Die vier Pflichtangaben der Norm: hinreichend begründete Erläuterung, klare
// Angabe des Orts (URL), Name und E-Mail, und die Erklärung über Richtigkeit
// und Vollständigkeit.
//
// Die URL wird aus `?url=` vorbelegt, damit ein „Melden"-Link neben einem Bild
// oder einer Ergebnisseite den Ort schon mitbringt. Der Wert ist trotzdem
// editierbar und wird server-seitig geprüft — er kommt aus der Adresszeile und
// ist damit Nutzereingabe, egal wer den Link gesetzt hat.

interface Done { title: string; text: string }

export function ReportClient() {
  const { lang } = useLang()
  const params = useSearchParams()
  const t  = legalFormTranslations[lang]
  const tl = layoutTranslations[lang]

  // Abgeleiteter Ausgangswert statt `setState` in einem Effect: der
  // Query-Parameter steht beim ersten Render fest.
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
      try { data = await res.json() } catch { /* kein verwertbarer Körper */ }

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
      <form onSubmit={submit} noValidate>
        <Field
          id="contentUrl" label={t.report_url}
          hint={t.report_url_hint} error={messageFor('contentUrl')}
        >
          <input
            id="contentUrl" name="contentUrl" type="url" required
            className={INPUT_CLASS}
            value={contentUrl} onChange={e => setContentUrl(e.target.value)}
            aria-describedby={errors.contentUrl ? 'contentUrl-error' : 'contentUrl-hint'}
          />
        </Field>

        <Field
          id="reason" label={t.report_reason}
          hint={t.report_reason_hint} error={messageFor('reason')}
        >
          <textarea
            id="reason" name="reason" rows={5} required
            className={INPUT_CLASS}
            value={reason} onChange={e => setReason(e.target.value)}
            aria-describedby={errors.reason ? 'reason-error' : 'reason-hint'}
          />
        </Field>

        <Field id="name" label={t.field_name} error={messageFor('name')}>
          <input
            id="name" name="name" type="text" autoComplete="name" required
            className={INPUT_CLASS}
            value={name} onChange={e => setName(e.target.value)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </Field>

        <Field id="email" label={t.field_email} error={messageFor('email')}>
          <input
            id="email" name="email" type="email" autoComplete="email" required
            className={INPUT_CLASS}
            value={email} onChange={e => setEmail(e.target.value)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </Field>

        {/* Art. 16 Abs. 2 lit. d DSA. Ohne diese Erklärung ist die Meldung
            keine Meldung im Sinne der Verordnung, deshalb ist sie Pflicht und
            wird zusätzlich in der Route geprüft. */}
        <div className="mb-5">
          <label className="flex min-h-11 items-start gap-2.5 text-sm text-[var(--color-muted-foreground)]">
            <input
              type="checkbox" required
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
              checked={declared} onChange={e => setDeclared(e.target.checked)}
              aria-describedby={errors.declaredTrue ? 'declared-error' : undefined}
            />
            <span>{t.report_declaration}</span>
          </label>
          {errors.declaredTrue && (
            <p id="declared-error" role="alert" className="mt-1.5 text-xs text-[var(--color-danger)]">
              {messageFor('declaredTrue')}
            </p>
          )}
        </div>

        {errors._ && (
          <p role="alert" className="mb-4 text-sm text-[var(--color-danger)]">{errors._}</p>
        )}

        <Button type="submit" disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {sending ? t.submitting : t.report_submit}
        </Button>
      </form>
    </LegalFormShell>
  )
}
