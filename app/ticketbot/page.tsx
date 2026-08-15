import type { Metadata } from 'next'

import { TicketBotLanding } from '@/components/bots/TicketBotLanding'
import { JsonLd } from '@/components/JsonLd'
import { ticketBotAppJsonLd, ticketBotMetadata } from '@/lib/botSeo'

/**
 * Englische Fassung der Ticket-Bot-Landingpage.
 *
 * Die Sprache ist hier **fest**, nicht cookie-abhängig: Die deutsche Fassung
 * hat mit `/de/ticketbot` eine eigene URL, und zwei URLs, die je nach Cookie
 * denselben Inhalt zeigen könnten, wären Duplicate Content.
 */
export const metadata: Metadata = ticketBotMetadata('en')

export default function TicketBotPage() {
  return (
    <>
      <JsonLd data={ticketBotAppJsonLd('en')} />
      <TicketBotLanding lang="en" />
    </>
  )
}
