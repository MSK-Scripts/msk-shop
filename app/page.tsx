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
import { loadReleases } from '@/lib/releases'
import { loadShopStats } from '@/lib/shopStats'

// Der Titel des Root-Layouts ist reiner Markenname ("MSK Scripts – Website &
// Shop"). Die Startseite sammelt aber Impressionen auf generische Anfragen
// nach FiveM-Scripts, deshalb hat sie einen eigenen. Beide Fassungen stehen in
// lib/pageSeo.ts, seit es die Seite zweimal gibt.
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
 * Reihenfolge der Sektionen, und warum sie so ist:
 *
 *   Hero + Belege  → wer und was, mit nachrechenbaren Zahlen statt Behauptungen
 *   Katalog        → das Produkt, direkt danach statt bei 40 % Scrolltiefe
 *   Warum MSK      → warum ausgerechnet hier kaufen
 *   So läuft es ab → die Escrow-/Keymaster-Mechanik, die Support-Tickets spart
 *   Bots           → zwei eigene Produkte, vorher im Gratis-Raster vergraben
 *   Gratis-Scripts → die kostenlosen FiveM-Resourcen, msk_core zuerst
 *   Tools          → Web-Nebenprojekte, hinter dem Kaufpfad
 *   CTA            → Abschluss
 *
 * „Warum" steht vor „Wie": erst die Kaufentscheidung, dann die Mechanik der
 * Abwicklung. Umgekehrt erklärt die Seite den Ablauf für einen Kauf, zu dem
 * sie noch gar nicht überzeugt hat.
 */
export default async function HomePage() {
  const [{ lang }, headline, releases, stats] = await Promise.all([
    getRequestLang(),
    // Fail-soft: keine dieser Quellen darf die Startseite kippen. Fällt eine
    // aus, verschwindet die zugehörige Angabe — es wird nichts geschätzt.
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
  ])

  return (
    <>
      {/* Die Belegzeile steht im Hero, nicht darunter: sie ist der Beleg für
          dessen Behauptung und muss deshalb ohne Scrollen sichtbar sein. */}
      <Hero lang={lang} stat={headline} releases={releases}>
        <ProofLine lang={lang} stats={stats} servers={headline} />
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
