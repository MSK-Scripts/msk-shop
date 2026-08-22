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
 */

const LOCALE: Record<Lang, string> = { en: 'en_US', de: 'de_DE' }

interface BotSeo {
  title:       string
  description: string
  ogTitle:     string
  ogDescription: string
  twitterDescription: string
  keywords:    string[]
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
      keywords: [
        'self-hosted Discord ticket bot', 'Discord ticket bot transcripts', 'open source Discord ticket bot',
        'free Discord ticket bot', 'Discord.js ticket system', 'Discord support bot', 'HTML ticket transcripts',
        'Discord ticket bot MySQL', 'MSK Scripts',
      ],
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
      keywords: [
        'Discord Ticket Bot selbst hosten', 'Discord Ticket Bot deutsch', 'Discord Ticketsystem',
        'kostenloser Discord Ticket Bot', 'Discord Support Bot', 'Ticket Transkripte', 'Discord.js Ticketsystem',
        'Discord Ticket Bot MySQL', 'MSK Scripts',
      ],
      appDescription:
        'Kostenloser Discord Ticket Bot zum Selbsthosten, mit HTML-Transkripten, Ticket-Typen, Claim-System und Bewertungen.',
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
      keywords: [
        'free Discord giveaway bot', 'restart-safe giveaway bot', 'weighted giveaway entries',
        'Discord giveaway bot with role requirements', 'button entry giveaway', 'multilingual giveaway bot',
        'Discord.js giveaway bot', 'Tebex giveaway coupon', 'MSK Scripts',
      ],
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
      keywords: [
        'Discord Giveaway Bot deutsch', 'kostenloser Discord Giveaway Bot', 'Discord Gewinnspiel Bot',
        'Giveaway Bot mit Rollen', 'gewichtete Lose Giveaway', 'mehrsprachiger Giveaway Bot',
        'Discord.js Giveaway Bot', 'Tebex Gutschein Gewinnspiel', 'MSK Scripts',
      ],
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
    keywords:    seo.keywords,
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
export const giveawayMetadata  = (lang: Lang) => metadataFor(GIVEAWAY, lang)

export const ticketBotAppJsonLd = (lang: Lang) => appJsonLdFor(TICKETBOT, lang)
export const giveawayAppJsonLd  = (lang: Lang) => appJsonLdFor(GIVEAWAY, lang)

/** Alle vier Landingpage-Pfade, für die Sitemap. */
export const BOT_LANDING_PATHS = {
  ticketbot: TICKETBOT.paths,
  giveaway:  GIVEAWAY.paths,
} as const
