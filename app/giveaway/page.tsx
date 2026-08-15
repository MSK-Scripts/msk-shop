import type { Metadata } from 'next'

import { GiveawayLanding } from '@/components/bots/GiveawayLanding'
import { JsonLd } from '@/components/JsonLd'
import { giveawayAppJsonLd, giveawayMetadata } from '@/lib/botSeo'

/**
 * Englische Fassung der Giveaway-Bot-Landingpage. Deutsche Fassung unter
 * `/de/giveaway`, siehe Kommentar in `app/ticketbot/page.tsx`.
 */
export const metadata: Metadata = giveawayMetadata('en')

export default function GiveawayBotPage() {
  return (
    <>
      <JsonLd data={giveawayAppJsonLd('en')} />
      <GiveawayLanding lang="en" />
    </>
  )
}
