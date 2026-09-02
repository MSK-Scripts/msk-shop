'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { useLang } from '@/components/i18n/LangProvider'
import { legalFormTranslations, layoutTranslations } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'
import { LegalFormShell, Field, INPUT_CLASS } from '@/components/legal/LegalFormShell'

// ── Widerrufsfunktion (§ 356a BGB) ──────────────────────────────────────────
//
// Drei Felder, ein Knopf, kein Login und kein Captcha. Die Norm erlaubt genau
// die Abfrage von Name, Angaben zur Identifizierung des Vertrags und
// Kontaktdaten — mehr zu verlangen wäre eine unzulässige Erschwerung, und
// jedes zusätzliche Feld ist ein Grund mehr, abzubrechen.
//
// Kein `setState` in einem Effect: der ganze Zustand entsteht in
// Event-Handlern, und die Erfolgsmeldung wird erst nach dem `await` gesetzt.

interface Done { title: string; text: string }

export function WithdrawalClient() {
  const { lang } = useLang()
  const t  = legalFormTranslations[lang]
  const tl = layoutTranslations[lang]

  const [name,        setName]        = useState('')
  const [contractRef, setContractRef] = useState('')
  const [email,       setEmail]       = useState('')
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
      const res = await fetch('/api/legal/withdrawal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, contractRef, email, lang }),
      })

      if (res.status === 429) { setErrors({ _: t.err_rate }); return }

      // 400 liefert unsere Route als JSON mit Feldfehlern, alles andere kann
      // auch eine HTML-Fehlerseite sein. Deshalb wird das Parsen versucht und
      // darf scheitern — dieselbe Lehre wie bei `readJsonResource`.
      let data: { errors?: Record<string, string>; timestamp?: string } | null = null
      try { data = await res.json() } catch { /* kein verwertbarer Körper */ }

      if (!res.ok) {
        if (data?.errors) setErrors(data.errors)
        else setErrors({ _: t.err_generic })
        return
      }

      setDone({
        title: t.revoke_done_title,
        text:  t.revoke_done_text
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
      breadcrumb={tl.legal_revoke}
      title={t.revoke_title}
      intro={t.revoke_intro}
      done={done}
      footnote={
        <Link href="/terms/widerruf" className="text-[var(--color-primary)] hover:underline">
          {t.revoke_legal_link}
        </Link>
      }
    >
      <form onSubmit={submit} noValidate>
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
          hint={t.revoke_contract_hint} error={messageFor(errors.contractRef)}
        >
          <input
            id="contractRef" name="contractRef" type="text" required
            className={INPUT_CLASS}
            value={contractRef} onChange={e => setContractRef(e.target.value)}
            aria-describedby={errors.contractRef ? 'contractRef-error' : 'contractRef-hint'}
          />
        </Field>

        <Field
          id="email" label={t.field_email}
          hint={t.revoke_email_hint} error={messageFor(errors.email)}
        >
          <input
            id="email" name="email" type="email" autoComplete="email" required
            className={INPUT_CLASS}
            value={email} onChange={e => setEmail(e.target.value)}
            aria-describedby={errors.email ? 'email-error' : 'email-hint'}
          />
        </Field>

        {errors._ && (
          <p role="alert" className="mb-4 text-sm text-[var(--color-danger)]">{errors._}</p>
        )}

        {/* Der Wortlaut ist gesetzlich vorgegeben und darf nicht mit einem
            allgemeinen „Absenden" ersetzt werden. */}
        <Button type="submit" disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {sending ? t.submitting : t.revoke_submit}
        </Button>
      </form>
    </LegalFormShell>
  )
}
