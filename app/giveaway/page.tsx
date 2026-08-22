import type { Metadata } from 'next'

import { GiveawayLanding } from '@/components/bots/GiveawayLanding'
import { JsonLd } from '@/components/JsonLd'
import { giveawayAppJsonLd, giveawayMetadata } from '@/lib/botSeo'
import { getRequestLang } from '@/lib/serverLang'

/**
 * Landingpage des Giveaway-Bots, zweisprachig über den Pfad.
 * Siehe `app/ticketbot/page.tsx`, hier gilt dasselbe.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return giveawayMetadata(lang)
}

export default async function GiveawayPage() {
  const { lang } = await getRequestLang()
  return (
    <>
      <JsonLd data={giveawayAppJsonLd(lang)} />
      <GiveawayLanding lang={lang} />
    </>
  )
}
