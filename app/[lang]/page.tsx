import type { Metadata } from 'next'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { Hero } from '@/components/home/Hero'
import { ProofLine } from '@/components/home/ProofLine'
import { Catalog, cheapestScript } from '@/components/home/Catalog'
import { Bots } from '@/components/home/Bots'
import { WebTools } from '@/components/home/WebTools'
import { FreeScripts } from '@/components/home/FreeScripts'
import { About } from '@/components/home/About'
import { alternatesFor, openGraphFor } from '@/lib/seo'
import { publicPath } from '@/lib/routes'
import { JsonLd } from '@/components/JsonLd'
import { webSiteJsonLd } from '@/lib/jsonLd'
import { loadHeadlineStat } from '@/lib/fivestats'
import { loadDocPageCount } from '@/lib/docsPages'
import { loadShopStats } from '@/lib/shopStats'
import { getPackages } from '@/lib/tebex'
import { formatEuro } from '@/lib/price'
import { cheapestPaidTier, formatTierPrice } from '@/lib/tiers'
import type { TebexPackage } from '@/types/tebex'

// The home page collects impressions on generic queries for
// FiveM scripts, so it carries its title itself instead of going through the
// '%s | MSK Scripts' template. Both versions live in
// lib/pageSeo.ts, since the page exists twice.
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/'),
    openGraph:   openGraphFor({ url: publicPath(lang, '/'), title: seo.title, description: seo.description }),
  }
}

/**
 * Order of the sections (plan 5.4, English as the lead version):
 *
 *   Hero           -> what MSK is, and the entry by need
 *   Proof          -> at most three measured figures
 *   FiveM scripts  -> the paid scripts and the subscription
 *   Discord bots   -> both bots in a zigzag
 *   Web tools      -> a compact row
 *   Free scripts   -> a list, not a grid of big cards
 *   About          -> three sentences, no photo
 *
 * The close is the green band above the footer, which every public page has:
 * Discord support and the documentation as two ways, no second call to buy.
 * Gone: the release log in terminal look, "Why MSK" as a row of four icon
 * cards and the second closing section (exclusion list, plan 4.2).
 */
export default async function HomePage() {
  const [{ lang }, headline, stats, docPages, packages] = await Promise.all([
    getRequestLang(),
    // Fail-soft: none of these sources may take down the home page. If one
    // fails, the corresponding figure disappears; nothing is estimated.
    loadHeadlineStat().catch(err => {
      console.warn('[home] fivestats headline stat unavailable:', err)
      return null
    }),
    loadShopStats().catch(err => {
      console.warn('[home] shop stats unavailable:', err)
      return null
    }),
    loadDocPageCount().catch(err => {
      console.warn('[home] doc page count unavailable:', err)
      return null
    }),
    getPackages().catch(err => {
      console.warn('[home] Tebex unavailable, catalogue hidden:', err)
      return [] as TebexPackage[]
    }),
  ])

  const cheapest = cheapestScript(packages)
  const ticketFrom = formatTierPrice(cheapestPaidTier(), lang)

  return (
    <>
      {/* The site as an entity, next to the Organization from the root layout.
          Only here: the home page is the one address that stands for the site. */}
      <JsonLd data={webSiteJsonLd()} />
      <Hero lang={lang} fivemFrom={cheapest === null ? null : formatEuro(cheapest, lang)} botFrom={ticketFrom} />
      <ProofLine lang={lang} stats={stats} servers={headline} docPages={docPages} />
      <Catalog lang={lang} packages={packages} />
      <Bots lang={lang} ticketFrom={ticketFrom} />
      <WebTools lang={lang} />
      <FreeScripts lang={lang} />
      <About lang={lang} />
    </>
  )
}
