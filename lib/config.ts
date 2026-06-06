// ── Featured Package IDs ─────────────────────────────────────
// Add the Tebex package IDs you want to show on the homepage.
// Find the ID in your Tebex control panel URL when editing a package.
// Example: https://creator.tebex.io/packages/1234567 → ID is 1234567

export const FEATURED_PACKAGE_IDS: number[] = [
  5301828,
  6446947,
  5732588,
]

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
  5159927: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }], // MSK Handcuffs - E
  5301828: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }], // MSK Handcuffs - S
  6372773: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }], // MSK Storage - E
  6372865: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }], // MSK Storage - S
  6446936: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }, { label: 'Lua', variant: 'lua' }], // MSK VehicleKeys - E
  6446947: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }, { label: 'Lua', variant: 'lua' }], // MSK VehicleKeys - S
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
}

// ── News Popup ────────────────────────────────────────────
// Shown bottom-right on every full page load. Closes with X button.
// Set enabled: false to hide it completely.

export const NEWS_POPUP = {
  enabled: true,

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
