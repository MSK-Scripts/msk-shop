import type { Metadata } from 'next'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { Hero } from '@/components/home/Hero'
import { ProofLine } from '@/components/home/ProofLine'
import { Catalog } from '@/components/home/Catalog'
import { HowItWorks } from '@/components/home/HowItWorks'
import { WhyMSK } from '@/components/home/WhyMSK'
import { Bots } from '@/components/home/Bots'
import { FreeScripts } from '@/components/home/FreeScripts'
import { CustomPackages } from '@/components/home/CustomPackages'
import { CTASection } from '@/components/home/CTASection'
import { alternatesFor, openGraphFor } from '@/lib/seo'
import { loadHeadlineStat } from '@/lib/fivestats'
import { loadDocPageCount } from '@/lib/docsPages'
import { loadReleases } from '@/lib/releases'
import { loadShopStats } from '@/lib/shopStats'

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
    openGraph:   openGraphFor({ url: '/', title: seo.title, description: seo.description }),
  }
}

/**
 * Order of the sections, and why it is this way:
 *
 *   Hero + proof   → who and what, with verifiable numbers instead of claims
 *   Catalog        → the product, right after instead of at 40 % scroll depth
 *   Why MSK        → why buy here of all places
 *   How it works   → the escrow/Keymaster mechanics, which saves support tickets
 *   Bots           → two products of our own, previously buried in the free grid
 *   Free scripts   → the free FiveM resources, msk_core first
 *   Tools          → web side projects, behind the purchase path
 *   CTA            → closing
 *
 * "Why" comes before "How": first the purchase decision, then the mechanics of
 * fulfilment. The other way round, the page explains the process for a purchase
 * it has not yet convinced anyone of.
 */
export default async function HomePage() {
  const [{ lang }, headline, releases, stats, docPages] = await Promise.all([
    getRequestLang(),
    // Fail-soft: none of these sources may take down the home page. If one
    // fails, the corresponding figure disappears; nothing is estimated.
    loadHeadlineStat().catch(err => {
      console.warn('[home] fivestats headline stat nicht verfügbar:', err)
      return null
    }),
    loadReleases(4).catch(err => {
      console.warn('[home] Release-Protokoll nicht verfügbar:', err)
      return []
    }),
    loadShopStats().catch(err => {
      console.warn('[home] Shop-Kennzahlen nicht verfügbar:', err)
      return null
    }),
    loadDocPageCount().catch(err => {
      console.warn('[home] Doku-Seitenzahl nicht verfügbar:', err)
      return null
    }),
  ])

  return (
    <>
      {/* The proof line sits inside the hero, not below it: it is the proof for
          the hero's claim and must therefore be visible without scrolling. */}
      <Hero lang={lang} stat={headline} releases={releases}>
        <ProofLine lang={lang} stats={stats} servers={headline} docPages={docPages} />
      </Hero>
      <Catalog lang={lang} />
      <WhyMSK lang={lang} />
      <HowItWorks lang={lang} />
      <Bots lang={lang} />
      <FreeScripts lang={lang} />
      <CustomPackages lang={lang} />
      <CTASection lang={lang} stats={stats} />
    </>
  )
}
