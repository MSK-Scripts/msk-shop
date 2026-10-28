'use client'

import { CircleNotch as Loader2, CreditCard } from '@/components/icons'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Button } from '@/components/ui/Button'
import { dashboardTranslations, subscriptionTermsTranslations, type Lang } from '@/lib/i18n'
import { formatTierPrice, yearlyMonthsFree, type BillingInterval, type Tier } from '@/lib/tiers'

export type PaidTier = Exclude<Tier, 'basic'>

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
 */
export function OrderSummary({
  lang, tier, guildLabel, interval, onIntervalChange, busy, submitting, onSubmit, onCancel,
}: Props) {
  const t = dashboardTranslations[lang]
  const terms = subscriptionTermsTranslations[lang]

  return (
    <div className="mb-6 rounded-lg border border-[var(--color-primary)]/30 bg-[color-mix(in_oklab,var(--color-primary)_6%,transparent)] p-4">
      <h2 className="text-sm font-bold text-[var(--color-foreground)]">{t.sub_confirm_title}</h2>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-[var(--color-muted-foreground)]">{t.sub_confirm_service}:</dt>
          <dd className="font-medium text-[var(--color-foreground)]">
            {t[`tier_${tier}` as 'tier_premium' | 'tier_premium_plus' | 'tier_business']}
            {' · '}{guildLabel}
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <dt className="text-[var(--color-muted-foreground)]">{t.sub_interval}:</dt>
          <dd className="flex items-center gap-1.5">
            {(['monthly', 'yearly'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => onIntervalChange(option)}
                aria-pressed={interval === option}
                disabled={busy}
                className={
                  interval === option
                    ? 'rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]'
                    : 'rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }
              >
                {option === 'monthly' ? t.sub_interval_monthly : t.sub_interval_yearly}
              </button>
            ))}
            <span className="text-xs text-[var(--color-primary)]">
              {t.sub_interval_save.replace('{n}', String(yearlyMonthsFree(tier)))}
            </span>
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-[var(--color-muted-foreground)]">{t.sub_confirm_price}:</dt>
          <dd className="font-medium text-[var(--color-foreground)]">
            {(interval === 'yearly' ? t.sub_confirm_price_value_year : t.sub_confirm_price_value)
              .replace('{price}', formatTierPrice(tier, lang, interval))}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-[var(--color-muted-foreground)]">{t.sub_confirm_term}:</dt>
          <dd className="font-medium text-[var(--color-foreground)]">
            {interval === 'yearly' ? t.sub_confirm_term_value_year : t.sub_confirm_term_value}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        {terms.contract_partner} {terms.vat_exempt} {terms.final_price}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        {t.sub_confirm_legal_pre}{' '}
        <Link href="/legal/terms" className="text-[var(--color-primary)] hover:underline">{t.sub_confirm_terms}</Link>
        {' '}{t.sub_confirm_legal_and}{' '}
        <Link href="/legal/withdrawal" className="text-[var(--color-primary)] hover:underline">{t.sub_confirm_withdrawal}</Link>
        {t.sub_confirm_legal_post}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        {terms.contract_languages}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {/* The wording is prescribed by law (§ 312j Abs. 3 BGB) and
            must not be shortened to "Abonnieren" or "Weiter". */}
        <Button size="sm" onClick={onSubmit} disabled={busy}>
          {submitting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <CreditCard className="h-3.5 w-3.5" />}
          {t.sub_confirm_submit}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
          {t.sub_confirm_cancel}
        </Button>
      </div>
    </div>
  )
}
