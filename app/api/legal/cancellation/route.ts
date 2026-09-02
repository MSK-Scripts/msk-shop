import { NextResponse } from 'next/server'

import { validateCancellation, storeCancellation } from '@/lib/legalForms'
import { buildCancellationReceipt, buildInternalNotice, formatReceiptTime } from '@/lib/emails/legalReceipts'
import { originAllowed, mailLangFrom, clientIpOrNull, deliverReceipts, badRequest } from '../shared'

// ── Kündigungsschaltfläche (§ 312k BGB) ─────────────────────────────────────
//
// Der Weg über das Stripe-Kundenportal im Dashboard bleibt bestehen, genügt
// aber allein nicht: § 312k verlangt eine Schaltfläche auf der Website, die
// **ohne Anmeldung** unmittelbar zu einer Bestätigungsseite führt.
//
// Die Kündigung wird hier nicht ausgeführt, sondern **entgegengenommen**. Das
// ist kein Versäumnis: die Erklärung wird mit ihrem Zugang wirksam, und ohne
// Anmeldung lässt sich nicht feststellen, welches Stripe-Abo gemeint ist. Ein
// automatischer Abbruch auf Zuruf einer nicht authentifizierten Angabe wäre
// die gefährlichere Variante — jeder mit einer Discord-Server-Id könnte fremde
// Abos beenden.

export const dynamic = 'force-dynamic'

export async function POST(req: Request): Promise<NextResponse> {
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const parsed = validateCancellation(body)
  if (!parsed.ok) return badRequest(parsed.errors)

  const lang = mailLangFrom(body)
  const { kind, effectiveAt } = parsed.value

  const effectiveLabel = effectiveAt === 'asap'
    ? (lang === 'de' ? 'Zum nächstmöglichen Zeitpunkt' : 'As soon as possible')
    : effectiveAt

  const declaration = lang === 'de'
    ? `Hiermit kündige ich den mit MSK Scripts geschlossenen Vertrag über die bezeichnete Leistung `
      + `(${kind === 'extraordinary' ? 'außerordentlich aus wichtigem Grund' : 'ordentlich'}), `
      + `Kündigungszeitpunkt: ${effectiveLabel}.`
    : `I hereby cancel the contract concluded with MSK Scripts for the service identified `
      + `(${kind === 'extraordinary' ? 'immediately for cause' : 'ordinary cancellation'}), `
      + `date of cancellation: ${effectiveLabel}.`

  let stored
  try {
    stored = await storeCancellation(parsed.value, declaration, clientIpOrNull(req))
  } catch (err) {
    console.error('[legal/cancellation] Speichern fehlgeschlagen:', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  await deliverReceipts({
    table:   'msk_cancellations',
    id:      stored.id,
    to:      parsed.value.email,
    receipt: buildCancellationReceipt({
      lang,
      kind,
      name:        parsed.value.name,
      contractRef: parsed.value.contractRef,
      email:       parsed.value.email,
      effectiveAt: effectiveLabel,
      reason:      parsed.value.reason,
      receivedAt:  stored.receivedAt,
    }),
    internal: buildInternalNotice('cancellation', {
      'Art':                 kind === 'extraordinary' ? 'außerordentlich' : 'ordentlich',
      'Name':                parsed.value.name,
      'Angaben zum Vertrag': parsed.value.contractRef,
      'E-Mail':              parsed.value.email,
      'Kündigungszeitpunkt': effectiveLabel,
      'Grund':               parsed.value.reason,
      'Vorgangsnummer':      stored.id,
    }, stored.receivedAt),
  })

  return NextResponse.json({
    ok:        true,
    id:        stored.id,
    timestamp: formatReceiptTime(stored.receivedAt, lang),
  })
}
