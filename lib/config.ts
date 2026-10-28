import type { Lang } from '@/lib/i18n'

// ── Site Config ───────────────────────────────────────────
export const SITE_CONFIG = {
  name: 'MSK Scripts Shop',
  tagline: 'High quality FiveM resources & Discord bots for your server',
  discord: 'https://discord.gg/5hHSBRHvJE',
  github: 'https://github.com/MSK-Scripts',
  docs: 'https://docu.msk-scripts.de',
  /** The contact address from the imprint. */
  email: 'info@msk-scripts.de',
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

// ── Products ─────────────────────────────────────────────────
// What the shop says about a product, keyed by its slug (lib/products.ts).
// Until Phase 4 of the redesign (28.10.2026) this lived per Tebex package in
// four tables (badges, descriptions, search snippets, tags), each entry
// twice: once for Encrypted, once for Source. One product is one page now,
// so it is one entry.
//
// A product without an entry still works: the card falls back to an excerpt
// of the Tebex text, the page title to the Tebex name.

/**
 * Title and meta description of a page, i.e. what shows up in the Google
 * result list. Deliberately separate from the summary: that is the visible
 * text on the page itself.
 *
 * Why they are curated (measured in Search Console on 22.08.2026): the shop
 * collects impressions on generic queries such as "fivem handcuff script",
 * but the word "FiveM" appears in none of the Tebex package names. The raw
 * name as <title> left out precisely the term people search for.
 *
 * No prices: they change with every sale, a snippet does not.
 */
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

export interface ProductCopy {
  /**
   * One line of benefit, on the card and under the product name. A missing
   * German line falls back to the English one, marked as English (plan 5.9).
   */
  summary: { en: string; de?: string }
  seo: SearchSnippets
  /** Frameworks the script runs on, shown as tags and offered as the catalogue filter. */
  frameworks: string[]
  /**
   * From the "Requirements" section of the documentation, read on 28.10.2026
   * (docu.msk-scripts.de/docs/<resource>/). Names only: the minimum versions
   * live in the documentation, which the page links to, so they cannot drift
   * apart here.
   */
  requires?: string[]
  optional?: string[]
}

export const PRODUCT_COPY: Record<string, ProductCopy> = {
  garage: {
    summary: {
      en: 'A complete, server-authoritative garage and impound system for ESX with a modern React UI and a security-first backend.',
      de: 'Ein komplettes Garagen- und Abschlepphof-System für ESX: der Server prüft alles, die Oberfläche ist modernes React, das Backend auf Sicherheit gebaut.',
    },
    seo: {
      en: {
        title:       'MSK Garage, FiveM Garage & Impound',
        description: 'Server-authoritative FiveM garage and impound system for ESX with a React admin dashboard. Available as Encrypted or Source release.',
      },
      de: {
        title:       'MSK Garage, FiveM Garage & Impound',
        description: 'Server-autoritatives FiveM Garage- und Impound-System für ESX mit React-Admin-Dashboard. Als Encrypted- oder Source-Fassung erhältlich.',
      },
    },
    frameworks: ['ESX'],
    requires: ['msk_core', 'ox_lib', 'oxmysql'],
    optional: ['AdvancedParking', 'VehicleDeformation', 'MSK VehicleKeys', 'VehicleKeyChain', 'Jaksam Vehicle Keys'],
  },
  handcuffs: {
    summary: {
      en: 'Realistic handcuffs with animations, props, drag, headbag, tape and ankle tracker.',
      de: 'Realistische Handschellen mit Animationen, Props, Abführen, Kopfsack, Klebeband und Fußfessel.',
    },
    seo: {
      en: {
        title:       'MSK Handcuffs, FiveM Handcuff Script',
        description: 'Realistic FiveM handcuffs for ESX and QBCore: animations, props, drag, headbag, tape and ankle tracker. Available as Encrypted or Source release.',
      },
      de: {
        title:       'MSK Handcuffs, FiveM Handcuff Script',
        description: 'Realistische FiveM-Handschellen für ESX und QBCore: Animationen, Props, Abführen, Kopfsack, Klebeband und Fußfessel. Als Encrypted oder Source.',
      },
    },
    frameworks: ['ESX', 'QBCore'],
    requires: ['msk_core', 'oxmysql'],
    optional: ['ox_target or qb-target', 'pma-voice or saltychat'],
  },
  vehiclekeys: {
    summary: {
      en: 'Unique vehicle key items with lock/unlock, key menu, job vehicles and much more.',
      de: 'Fahrzeugschlüssel als eigene Items, mit Auf- und Zuschließen, Schlüsselmenü, Jobfahrzeugen und mehr.',
    },
    seo: {
      en: {
        title:       'MSK VehicleKeys, FiveM Vehicle Keys',
        description: 'FiveM vehicle keys for ESX and QBCore: unique key items, lock/unlock, key menu, job vehicles, admin dashboard. Encrypted or Source release.',
      },
      de: {
        title:       'MSK VehicleKeys, FiveM Vehicle Keys',
        description: 'FiveM Vehicle Keys für ESX und QBCore: Schlüssel als Item, Auf- und Zuschließen, Schlüsselmenü, Jobfahrzeuge, Admin-Dashboard. Encrypted oder Source.',
      },
    },
    frameworks: ['ESX', 'QBCore'],
    requires: ['msk_core', 'ox_lib', 'oxmysql'],
    optional: ['ox_target', 'msk_enginetoggle'],
  },
  'all-access': {
    // Said positively first, what you get, then that it is a trial licence
    // (plan 5.5). The facts are the ones of the Tebex text.
    summary: {
      en: 'Every MSK FiveM script for a month, cancel monthly. A trial licence: test them on your own server before you buy the ones you keep.',
      de: 'Alle MSK FiveM Scripts für einen Monat, monatlich kündbar. Eine Testlizenz: probier sie auf deinem Server aus, bevor du die kaufst, die du behalten willst.',
    },
    seo: {
      en: {
        title:       'All MSK FiveM Scripts, Monthly',
        description: 'Try every MSK FiveM script for a month before buying a single resource. Encrypted or Source release. A trial model, not a permanent license.',
      },
      de: {
        title:       'Alle MSK FiveM Scripts im Monatsabo',
        description: 'Einen Monat lang jedes MSK FiveM Script testen, bevor du dich für eine einzelne Ressource entscheidest. Encrypted oder Source, ein Testmodell.',
      },
    },
    frameworks: [],
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
      description: 'MSK FiveM Scripts in der Encrypted-Fassung: alles ist Escrow-geschützt außer config.lua, translation.lua und server_discordlog.lua.',
    },
  },
  2228937: { // Source Version
    en: {
      title:       'Source FiveM Scripts',
      description: 'MSK FiveM scripts in the source release: most of the code is open, only the core functions stay encrypted so the script cannot be copied.',
    },
    de: {
      title:       'FiveM Scripts mit Quellcode',
      description: 'MSK FiveM Scripts in der Source-Fassung: der größte Teil des Codes liegt offen, nur die Kernfunktionen bleiben verschlüsselt und damit kopiergeschützt.',
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
