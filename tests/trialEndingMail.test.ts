import { describe, it, expect } from 'vitest'
import type Stripe from 'stripe'
import {
  buildTrialEndingEmail,
  pickMailLang,
  formatTrialEnd,
} from '@/lib/emails/trialEnding'
import { hasPaymentMethod, formatSubscriptionPrice } from '@/lib/stripe'
import { mailConfigFromEnv } from '@/lib/mail'

const END = new Date(Date.UTC(2026, 8, 12)) // 12 September 2026

function sub(partial: Record<string, unknown>): Stripe.Subscription {
  return {
    items: { data: [{ price: { unit_amount: 399, currency: 'eur' } }] },
    ...partial,
  } as unknown as Stripe.Subscription
}

describe('pickMailLang', () => {
  it('uses German only for an explicit German locale', () => {
    expect(pickMailLang(['de'])).toBe('de')
    expect(pickMailLang(['de-AT'])).toBe('de')
    expect(pickMailLang(['DE-CH', 'en'])).toBe('de')
  })

  it('falls back to English for everything else', () => {
    expect(pickMailLang(['en-GB'])).toBe('en')
    expect(pickMailLang(['fr'])).toBe('en')
    expect(pickMailLang([])).toBe('en')
    expect(pickMailLang(null)).toBe('en')
    expect(pickMailLang(undefined)).toBe('en')
  })
})

describe('buildTrialEndingEmail', () => {
  const base = { guildLabel: 'Testserver', trialEndsAt: END, price: '3,99 €' }

  it('names the date in subject and body', () => {
    const de = buildTrialEndingEmail({ ...base, lang: 'de' })
    const dateDe = formatTrialEnd(END, 'de')
    expect(de.subject).toContain(dateDe)
    expect(de.text).toContain(dateDe)
    expect(de.html).toContain(dateDe)
  })

  it('states that nothing is charged, the whole point of the mail', () => {
    expect(buildTrialEndingEmail({ ...base, lang: 'de' }).text).toContain('Es wird nichts abgebucht.')
    expect(buildTrialEndingEmail({ ...base, lang: 'en' }).text).toContain('Nothing will be charged.')
  })

  it('links the dashboard in both the text and the html part', () => {
    const mail = buildTrialEndingEmail({ ...base, lang: 'en' })
    expect(mail.text).toContain('https://www.msk-scripts.de/ticketbot/dashboard')
    expect(mail.html).toContain('https://www.msk-scripts.de/ticketbot/dashboard')
  })

  it('escapes the guild name so a server called "<script>" cannot inject html', () => {
    const mail = buildTrialEndingEmail({
      ...base,
      lang: 'en',
      guildLabel: '<script>alert(1)</script>',
    })
    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('&lt;script&gt;')
    // The plain-text part keeps the raw name; there is nothing to inject there.
    expect(mail.text).toContain('<script>alert(1)</script>')
  })

  it('quotes the price the customer would pay', () => {
    expect(buildTrialEndingEmail({ ...base, lang: 'de' }).text).toContain('3,99 €')
  })
})

describe('hasPaymentMethod', () => {
  it('is true when the subscription itself carries one', () => {
    expect(hasPaymentMethod(sub({ default_payment_method: 'pm_1' }), null)).toBe(true)
  })

  it('is true when the customer has a default (that is where the portal writes it)', () => {
    const customer = { invoice_settings: { default_payment_method: 'pm_2' } } as Stripe.Customer
    expect(hasPaymentMethod(sub({}), customer)).toBe(true)
  })

  it('is false with no method anywhere, which is what triggers the reminder', () => {
    const customer = { invoice_settings: { default_payment_method: null } } as unknown as Stripe.Customer
    expect(hasPaymentMethod(sub({}), customer)).toBe(false)
    expect(hasPaymentMethod(sub({}), null)).toBe(false)
  })

  it('treats a deleted customer as having none rather than throwing', () => {
    const deleted = { deleted: true } as Stripe.DeletedCustomer
    expect(hasPaymentMethod(sub({}), deleted)).toBe(false)
  })
})

describe('formatSubscriptionPrice', () => {
  it('formats per language from the subscription, not from a constant', () => {
    expect(formatSubscriptionPrice(sub({}), 'de')).toMatch(/3,99/)
    expect(formatSubscriptionPrice(sub({}), 'en')).toMatch(/3\.99/)
  })

  it('returns an empty string when the price is unreadable', () => {
    const bare = { items: { data: [] } } as unknown as Stripe.Subscription
    expect(formatSubscriptionPrice(bare, 'de')).toBe('')
  })
})

describe('mailConfigFromEnv', () => {
  const full = {
    SMTP_HOST: 'mail.example.com',
    SMTP_PORT: '465',
    SMTP_USER: 'noreply@example.com',
    SMTP_PASS: 'secret',
    MAIL_FROM: 'MSK <noreply@example.com>',
  }

  it('reads a complete configuration', () => {
    expect(mailConfigFromEnv(full)).toEqual({
      host: 'mail.example.com',
      port: 465,
      user: 'noreply@example.com',
      pass: 'secret',
      from: 'MSK <noreply@example.com>',
    })
  })

  it('derives a from address from the user when MAIL_FROM is absent', () => {
    const { MAIL_FROM: _unused, ...rest } = full
    expect(mailConfigFromEnv(rest)?.from).toBe('MSK Scripts <noreply@example.com>')
  })

  it('returns null on any missing piece, so sending degrades to a no-op', () => {
    for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] as const) {
      expect(mailConfigFromEnv({ ...full, [key]: '' })).toBeNull()
    }
    expect(mailConfigFromEnv({})).toBeNull()
    expect(mailConfigFromEnv({ ...full, SMTP_PORT: 'nope' })).toBeNull()
  })
})
