import { NextResponse } from 'next/server'

import { validateWithdrawal, storeWithdrawal } from '@/lib/legalForms'
import { buildWithdrawalReceipt, buildInternalNotice, formatReceiptTime } from '@/lib/emails/legalReceipts'
import { originAllowed, mailLangFrom, clientIpOrNull, deliverReceipts, badRequest } from '../shared'

// ── Withdrawal function (§ 356a BGB) ────────────────────────────────────────
//
// Deliberately **without sign-in**. The statute requires a button that stays
// reachable without any hurdle for the entire withdrawal period; a login would
// be such a hurdle, and someone who wants to withdraw may have lost access for
// exactly that reason.
//
// For the same reason there is **no lookup against `ticketbot_guilds`**. The
// declaring person has to identify the contract, not prove it. Whether the
// details belong to a real subscription is settled during processing, not by
// the form.

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
    // Here and only here a 500 is right: without a stored row there is no
    // record, and then the sender really does have to try again.
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
