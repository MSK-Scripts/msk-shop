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
  price?: string
  isFree?: boolean
  image: string
  link: string
  linkLabel: string
  secondaryLink?: string
  secondaryLinkLabel?: string
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
    id: 'msk-discord-ticketbot',
    name: 'Discord Ticketbot',
    description: 'A powerful Discord bot for your FiveM community with role sync, ticket system and more.',
    price: 'Free',
    isFree: true,
    image: 'discord_ticketbot_banner.png',
    link: 'https://github.com/MSK-Scripts/discord_ticketbot',
    linkLabel: 'View on GitHub',
    badges: [
      { label: 'Discord', variant: 'discord' },
      { label: 'JavaScript', variant: 'js' },
    ],
    tags: ['Installation', 'Configuration', 'Ticket System'],
  },
  {
    id: 'msk-discord-multibot',
    name: 'Discord Multibot',
    description: 'A Discord multibot, allowing you to create multiple bots for different purposes, such as a event bot, a command bot, and more.',
    price: 'Free',
    isFree: true,
    image: 'msk_multibot_banner.png',
    link: 'https://github.com/MSK-Scripts/discord_multibot',
    linkLabel: 'View on GitHub',
    badges: [
      { label: 'Discord', variant: 'discord' },
      { label: 'JavaScript', variant: 'js' },
    ],
    tags: ['Installation', 'Configuration'],
  },
  {
    id: 'msk-core',
    name: 'MSK Core',
    description: 'Our core library for our resources, providing common utilities, and more.',
    price: 'Free',
    isFree: true,
    image: 'msk_core_banner.png',
    link: 'https://github.com/MSK-Scripts/msk_core',
    linkLabel: 'View on GitHub',
    badges: [
      { label: 'FiveM', variant: 'fivem' },
      { label: 'Lua', variant: 'lua' },
      { label: 'Standalone', variant: 'standalone' },
    ],
    tags: ['Library for MSK Scripts', 'Utilities'],
  },
  {
    id: 'mskanban',
    name: 'MSKanban',
    description: 'Zero-knowledge encryption, real-time collaboration, offline-first — open source under AGPL-3.0.',
    image: 'mskanban.png',
    link: 'https://mskanban.msk-scripts.de/',
    linkLabel: 'View LIVE',
    secondaryLink: 'https://github.com/MSK-Scripts/mskanban',
    secondaryLinkLabel: 'GitHub',
    badges: [
      { label: 'TypeScript', variant: 'ts' },
    ],
    tags: ['Kanban Board', 'Task Management', 'Collaboration'],
  },
  {
    id: 'msk-paste',
    name: 'MSK Paste',
    description: 'A simple paste tool for sharing code snippets with your team.',
    image: 'msk_paste.png',
    link: 'https://paste.msk-scripts.de/',
    linkLabel: 'View LIVE',
    secondaryLink: 'https://github.com/MSK-Scripts/msk-paste',
    secondaryLinkLabel: 'GitHub',
    badges: [
      { label: 'TypeScript', variant: 'ts' },
    ],
    tags: ['Code Sharing', 'Collaboration', 'Syntax Highlighting'],
  },
  {
    id: 'msk-shortener',
    name: 'MSK Shortener',
    description: 'Fast, privacy-friendly URL shortener. No cookies, no trackers, no signup.',
    image: 'msk_shortener.png',
    link: 'https://s.msk-scripts.de/',
    linkLabel: 'View LIVE',
    secondaryLink: 'https://github.com/MSK-Scripts/msk-shortener',
    secondaryLinkLabel: 'GitHub',
    badges: [
      { label: 'TypeScript', variant: 'ts' },
    ],
    tags: ['URL Shortening', 'Privacy-Friendly'],
  },

]

// ═══════════════════════════════════════════════════════════════
//  SECTION TITLE
//  Change the title of the custom packages section
// ═══════════════════════════════════════════════════════════════
export const CUSTOM_PACKAGES_TITLE = 'Tools, Bots & More'
