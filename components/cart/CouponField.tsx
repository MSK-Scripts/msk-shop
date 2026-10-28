'use client'

import { useId, useState } from 'react'
import { CaretDown, CircleNotch, Tag, X } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cartTranslations, type Lang } from '@/lib/i18n'
import { useCart } from '@/lib/useCart'

/**
 * Coupon code of the basket, on the cart page and in the drawer. The same
 * calls as before (`applyCode`, `removeCode` from useCart, through our basket
 * routes); only the frame is new: a native disclosure, a visible label, and
 * the error tied to the field.
 */
export function CouponField({ lang }: { lang: Lang }) {
  const t = cartTranslations[lang]
  const { basket, applyCode, removeCode, isLoading } = useCart()
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const id = useId()
  const fieldId = `${id}-code`
  const errorId = `${id}-error`

  const active = (basket?.coupons ?? []).map(c => c.code ?? c.coupon_code ?? '').filter(Boolean)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = code.trim()
    if (!value) return
    if (active.length > 0) { setError(t.err_coupon_active); return }
    setSending(true)
    setError('')
    const result = await applyCode(value)
    setSending(false)
    if (result === true) setCode('')
    else setError(result === 'not_applicable' ? t.err_coupon_scope : t.err_coupon_invalid)
  }

  if (active.length > 0) {
    return (
      <ul className="grid gap-2">
        {active.map(c => (
          <li key={c} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[var(--color-accent-soft)] py-1 pl-3 pr-1">
            <span className="flex items-center gap-2 text-small font-semibold">
              <Tag className="h-4 w-4 text-[var(--color-primary)]" />
              {t.coupon_active.replace('{code}', c)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCode(c)}
              disabled={isLoading}
              aria-label={t.coupon_remove.replace('{code}', c)}
            >
              {isLoading ? <CircleNotch className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <details className="group">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] [&::-webkit-details-marker]:hidden">
        <Tag className="h-4 w-4" />
        {t.have_coupon}
        <CaretDown className="h-4 w-4 transition-transform duration-150 group-open:rotate-180" />
      </summary>
      <form onSubmit={submit} noValidate className="mt-2 grid gap-1.5">
        <label htmlFor={fieldId} className="font-semibold">{t.coupon_label}</label>
        <div className="flex flex-wrap gap-2">
          <Input
            id={fieldId}
            name="coupon"
            autoComplete="off"
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="min-w-0 flex-[1_1_10rem]"
          />
          <Button type="submit" variant="outline" disabled={sending || !code.trim()}>
            {sending && <CircleNotch className="h-4 w-4 animate-spin" />}
            {t.coupon_apply}
          </Button>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-small font-semibold text-[var(--color-danger)]">{error}</p>
        )}
      </form>
    </details>
  )
}
