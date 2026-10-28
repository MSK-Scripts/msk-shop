import type { Metadata } from 'next'

import { GiveawayLanding } from '@/components/bots/GiveawayLanding'
import { JsonLd } from '@/components/JsonLd'
import { giveawayAppJsonLd, giveawayMetadata } from '@/lib/botSeo'
import { getRequestLang } from '@/lib/serverLang'

/**
 * Landing page of the giveaway bot, bilingual via the path.
 * See `app/ticketbot/page.tsx`, the same applies here.
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
