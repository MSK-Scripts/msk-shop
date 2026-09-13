import type { Metadata } from 'next'

import { TicketBotLanding } from '@/components/bots/TicketBotLanding'
import { JsonLd } from '@/components/JsonLd'
import { ticketBotAppJsonLd, ticketBotMetadata } from '@/lib/botSeo'
import { getRequestLang } from '@/lib/serverLang'

/**
 * Landing page of the ticket bot, bilingual via the path.
 *
 * `/ticketbot` and `/de/ticketbot` are two indexable addresses with
 * reciprocal hreflang. Until 22.08.2026 there were two files for this; since
 * the proxy rewrites `/de/…` internally, this one is enough, and the language
 * comes from the request.
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
