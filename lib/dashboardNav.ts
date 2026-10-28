import { TIER_CONFIG, type Tier } from '@/lib/tiers'

/**
 * Which areas the two bot dashboards offer, and to whom (plan 6.3 to 6.5).
 * The admin has its own in `lib/adminTabs.ts`.
 *
 * Kept apart from the shells for the same reason as `lib/adminTabs.ts`:
 * "who gets which entry" is a permission question, the shell only draws the
 * answer. Every rule here mirrors one the dashboards already had as tabs; the
 * routes and pages behind each entry check on their own again.
 */

// ─── Ticket bot ──────────────────────────────────────────────────────────────

export const TICKET_BOT_SECTIONS = ['overview', 'domains', 'transcripts', 'hosting'] as const
export type TicketBotSection = typeof TICKET_BOT_SECTIONS[number]

/**
 * The areas of one server. Hosting only where the plan includes it, for an
 * already hosted server as much as for one that is not hosted yet: the
 * hosting page is where it gets switched on.
 */
export function ticketBotSections(tier: Tier): TicketBotSection[] {
  return TICKET_BOT_SECTIONS.filter(s => s !== 'hosting' || TIER_CONFIG[tier].botHosting)
}

/** Internal path of an area of a server. The id is a path segment of its own. */
export function ticketBotHref(guildId: string, section: TicketBotSection): string {
  const base = `/dashboard/ticket-bot/${encodeURIComponent(guildId)}`
  return section === 'overview' ? base : `${base}/${section}`
}

/** The area an internal path points at, or null outside a server's pages. */
export function ticketBotSectionOf(path: string): TicketBotSection | null {
  const match = /^\/dashboard\/ticket-bot\/([^/]+)(?:\/([^/]+))?$/.exec(path)
  if (!match || match[1] === 'verify') return null
  const section = match[2] ?? 'overview'
  return (TICKET_BOT_SECTIONS as readonly string[]).includes(section) ? section as TicketBotSection : null
}

// ─── Giveaway bot ────────────────────────────────────────────────────────────

export const GIVEAWAY_SECTIONS = ['overview', 'giveaways', 'templates', 'settings', 'store'] as const
export type GiveawaySection = typeof GIVEAWAY_SECTIONS[number]

/**
 * The Tebex store only for the owner of the server, as the tab before. The
 * bot checks the owner itself on every Tebex call, so this decides what is
 * offered, not what is allowed.
 */
export function giveawaySections(owner: boolean): GiveawaySection[] {
  return GIVEAWAY_SECTIONS.filter(s => s !== 'store' || owner)
}

export function giveawayHref(section: GiveawaySection): string {
  return section === 'overview' ? '/dashboard/giveaway-bot' : `/dashboard/giveaway-bot/${section}`
}

/**
 * The pages below an area (Phase 9): a new giveaway, one giveaway, a new or
 * an existing template. The id only selects among what the session's server
 * returned; every request behind these pages takes the guild from the
 * signed session.
 */
export const GIVEAWAY_NEW_HREF = '/dashboard/giveaway-bot/giveaways/new'
export const TEMPLATE_NEW_HREF = '/dashboard/giveaway-bot/templates/new'

export function giveawayDetailHref(id: string): string {
  return `/dashboard/giveaway-bot/giveaways/${encodeURIComponent(id)}`
}

export function templateHref(id: number | string): string {
  return `/dashboard/giveaway-bot/templates/${encodeURIComponent(String(id))}`
}

/** The area a giveaway dashboard path belongs to, its sub-pages included. */
export function giveawaySectionOf(path: string): GiveawaySection | null {
  if (path === giveawayHref('overview')) return 'overview'
  return GIVEAWAY_SECTIONS.find(s => s !== 'overview' && (path === giveawayHref(s) || path.startsWith(`${giveawayHref(s)}/`))) ?? null
}
