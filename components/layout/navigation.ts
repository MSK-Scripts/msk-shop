import { layoutTranslations, type Lang } from '@/lib/i18n'

/**
 * The product lines as header, mobile menu and footer show them.
 *
 * One table, so the three places cannot drift apart. Hrefs are internal paths;
 * `LocaleLink` turns them into the address of the current language.
 */

export interface NavLink {
  href: string
  label: string
  description?: string
  external?: boolean
}

export interface ProductLine {
  id: 'fivem' | 'discord' | 'tools'
  href: string
  label: string
  links: NavLink[]
  /** Internal paths below which this line is the active one. */
  matches: string[]
}

export const TOOL_URLS = {
  forms:     'https://forms.msk-scripts.de/',
  paste:     'https://paste.msk-scripts.de/',
  shortener: 'https://s.msk-scripts.de/',
} as const

/**
 * Pages the navigation already links to but that only arrive in Phase 5 of
 * the redesign. They are not prefetched, because a prefetch of a missing page
 * is a 404 in the console on every page view. Remove an entry when its page
 * lands.
 */
const PENDING_PAGES = new Set(['/discord', '/tools', '/about', '/fivem/free', '/fivem/all-access'])

/** `prefetch` for a `LocaleLink` to `href`: off for pages that do not exist yet. */
export function prefetchFor(href: string): false | undefined {
  return PENDING_PAGES.has(href) ? false : undefined
}

export function productLines(lang: Lang): ProductLine[] {
  const t = layoutTranslations[lang]
  return [
    {
      id: 'fivem',
      href: '/fivem',
      label: t.nav_fivem,
      matches: ['/fivem', '/stats'],
      links: [
        { href: '/fivem',            label: t.nav_fivem_paid,      description: t.nav_fivem_paid_desc },
        { href: '/fivem/free',       label: t.nav_fivem_free,      description: t.nav_fivem_free_desc },
        { href: '/fivem/all-access', label: t.nav_fivem_allaccess, description: t.nav_fivem_allaccess_desc },
        { href: '/stats',            label: t.nav_fivem_stats,     description: t.nav_fivem_stats_desc },
      ],
    },
    {
      id: 'discord',
      href: '/discord',
      label: t.nav_discord,
      matches: ['/discord', '/dashboard'],
      // Product names stay as they are in both languages.
      links: [
        { href: '/discord/ticket-bot',   label: 'Ticket Bot',   description: t.nav_ticket_desc },
        { href: '/discord/giveaway-bot', label: 'Giveaway Bot', description: t.nav_giveaway_desc },
      ],
    },
    {
      id: 'tools',
      href: '/tools',
      label: t.nav_tools,
      matches: ['/tools'],
      links: [
        { href: '/tools/images',      label: t.nav_images,     description: t.nav_images_desc },
        { href: TOOL_URLS.forms,      label: 'MSK Forms',      description: t.nav_forms_desc,     external: true },
        { href: TOOL_URLS.paste,      label: 'MSK Paste',      description: t.nav_paste_desc,     external: true },
        { href: TOOL_URLS.shortener,  label: 'MSK Shortener',  description: t.nav_shortener_desc, external: true },
      ],
    },
  ]
}

export function aboutLink(lang: Lang): NavLink {
  return { href: '/about', label: layoutTranslations[lang].nav_about }
}

/** True if the internal path `path` lies at or below one of `matches`. */
export function isWithin(path: string, matches: string[]): boolean {
  return matches.some(m => path === m || path.startsWith(`${m}/`))
}
