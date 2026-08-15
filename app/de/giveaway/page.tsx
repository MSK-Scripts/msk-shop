import type { Metadata } from 'next'

import { GiveawayLanding } from '@/components/bots/GiveawayLanding'
import { JsonLd } from '@/components/JsonLd'
import { giveawayAppJsonLd, giveawayMetadata } from '@/lib/botSeo'

/**
 * Deutsche Fassung der Giveaway-Bot-Landingpage. Begründung für die eigene URL
 * steht in `app/de/ticketbot/page.tsx`.
 */
export const metadata: Metadata = giveawayMetadata('de')

export default function GiveawayBotPageDe() {
  return (
    <>
      <JsonLd data={giveawayAppJsonLd('de')} />
      <GiveawayLanding lang="de" />
    </>
  )
}
