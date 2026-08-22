import type { Metadata } from 'next'

import { TicketBotLanding } from '@/components/bots/TicketBotLanding'
import { JsonLd } from '@/components/JsonLd'
import { ticketBotAppJsonLd, ticketBotMetadata } from '@/lib/botSeo'
import { getRequestLang } from '@/lib/serverLang'

/**
 * Landingpage des Ticket-Bots, zweisprachig über den Pfad.
 *
 * `/ticketbot` und `/de/ticketbot` sind zwei indexierbare Adressen mit
 * reziprokem hreflang. Bis zum 22.08.2026 gab es dafür zwei Dateien; seit der
 * Proxy `/de/…` intern umschreibt, reicht diese eine, und die Sprache kommt
 * aus dem Request.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return ticketBotMetadata(lang)
}

export default async function TicketBotPage() {
  const { lang } = await getRequestLang()
  return (
    <>
      <JsonLd data={ticketBotAppJsonLd(lang)} />
      <TicketBotLanding lang={lang} />
    </>
  )
}
