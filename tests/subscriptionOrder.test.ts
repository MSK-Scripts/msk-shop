import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { OrderSummary } from '@/app/[lang]/dashboard/ticket-bot/OrderSummary'
import { LangProvider } from '@/components/i18n/LangProvider'
import { dashboardTranslations, subscriptionTermsTranslations, type Lang } from '@/lib/i18n'
import { formatTierPrice, type BillingInterval } from '@/lib/tiers'

/**
 * The order summary in front of the ticket bot's order button.
 *
 * Art. 246c Nr. 4 EGBGB wants the contract languages named before the order
 * is placed, § 312j Abs. 2 BGB the total price right before the button, and
 * draft 2.3 of the legal texts names contract partner, payment provider and
 * the VAT exemption next to that price. A line that slips below the button,
 * or out of the block, breaks a legal duty that no type check sees.
 */

const noop = () => {}

function render(lang: Lang, interval: BillingInterval): string {
  const summary = createElement(OrderSummary, {
    lang, tier: 'premium', guildLabel: 'Atlas Roleplay', interval,
    onIntervalChange: noop, busy: false, submitting: false, onSubmit: noop, onCancel: noop,
  })
  // The cast only tells createElement that `children` comes as its third argument.
  return renderToStaticMarkup(
    createElement(LangProvider, { lang, path: '/dashboard/ticket-bot' } as ComponentProps<typeof LangProvider>, summary),
  )
}

const cases = (['en', 'de'] as const).flatMap(lang =>
  (['monthly', 'yearly'] as const).map(interval => [lang, interval] as const))

describe('subscription order summary', () => {
  it.each(cases)('names the contract languages before the order button (%s, %s)', (lang, interval) => {
    const html = render(lang, interval)
    const languages = html.indexOf(subscriptionTermsTranslations[lang].contract_languages)
    const button = html.indexOf(dashboardTranslations[lang].sub_confirm_submit)
    expect(languages).toBeGreaterThan(-1)
    expect(button).toBeGreaterThan(-1)
    expect(languages).toBeLessThan(button)
  })

  it.each(cases)('states contract partner, Stripe and the VAT exemption before the button (%s, %s)', (lang, interval) => {
    const html = render(lang, interval)
    const terms = subscriptionTermsTranslations[lang]
    const button = html.indexOf(dashboardTranslations[lang].sub_confirm_submit)
    for (const sentence of [terms.contract_partner, terms.vat_exempt, terms.final_price]) {
      const at = html.indexOf(sentence)
      expect(at).toBeGreaterThan(-1)
      expect(at).toBeLessThan(button)
    }
  })

  it('quotes the price of the chosen interval from lib/tiers.ts', () => {
    expect(render('de', 'monthly')).toContain(`${formatTierPrice('premium', 'de')} pro Monat`)
    expect(render('de', 'yearly')).toContain(`${formatTierPrice('premium', 'de', 'yearly')} pro Jahr`)
    expect(render('en', 'yearly')).toContain(`${formatTierPrice('premium', 'en', 'yearly')} per year`)
  })

  it('uses the wording of the draft for the contract languages', () => {
    expect(subscriptionTermsTranslations.en.contract_languages).toBe('Contract languages: German, English.')
    expect(subscriptionTermsTranslations.de.contract_languages).toBe('Vertragssprachen: Deutsch, Englisch.')
  })
})
