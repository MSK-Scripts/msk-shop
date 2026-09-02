import { NextResponse } from 'next/server'

import { validateReport, storeReport } from '@/lib/legalForms'
import { buildReportReceipt, buildInternalNotice, formatReceiptTime } from '@/lib/emails/legalReceipts'
import { originAllowed, mailLangFrom, clientIpOrNull, deliverReceipts, badRequest } from '../shared'

// ── Meldeverfahren nach Art. 16 DSA ─────────────────────────────────────────
//
// Eine Meldung ist erst dann eine Meldung im Sinne der Verordnung, wenn sie
// URL, Begründung, Kontaktangaben **und** die Richtigkeitserklärung enthält.
// Erst dann begründet sie Kenntnis im Sinne des Art. 6 DSA. Deshalb erzwingt
// `validateReport` die Erklärung serverseitig und nicht nur im Formular.
//
// Kein Login, aus demselben Grund wie bei den anderen beiden: melden können
// muss jede Person, nicht nur Kunden.

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

  const parsed = validateReport(body)
  if (!parsed.ok) return badRequest(parsed.errors)

  const lang = mailLangFrom(body)

  let stored
  try {
    stored = await storeReport(parsed.value, clientIpOrNull(req))
  } catch (err) {
    console.error('[legal/report] Speichern fehlgeschlagen:', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  await deliverReceipts({
    table:   'msk_content_reports',
    id:      stored.id,
    to:      parsed.value.email,
    receipt: buildReportReceipt({ lang, ...parsed.value, receivedAt: stored.receivedAt }),
    internal: buildInternalNotice('report', {
      'Gemeldete Adresse': parsed.value.contentUrl,
      'Begründung':        parsed.value.reason,
      'Name':              parsed.value.name,
      'E-Mail':            parsed.value.email,
      'Vorgangsnummer':    stored.id,
    }, stored.receivedAt),
  })

  return NextResponse.json({
    ok:        true,
    id:        stored.id,
    timestamp: formatReceiptTime(stored.receivedAt, lang),
  })
}
