import { describe, it, expect } from 'vitest'

import {
  validateWithdrawal, validateCancellation, validateReport,
  MAX_NAME, MAX_REASON,
} from '@/lib/legalForms'
import {
  buildWithdrawalReceipt, buildCancellationReceipt, buildReportReceipt,
  formatReceiptTime,
} from '@/lib/emails/legalReceipts'
import { buildOrderConfirmation } from '@/lib/emails/orderConfirmation'

// These tests cover the part the legal consequence depends on: which
// inputs are accepted and whether the acknowledgement of receipt contains what
// § 356a BGB and § 312k BGB require. The database stays out of it, it
// would abstract away exactly the part this is about.

const ok = { name: 'Max Mustermann', contractRef: '821125865101328384', email: 'max@example.com' }

describe('validateWithdrawal', () => {
  it('nimmt die drei Pflichtfelder an', () => {
    const r = validateWithdrawal(ok)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.email).toBe('max@example.com')
  })

  it('meldet jedes fehlende Feld einzeln', () => {
    const r = validateWithdrawal({})
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['contractRef', 'email', 'name'])
  })

  it('unterscheidet fehlende von unbrauchbarer E-Mail', () => {
    const r = validateWithdrawal({ ...ok, email: 'keine-adresse' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.email).toBe('invalid')
  })

  it('normalisiert die Adresse auf Kleinschreibung', () => {
    const r = validateWithdrawal({ ...ok, email: 'Max@Example.COM' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.email).toBe('max@example.com')
  })

  it('schneidet ueberlange Eingaben ab, statt sie abzulehnen', () => {
    // Rejecting a declaration because of a name that is too long would be exactly
    // the hurdle that § 356a prohibits.
    const r = validateWithdrawal({ ...ok, name: 'a'.repeat(MAX_NAME + 500) })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.name).toHaveLength(MAX_NAME)
  })

  it('behandelt reinen Leerraum wie fehlend', () => {
    const r = validateWithdrawal({ ...ok, name: '   \t  ' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.name).toBe('required')
  })
})

describe('validateCancellation', () => {
  it('faellt ohne Angabe auf die ordentliche Kuendigung zurueck', () => {
    const r = validateCancellation(ok)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.kind).toBe('ordinary')
  })

  it('uebernimmt die ausserordentliche Kuendigung', () => {
    const r = validateCancellation({ ...ok, kind: 'extraordinary', reason: 'Dienst dauerhaft gestoert' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.kind).toBe('extraordinary')
      expect(r.value.reason).toBe('Dienst dauerhaft gestoert')
    }
  })

  it('setzt einen fehlenden Zeitpunkt auf asap statt ihn zu bemaengeln', () => {
    const r = validateCancellation(ok)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.effectiveAt).toBe('asap')
  })

  it('laesst einen unbekannten kind-Wert nicht durch', () => {
    const r = validateCancellation({ ...ok, kind: 'sofort-und-fuer-immer' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.kind).toBe('ordinary')
  })
})

describe('validateReport', () => {
  const report = {
    contentUrl: 'https://www.msk-scripts.de/images/vehicles/adder',
    reason:     'Das Bild verletzt ein Urheberrecht.',
    name:       'Erika Musterfrau',
    email:      'erika@example.com',
    declaredTrue: true,
  }

  it('nimmt eine vollstaendige Meldung an', () => {
    expect(validateReport(report).ok).toBe(true)
  })

  it('lehnt sie ohne Richtigkeitserklaerung ab', () => {
    // Art. 16 Abs. 2 lit. d DSA: without this declaration it is not a notice within
    // the meaning of the regulation and does not establish knowledge under Art. 6.
    const r = validateReport({ ...report, declaredTrue: false })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.declaredTrue).toBe('required')
  })

  it('verlangt eine http(s)-Adresse', () => {
    const r = validateReport({ ...report, contentUrl: 'javascript:alert(1)' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.contentUrl).toBe('invalid')
  })

  it('behaelt Zeilenumbrueche in der Begruendung', () => {
    const r = validateReport({ ...report, reason: 'Zeile eins\nZeile zwei' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.reason).toContain('\n')
  })

  it('deckelt die Begruendung', () => {
    const r = validateReport({ ...report, reason: 'x'.repeat(MAX_REASON + 100) })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.reason).toHaveLength(MAX_REASON)
  })
})

describe('Eingangsbestaetigungen', () => {
  const at = new Date('2026-09-02T12:34:56Z')

  it('nennt Datum, Uhrzeit und Zeitzone', () => {
    // The zone is not a detail: the acknowledgement proves that a deadline
    // was met, and a time without a zone does not answer whether the last day
    // was still running.
    const s = formatReceiptTime(at, 'de')
    expect(s).toContain('02.09.2026')
    expect(s).toContain('Europe/Berlin')
  })

  it('enthaelt im Widerruf den Inhalt der Erklaerung', () => {
    const mail = buildWithdrawalReceipt({ lang: 'de', ...ok, receivedAt: at })
    expect(mail.subject).toContain('Widerruf')
    expect(mail.text).toContain('Hiermit widerrufe ich')
    expect(mail.text).toContain(ok.contractRef)
    expect(mail.text).toContain('02.09.2026')
  })

  it('nennt bei der Kuendigung die Art und den Zeitpunkt', () => {
    const mail = buildCancellationReceipt({
      lang: 'de', kind: 'extraordinary', ...ok,
      effectiveAt: '31.12.2026', reason: null, receivedAt: at,
    })
    expect(mail.text).toContain('Außerordentliche Kündigung')
    expect(mail.text).toContain('31.12.2026')
  })

  it('escaped fremde Eingaben im HTML-Teil', () => {
    const mail = buildReportReceipt({
      lang: 'en',
      name: '<script>alert(1)</script>',
      email: 'a@b.de',
      contentUrl: 'https://example.com/x?a=1&b=2',
      reason: 'weil "so"',
      receivedAt: at,
    })
    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('&lt;script&gt;')
    expect(mail.html).toContain('&amp;b=2')
  })
})

describe('Bestellbestaetigung (§ 312f BGB)', () => {
  const base = {
    tierLabel: 'Premium+', guildLabel: 'Atlas Roleplay', price: '6,99 €', interval: 'monthly', inTrial: false,
  } as const

  it('nennt Leistung, Preis, Laufzeit und verlinkt AGB und Widerruf', () => {
    const mail = buildOrderConfirmation({ lang: 'de', ...base })
    expect(mail.text).toContain('Premium+')
    expect(mail.text).toContain('6,99 €')
    expect(mail.text).toContain('verlängert sich monatlich')
    expect(mail.text).toContain('https://www.msk-scripts.de/de/rechtliches/agb')
    expect(mail.text).toContain('https://www.msk-scripts.de/de/rechtliches/widerrufsbelehrung')
    expect(mail.text).toContain('https://www.msk-scripts.de/de/vertrag-widerrufen')
    expect(mail.text).toContain('https://www.msk-scripts.de/de/vertrag-kuendigen')
    expect(mail.text).toContain('https://www.msk-scripts.de/de/dashboard/ticket-bot')
  })

  it('links the English version for English customers', () => {
    // The language lives in the path. A link to /de/rechtliches/agb in an
    // English mail leads to a German text.
    const mail = buildOrderConfirmation({ lang: 'en', ...base })
    expect(mail.text).toContain('https://www.msk-scripts.de/en/legal/terms')
    expect(mail.text).toContain('https://www.msk-scripts.de/en/legal/withdrawal')
    expect(mail.text).toContain('https://www.msk-scripts.de/en/withdraw-contract')
    expect(mail.text).toContain('https://www.msk-scripts.de/en/cancel-contract')
    expect(mail.text).not.toContain('/de/')
  })

  it('sends a subscriber straight to the withdrawal form, past the question which contract', () => {
    // The withdrawal page first asks whether it is a subscription or a shop
    // purchase (draft 2.5). The confirmation of a subscription preselects it.
    expect(buildOrderConfirmation({ lang: 'de', ...base }).text)
      .toContain('https://www.msk-scripts.de/de/vertrag-widerrufen?contract=subscription')
    expect(buildOrderConfirmation({ lang: 'en', ...base }).text)
      .toContain('https://www.msk-scripts.de/en/withdraw-contract?contract=subscription')
  })

  it('states the VAT exemption under § 19 UStG in both languages', () => {
    // § 34a UStDV requires a note on the exemption. Since 2025 § 19 UStG is
    // an exemption, so "no VAT shown" no longer describes it correctly.
    const de = buildOrderConfirmation({ lang: 'de', ...base })
    const en = buildOrderConfirmation({ lang: 'en', ...base })
    expect(de.text).toContain('Steuerfreie Leistung, Kleinunternehmer nach § 19 UStG')
    expect(en.text).toContain('VAT-exempt supply, small business under § 19 UStG')
    expect(de.text).not.toContain('ausgewiesen')
  })

  // § 312f BGB: the mail confirms the contract content, and price and term are
  // part of it. Until 28.10.2026 it only knew monthly plans, so a yearly
  // subscriber read "49,00 € pro Monat" and "verlängert sich monatlich".
  describe('price period and term follow the billing interval', () => {
    const yearly = { ...base, tierLabel: 'Premium', price: '49,00 €', interval: 'yearly' } as const

    it('states a monthly plan as per month, one month, renewing monthly', () => {
      const de = buildOrderConfirmation({ ...base, lang: 'de' }).text
      const en = buildOrderConfirmation({ ...base, lang: 'en' }).text
      expect(de).toContain('Preis: 6,99 € pro Monat')
      expect(de).toContain('Laufzeit: ein Monat, verlängert sich monatlich')
      expect(en).toContain('Price: 6,99 € per month')
      expect(en).toContain('Term: one month, renews monthly')
      for (const text of [de, en]) {
        expect(text).not.toMatch(/pro Jahr|jährlich|zwölf|per year|yearly|twelve/)
      }
    })

    it('states a yearly plan as per year, twelve months, renewing yearly', () => {
      const de = buildOrderConfirmation({ ...yearly, lang: 'de' }).text
      const en = buildOrderConfirmation({ ...yearly, lang: 'en' }).text
      expect(de).toContain('Preis: 49,00 € pro Jahr')
      expect(de).toContain('Laufzeit: zwölf Monate, verlängert sich jährlich')
      expect(en).toContain('Price: 49,00 € per year')
      expect(en).toContain('Term: twelve months, renews yearly')
      for (const text of [de, en]) {
        expect(text).not.toMatch(/pro Monat|monatlich|ein Monat|per month|monthly|one month/)
      }
    })

    it('carries the same lines into the HTML part', () => {
      const html = buildOrderConfirmation({ ...yearly, lang: 'de' }).html
      expect(html).toContain('<li>Preis: 49,00 € pro Jahr</li>')
      expect(html).toContain('<li>Laufzeit: zwölf Monate, verlängert sich jährlich</li>')
    })
  })

  it('weist die Testphase samt Ende aus', () => {
    const mail = buildOrderConfirmation({
      lang: 'de', ...base, inTrial: true, trialEndsAt: new Date('2026-09-16T00:00:00Z'),
    })
    expect(mail.text).toContain('Testphase')
    expect(mail.text).toContain('16. September 2026')
  })

  it('escaped den Servernamen', () => {
    const mail = buildOrderConfirmation({ ...base, lang: 'de', guildLabel: '<b>x</b>' })
    expect(mail.html).not.toContain('<b>x</b>')
    expect(mail.html).toContain('&lt;b&gt;')
  })
})
