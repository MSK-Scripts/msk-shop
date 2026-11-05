// NOTE: server module. No secret behind it: Discord answers an invite lookup
// without a token. Fetching it server-side happens once per hour instead of
// once per page view, and the figure is already in the delivered markup.

import { SITE_CONFIG } from '@/lib/config'

/**
 * How many members the MSK Scripts Discord has.
 *
 * Replaces "unique buyers" under the hero and on the about page since
 * 05.11.2026, when the paid FiveM scripts went free and the shop stopped
 * selling them. Support now runs through that Discord (public channel, tickets
 * for GitHub sponsors), so its size is the figure that fits.
 *
 * The source is Discord's public invite endpoint with `with_counts=true`. Its
 * `approximate_member_count` is what Discord itself shows on the invite card,
 * so a reader can check it by opening the invite.
 */

const INVITE_API = 'https://discord.com/api/v10/invites/{code}?with_counts=true'

/** One hour. The count moves slowly and Discord rate-limits this endpoint. */
const REVALIDATE_SECONDS = 3600

/** `https://discord.gg/abc123` -> `abc123`. `null` for anything else. */
export function inviteCode(url: string): string | null {
  const match = /^https:\/\/(?:www\.)?discord(?:\.gg|(?:app)?\.com\/invite)\/([A-Za-z0-9-]+)\/?$/.exec(url)
  return match ? match[1] : null
}

/**
 * The member count from an invite response, or `null` when it is missing or
 * not a positive whole number. A zero would be a broken answer, not an empty
 * server: the invite belongs to a server with members.
 */
export function memberCountFrom(body: unknown): number | null {
  if (typeof body !== 'object' || body === null) return null
  const count = (body as { approximate_member_count?: unknown }).approximate_member_count
  return typeof count === 'number' && Number.isInteger(count) && count > 0 ? count : null
}

/**
 * Returns the count, or `null` when it cannot be determined. Same rule as the
 * other measured figures: a source that fails drops its entry, nothing is
 * estimated or frozen.
 */
export async function loadDiscordMemberCount(): Promise<number | null> {
  const code = inviteCode(SITE_CONFIG.discord)
  if (!code) {
    console.error('[discordMembers] SITE_CONFIG.discord is not an invite link')
    return null
  }
  try {
    const res = await fetch(INVITE_API.replace('{code}', code), {
      headers: { accept: 'application/json' },
      next:    { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) {
      console.error(`[discordMembers] invite lookup responded ${res.status}`)
      return null
    }
    return memberCountFrom(await res.json())
  } catch (e) {
    console.error('[discordMembers] could not read the invite:', e)
    return null
  }
}
