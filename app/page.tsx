import type { Metadata } from 'next'
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
// ("free tebex scripts", "fivem scripts"), deshalb nennt sie hier selbst, was
// es zu holen gibt. `absolute`, damit das '%s | MSK Scripts'-Template nicht
// noch ein zweites Mal die Marke anhängt.
const HOME_TITLE       = 'FiveM Scripts, Tools & Discord Bots | MSK Scripts'
const HOME_DESCRIPTION =
  'FiveM scripts and resources for ESX and QBCore, plus free self-hosted Discord bots. '
  + 'Escrow protected releases, delivered through the CFX.re Keymaster.'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return {
  title:       { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates:  alternatesFor(lang, '/'),
  openGraph:   openGraphFor({ url: '/', title: HOME_TITLE, description: HOME_DESCRIPTION }),
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
