import type { Metadata } from 'next'

import { TicketBotLanding } from '@/components/bots/TicketBotLanding'
import { JsonLd } from '@/components/JsonLd'
import { ticketBotAppJsonLd, ticketBotMetadata } from '@/lib/botSeo'

/**
 * Deutsche Fassung der Ticket-Bot-Landingpage.
 *
 * Warum es diese Route gibt, obwohl die Sprachumschaltung sonst über das
 * `msk_lang`-Cookie läuft: Ein Cookie erzeugt keine indexierbare URL. Für
 * deutschsprachige Suchanfragen („Discord Ticket Bot selbst hosten") gab es
 * damit schlicht nichts, was Google hätte ranken können. Die Ausnahme gilt
 * bewusst nur für die beiden Bot-Landingpages, der Rest der Seite bleibt
 * cookie-basiert und einsprachig pro URL.
 */
export const metadata: Metadata = ticketBotMetadata('de')

export default function TicketBotPageDe() {
  return (
    <>
      <JsonLd data={ticketBotAppJsonLd('de')} />
      <TicketBotLanding lang="de" />
    </>
  )
}
