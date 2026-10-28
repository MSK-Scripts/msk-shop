// ═══════════════════════════════════════════════════════════════
//  CUSTOM PACKAGES
//  What is not sold through Tebex: the free FiveM scripts on GitHub and
//  the web tools. FREE_SCRIPT_IDS and WEB_TOOL_IDS below pick them for the
//  home page, /fivem/free and /tools. Button labels come from the
//  translations, not from here.
// ═══════════════════════════════════════════════════════════════
//
//  HOW TO ADD A PACKAGE:
//  Copy one of the entries below, fill in your details and add its id to
//  FREE_SCRIPT_IDS or WEB_TOOL_IDS.
//
//  FIELDS:
//    id            → unique string, e.g. "msk_core"
//    name          → name shown on the page
//    description   → short description (1-2 sentences), English
//    descriptionDe → (optional) the German description
//    image         → screenshot of a web tool: a file in public/ or a URL.
//                    The free scripts show no picture.
//    link          → where the main button points (GitHub, live site)
//    secondaryLink → (optional) a second button, e.g. the GitHub repository
//    docsLink      → (optional) start page of the documentation
//    badges        → tags such as frameworks, e.g. [{ label: "ESX" }];
//                    every tag has the same soft green look
//
// ═══════════════════════════════════════════════════════════════

export interface CustomPackage {
  id: string
  name: string
  description: string
  /** German version of `description`. Without it the German page shows the English one. */
  descriptionDe?: string
  image: string
  link: string
  secondaryLink?: string
  /**
   * Start page of the documentation, where there is one. Checked against the
   * sitemap of docu.msk-scripts.de on 28.10.2026; msk_givevehicle has none.
   */
  docsLink?: string
  badges: { label: string }[]
}

export const CUSTOM_PACKAGES: CustomPackage[] = [
  // ─── EXAMPLE, delete or edit this ───────────────────────────
  // {
  //   id: 'msk-discord-bot',
  //   name: 'MSK Discord Bot',
  //   description: 'A powerful Discord bot for your FiveM community with role sync, ticket system and more.',
  //   image: '',
  //   link: 'https://github.com/MSK-Scripts/msk-discord-bot',
  //   badges: [{ label: 'Discord' }],
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
    image: "msk_core-banner.webp",
    link: "https://github.com/MSK-Scripts/msk_core",
    docsLink: "https://docu.msk-scripts.de/docs/msk_core/",
    badges: [
      { label: "FiveM" },
      { label: "Lua" },
      { label: "Standalone" },
    ],
  },
  {
    id: "msk_enginetoggle",
    name: "MSK EngineToggle",
    description: "A simple resource for toggling the FiveM engine on and off.",
    descriptionDe: "Eine einfache Ressource, um den Motor in FiveM an- und auszuschalten.",
    image: "msk_enginetoggle-banner.webp",
    link: "https://github.com/MSK-Scripts/msk_enginetoggle",
    docsLink: "https://docu.msk-scripts.de/docs/msk_enginetoggle/",
    badges: [
      { label: "FiveM" },
      { label: "Lua" },
      { label: "ESX" },
      { label: "QBCore" },
    ],
  },
  {
    id: "msk_givevehicle",
    name: "MSK GiveVehicle",
    description:
      "Give, spawn, delete & manage vehicles through an in-game admin dashboard",
    descriptionDe:
      "Fahrzeuge vergeben, spawnen, löschen und verwalten, über ein Admin-Dashboard im Spiel",
    image: "msk_givevehicle-banner.webp",
    link: "https://github.com/MSK-Scripts/msk_givevehicle",
    badges: [
      { label: "FiveM" },
      { label: "Lua" },
      { label: "ESX" },
      { label: "QBCore" },
    ],
  },
  /* {
    id: 'msk_jobGPS',
    name: 'MSK JobGPS',
    description: 'A simple resource for providing GPS coordinates for job locations.',
    image: '',
    link: 'https://github.com/MSK-Scripts/msk_jobGPS',
    badges: [
      { label: 'FiveM' },
      { label: 'Lua' },
      { label: 'ESX' },
      { label: 'QBCore' },
    ],
  }, */
  {
    id: "msk_fuel",
    name: "MSK Fuel",
    description:
      "The complete fuel state (level, max volume, fuel type) is stored on StateBags and is therefore fully network-synchronized between all players.",
    descriptionDe:
      "Der komplette Tankzustand (Füllstand, Tankgröße, Kraftstoffart) liegt in StateBags und ist dadurch zwischen allen Spielern über das Netzwerk synchron.",
    image: "msk_fuel-banner.webp",
    link: "https://github.com/MSK-Scripts/msk_fuel",
    docsLink: "https://docu.msk-scripts.de/docs/msk_fuel/",
    badges: [
      { label: "FiveM" },
      { label: "Lua" },
      { label: "ESX" },
      { label: "QBCore" },
    ],
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
    secondaryLink: "https://github.com/MSK-Scripts/msk-forms",
    docsLink: "https://docu.msk-scripts.de/ecosystem/msk-forms/",
    badges: [{ label: "TypeScript" }],
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
    secondaryLink: "https://github.com/MSK-Scripts/msk-paste",
    docsLink: "https://docu.msk-scripts.de/ecosystem/msk-paste/",
    badges: [{ label: "TypeScript" }],
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
    secondaryLink: "https://github.com/MSK-Scripts/msk-shortener",
    docsLink: "https://docu.msk-scripts.de/ecosystem/msk-shortener/",
    badges: [{ label: "TypeScript" }],
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
