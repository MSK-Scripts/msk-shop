import type { Lang } from '@/lib/i18n'

/**
 * Titel und Beschreibungen der festen Seiten, je Sprache.
 *
 * Seit dem 22.08.2026 hat jede Seite zwei Adressen. Eine deutsche URL mit
 * englischem Titel im Kopf rankt für nichts: der Titel ist das Signal, an dem
 * Google die Sprache und das Thema einer Seite festmacht.
 *
 * Die deutschen Fassungen sind Übersetzungen der englischen, keine eigene
 * Keyword-Recherche. Für die beiden Bot-Landingpages liegen dafür Zahlen aus
 * der Search Console vor, für diese Seiten nicht; erfundene Suchbegriffe wären
 * schlechter als eine ehrliche Übersetzung.
 *
 * `absolute: true` heisst, der Titel trägt die Marke schon selbst und darf
 * nicht noch einmal durch das '%s | MSK Scripts'-Template laufen.
 */

export interface PageSeo {
  title:       string
  description: string
  absolute?:   boolean
}

export const PAGE_SEO: Record<string, Record<Lang, PageSeo>> = {
  '/': {
    en: {
      title:       'FiveM Scripts, Tools & Discord Bots | MSK Scripts',
      description:
        'FiveM scripts and resources for ESX and QBCore, plus free self-hosted Discord bots. '
        + 'Escrow protected releases, delivered through the CFX.re Keymaster.',
      absolute: true,
    },
    de: {
      title:       'FiveM Scripts, Tools und Discord-Bots | MSK Scripts',
      description:
        'FiveM Scripts und Ressourcen für ESX und QBCore, dazu kostenlose Discord-Bots zum Selbsthosten. '
        + 'Escrow-geschützte Releases, ausgeliefert über den CFX.re-Keymaster.',
      absolute: true,
    },
  },
  '/packages': {
    en: {
      title:       'All Packages',
      description: 'Browse all FiveM resources, tools and Discord bots from MSK Scripts.',
    },
    de: {
      title:       'Alle FiveM Scripts und Pakete',
      description: 'Alle FiveM-Ressourcen, Tools und Discord-Bots von MSK Scripts auf einen Blick.',
    },
  },
  '/resources': {
    en: {
      title:       'Resource Statistics',
      description: 'Live adoption statistics of MSK Scripts FiveM resources across all servers, powered by fivestats.io.',
    },
    de: {
      title:       'Resourcen-Statistiken',
      description: 'Wie viele FiveM-Server die Ressourcen von MSK Scripts einsetzen. Live-Zahlen von fivestats.io.',
    },
  },
  '/ticketbot/stats': {
    en: {
      title:       'Bot Statistics',
      description: 'Anonymous live statistics of the MSK Ticket Bot across all servers.',
    },
    de: {
      title:       'Ticket-Bot-Statistiken',
      description: 'Anonyme Live-Zahlen des MSK Ticket Bots über alle Server hinweg.',
    },
  },
  '/giveaway/stats': {
    en: {
      title:       'Giveaway Bot Statistics',
      description: 'Anonymous live statistics of the MSK Giveaway Bot across all Discord servers.',
    },
    de: {
      title:       'Giveaway-Bot-Statistiken',
      description: 'Anonyme Live-Zahlen des MSK Giveaway Bots über alle Discord-Server hinweg.',
    },
  },
  '/terms': {
    en: { title: 'Terms & Conditions', description: 'Terms and conditions for buying and using MSK Scripts resources.' },
    de: { title: 'AGB',                description: 'Allgemeine Geschäftsbedingungen für den Kauf und die Nutzung der Ressourcen von MSK Scripts.' },
  },
  '/terms/imprint': {
    en: { title: 'Imprint',    description: 'Legal notice and contact details for MSK Scripts, Moritz Kohm.' },
    de: { title: 'Impressum',  description: 'Anbieterkennzeichnung und Kontaktdaten von MSK Scripts, Moritz Kohm.' },
  },
  '/terms/privacy': {
    en: { title: 'Privacy Policy',        description: 'How MSK Scripts handles personal data, in line with the GDPR.' },
    de: { title: 'Datenschutzerklärung',  description: 'Wie MSK Scripts mit personenbezogenen Daten umgeht, nach den Vorgaben der DSGVO.' },
  },
  '/terms/widerruf': {
    en: {
      title:       'Withdrawal Instructions',
      description: 'Your 14-day right of withdrawal for MSK Scripts subscriptions, including the model withdrawal form.',
    },
    de: {
      title:       'Widerrufsbelehrung',
      description: 'Dein 14-tägiges Widerrufsrecht für Abonnements von MSK Scripts, inklusive Muster-Widerrufsformular.',
    },
  },
  '/terms/avv': {
    en: {
      title:       'Data Processing Agreement',
      description: 'The Art. 28 GDPR agreement for the transcript service, hosted bot management and MSK Forms.',
    },
    de: {
      title:       'Auftragsverarbeitung (AVV)',
      description: 'Die Vereinbarung nach Art. 28 DSGVO für Transcript-Service, Bot-Hosting und MSK Forms.',
    },
  },

  // Die drei Pflichtformulare. Sie tragen bewusst kein `noindex`: § 356a und
  // § 312k BGB verlangen eine ständig und ohne Hürde erreichbare Schaltfläche,
  // und eine Seite aus dem Index zu nehmen, die jemand im Ernstfall suchen
  // wird, arbeitet gegen diesen Zweck.
  '/vertrag-widerrufen': {
    en: {
      title:       'Withdraw from contract',
      description: 'Withdraw from an MSK Scripts subscription online, without signing in. You receive an acknowledgement of receipt by email.',
    },
    de: {
      title:       'Vertrag widerrufen',
      description: 'Widerrufe ein Abonnement von MSK Scripts online und ohne Anmeldung. Die Eingangsbestätigung kommt per E-Mail.',
    },
  },
  '/vertrag-kuendigen': {
    en: {
      title:       'Cancel contracts here',
      description: 'Cancel an MSK Scripts subscription online, without signing in. You receive an acknowledgement of receipt by email.',
    },
    de: {
      title:       'Verträge hier kündigen',
      description: 'Kündige ein Abonnement von MSK Scripts online und ohne Anmeldung. Die Eingangsbestätigung kommt per E-Mail.',
    },
  },
  '/report': {
    en: {
      title:       'Report illegal content',
      description: 'Report content hosted by MSK Scripts that you consider illegal, under Art. 16 of Regulation (EU) 2022/2065.',
    },
    de: {
      title:       'Rechtswidrige Inhalte melden',
      description: 'Melde bei MSK Scripts gespeicherte Inhalte, die du für rechtswidrig hältst, nach Art. 16 der Verordnung (EU) 2022/2065.',
    },
  },

  // Kaufpfad. Diese fünf tragen `robots: noindex` und stehen zusätzlich in der
  // robots.txt, die Beschreibung wird also nie in einem Suchergebnis landen.
  // Der Titel ist trotzdem nötig: bis zum 24.08.2026 hiessen alle fünf
  // "MSK Scripts – Website & Shop", weil sie gar keine Metadaten hatten und den
  // Vorgabewert aus dem Root-Layout erbten. Wer beim Kaufen einen zweiten Tab
  // öffnet, fand den Warenkorb in der Leiste nicht wieder.
  '/cart': {
    en: { title: 'Cart',        description: 'The packages you have selected, before checkout at Tebex.' },
    de: { title: 'Warenkorb',   description: 'Die ausgewählten Pakete, vor der Bezahlung bei Tebex.' },
  },
  '/checkout': {
    en: { title: 'Order status',  description: 'Status of your order after returning from Tebex.' },
    de: { title: 'Bestellstatus', description: 'Status deiner Bestellung nach der Rückkehr von Tebex.' },
  },
  '/login': {
    en: { title: 'Sign in',   description: 'Sign in with your CFX.re account to buy MSK Scripts resources.' },
    de: { title: 'Anmelden',  description: 'Mit dem CFX.re-Konto anmelden, um Ressourcen von MSK Scripts zu kaufen.' },
  },
  '/account': {
    en: { title: 'Account',     description: 'Your CFX.re account and linked Discord ID.' },
    de: { title: 'Mein Konto',  description: 'Dein CFX.re-Konto und die verknüpfte Discord-ID.' },
  },
  '/auth/discord': {
    en: { title: 'Linking Discord',      description: 'Linking your Discord account for role assignment after purchase.' },
    de: { title: 'Discord verknüpfen',   description: 'Discord-Konto verknüpfen für die Rollenvergabe nach dem Kauf.' },
  },

  // Die Galerie ist die einzige Seite hier, die auf Suchbegriffe zielt, die
  // nichts mit der Marke zu tun haben ("fivem vehicle images transparent").
  // Deshalb steht das Gesuchte im Titel und nicht der Bereichsname.
  '/images/upload': {
    en: {
      title:       'Submit an Image',
      description: 'Send us a transparent GTA V or FiveM asset image for the gallery. Reviewed by hand, credited to you, free for everyone to use.',
    },
    de: {
      title:       'Bild einreichen',
      description: 'Schick uns ein freigestelltes GTA-V- oder FiveM-Asset für die Galerie. Wird von Hand geprüft und ist danach für alle kostenlos nutzbar.',
    },
  },
  '/images': {
    en: {
      title:       'FiveM & GTA V Image Gallery',
      description: 'Free transparent images of GTA V vehicles, weapons, items, props and peds for FiveM scripts. Served from our own CDN, ready to use by spawn name.',
    },
    de: {
      title:       'FiveM- und GTA-V-Bildergalerie',
      description: 'Kostenlose freigestellte Bilder von GTA-V-Fahrzeugen, Waffen, Items, Props und Peds für FiveM-Scripts. Über eigenes CDN, direkt über den Spawnnamen nutzbar.',
    },
  },
}

/** Kurzgriff für eine Seite. Der Pfad ist der sprachlose. */
export function pageSeo(path: string, lang: Lang): PageSeo {
  return PAGE_SEO[path][lang]
}
