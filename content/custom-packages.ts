// ═══════════════════════════════════════════════════════════════
//  CUSTOM PACKAGES
//  Packages that are NOT from Tebex (e.g. Discord Bots, GitHub)
//  These appear on the homepage below the Tebex packages.
// ═══════════════════════════════════════════════════════════════
//
//  HOW TO ADD A PACKAGE:
//  Copy one of the examples below and fill in your details.
//
//  FIELDS:
//    id          → unique string (anything you want, e.g. "discord-bot-1")
//    name        → package name shown on the card
//    description → short description (1-2 sentences)
//    price       → (optional) price as string, e.g. "€9.99" or "Free"
//    isFree      → (optional) set to true if the package is free
//    image       → URL to a preview image (or leave empty "")
//    link        → where the primary button points (GitHub, Discord, website...)
//    linkLabel   → label of the primary button, e.g. "View on GitHub" / "Get Bot"
//    secondaryLink      → (optional) where the secondary button points
//    secondaryLinkLabel → (optional) label of the secondary button
//                  Both secondary fields must be set for the second button to appear.
//    badges      → list of badges to show (label + variant)
//                  variants: "esx" | "qb" | "standalone" | "js" | "ts" | "lua" | "py" | "discord" | "fivem"
//                  Add as many badges as you want, or leave the array empty []
//    tags        → list of tags to show (e.g. ['Installation', 'Configuration'])
//
// ═══════════════════════════════════════════════════════════════

export interface CustomPackage {
  id: string
  name: string
  description: string
  /** German version of `description`. Without it the German page shows the English one. */
  descriptionDe?: string
  price?: string
  isFree?: boolean
  image: string
  link: string
  linkLabel: string
  secondaryLink?: string
  secondaryLinkLabel?: string
  /**
   * Start page of the documentation, where there is one. Checked against the
   * sitemap of docu.msk-scripts.de on 28.10.2026; msk_givevehicle has none.
   */
  docsLink?: string
  badges: { label: string; variant: 'esx' | 'qb' | 'standalone' | 'js' | 'ts' | 'lua' | 'py' | 'discord' | 'fivem' }[]
  tags: string[]
}

export const CUSTOM_PACKAGES: CustomPackage[] = [
  // ─── EXAMPLE — Delete or edit this ──────────────────────────
  // {
  //   id: 'msk-discord-bot',
  //   name: 'MSK Discord Bot',
  //   description: 'A powerful Discord bot for your FiveM community with role sync, ticket system and more.',
  //   price: 'Free',
  //   isFree: true,
  //   image: '',
  //   link: 'https://github.com/MSK-Scripts/msk-discord-bot',
  //   linkLabel: 'View on GitHub',
  //   badges: [{ label: 'Discord', variant: 'standalone' }],
  //   tags: ['Role Sync', 'Ticket System', 'Moderation'],
  // },
  // ────────────────────────────────────────────────────────────

  // Add your custom packages here ↓
  {
    id: "msk_core",
    name: "MSK Core",
    description:
      "Our core library for our resources, providing common utilities, and more.",
    descriptionDe:
      "Unsere Kernbibliothek für unsere Ressourcen, mit gemeinsamen Hilfsfunktionen und mehr.",
    price: "Free",
    isFree: true,
    image: "msk_core-banner.webp",
    link: "https://github.com/MSK-Scripts/msk_core",
    linkLabel: "View on GitHub",
    docsLink: "https://docu.msk-scripts.de/docs/msk_core/",
    badges: [
      { label: "FiveM", variant: "fivem" },
      { label: "Lua", variant: "lua" },
      { label: "Standalone", variant: "standalone" },
    ],
    tags: ["Library for MSK Scripts", "Utilities"],
  },
  {
    id: "msk_enginetoggle",
    name: "MSK EngineToggle",
    description: "A simple resource for toggling the FiveM engine on and off.",
    descriptionDe: "Eine einfache Ressource, um den Motor in FiveM an- und auszuschalten.",
    price: "Free",
    isFree: true,
    image: "msk_enginetoggle-banner.webp",
    link: "https://github.com/MSK-Scripts/msk_enginetoggle",
    linkLabel: "View on GitHub",
    docsLink: "https://docu.msk-scripts.de/docs/msk_enginetoggle/",
    badges: [
      { label: "FiveM", variant: "fivem" },
      { label: "Lua", variant: "lua" },
      { label: "ESX", variant: "esx" },
      { label: "QBCore", variant: "qb" },
    ],
    tags: ["EngineToggle", "Vehicle Management"],
  },
  {
    id: "msk_givevehicle",
    name: "MSK GiveVehicle",
    description:
      "Give, spawn, delete & manage vehicles through an in-game admin dashboard",
    descriptionDe:
      "Fahrzeuge vergeben, spawnen, löschen und verwalten, über ein Admin-Dashboard im Spiel",
    price: "Free",
    isFree: true,
    image: "msk_givevehicle-banner.webp",
    link: "https://github.com/MSK-Scripts/msk_givevehicle",
    linkLabel: "View on GitHub",
    badges: [
      { label: "FiveM", variant: "fivem" },
      { label: "Lua", variant: "lua" },
      { label: "ESX", variant: "esx" },
      { label: "QBCore", variant: "qb" },
    ],
    tags: ["Give Vehicle", "Vehicle Management", "Admin Dashboard"],
  },
  /* {
    id: 'msk_jobGPS',
    name: 'MSK JobGPS',
    description: 'A simple resource for providing GPS coordinates for job locations.',
    price: 'Free',
    isFree: true,
    image: '',
    link: 'https://github.com/MSK-Scripts/msk_jobGPS',
    linkLabel: 'View on GitHub',
    badges: [
      { label: 'FiveM', variant: 'fivem' },
      { label: 'Lua', variant: 'lua' },
      { label: 'ESX', variant: 'esx' },
      { label: 'QBCore', variant: 'qb' },
    ],
    tags: ['Job GPS', 'Location Tracking'],
  }, */
  {
    id: "msk_fuel",
    name: "MSK Fuel",
    description:
      "The complete fuel state (level, max volume, fuel type) is stored on StateBags and is therefore fully network-synchronized between all players.",
    descriptionDe:
      "Der komplette Tankzustand (Füllstand, Tankgröße, Kraftstoffart) liegt in StateBags und ist dadurch zwischen allen Spielern über das Netzwerk synchron.",
    price: "Free",
    isFree: true,
    image: "msk_fuel-banner.webp",
    link: "https://github.com/MSK-Scripts/msk_fuel",
    linkLabel: "View on GitHub",
    docsLink: "https://docu.msk-scripts.de/docs/msk_fuel/",
    badges: [
      { label: "FiveM", variant: "fivem" },
      { label: "Lua", variant: "lua" },
      { label: "ESX", variant: "esx" },
      { label: "QBCore", variant: "qb" },
    ],
    tags: ["Fuel Consumption", "Realistic Fuel System", "Vehicle Management"],
  },
  {
    id: "msk-forms",
    name: "MSK Forms",
    description:
      "A modern form & application platform with status feedback and native Discord integration.",
    descriptionDe:
      "Eine moderne Plattform für Formulare und Bewerbungen, mit Statusrückmeldung und nativer Discord-Anbindung.",
    image: "msk_forms.webp",
    link: "https://forms.msk-scripts.de/",
    linkLabel: "View LIVE",
    secondaryLink: "https://github.com/MSK-Scripts/msk-forms",
    secondaryLinkLabel: "GitHub",
    docsLink: "https://docu.msk-scripts.de/ecosystem/msk-forms/",
    badges: [{ label: "TypeScript", variant: "ts" }],
    tags: ["Form Builder", "Application Management", "Discord Integration"],
  },
  {
    id: "msk-paste",
    name: "MSK Paste",
    description:
      "A simple paste tool for sharing code snippets with your team.",
    descriptionDe:
      "Ein einfaches Paste-Tool, um Code-Schnipsel mit deinem Team zu teilen.",
    image: "msk_paste.webp",
    link: "https://paste.msk-scripts.de/",
    linkLabel: "View LIVE",
    secondaryLink: "https://github.com/MSK-Scripts/msk-paste",
    secondaryLinkLabel: "GitHub",
    docsLink: "https://docu.msk-scripts.de/ecosystem/msk-paste/",
    badges: [{ label: "TypeScript", variant: "ts" }],
    tags: ["Code Sharing", "Collaboration", "Syntax Highlighting"],
  },
  {
    id: "msk-shortener",
    name: "MSK Shortener",
    description:
      "Fast, privacy-friendly URL shortener. No cookies, no trackers, no signup.",
    descriptionDe:
      "Schneller, datenschutzfreundlicher Linkkürzer. Keine Cookies, keine Tracker, keine Anmeldung.",
    image: "msk_shortener.webp",
    link: "https://s.msk-scripts.de/",
    linkLabel: "View LIVE",
    secondaryLink: "https://github.com/MSK-Scripts/msk-shortener",
    secondaryLinkLabel: "GitHub",
    docsLink: "https://docu.msk-scripts.de/ecosystem/msk-shortener/",
    badges: [{ label: "TypeScript", variant: "ts" }],
    tags: ["URL Shortening", "Privacy-Friendly"],
  },
];

/**
 * Which entries are the free FiveM scripts and which the web tools.
 * `CUSTOM_PACKAGES` mixes both, and home page, free scripts page and tools
 * page all pick from it by these lists. msk_core comes first, the paid
 * resources depend on it. An id that no longer exists drops out silently
 * (msk_jobGPS is commented out above).
 */
export const FREE_SCRIPT_IDS = ['msk_core', 'msk_fuel', 'msk_enginetoggle', 'msk_givevehicle', 'msk_jobGPS'] as const
export const WEB_TOOL_IDS = ['msk-forms', 'msk-paste', 'msk-shortener'] as const

/** The entries with these ids, in the order of the ids. */
export function packagesById(ids: readonly string[]): CustomPackage[] {
  return ids.flatMap(id => CUSTOM_PACKAGES.filter(p => p.id === id))
}

// ═══════════════════════════════════════════════════════════════
//  SECTION TITLE
//  Change the title of the custom packages section
// ═══════════════════════════════════════════════════════════════
export const CUSTOM_PACKAGES_TITLE = 'FREE FiveM Scripts'
