'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { useLang } from '@/components/i18n/LangProvider'
import { legalFormTranslations, layoutTranslations } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'
import { LegalFormShell, Field, INPUT_CLASS } from '@/components/legal/LegalFormShell'

// ── Withdrawal function (§ 356a BGB)────────────────────────────────────────
//
// Three fields, one button, no login and no captcha. The provision allows
// asking for exactly the name, details identifying the contract and
// contact details; asking for more would be an unlawful obstacle, and
// every additional field is one more reason to give up.
//
// No `setState` in an effect: all of the state comes from event
// handlers, and the success message is only set after the `await`.

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

      // For a 400 our route returns JSON with field errors, anything else can
      // also be an HTML error page. So parsing is attempted and is allowed
      // to fail, the same lesson as with `readJsonResource`.
      let data: { errors?: Record<string, string>; timestamp?: string } | null = null
      try { data = await res.json() } catch { /* no usable body */ }

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

        {/* The wording is prescribed by law and must not be replaced with a
            generic "Submit". */}
        <Button type="submit" disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {sending ? t.submitting : t.revoke_submit}
        </Button>
      </form>
    </LegalFormShell>
  )
}
