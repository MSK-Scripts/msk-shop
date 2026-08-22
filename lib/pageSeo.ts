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
}

/** Kurzgriff für eine Seite. Der Pfad ist der sprachlose. */
export function pageSeo(path: string, lang: Lang): PageSeo {
  return PAGE_SEO[path][lang]
}
