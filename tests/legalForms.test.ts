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

// Diese Tests decken den Teil ab, an dem die Rechtsfolge haengt: welche
// Eingaben angenommen werden und ob die Eingangsbestaetigung das enthaelt, was
// § 356a BGB und § 312k BGB verlangen. Die Datenbank bleibt aussen vor, sie
// wuerde genau den Teil wegabstrahieren, um den es hier geht.

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
    // Eine Erklaerung wegen eines zu langen Namens zurueckzuweisen waere genau
    // die Huerde, die § 356a verbietet.
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
    // Art. 16 Abs. 2 lit. d DSA: ohne diese Erklaerung ist es keine Meldung im
    // Sinne der Verordnung und begruendet keine Kenntnis nach Art. 6.
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
    // Die Zone ist kein Detail: die Bestaetigung belegt die Wahrung einer
    // Frist, und eine Uhrzeit ohne Zone beantwortet nicht, ob der letzte Tag
    // noch lief.
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
    tierLabel: 'Premium+', guildLabel: 'Atlas Roleplay', price: '6,99 €', inTrial: false,
  } as const

  it('nennt Leistung, Preis, Laufzeit und verlinkt AGB und Widerruf', () => {
    const mail = buildOrderConfirmation({ lang: 'de', ...base })
    expect(mail.text).toContain('Premium+')
    expect(mail.text).toContain('6,99 €')
    expect(mail.text).toContain('verlängert sich monatlich')
    expect(mail.text).toContain('/de/terms')
    expect(mail.text).toContain('/de/terms/widerruf')
    expect(mail.text).toContain('/de/vertrag-kuendigen')
  })

  it('verlinkt fuer englische Kunden die Wurzelfassung', () => {
    // Die Sprache steckt im Pfad: Englisch liegt auf der Wurzel. Ein Link auf
    // /de/terms in einer englischen Mail fuehrt auf einen deutschen Text.
    const mail = buildOrderConfirmation({ lang: 'en', ...base })
    expect(mail.text).toContain('https://www.msk-scripts.de/terms')
    expect(mail.text).not.toContain('/de/terms')
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
