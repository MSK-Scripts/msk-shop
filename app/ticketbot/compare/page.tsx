import type { Metadata } from 'next'

import { TicketBotCompare } from '@/components/bots/TicketBotCompare'
import { JsonLd } from '@/components/JsonLd'
import { ticketBotCompareCopy } from '@/content/ticketbot-compare-copy'
import { ticketBotCompareMetadata } from '@/lib/botSeo'
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/jsonLd'
import { alternatePaths } from '@/lib/lang'
import { getRequestLang } from '@/lib/serverLang'

/**
 * „Welchen Discord Ticket Bot nehmen" — die Frage, die Leute wirklich stellen.
 *
 * Die Landingpage sagt, was der Bot kann. Diese Seite beantwortet die
 * Kaufentscheidung und nennt dabei die Fälle, in denen ein anderes Projekt
 * besser passt. Das ist das Format, aus dem Sprachmodelle zitieren, und der
 * Grund, warum die Gegenargumente hier nicht kosmetisch sind.
 *
 * Zweisprachig über den Pfad wie die Landingpages: `/ticketbot/compare` und
 * `/de/ticketbot/compare` sind zwei indexierbare Adressen mit reziprokem
 * hreflang, die Sprache kommt aus dem Request.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return ticketBotCompareMetadata(lang)
}

export default async function TicketBotComparePage() {
  const { lang } = await getRequestLang()
  const copy     = ticketBotCompareCopy(lang)

  // Die Breadcrumb nennt die Pfade der laufenden Sprachfassung. `alternatePaths`
  // ist die einzige Stelle, die das Sprachpraefix kennt; von Hand gesetzt waere
  // es die naechste Stelle, die bei einer Routenaenderung stehen bleibt.
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
