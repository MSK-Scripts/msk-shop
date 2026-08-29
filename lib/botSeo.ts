import type { Metadata } from 'next'

import type { Lang } from '@/lib/i18n'
import { softwareApplicationJsonLd, type JsonLdObject } from '@/lib/jsonLd'

/**
 * Metadata und strukturierte Daten der beiden Bot-Landingpages.
 *
 * Jede Seite existiert zweimal (`/ticketbot` und `/de/ticketbot`). Die
 * hreflang-Paare stehen deshalb an genau einer Stelle: Ein Canonical, das auf
 * die falsche Sprachfassung zeigt, oder ein hreflang ohne Rückverweis ist
 * schlimmer als gar keins, weil Google die Seiten dann als Duplikate wertet.
 *
 * **Titel bewusst auf Mid-Tail statt auf den Head-Term.** Für „discord ticket
 * bot" ranken Ein-Zweck-Domains mit vierstelliger Linkzahl, dagegen ist mit 74
 * externen Links nichts zu holen. Die Formulierungen zielen auf die Anfragen,
 * auf denen die Seiten heute schon Seite 1 erreichen (self-hosted, Transkripte,
 * neustartsicher, gewichtete Lose).
 *
 * **Kein `keywords`.** Bis zum 22.08.2026 trug jede der vier Seiten eine
 * eigene Liste. Google schreibt dazu: "The meta-keyword tag is not used by
 * Google Search, and it has no effect on indexing and ranking at all." Bing
 * hat dasselbe 2014 im eigenen Webmaster-Blog festgehalten. Nicht wieder
 * einbauen.
 */

const LOCALE: Record<Lang, string> = { en: 'en_US', de: 'de_DE' }

interface BotSeo {
  title:       string
  description: string
  ogTitle:     string
  ogDescription: string
  twitterDescription: string
  /** Kurzbeschreibung fürs JSON-LD. Darf knapper sein als die Meta-Description. */
  appDescription: string
}

interface BotDefinition {
  /** Pfad je Sprache. Zusammen bilden die beiden das hreflang-Paar. */
  paths: Record<Lang, string>
  image: string
  appName: string
  codeRepository?: string
  seo: Record<Lang, BotSeo>
}

const TICKETBOT: BotDefinition = {
  paths: { en: '/ticketbot', de: '/de/ticketbot' },
  image: '/discord_ticketbot_banner.webp',
  appName: 'MSK Discord Ticket Bot',
  codeRepository: 'https://github.com/MSK-Scripts/discord_ticketbot',
  seo: {
    en: {
      title: 'Self-Hosted Discord Ticket Bot with Transcripts | MSK Scripts',
      description:
        'Free self-hosted Discord ticket bot on Discord.js v14. Runs on SQLite, MySQL/MariaDB or PostgreSQL. '
        + 'Custom ticket types, claim system, HTML transcripts, ratings, auto-close and a hosted dashboard.',
      ogTitle: 'Self-Hosted Discord Ticket Bot with HTML Transcripts',
      ogDescription:
        'Free self-hosted Discord ticket bot: custom ticket types, claim system, HTML transcripts, ratings, '
        + 'auto-close and a hosted management dashboard.',
      twitterDescription:
        'Free self-hosted Discord ticket bot on Discord.js v14: SQLite, MySQL or PostgreSQL, transcripts, '
        + 'ratings and a hosted dashboard.',
      appDescription:
        'Free self-hosted Discord ticket bot with HTML transcripts, ticket types, claim system and ratings.',
    },
    de: {
      title: 'Discord Ticket Bot zum Selbsthosten | MSK Scripts',
      description:
        'Kostenloser Discord Ticket Bot zum Selbsthosten, gebaut auf Discord.js v14. Läuft mit SQLite, '
        + 'MySQL/MariaDB oder PostgreSQL. Ticket-Typen, Claim-System, HTML-Transkripte, Bewertungen, '
        + 'Auto-Close und ein Dashboard.',
      ogTitle: 'Discord Ticket Bot zum Selbsthosten, mit HTML-Transkripten',
      ogDescription:
        'Kostenloser Discord Ticket Bot zum Selbsthosten: Ticket-Typen, Claim-System, HTML-Transkripte, '
        + 'Bewertungen, Auto-Close und ein Verwaltungs-Dashboard.',
      twitterDescription:
        'Kostenloser Discord Ticket Bot auf Discord.js v14: SQLite, MySQL oder PostgreSQL, Transkripte, '
        + 'Bewertungen und ein Dashboard.',
      appDescription:
        'Kostenloser Discord Ticket Bot zum Selbsthosten, mit HTML-Transkripten, Ticket-Typen, Claim-System und Bewertungen.',
    },
  },
}

const TICKETBOT_COMPARE: BotDefinition = {
  paths: { en: '/ticketbot/compare', de: '/de/ticketbot/compare' },
  image: '/discord_ticketbot_banner.webp',
  appName: 'MSK Discord Ticket Bot',
  codeRepository: 'https://github.com/MSK-Scripts/discord_ticketbot',
  seo: {
    en: {
      title: 'Self-Hosted Discord Ticket Bots Compared | MSK Scripts',
      description:
        'Which self-hosted Discord ticket bot to use: MSK Ticket Bot, Discord Tickets, Sayrix Ticket-Bot '
        + 'and the hosted Ticket Tool side by side, with the cases where our own bot is the wrong choice.',
      ogTitle: 'Which Self-Hosted Discord Ticket Bot Should You Use?',
      ogDescription:
        'Three open-source ticket bots and one hosted service compared: hosting, licence, database, '
        + 'transcripts, dashboard, and what each one costs.',
      twitterDescription:
        'MSK Ticket Bot, Discord Tickets, Sayrix Ticket-Bot and Ticket Tool compared, including the '
        + 'cases against our own bot.',
      appDescription:
        'Comparison of self-hosted Discord ticket bots, with an FAQ on hosting, data storage and pricing.',
    },
    de: {
      title: 'Discord Ticket Bots zum Selbsthosten im Vergleich | MSK Scripts',
      description:
        'Welchen Discord Ticket Bot zum Selbsthosten nehmen: MSK Ticket Bot, Discord Tickets, Sayrix '
        + 'Ticket-Bot und das gehostete Ticket Tool nebeneinander, samt der Fälle, in denen unser '
        + 'eigener Bot die falsche Wahl ist.',
      ogTitle: 'Welchen Discord Ticket Bot zum Selbsthosten soll man nehmen?',
      ogDescription:
        'Drei Open-Source-Ticket-Bots und ein gehosteter Dienst im Vergleich: Betrieb, Lizenz, '
        + 'Datenbank, Transkripte, Dashboard und was jeweils Geld kostet.',
      twitterDescription:
        'MSK Ticket Bot, Discord Tickets, Sayrix Ticket-Bot und Ticket Tool im Vergleich, inklusive '
        + 'der Argumente gegen den eigenen Bot.',
      appDescription:
        'Vergleich von Discord Ticket Bots zum Selbsthosten, mit FAQ zu Betrieb, Datenhaltung und Preisen.',
    },
  },
}

const GIVEAWAY: BotDefinition = {
  paths: { en: '/giveaway', de: '/de/giveaway' },
  image: '/msk-giveaway-bot-banner.webp',
  appName: 'MSK Discord Giveaway Bot',
  codeRepository: 'https://github.com/MSK-Scripts/discord_giveawaybot',
  seo: {
    en: {
      title: 'Free Discord Giveaway Bot, Restart-Safe | MSK Scripts',
      description:
        'Free Discord giveaway bot on Discord.js v14. Button entry, restart-safe scheduling, weighted bonus '
        + 'entries, eligibility rules, templates, reroll and automatic Tebex coupons for winners.',
      ogTitle: 'Free Discord Giveaway Bot, Restart-Safe & Multilingual',
      ogDescription:
        'Free Discord giveaway bot: button entry, restart-safe scheduling, weighted bonus entries, '
        + 'eligibility rules, templates, reroll and pause/resume.',
      twitterDescription:
        'Free Discord giveaway bot on Discord.js v14: button entry, weighted entries, eligibility rules, '
        + 'templates and reroll.',
      appDescription:
        'Free Discord giveaway bot with button entry, restart-safe scheduling, weighted bonus entries and reroll.',
    },
    de: {
      title: 'Discord Giveaway Bot, kostenlos & neustartsicher | MSK Scripts',
      description:
        'Kostenloser Discord Giveaway Bot auf Discord.js v14. Teilnahme per Knopfdruck, neustartsichere '
        + 'Zeitsteuerung, gewichtete Bonuslose, Teilnahmeregeln, Vorlagen, Neuauslosung und automatische '
        + 'Tebex-Gutscheine für Gewinner.',
      ogTitle: 'Discord Giveaway Bot, kostenlos, neustartsicher und mehrsprachig',
      ogDescription:
        'Kostenloser Discord Giveaway Bot: Teilnahme per Knopfdruck, neustartsichere Zeitsteuerung, '
        + 'gewichtete Bonuslose, Teilnahmeregeln, Vorlagen, Neuauslosung sowie Pause und Fortsetzen.',
      twitterDescription:
        'Kostenloser Discord Giveaway Bot auf Discord.js v14: Teilnahme per Knopfdruck, gewichtete Lose, '
        + 'Teilnahmeregeln, Vorlagen und Neuauslosung.',
      appDescription:
        'Kostenloser Discord Giveaway Bot mit Teilnahme per Knopfdruck, neustartsicherer Zeitsteuerung, gewichteten Bonuslosen und Neuauslosung.',
    },
  },
}

function metadataFor(bot: BotDefinition, lang: Lang): Metadata {
  const seo  = bot.seo[lang]
  const path = bot.paths[lang]

  return {
    // `absolute`, damit die Landingpage ihren eigenen Titel behält statt das
    // '%s | MSK Scripts'-Template des Root-Layouts zu bekommen.
    title:       { absolute: seo.title },
    description: seo.description,
    alternates: {
      canonical: path,
      // Beide Fassungen nennen beide Pfade, sonst ist das hreflang-Paar
      // einseitig und Google ignoriert es.
      languages: {
        'en':        bot.paths.en,
        'de':        bot.paths.de,
        'x-default': bot.paths.en,
      },
    },
    openGraph: {
      type:            'website',
      siteName:        'MSK Scripts',
      locale:          LOCALE[lang],
      alternateLocale: [LOCALE[lang === 'en' ? 'de' : 'en']],
      url:             path,
      title:           seo.ogTitle,
      description:     seo.ogDescription,
      images: [{ url: bot.image, alt: bot.appName }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       seo.ogTitle,
      description: seo.twitterDescription,
      images:      [bot.image],
    },
  }
}

function appJsonLdFor(bot: BotDefinition, lang: Lang): JsonLdObject {
  return softwareApplicationJsonLd({
    name:        bot.appName,
    path:        bot.paths[lang],
    description: bot.seo[lang].appDescription,
    image:       bot.image,
    inLanguage:  lang === 'de' ? 'de-DE' : 'en-US',
    codeRepository: bot.codeRepository,
  })
}

export const ticketBotMetadata = (lang: Lang) => metadataFor(TICKETBOT, lang)
export const ticketBotCompareMetadata = (lang: Lang) => metadataFor(TICKETBOT_COMPARE, lang)
export const giveawayMetadata  = (lang: Lang) => metadataFor(GIVEAWAY, lang)

export const ticketBotAppJsonLd = (lang: Lang) => appJsonLdFor(TICKETBOT, lang)
export const giveawayAppJsonLd  = (lang: Lang) => appJsonLdFor(GIVEAWAY, lang)

/** Alle vier Landingpage-Pfade, für die Sitemap. */
export const BOT_LANDING_PATHS = {
  ticketbot:        TICKETBOT.paths,
  ticketbotCompare: TICKETBOT_COMPARE.paths,
  giveaway:         GIVEAWAY.paths,
} as const
