import { NextResponse } from 'next/server'

import { validateCancellation, storeCancellation } from '@/lib/legalForms'
import { buildCancellationReceipt, buildInternalNotice, formatReceiptTime } from '@/lib/emails/legalReceipts'
import { originAllowed, mailLangFrom, clientIpOrNull, deliverReceipts, badRequest } from '../shared'

// ── Cancellation button (§ 312k BGB) ────────────────────────────────────────
//
// The route via the Stripe customer portal in the dashboard remains, but on
// its own it is not enough: § 312k requires a button on the website that leads
// **without sign-in** directly to a confirmation page.
//
// The cancellation is not carried out here but **received**. That is not an
// omission: the declaration takes effect upon receipt, and without sign-in
// there is no way to tell which Stripe subscription is meant. An automatic
// termination on the say-so of unauthenticated input would be the more
// dangerous option: anyone with a Discord server id could end other people's
// subscriptions.

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
