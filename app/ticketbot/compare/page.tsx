import type { Metadata } from 'next'

import { TicketBotCompare } from '@/components/bots/TicketBotCompare'
import { JsonLd } from '@/components/JsonLd'
import { ticketBotCompareCopy } from '@/content/ticketbot-compare-copy'
import { ticketBotCompareMetadata } from '@/lib/botSeo'
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/jsonLd'
import { alternatePaths } from '@/lib/lang'
import { getRequestLang } from '@/lib/serverLang'

/**
 * "Which Discord ticket bot should I pick": the question people really ask.
 *
 * The landing page says what the bot can do. This page answers the
 * buying decision and names the cases in which another project fits
 * better. That is the format language models quote from, and the
 * reason why the counterarguments here are not cosmetic.
 *
 * Bilingual via the path like the landing pages: `/ticketbot/compare` and
 * `/de/ticketbot/compare` are two indexable addresses with reciprocal
 * hreflang, the language comes from the request.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return ticketBotCompareMetadata(lang)
}

export default async function TicketBotComparePage() {
  const { lang } = await getRequestLang()
  const copy     = ticketBotCompareCopy(lang)

  // The breadcrumb names the paths of the current language version. `alternatePaths`
  // is the only place that knows the language prefix; set by hand, it would be
  // the next place that gets left behind when a route changes.
  const path   = (p: string) => alternatePaths(p)[lang]
  const crumbs = breadcrumbJsonLd([
    { name: 'MSK Scripts', path: path('/') },
    { name: 'Ticket Bot',  path: path('/ticketbot') },
    { name: copy.badge },
  ])

  return (
    <>
      <JsonLd data={crumbs} />
      <JsonLd data={faqPageJsonLd(copy.faq.map(item => ({ question: item.q, answer: item.a })))} />
      <TicketBotCompare lang={lang} />
    </>
  )
}
