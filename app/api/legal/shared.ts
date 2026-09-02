// Gemeinsames für die drei Pflichtformular-Routen.
//
// Die Routen selbst bleiben dadurch kurz genug, dass man auf einen Blick sieht,
// was sie prüfen und in welcher Reihenfolge sie schreiben und versenden.

import { NextResponse } from 'next/server'
import { getClientIp }  from '@/lib/rateLimit'
import { sendMail }     from '@/lib/mail'
import { markConfirmed } from '@/lib/legalForms'
import type { MailLang, BuiltEmail } from '@/lib/emails/legalReceipts'

/** Wohin die interne Benachrichtigung geht. Der DSA-Kontakt ist dieselbe
 *  Adresse, ein eigenes `dsa@`-Postfach gibt es (noch) nicht. */
export const NOTICE_RECIPIENT = 'info@msk-scripts.de'

/**
 * Origin-Prüfung wie in `adminRoute` und beim Bild-Upload: Browser senden bei
 * einem POST immer einen Origin, fälschen kann ihn ein fremder Ursprung nicht.
 * Ein fehlender Origin ist erlaubt (server-seitiger Aufruf).
 */
export function originAllowed(req: Request): boolean {
  const origin  = req.headers.get('origin')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de'
  return !origin || origin === baseUrl
}

/** Sprache der Bestätigungsmail aus dem Body. Kein Rateraten über Header:
 *  die Seite kennt ihre eigene Sprache und schickt sie mit. */
export function mailLangFrom(body: unknown): MailLang {
  const raw = (body as Record<string, unknown> | null)?.lang
  return raw === 'de' ? 'de' : 'en'
}

export function clientIpOrNull(req: Request): string | null {
  const ip = getClientIp(req)
  return ip && ip !== '127.0.0.1' ? ip.slice(0, 45) : null
}

/**
 * Bestätigung an den Erklärenden und Benachrichtigung an uns.
 *
 * Das Ergebnis wird **nicht** in den HTTP-Status gehoben: die Erklärung liegt
 * zu diesem Zeitpunkt bereits mit Zeitstempel in der Datenbank, die Frist ist
 * gewahrt, und ein 500 nach erfolgreicher Speicherung würde den Absender zum
 * Wiederholen einladen und dieselbe Erklärung ein zweites Mal erzeugen.
 * Scheitert der Versand, bleibt `confirmed_at` NULL — das ist die Liste, die
 * von Hand nachgearbeitet werden muss.
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

/** Einheitliche Antwort auf einen Validierungsfehler. */
export function badRequest(errors: Record<string, string>): NextResponse {
  return NextResponse.json({ errors }, { status: 400 })
}
