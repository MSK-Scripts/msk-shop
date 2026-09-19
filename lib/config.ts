import type { Lang } from '@/lib/i18n'

// ── Site Config ───────────────────────────────────────────
export const SITE_CONFIG = {
  name: 'MSK Scripts Shop',
  tagline: 'High quality FiveM resources & Discord bots for your server',
  discord: 'https://discord.gg/5hHSBRHvJE',
  github: 'https://github.com/MSK-Scripts',
  docs: 'https://docu.msk-scripts.de',
}

// ── Featured Package IDs ─────────────────────────────────────
// Add the Tebex package IDs you want to show on the homepage.
// Find the ID in your Tebex control panel URL when editing a package.
// Example: https://creator.tebex.io/packages/1234567 → ID is 1234567

export const FEATURED_PACKAGE_IDS: number[] = [
  5301828,
  6446947,
  5732588,
]

// ── Subscription packages ─────────────────────────────────────
// The two all-access subscriptions from the Tebex "Subscriptions" category.
// They existed for a while without ever appearing on the homepage, which meant
// the cheapest way into the catalogue was also the least visible one.
// Set to null to hide the subscription strip.
export const SUBSCRIPTION_PACKAGE_IDS: { encrypted: number; source: number } | null = {
  encrypted: 7569109,
  source:    7569121,
}

// ── Package Badges ────────────────────────────────────────────
// Add one or more badges to packages by their Tebex package ID.
// badge.label = Text shown on the badge (e.g. "ESX", "QBCore", "Standalone")
// badge.variant = Color style: 'esx' | 'qb' | 'standalone' | 'js' | 'lua' | 'py' | 'discord' | 'fivem'
//
// Color reference:
//   esx        → orange (ESX logo color)
//   qb         → purple
//   standalone → green (accent)
//   js         → yellow
//   lua        → blue
//   py         → sky blue
//   discord    → indigo
//   fivem      → orange

export type BadgeVariant = 'esx' | 'qb' | 'standalone' | 'js' | 'lua' | 'py' | 'discord' | 'fivem'
export interface Badge { label: string; variant: BadgeVariant }

export const PACKAGE_BADGES: Record<number, Badge[]> = {
  5732587: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }], // MSK Garage - E
  5732588: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }], // MSK Garage - S
  5159927: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }, { label: 'Lua', variant: 'lua' }], // MSK Handcuffs - E
  5301828: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }, { label: 'Lua', variant: 'lua' }], // MSK Handcuffs - S
  6446936: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }, { label: 'Lua', variant: 'lua' }], // MSK VehicleKeys - E
  6446947: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }, { label: 'Lua', variant: 'lua' }], // MSK VehicleKeys - S
  7569109: [{ label: 'Subscription', variant: 'standalone' }, { label: 'Lua', variant: 'lua' }], // Subscription - Encrypted Version
  7569121: [{ label: 'Subscription', variant: 'standalone' }, { label: 'Lua', variant: 'lua' }], // Subscription - Source Version
}

// ── Package Descriptions ─────────────────────────────────────
// Optional custom description shown on package cards.
// If empty ("") or not set, the Tebex description is used.
// Keep it short: 1 to 2 sentences max.

export const PACKAGE_DESCRIPTIONS: Record<number, string> = {
  5732587: 'A complete, server-authoritative garage and impound system for ESX with a modern React UI and a security-first backend.', // MSK Garage - E
  5732588: 'A complete, server-authoritative garage and impound system for ESX with a modern React UI and a security-first backend.', // MSK Garage - S
  5159927: 'Realistic handcuffs with animations, props, drag, headbag, tape and ankle tracker.', // MSK Handcuffs - E
  5301828: 'Realistic handcuffs with animations, props, drag, headbag, tape and ankle tracker.', // MSK Handcuffs - S
  6446936: 'Unique vehicle key items with lock/unlock, key menu, job vehicles and much more.', // MSK VehicleKeys - E
  6446947: 'Unique vehicle key items with lock/unlock, key menu, job vehicles and much more.', // MSK VehicleKeys - S
  7569109: 'This subscription is intended purely as a trial model. The goal is to let you test all scripts thoroughly within one month before deciding on the final purchase of individual resources. It does not replace a permanent license purchase.', // Subscription - Encrypted Version
  7569121: 'This subscription is intended purely as a trial model. The goal is to let you test all scripts thoroughly within one month before deciding on the final purchase of individual resources. It does not replace a permanent license purchase.', // Subscription - Source Version 
}

// ── Search snippets ──────────────────────────────────────────
// Title and meta description of the package and category pages, i.e. what
// shows up in the Google result list. Deliberately separate from
// PACKAGE_DESCRIPTIONS: that is the visible card text on the page itself.
//
// Two reasons for curating them, both measured in Search Console on
// 22.08.2026:
//
//   1. The shop collects impressions on generic queries such as
//      "fivem handcuff script" (24) and "fivem job creator" (21), but the
//      word "FiveM" appears in none of the Tebex package names. The raw name
//      as <title> left out precisely the term people were searching for.
//   2. Encrypted and Source are two pages per product with identical text.
//      Google reports 6 pages as "Duplikat, vom Nutzer nicht als kanonisch
//      festgelegt" (duplicate without user-selected canonical). Both versions
//      should stay indexable, so title and description have to name the
//      license difference.
//
// The wording of the difference comes from Tebex's own category texts, it is
// not made up: Encrypted encrypts everything except config.lua,
// translation.lua and server_discordlog.lua, Source leaves most of it open
// and encrypts only the CORE functions.
//
// Without an entry the page falls back to the Tebex name and the Tebex text.
// New packages and categories therefore have to be added here.

export interface SearchSnippet {
  /** <title> without the " | MSK Scripts" suffix. Target: under 50 characters. */
  title:       string
  /** Meta description. Target: under 160 characters, otherwise Google truncates. */
  description: string
}

/**
 * One search result per language. Since 22.08.2026 every package and
 * category page has two addresses, and a German URL with an English title
 * ranks for nothing.
 *
 * Product names and the scene's technical terms stay English: a German
 * server operator searches for „fivem handcuff script", not for
 * „FiveM Handschellen-Skript". What gets translated is what explains something to them.
 */
export type SearchSnippets = Record<Lang, SearchSnippet>

export const PACKAGE_SEO: Record<number, SearchSnippets> = {
  5732587: { // MSK Garage - Encrypted
    en: {
      title:       'MSK Garage (Encrypted), FiveM Garage & Impound',
      description: 'Server-authoritative FiveM garage and impound system for ESX with a React admin dashboard. Encrypted release, config and locale files stay open.',
    },
    de: {
      title:       'MSK Garage (Encrypted), FiveM Garage & Impound',
      description: 'Server-autoritatives FiveM Garage- und Impound-System für ESX mit React-Admin-Dashboard. Encrypted-Fassung, Config- und Sprachdateien bleiben offen.',
    },
  },
  5732588: { // MSK Garage - Source
    en: {
      title:       'MSK Garage (Source), FiveM Garage & Impound',
      description: 'Server-authoritative FiveM garage and impound system for ESX with a React admin dashboard. Source release, only the core functions stay encrypted.',
    },
    de: {
      title:       'MSK Garage (Source), FiveM Garage & Impound',
      description: 'Server-autoritatives FiveM Garage- und Impound-System für ESX mit React-Admin-Dashboard. Source-Fassung, nur die Kernfunktionen bleiben verschlüsselt.',
    },
  },
  5159927: { // MSK Handcuffs - Encrypted
    en: {
      title:       'MSK Handcuffs (Encrypted), FiveM Handcuff Script',
      description: 'Realistic FiveM handcuffs for ESX and QBCore: animations, props, drag, headbag, tape and ankle tracker. Encrypted release, config files stay open.',
    },
    de: {
      title:       'MSK Handcuffs (Encrypted), FiveM Handcuff Script',
      description: 'Realistische FiveM-Handschellen für ESX und QBCore: Animationen, Props, Ziehen, Kopfsack, Klebeband und Fußfessel. Encrypted, Config bleibt offen.',
    },
  },
  5301828: { // MSK Handcuffs - Source
    en: {
      title:       'MSK Handcuffs (Source), FiveM Handcuff Script',
      description: 'Realistic FiveM handcuffs for ESX and QBCore: animations, props, drag, headbag, tape and ankle tracker. Source release, only core code encrypted.',
    },
    de: {
      title:       'MSK Handcuffs (Source), FiveM Handcuff Script',
      description: 'Realistische FiveM-Handschellen für ESX und QBCore: Animationen, Props, Ziehen, Kopfsack, Klebeband und Fußfessel. Source, nur der Kern verschlüsselt.',
    },
  },
  6446936: { // MSK VehicleKeys - Encrypted
    en: {
      title:       'MSK VehicleKeys (Encrypted), FiveM Vehicle Keys',
      description: 'FiveM vehicle keys for ESX and QBCore: unique key items, lock/unlock, key menu, job vehicles, admin dashboard. Encrypted release, config stays open.',
    },
    de: {
      title:       'MSK VehicleKeys (Encrypted), FiveM Vehicle Keys',
      description: 'FiveM Vehicle Keys für ESX und QBCore: Schlüssel als Item, Auf- und Zuschliessen, Schlüsselmenü, Jobfahrzeuge, Admin-Dashboard. Config bleibt offen.',
    },
  },
  6446947: { // MSK VehicleKeys - Source
    en: {
      title:       'MSK VehicleKeys (Source), FiveM Vehicle Keys',
      description: 'FiveM vehicle keys for ESX and QBCore: unique key items, lock/unlock, key menu, job vehicles, admin dashboard. Source release, only core encrypted.',
    },
    de: {
      title:       'MSK VehicleKeys (Source), FiveM Vehicle Keys',
      description: 'FiveM Vehicle Keys für ESX und QBCore: Schlüssel als Item, Auf- und Zuschliessen, Schlüsselmenü, Jobfahrzeuge, Admin-Dashboard. Nur der Kern verschlüsselt.',
    },
  },
  7569109: { // Subscription - Encrypted
    en: {
      title:       'All MSK FiveM Scripts, Monthly (Encrypted)',
      description: 'Try every MSK FiveM script for a month before buying a single resource. Encrypted release. A trial model, not a permanent license purchase.',
    },
    de: {
      title:       'Alle MSK FiveM Scripts im Monatsabo (Encrypted)',
      description: 'Einen Monat lang jedes MSK FiveM Script testen, bevor du dich für eine einzelne Ressource entscheidest. Encrypted-Fassung. Ein Testmodell, kein Lizenzkauf.',
    },
  },
  7569121: { // Subscription - Source
    en: {
      title:       'All MSK FiveM Scripts, Monthly (Source)',
      description: 'Try every MSK FiveM script for a month before buying a single resource. Source release. A trial model, not a permanent license purchase.',
    },
    de: {
      title:       'Alle MSK FiveM Scripts im Monatsabo (Source)',
      description: 'Einen Monat lang jedes MSK FiveM Script testen, bevor du dich für eine einzelne Ressource entscheidest. Source-Fassung. Ein Testmodell, kein Lizenzkauf.',
    },
  },
}

// The Tebex category descriptions are bilingual [GER]/[ENG] blocks. An
// excerpt from them always yields the German part, which is why the English
// category pages carried a German meta description until 22.08.2026.
export const CATEGORY_SEO: Record<number, SearchSnippets> = {
  2105296: { // Encrypted Version
    en: {
      title:       'Encrypted FiveM Scripts',
      description: 'MSK FiveM scripts in the encrypted release: everything is escrow protected except config.lua, translation.lua and server_discordlog.lua.',
    },
    de: {
      title:       'Verschlüsselte FiveM Scripts',
      description: 'MSK FiveM Scripts in der Encrypted-Fassung: alles ist Escrow-geschützt ausser config.lua, translation.lua und server_discordlog.lua.',
    },
  },
  2228937: { // Source Version
    en: {
      title:       'Source FiveM Scripts',
      description: 'MSK FiveM scripts in the source release: most of the code is open, only the core functions stay encrypted so the script cannot be copied.',
    },
    de: {
      title:       'FiveM Scripts mit Quellcode',
      description: 'MSK FiveM Scripts in der Source-Fassung: der grösste Teil des Codes liegt offen, nur die Kernfunktionen bleiben verschlüsselt und damit kopiergeschützt.',
    },
  },
  3392436: { // Subscriptions
    en: {
      title:       'FiveM Script Subscriptions',
      description: 'Try every MSK FiveM script for a month before deciding on a single resource. Available as an encrypted or a source subscription.',
    },
    de: {
      title:       'FiveM Script Abos',
      description: 'Jedes MSK FiveM Script einen Monat lang ausprobieren, bevor du dich für eine einzelne Ressource entscheidest. Als Encrypted- oder Source-Abo.',
    },
  },
}


// ── License variant ───────────────────────────────────────────
// Every script exists twice, as Encrypted and as Source. Until
// 22.08.2026 the difference appeared nowhere on the purchase surface: the two
// cards carried the same description, the same tags and partly the same image
// and differed visibly only by a title suffix and the price.
// It was written down, but only in CATEGORY_SEO, i.e. for Google.
//
// The mapping comes from the existing data, nothing is guessed: the two
// catalogue categories carry it directly. For the subscription packages both
// variants live in the same category, there the package name decides.

export type PackageVariant = 'encrypted' | 'source'

const CATEGORY_VARIANT: Record<number, PackageVariant> = {
  2105296: 'encrypted',
  2228937: 'source',
}

export function resolveVariant(
  pkg: { name?: string; category?: { id?: number } },
): PackageVariant | null {
  const byCategory = pkg.category?.id ? CATEGORY_VARIANT[pkg.category.id] : undefined
  if (byCategory) return byCategory

  const name = pkg.name ?? ''
  if (/\bsource\b/i.test(name))    return 'source'
  if (/\bencrypted\b/i.test(name)) return 'encrypted'
  return null
}

// ── Package Tags ──────────────────────────────────────────────
// Optional small tags shown below the package name on cards.
// Example: ['ESX', 'oxmysql', 'msk_core']

export const PACKAGE_TAGS: Record<number, string[]> = {
  5732587: ['oxmysql','msk_core', 'AdvancedParking', 'MSK VehicleKeys', 'Jaksam Vehicle Keys'], // MSK Garage - E
  5732588: ['oxmysql','msk_core', 'AdvancedParking', 'MSK VehicleKeys', 'Jaksam Vehicle Keys'], // MSK Garage - S
  5159927: ['msk_core', 'pma-voice', 'saltychat'], // MSK Handcuffs - E
  5301828: ['msk_core', 'pma-voice', 'saltychat'], // MSK Handcuffs - S
  6446936: ['oxmysql', 'msk_core', 'ox_inventory', 'msk_enginetoggle'], // MSK VehicleKeys - E
  6446947: ['oxmysql', 'msk_core', 'ox_inventory', 'msk_enginetoggle'], // MSK VehicleKeys - S
  // The two subscription packages deliberately have no entry. `Subscription` is
  // not a dependency but the product type, and as a badge it already sits at the
  // top of the image on the card (PACKAGE_BADGES). In this list it also ended up
  // in the "Funktioniert mit" ("Works with") filter group, between saltychat and
  // oxmysql, where it does not belong.
}
