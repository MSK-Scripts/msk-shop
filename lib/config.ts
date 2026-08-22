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
  6372773: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }], // MSK Storage - E
  6372865: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }], // MSK Storage - S
  6446936: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }, { label: 'Lua', variant: 'lua' }], // MSK VehicleKeys - E
  6446947: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }, { label: 'Lua', variant: 'lua' }], // MSK VehicleKeys - S
  7569109: [{ label: 'Subscription', variant: 'standalone' }, { label: 'Lua', variant: 'lua' }], // Subscription - Encrypted Version
  7569121: [{ label: 'Subscription', variant: 'standalone' }, { label: 'Lua', variant: 'lua' }], // Subscription - Source Version
}

// ── Package Descriptions ─────────────────────────────────────
// Optional custom description shown on package cards.
// If empty ("") or not set, the Tebex description is used.
// Keep it short — 1 to 2 sentences max.

export const PACKAGE_DESCRIPTIONS: Record<number, string> = {
  5732587: 'A complete, server-authoritative garage and impound system for ESX with a modern React UI and a security-first backend.', // MSK Garage - E
  5732588: 'A complete, server-authoritative garage and impound system for ESX with a modern React UI and a security-first backend.', // MSK Garage - S
  5159927: 'Realistic handcuffs with animations, props, drag, headbag, tape and ankle tracker.', // MSK Handcuffs - E
  5301828: 'Realistic handcuffs with animations, props, drag, headbag, tape and ankle tracker.', // MSK Handcuffs - S
  6372773: 'Flexible storage system with support for ox_inventory and Chezza Inventory.', // MSK Storage - E
  6372865: 'Flexible storage system with support for ox_inventory and Chezza Inventory.', // MSK Storage - S
  6446936: 'Unique vehicle key items with lock/unlock, key menu, job vehicles and much more.', // MSK VehicleKeys - E
  6446947: 'Unique vehicle key items with lock/unlock, key menu, job vehicles and much more.', // MSK VehicleKeys - S
  7569109: 'This subscription is intended purely as a trial model. The goal is to let you test all scripts thoroughly within one month before deciding on the final purchase of individual resources. It does not replace a permanent license purchase.', // Subscription - Encrypted Version
  7569121: 'This subscription is intended purely as a trial model. The goal is to let you test all scripts thoroughly within one month before deciding on the final purchase of individual resources. It does not replace a permanent license purchase.', // Subscription - Source Version 
}

// ── Search snippets ──────────────────────────────────────────
// Titel und Meta-Description der Paket- und Kategorieseiten, also das was in
// der Google-Trefferliste steht. Bewusst getrennt von PACKAGE_DESCRIPTIONS:
// das ist der sichtbare Kartentext auf der Seite selbst.
//
// Zwei Gründe für die Kuratierung, beide am 22.08.2026 in der Search Console
// nachgemessen:
//
//   1. Der Shop sammelt Impressionen auf generische Anfragen wie
//      "fivem handcuff script" (24) und "fivem job creator" (21), aber in
//      keinem Tebex-Paketnamen steht das Wort "FiveM". Der rohe Name als
//      <title> liess ausgerechnet den gesuchten Begriff weg.
//   2. Encrypted und Source sind pro Produkt zwei Seiten mit identischem Text.
//      Google meldet 6 Seiten als "Duplikat, vom Nutzer nicht als kanonisch
//      festgelegt". Beide Fassungen sollen indexierbar bleiben, also müssen
//      Titel und Description den Lizenzunterschied benennen.
//
// Die Formulierung des Unterschieds stammt aus Tebex' eigenen Kategorietexten,
// sie ist nicht ausgedacht: Encrypted verschlüsselt alles ausser config.lua,
// translation.lua und server_discordlog.lua, Source lässt den Grossteil offen
// und verschlüsselt nur die CORE-Funktionen.
//
// Ohne Eintrag fällt die Seite auf den Tebex-Namen und den Tebex-Text zurück.
// Neue Pakete und Kategorien gehören deshalb hier ergänzt.

export interface SearchSnippet {
  /** <title> ohne das " | MSK Scripts"-Suffix. Zielmarke: unter 50 Zeichen. */
  title:       string
  /** Meta-Description. Zielmarke: unter 160 Zeichen, sonst kürzt Google. */
  description: string
}

export const PACKAGE_SEO: Record<number, SearchSnippet> = {
  5732587: { // MSK Garage - Encrypted
    title:       'MSK Garage (Encrypted), FiveM Garage & Impound',
    description: 'Server-authoritative FiveM garage and impound system for ESX with a React admin dashboard. Encrypted release, config and locale files stay open.',
  },
  5732588: { // MSK Garage - Source
    title:       'MSK Garage (Source), FiveM Garage & Impound',
    description: 'Server-authoritative FiveM garage and impound system for ESX with a React admin dashboard. Source release, only the core functions stay encrypted.',
  },
  5159927: { // MSK Handcuffs - Encrypted
    title:       'MSK Handcuffs (Encrypted), FiveM Handcuff Script',
    description: 'Realistic FiveM handcuffs for ESX and QBCore: animations, props, drag, headbag, tape and ankle tracker. Encrypted release, config files stay open.',
  },
  5301828: { // MSK Handcuffs - Source
    title:       'MSK Handcuffs (Source), FiveM Handcuff Script',
    description: 'Realistic FiveM handcuffs for ESX and QBCore: animations, props, drag, headbag, tape and ankle tracker. Source release, only core code encrypted.',
  },
  6372773: { // MSK Storage - Encrypted
    title:       'MSK Storage (Encrypted), FiveM Storage Script',
    description: 'Flexible FiveM storage system for ESX with ox_inventory and Chezza Inventory support. Encrypted release, config and locale files stay open.',
  },
  6372865: { // MSK Storage - Source
    title:       'MSK Storage (Source), FiveM Storage Script',
    description: 'Flexible FiveM storage system for ESX with ox_inventory and Chezza Inventory support. Source release, only the core functions stay encrypted.',
  },
  6446936: { // MSK VehicleKeys - Encrypted
    title:       'MSK VehicleKeys (Encrypted), FiveM Vehicle Keys',
    description: 'FiveM vehicle keys for ESX and QBCore: unique key items, lock/unlock, key menu, job vehicles, admin dashboard. Encrypted release, config stays open.',
  },
  6446947: { // MSK VehicleKeys - Source
    title:       'MSK VehicleKeys (Source), FiveM Vehicle Keys',
    description: 'FiveM vehicle keys for ESX and QBCore: unique key items, lock/unlock, key menu, job vehicles, admin dashboard. Source release, only core encrypted.',
  },
  7569109: { // Subscription - Encrypted
    title:       'All MSK FiveM Scripts, Monthly (Encrypted)',
    description: 'Try every MSK FiveM script for a month before buying a single resource. Encrypted release. A trial model, not a permanent license purchase.',
  },
  7569121: { // Subscription - Source
    title:       'All MSK FiveM Scripts, Monthly (Source)',
    description: 'Try every MSK FiveM script for a month before buying a single resource. Source release. A trial model, not a permanent license purchase.',
  },
}

// Die Tebex-Kategoriebeschreibungen sind zweisprachige [GER]/[ENG]-Blöcke. Ein
// Auszug daraus liefert immer den deutschen Teil, weshalb die englischen
// Kategorieseiten bis zum 22.08.2026 eine deutsche Meta-Description trugen.
export const CATEGORY_SEO: Record<number, SearchSnippet> = {
  2105296: { // Encrypted Version
    title:       'Encrypted FiveM Scripts',
    description: 'MSK FiveM scripts in the encrypted release: everything is escrow protected except config.lua, translation.lua and server_discordlog.lua.',
  },
  2228937: { // Source Version
    title:       'Source FiveM Scripts',
    description: 'MSK FiveM scripts in the source release: most of the code is open, only the core functions stay encrypted so the script cannot be copied.',
  },
  3392436: { // Subscriptions
    title:       'FiveM Script Subscriptions',
    description: 'Try every MSK FiveM script for a month before deciding on a single resource. Available as an encrypted or a source subscription.',
  },
}


// ── Package Tags ──────────────────────────────────────────────
// Optional small tags shown below the package name on cards.
// Example: ['ESX', 'oxmysql', 'msk_core']

export const PACKAGE_TAGS: Record<number, string[]> = {
  5732587: ['oxmysql','msk_core', 'AdvancedParking', 'MSK VehicleKeys', 'Jaksam Vehicle Keys'], // MSK Garage - E
  5732588: ['oxmysql','msk_core', 'AdvancedParking', 'MSK VehicleKeys', 'Jaksam Vehicle Keys'], // MSK Garage - S
  5159927: ['msk_core', 'pma-voice', 'saltychat'], // MSK Handcuffs - E
  5301828: ['msk_core', 'pma-voice', 'saltychat'], // MSK Handcuffs - S
  6372773: ['msk_core', 'ox_inventory', 'Chezza Inventory'], // MSK Storage - E
  6372865: ['msk_core', 'ox_inventory', 'Chezza Inventory'], // MSK Storage - S
  6446936: ['oxmysql', 'msk_core', 'ox_inventory', 'msk_enginetoggle'], // MSK VehicleKeys - E
  6446947: ['oxmysql', 'msk_core', 'ox_inventory', 'msk_enginetoggle'], // MSK VehicleKeys - S
  7569109: ['Subscription'], // Subscription - Encrypted Version
  7569121: ['Subscription'], // Subscription - Source Version
}

// ── News Popup ────────────────────────────────────────────
// Shown bottom-right on every full page load. Closes with X button.
// Set enabled: false to hide it completely.

export const NEWS_POPUP = {
  enabled: false,

  title: 'Discord Ticket Bot',

  // Supports simple text. Use \n for line breaks.
  text: 'Get your API Key now and create a ticket system for your community!',

  // Optional button — set to null to hide it
  //button: null as { label: string; href: string } | null,
  button: {
    label: 'Get API Key',
    href: '/ticketbot/verify',
  } as { label: string; href: string } | null,

  // Optional second button — set to null to hide it
  //secondButton: null as { label: string; href: string } | null,
  secondButton: {
    label: 'Dashboard',
    href: '/ticketbot/dashboard',
  } as { label: string; href: string } | null,

  // Optional coupon code — set to null to hide it
  // Displays a copyable coupon field below the text
  coupon: null as string | null,
  //coupon: 'NEWSHOP20',
}

// ── Site Config ───────────────────────────────────────────
export const SITE_CONFIG = {
  name: 'MSK Scripts Shop',
  tagline: 'High quality FiveM resources & Discord bots for your server',
  discord: 'https://discord.gg/5hHSBRHvJE',
  github: 'https://github.com/MSK-Scripts',
  docs: 'https://docu.msk-scripts.de',
}
