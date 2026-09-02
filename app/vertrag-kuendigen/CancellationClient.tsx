'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { useLang } from '@/components/i18n/LangProvider'
import { legalFormTranslations, layoutTranslations } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'
import { LegalFormShell, Field, INPUT_CLASS } from '@/components/legal/LegalFormShell'

// ── Kündigungsschaltfläche (§ 312k BGB) ─────────────────────────────────────
//
// Die Norm zählt die Angaben auf, die die Bestätigungsseite abfragen darf und
// muss: Art der Kündigung, Bezeichnung des Vertrags, Name, Kontaktdaten und
// der Zeitpunkt. Genau diese fünf stehen hier, keines mehr.
//
// „Zum nächstmöglichen Zeitpunkt" ist vorbelegt, weil es der gesetzliche
// Regelfall ist. Wer ein Datum nennen will, kann es, muss aber nicht.

interface Done { title: string; text: string }

export function CancellationClient() {
  const { lang } = useLang()
  const t  = legalFormTranslations[lang]
  const tl = layoutTranslations[lang]

  const [kind,        setKind]        = useState<'ordinary' | 'extraordinary'>('ordinary')
  const [name,        setName]        = useState('')
  const [contractRef, setContractRef] = useState('')
  const [email,       setEmail]       = useState('')
  const [whenMode,    setWhenMode]    = useState<'asap' | 'date'>('asap')
  const [whenDate,    setWhenDate]    = useState('')
  const [reason,      setReason]      = useState('')
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [sending,     setSending]     = useState(false)
  const [done,        setDone]        = useState<Done | null>(null)

  const messageFor = (code: string | undefined): string | undefined => {
    if (!code) return undefined
    return code === 'invalid' ? t.err_email : t.err_required
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSending(true)
    try {
      const res = await fetch('/api/legal/cancellation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          kind, name, contractRef, email, lang,
          effectiveAt: whenMode === 'date' && whenDate ? whenDate : 'asap',
          reason:      kind === 'extraordinary' ? reason : null,
        }),
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
        title: t.cancel_done_title,
        text:  t.cancel_done_text
          .replace('{timestamp}', data?.timestamp ?? '')
          .replace('{email}', email),
      })
    } catch {
      setErrors({ _: t.err_network })
    } finally {
      setSending(false)
    }
  }

  const radio = 'mr-2 accent-[var(--color-primary)]'

  return (
    <LegalFormShell
      breadcrumb={tl.legal_cancel}
      title={t.cancel_title}
      intro={t.cancel_intro}
      done={done}
      footnote={<p>{t.cancel_portal_hint}</p>}
    >
      <form onSubmit={submit} noValidate>
        {/* Art der Kündigung — § 312k Abs. 2 Satz 2 Nr. 1 BGB */}
        <fieldset className="mb-5">
          <legend className="mb-1.5 text-sm font-medium text-[var(--color-foreground)]">
            {t.cancel_kind}
          </legend>
          <label className="mb-1 flex min-h-11 items-center text-sm text-[var(--color-muted-foreground)]">
            <input
              type="radio" name="kind" value="ordinary" className={radio}
              checked={kind === 'ordinary'} onChange={() => setKind('ordinary')}
            />
            {t.cancel_kind_ordinary}
          </label>
          <label className="flex min-h-11 items-center text-sm text-[var(--color-muted-foreground)]">
            <input
              type="radio" name="kind" value="extraordinary" className={radio}
              checked={kind === 'extraordinary'} onChange={() => setKind('extraordinary')}
            />
            {t.cancel_kind_extraordinary}
          </label>
        </fieldset>

        <Field id="name" label={t.field_name} error={messageFor(errors.name)}>
          <input
            id="name" name="name" type="text" autoComplete="name" required
            className={INPUT_CLASS}
            value={name} onChange={e => setName(e.target.value)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </Field>

        <Field
          id="contractRef" label={t.field_contract}
          hint={t.cancel_contract_hint} error={messageFor(errors.contractRef)}
        >
          <input
            id="contractRef" name="contractRef" type="text" required
            className={INPUT_CLASS}
            value={contractRef} onChange={e => setContractRef(e.target.value)}
            aria-describedby={errors.contractRef ? 'contractRef-error' : 'contractRef-hint'}
          />
        </Field>

        <Field id="email" label={t.field_email} error={messageFor(errors.email)}>
          <input
            id="email" name="email" type="email" autoComplete="email" required
            className={INPUT_CLASS}
            value={email} onChange={e => setEmail(e.target.value)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </Field>

        {/* Kündigungszeitpunkt — § 312k Abs. 2 Satz 2 Nr. 3 BGB */}
        <fieldset className="mb-5">
          <legend className="mb-1.5 text-sm font-medium text-[var(--color-foreground)]">
            {t.cancel_when}
          </legend>
          <label className="mb-1 flex min-h-11 items-center text-sm text-[var(--color-muted-foreground)]">
            <input
              type="radio" name="when" value="asap" className={radio}
              checked={whenMode === 'asap'} onChange={() => setWhenMode('asap')}
            />
            {t.cancel_when_asap}
          </label>
          <label className="flex min-h-11 flex-wrap items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <span className="flex items-center">
              <input
                type="radio" name="when" value="date" className={radio}
                checked={whenMode === 'date'} onChange={() => setWhenMode('date')}
              />
              {t.cancel_when_date}
            </span>
            <input
              type="date" aria-label={t.cancel_when_date}
              className={`${INPUT_CLASS} w-auto`}
              value={whenDate}
              onChange={e => { setWhenDate(e.target.value); setWhenMode('date') }}
            />
          </label>
        </fieldset>

        {kind === 'extraordinary' && (
          <Field id="reason" label={t.cancel_reason}>
            <textarea
              id="reason" name="reason" rows={4}
              className={INPUT_CLASS}
              value={reason} onChange={e => setReason(e.target.value)}
            />
          </Field>
        )}

        {errors._ && (
          <p role="alert" className="mb-4 text-sm text-[var(--color-danger)]">{errors._}</p>
        )}

        {/* „Jetzt kündigen" ist der gesetzlich vorgeschriebene Wortlaut der
            Bestätigungsschaltfläche (§ 312k Abs. 2 Satz 4 BGB). */}
        <Button type="submit" disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {sending ? t.submitting : t.cancel_submit}
        </Button>
      </form>
    </LegalFormShell>
  )
}
