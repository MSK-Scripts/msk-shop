'use client'

import { useState } from 'react'
import { ArrowSquareOut, CircleNotch as Loader2 } from '@/components/icons'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { useLang } from '@/components/i18n/LangProvider'
import { LinkedText } from '@/components/legal/LinkedText'
import { legalCopy, legalFormTranslations, layoutTranslations } from '@/lib/i18n'
import { withdrawalTarget, type ContractChoice } from '@/lib/withdrawalChoice'
import { Button } from '@/components/ui/Button'
import { RadioCard } from '@/components/ui/RadioCard'
import { LegalFormShell, Field, FormCard, INPUT_CLASS } from '@/components/legal/LegalFormShell'

// ── Withdrawal function (§ 356a BGB)────────────────────────────────────────
//
// First the question which contract it is about (draft legal copy 2.5): a
// subscription with MSK Scripts goes on to our own function, a purchase in
// the shop gets the way to Tebex, the seller, and no form of ours
// (lib/withdrawalChoice.ts).
//
// The function itself is unchanged: three fields, one button, no login and
// no captcha. The provision allows asking for exactly the name, details
// identifying the contract and contact details; asking for more would be an
// unlawful obstacle, and every additional field is one more reason to give up.
//
// No `setState` in an effect: all of the state comes from event
// handlers, and the success message is only set after the `await`.

interface Done { title: string; text: string }

export function WithdrawalClient({ initialChoice = null }: { initialChoice?: ContractChoice | null }) {
  const { lang } = useLang()
  const t  = legalFormTranslations[lang]
  const tl = layoutTranslations[lang]
  const lc = legalCopy[lang]

  const [choice,      setChoice]      = useState<ContractChoice | null>(initialChoice)
  const [name,        setName]        = useState('')
  const [contractRef, setContractRef] = useState('')
  const [email,       setEmail]       = useState('')
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [sending,     setSending]     = useState(false)
  const [done,        setDone]        = useState<Done | null>(null)

  const target = choice ? withdrawalTarget(choice) : null

  const messageFor = (code: string | undefined): string | undefined => {
    if (!code) return undefined
    return code === 'invalid' ? t.err_email : t.err_required
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (target?.kind !== 'form') return
    setErrors({})
    setSending(true)
    try {
      const res = await fetch(target.endpoint, {
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

  const options: Array<{ value: ContractChoice; label: string; sub: string }> = [
    { value: 'subscription', label: lc.withdraw_subscription, sub: lc.withdraw_subscription_sub },
    { value: 'shop',         label: lc.withdraw_shop,         sub: lc.withdraw_shop_sub },
  ]

  return (
    <LegalFormShell
      breadcrumb={tl.legal_revoke}
      title={t.revoke_title}
      intro={t.revoke_intro}
      done={done}
      footnote={target?.kind === 'form' ? (
        <Link href="/legal/withdrawal" className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline">
          {t.revoke_legal_link}
        </Link>
      ) : undefined}
    >
      <fieldset className="m-0 grid gap-3 border-0 p-0">
        <legend className="mb-3 font-display text-h3 font-[650]">{lc.withdraw_question}</legend>
        <div className="@container">
          <div className="grid gap-2.5 @min-[30rem]:grid-cols-2">
            {options.map(o => (
              <RadioCard key={o.value} name="contract" value={o.value} checked={choice === o.value} onChange={() => setChoice(o.value)}>
                <span className="font-semibold">{o.label}</span>
                <span className="text-small text-[var(--color-muted-foreground)]">{o.sub}</span>
              </RadioCard>
            ))}
          </div>
        </div>
      </fieldset>

      {target?.kind === 'tebex' && (
        // A pointer only. MSK accepts no withdrawal on Tebex' behalf (draft
        // 2.5, answer F4): it would become the recipient of the declaration
        // and answer for passing it on.
        <FormCard titleId="withdraw-shop-title" title={t.revoke_shop_title}>
          <p className="max-w-[40rem]">
            <LinkedText
              template={lc.withdraw_shop_text}
              link={text => (
                <a
                  href={target.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-hover)]"
                >
                  {text}
                  <ArrowSquareOut className="h-4 w-4" />
                  <span className="sr-only"> {tl.nav_new_tab}</span>
                </a>
              )}
            />
          </p>
        </FormCard>
      )}

      {target?.kind === 'form' && (
        <FormCard titleId="withdraw-form-title" title={t.revoke_form_title} intro={t.revoke_form_intro}>
          <form onSubmit={submit} noValidate className="grid gap-5">
            <Field id="name" label={t.field_name} error={messageFor(errors.name)}>
              <input
                id="name" name="name" type="text" autoComplete="name" required
                className={INPUT_CLASS}
                value={name} onChange={e => setName(e.target.value)}
                aria-invalid={errors.name ? true : undefined}
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
                aria-invalid={errors.contractRef ? true : undefined}
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
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'email-error' : 'email-hint'}
              />
            </Field>

            {errors._ && (
              <p role="alert" className="text-small font-semibold text-[var(--color-danger)]">{errors._}</p>
            )}

            {/* The wording is prescribed by law and must not be replaced with a
                generic "Submit". */}
            <Button type="submit" disabled={sending} className="justify-self-start">
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              {sending ? t.submitting : t.revoke_submit}
            </Button>
          </form>
        </FormCard>
      )}
    </LegalFormShell>
  )
}
