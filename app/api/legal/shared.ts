// Shared code for the three mandatory form routes.
//
// This keeps the routes themselves short enough to see at a glance what they
// check and in which order they write and send.

import { NextResponse } from 'next/server'
import { getClientIp }  from '@/lib/rateLimit'
import { sendMail }     from '@/lib/mail'
import { markConfirmed } from '@/lib/legalForms'
import type { MailLang, BuiltEmail } from '@/lib/emails/legalReceipts'

/** Where the internal notification goes. The DSA contact is the same
 *  address, there is no separate `dsa@` mailbox (yet). */
export const NOTICE_RECIPIENT = 'info@msk-scripts.de'

/**
 * Origin check as in `adminRoute` and the image upload: browsers always send an
 * Origin on a POST, and a foreign origin cannot forge it.
 * A missing Origin is allowed (server-side call).
 */
export function originAllowed(req: Request): boolean {
  const origin  = req.headers.get('origin')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de'
  return !origin || origin === baseUrl
}

/** Language of the confirmation mail, taken from the body. No guessing via
 *  headers: the page knows its own language and sends it along. */
export function mailLangFrom(body: unknown): MailLang {
  const raw = (body as Record<string, unknown> | null)?.lang
  return raw === 'de' ? 'de' : 'en'
}

export function clientIpOrNull(req: Request): string | null {
  const ip = getClientIp(req)
  return ip && ip !== '127.0.0.1' ? ip.slice(0, 45) : null
}

/**
 * Confirmation to the declaring person and notification to us.
 *
 * The result is **not** lifted into the HTTP status: at this point the
 * declaration is already stored with a timestamp in the database, the deadline
 * is met, and a 500 after a successful save would invite the sender to retry
 * and create the same declaration a second time.
 * If sending fails, `confirmed_at` stays NULL; that is the list that has to be
 * followed up by hand.
 */
export async function deliverReceipts(opts: {
  table:     'msk_withdrawals' | 'msk_cancellations' | 'msk_content_reports'
  id:        string
  to:        string
  receipt:   BuiltEmail
  internal:  BuiltEmail
}): Promise<void> {
  const { table, id, to, receipt, internal } = opts

  try {
    const sent = await sendMail({ to, ...receipt })
    if (sent) await markConfirmed(table, id)
    else console.warn('[legal] SMTP nicht konfiguriert, keine Eingangsbestätigung für', id)
  } catch (err) {
    console.error('[legal] Eingangsbestätigung fehlgeschlagen für', id, err)
  }

  try {
    await sendMail({ to: NOTICE_RECIPIENT, ...internal })
  } catch (err) {
    console.error('[legal] Interne Benachrichtigung fehlgeschlagen für', id, err)
  }
}

/** Uniform response to a validation error. */
export function badRequest(errors: Record<string, string>): NextResponse {
  return NextResponse.json({ errors }, { status: 400 })
}
