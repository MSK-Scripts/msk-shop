import { createElement, type ComponentProps, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import { BotsOverview } from '@/components/bots/BotsOverview'
import { TicketBotTiers } from '@/components/bots/TicketBotTiers'
import { LangProvider } from '@/components/i18n/LangProvider'
import { homeTranslations, subscriptionTermsTranslations, type Lang } from '@/lib/i18n'
import { TIER_CONFIG, cheapestPaidTier, formatTierPrice, type Tier } from '@/lib/tiers'

/**
 * The prices on the bot pages come from lib/tiers.ts, the table the checkout
 * charges from (§ 312j Abs. 2 BGB: the price shown is the price charged).
 *
 * Checking that the page shows "4,99 €" would pass just as well with the
 * number typed into the component. So the test changes the price in
 * TIER_CONFIG and expects the page to follow: only a page that reads the
 * table at render time passes.
 */

function render(lang: Lang, element: ReactElement): string {
  // The cast only tells createElement that `children` comes as its third argument.
  return renderToStaticMarkup(
    createElement(LangProvider, { lang, path: '/discord/ticket-bot' } as ComponentProps<typeof LangProvider>, element),
  )
}

const tiersTable = (lang: Lang) => render(lang, createElement(TicketBotTiers, { lang }))

const PAID: Tier[] = ['premium', 'premium_plus', 'business']
const original = structuredClone(TIER_CONFIG)

afterEach(() => {
  for (const tier of Object.keys(original) as Tier[]) Object.assign(TIER_CONFIG[tier], original[tier])
})

describe('ticket bot price table', () => {
  it.each(['en', 'de'] as const)('shows every monthly and yearly price of lib/tiers.ts (%s)', lang => {
    const html = tiersTable(lang)
    for (const tier of PAID) {
      expect(html).toContain(formatTierPrice(tier, lang))
      expect(html).toContain(formatTierPrice(tier, lang, 'yearly'))
    }
  })

  it('follows a price change in TIER_CONFIG', () => {
    TIER_CONFIG.premium.priceCents = 1234
    TIER_CONFIG.premium.priceCentsYearly = 12345
    const html = tiersTable('en')
    expect(html).toContain('€12.34')
    expect(html).toContain('€123.45')
    expect(html).not.toContain('€4.99')
  })

  it('follows a limit change in TIER_CONFIG', () => {
    TIER_CONFIG.premium.uploadsPerHour = 777
    TIER_CONFIG.premium_plus.botHosting = false
    TIER_CONFIG.business.botHosting = false
    const html = tiersTable('en')
    expect(html).toContain('>777<')
    // No plan offers hosting any more: the hosting row says No four times.
    const row = html.slice(html.indexOf('Hosted bot management'))
    expect(row.slice(0, row.indexOf('</tr>')).match(/>No</g)).toHaveLength(4)
  })

  it.each(['en', 'de'] as const)('states contract partner, Stripe and the VAT exemption under the table (%s)', lang => {
    const html = tiersTable(lang)
    const terms = subscriptionTermsTranslations[lang]
    const table = html.indexOf('</table>')
    for (const sentence of [terms.contract_partner, terms.vat_exempt, terms.final_prices]) {
      expect(html.indexOf(sentence)).toBeGreaterThan(table)
    }
  })
})

describe('Discord bots overview', () => {
  const overview = (lang: Lang) => render(lang, createElement(BotsOverview, { lang }))

  it.each(['en', 'de'] as const)('names the cheapest paid plan of lib/tiers.ts as the entry price (%s)', lang => {
    const from = homeTranslations[lang].bot_price_ticket.replace('{price}', formatTierPrice(cheapestPaidTier(), lang))
    expect(overview(lang)).toContain(from)
  })

  it('follows a price change in TIER_CONFIG', () => {
    // Still the cheapest paid plan after the change, so it stays the entry price.
    TIER_CONFIG.premium.priceCents = 123
    expect(overview('en')).toContain('plans from €1.23 a month')
  })

  it('calls the giveaway bot free', () => {
    expect(overview('de')).toContain(homeTranslations.de.bot_price_giveaway)
  })
})
