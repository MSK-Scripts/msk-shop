import type { Metadata } from 'next'

import type { Lang } from '@/lib/i18n'
import { softwareApplicationJsonLd, type JsonLdObject } from '@/lib/jsonLd'

/**
 * Metadata and structured data of the two bot landing pages.
 *
 * Each page exists twice (`/ticketbot` and `/de/ticketbot`). The
 * hreflang pairs are therefore kept in exactly one place: a canonical that points to
 * the wrong language version, or an hreflang without a return link, is
 * worse than none at all, because Google then treats the pages as duplicates.
 *
 * **Titles deliberately target the mid-tail instead of the head term.** For "discord ticket
 * bot", single-purpose domains with four-digit link counts rank; with 74
 * external links there is nothing to gain against them. The wording targets the queries
 * for which the pages already reach page 1 today (self-hosted, transcripts,
 * restart-safe, weighted entries).
 *
 * **No `keywords`.** Until 22.08.2026 each of the four pages carried its
 * own list. Google says about this: "The meta-keyword tag is not used by
 * Google Search, and it has no effect on indexing and ranking at all." Bing
 * stated the same in 2014 on its own Webmaster blog. Do not add it
 * back.
 */

const LOCALE: Record<Lang, string> = { en: 'en_US', de: 'de_DE' }

interface BotSeo {
  title:       string
  description: string
  ogTitle:     string
  ogDescription: string
  twitterDescription: string
  /** Short description for the JSON-LD. May be terser than the meta description. */
  appDescription: string
}

interface BotDefinition {
  /** Path per language. Together the two form the hreflang pair. */
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
        'Free self-hosted Discord ticket bot on Discord.js v14. HTML transcripts under your own domain, '
        + 'attachments, SQLite or your own SQL. No telemetry, open source.',
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
        'Kostenloser Discord Ticket Bot zum Selbsthosten. HTML-Transkripte unter eigener Domain, '
        + 'Anhänge, SQLite oder eigene SQL. Ohne Telemetrie, Open Source.',
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
        'MSK Ticket Bot, Discord Tickets, Sayrix Ticket-Bot and the hosted Ticket Tool side by side: '
        + 'hosting, licence, database, transcripts and cost.',
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
        'MSK Ticket Bot, Discord Tickets, Sayrix Ticket-Bot und das gehostete Ticket Tool im Vergleich: '
        + 'Hosting, Lizenz, Datenbank, Transkripte und Kosten.',
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
        'Free Discord giveaway bot on Discord.js v14. Button entry, restart-safe scheduling, weighted '
        + 'bonus entries and reroll.',
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
        + 'Zeitsteuerung, gewichtete Bonuslose und Neuauslosung.',
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
    // `absolute`, so the landing page keeps its own title instead of getting the
    // root layout's '%s | MSK Scripts' template.
    title:       { absolute: seo.title },
    description: seo.description,
    alternates: {
      canonical: path,
      // Both versions name both paths, otherwise the hreflang pair is
      // one-sided and Google ignores it.
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

/** All four landing page paths, for the sitemap. */
export const BOT_LANDING_PATHS = {
  ticketbot:        TICKETBOT.paths,
  ticketbotCompare: TICKETBOT_COMPARE.paths,
  giveaway:         GIVEAWAY.paths,
} as const
