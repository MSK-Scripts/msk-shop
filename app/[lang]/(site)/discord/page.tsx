import type { Metadata } from 'next'

import { BotsOverview } from '@/components/bots/BotsOverview'
import { pageSeo } from '@/lib/pageSeo'
import { publicPath } from '@/lib/routes'
import { alternatesFor, openGraphFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'

/** `/en/discord` and `/de/discord`: the overview of the two Discord bots (plan 5.2). */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/discord', lang)
  return {
    title:       seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/discord'),
    openGraph:   openGraphFor({ url: publicPath(lang, '/discord'), title: seo.title, description: seo.description }),
  }
}

export default async function DiscordPage() {
  const { lang } = await getRequestLang()
  return <BotsOverview lang={lang} />
}
