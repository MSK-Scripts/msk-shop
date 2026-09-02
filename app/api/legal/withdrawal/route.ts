import { NextResponse } from 'next/server'

import { validateWithdrawal, storeWithdrawal } from '@/lib/legalForms'
import { buildWithdrawalReceipt, buildInternalNotice, formatReceiptTime } from '@/lib/emails/legalReceipts'
import { originAllowed, mailLangFrom, clientIpOrNull, deliverReceipts, badRequest } from '../shared'

// ── Widerrufsfunktion (§ 356a BGB) ──────────────────────────────────────────
//
// Bewusst **ohne Anmeldung**. Die Norm verlangt eine Schaltfläche, die während
// der gesamten Widerrufsfrist ohne Hürde erreichbar ist; ein Login wäre eine
// solche Hürde, und wer gerade widerrufen will, hat womöglich genau deshalb
// keinen Zugang mehr.
//
// Es findet deshalb auch **kein Abgleich gegen `ticketbot_guilds`** statt. Der
// Erklärende muss den Vertrag identifizierbar bezeichnen, nicht beweisen. Ob
// die Angabe zu einem echten Abo gehört, klärt die Bearbeitung, nicht das
// Formular.

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

  const parsed = validateWithdrawal(body)
  if (!parsed.ok) return badRequest(parsed.errors)

  const lang = mailLangFrom(body)
  const declaration = lang === 'de'
    ? 'Hiermit widerrufe ich den mit MSK Scripts geschlossenen Vertrag über die bezeichnete Leistung.'
    : 'I hereby withdraw from the contract concluded with MSK Scripts for the service identified.'

  let stored
  try {
    stored = await storeWithdrawal(parsed.value, declaration, clientIpOrNull(req))
  } catch (err) {
    // Hier und nur hier ist ein 500 richtig: ohne gespeicherte Zeile gibt es
    // keinen Nachweis, und dann muss der Absender es wirklich noch einmal
    // versuchen.
    console.error('[legal/withdrawal] Speichern fehlgeschlagen:', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  await deliverReceipts({
    table:   'msk_withdrawals',
    id:      stored.id,
    to:      parsed.value.email,
    receipt: buildWithdrawalReceipt({ lang, ...parsed.value, receivedAt: stored.receivedAt }),
    internal: buildInternalNotice('withdrawal', {
      'Name':                parsed.value.name,
      'Angaben zum Vertrag': parsed.value.contractRef,
      'E-Mail':              parsed.value.email,
      'Vorgangsnummer':      stored.id,
    }, stored.receivedAt),
  })

  return NextResponse.json({
    ok:        true,
    id:        stored.id,
    timestamp: formatReceiptTime(stored.receivedAt, lang),
  })
}
