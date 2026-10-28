'use client'

import { useId } from 'react'

import { CircleNotch as Loader2, CreditCard } from '@/components/icons'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Button } from '@/components/ui/Button'
import { dashboardTranslations, subscriptionTermsTranslations, type Lang } from '@/lib/i18n'
import { formatTierPrice, yearlyMonthsFree, type BillingInterval } from '@/lib/tiers'
import { cn } from '@/lib/utils'
import type { PaidTier } from './ticketBotApi'

export type { PaidTier } from './ticketBotApi'

interface Props {
  lang: Lang
  tier: PaidTier
  /** Server name, or its id when the name is unknown. */
  guildLabel: string
  interval: BillingInterval
  onIntervalChange: (interval: BillingInterval) => void
  /** Any billing request is running; every control waits. */
  busy: boolean
  /** The checkout for this tier is the request that is running. */
  submitting: boolean
  onSubmit: () => void
  onCancel: () => void
}

/**
 * The order summary right before the order button of a ticket bot plan.
 *
 * What the law puts here, in this order:
 *   - service, total price and term (§ 312j Abs. 2 BGB), the price from
 *     lib/tiers.ts, the same number the checkout charges;
 *   - who the contract is with, who takes the payment and the VAT exemption
 *     (draft 2.3 of the legal texts);
 *   - links to the terms and the withdrawal instructions;
 *   - the contract languages (Art. 246c Nr. 4 EGBGB, draft 1.4);
 *   - the button with the wording § 312j Abs. 3 BGB prescribes.
 *
 * Its own component since 28.10.2026, so a test can render it and check that
 * the contract languages stand before the button. Deliberately an expanding
 * block and not a modal: a `position: fixed` overlay in a subtree with
 * `sticky` ends up beneath other elements, which on 18.08.2026 already once
 * put the gallery over the dialog.
 *
 * Phase 8 of the redesign: the billing interval is a pair of real radio
 * buttons (plan 4.7, native controls), every control reaches 44 px, and the
 * block reads at most 65 characters wide.
 */
export function OrderSummary({
  lang, tier, guildLabel, interval, onIntervalChange, busy, submitting, onSubmit, onCancel,
}: Props) {
  const t = dashboardTranslations[lang]
  const terms = subscriptionTermsTranslations[lang]
  const headingId = useId()
  const name = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="grid max-w-[44rem] gap-4 rounded-lg border-[1.5px] border-[var(--color-primary)] bg-[var(--color-accent-soft)] p-[clamp(1rem,0.8rem+0.6vw,1.5rem)]"
    >
      <h3 id={headingId} className="font-display text-h3 font-[650]">{t.sub_confirm_title}</h3>

      <dl className="grid gap-3">
        <div className="grid gap-0.5">
          <dt className="text-small text-[var(--color-muted-foreground)]">{t.sub_confirm_service}</dt>
          <dd className="font-semibold">
            {t[`tier_${tier}` as 'tier_premium' | 'tier_premium_plus' | 'tier_business']}
            {' · '}{guildLabel}
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-small text-[var(--color-muted-foreground)]">{t.sub_interval}</dt>
          <dd>
            <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <legend className="sr-only">{t.sub_interval}</legend>
              {(['monthly', 'yearly'] as const).map(option => (
                <label key={option} className={cn('inline-flex min-h-11 cursor-pointer items-center gap-2', busy && 'cursor-not-allowed opacity-60')}>
                  <input
                    type="radio"
                    name={name}
                    value={option}
                    checked={interval === option}
                    onChange={() => onIntervalChange(option)}
                    disabled={busy}
                    className="h-5 w-5 accent-[var(--color-primary)]"
                  />
                  <span className="font-semibold">{option === 'monthly' ? t.sub_interval_monthly : t.sub_interval_yearly}</span>
                </label>
              ))}
              <span className="text-small font-semibold text-[var(--color-primary)]">
                {t.sub_interval_save.replace('{n}', String(yearlyMonthsFree(tier)))}
              </span>
            </fieldset>
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-small text-[var(--color-muted-foreground)]">{t.sub_confirm_price}</dt>
          <dd className="font-semibold tabular-nums">
            {(interval === 'yearly' ? t.sub_confirm_price_value_year : t.sub_confirm_price_value)
              .replace('{price}', formatTierPrice(tier, lang, interval))}
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-small text-[var(--color-muted-foreground)]">{t.sub_confirm_term}</dt>
          <dd>{interval === 'yearly' ? t.sub_confirm_term_value_year : t.sub_confirm_term_value}</dd>
        </div>
      </dl>

      <div className="grid max-w-[65ch] gap-2 text-small text-[var(--color-muted-foreground)]">
        <p>{terms.contract_partner} {terms.vat_exempt} {terms.final_price}</p>
        <p>
          {t.sub_confirm_legal_pre}{' '}
          <Link href="/legal/terms" className="text-[var(--color-primary)] underline underline-offset-2">{t.sub_confirm_terms}</Link>
          {' '}{t.sub_confirm_legal_and}{' '}
          <Link href="/legal/withdrawal" className="text-[var(--color-primary)] underline underline-offset-2">{t.sub_confirm_withdrawal}</Link>
          {t.sub_confirm_legal_post}
        </p>
        <p>{terms.contract_languages}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* The wording is prescribed by law (§ 312j Abs. 3 BGB) and
            must not be shortened to "Abonnieren" or "Weiter". */}
        <Button onClick={onSubmit} disabled={busy} aria-busy={submitting || undefined}>
          {submitting
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <CreditCard className="h-4 w-4" />}
          {t.sub_confirm_submit}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          {t.sub_confirm_cancel}
        </Button>
      </div>
    </section>
  )
}
