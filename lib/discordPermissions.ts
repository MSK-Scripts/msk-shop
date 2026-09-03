/**
 * Who is allowed to manage a Discord guild from our dashboards?
 *
 * The answer deliberately lives in exactly one place. Ticketbot verify and
 * giveaway verify each carried an identical copy of this function until
 * 2026-09-03, and both checked ADMINISTRATOR only, while the bots gate their
 * own slash commands on MANAGE_GUILD. A customer with "Manage Server" could
 * therefore configure a guild by command but never saw it in the dashboard,
 * and nothing in the UI hinted at why.
 */

// Discord guild permission bits, see the Discord developer documentation.
export const ADMINISTRATOR = BigInt(0x8);
export const MANAGE_GUILD  = BigInt(0x20);

/**
 * `permissions` is the string from `GET /users/@me/guilds` (a decimal
 * bitfield), `owner` is the flag from the same response. An unparsable
 * bitfield counts as "not allowed": a Discord response we cannot read is no
 * reason to grant access.
 */
export function canManageGuild(permissions: string, owner: boolean): boolean {
  if (owner) return true;
  try {
    return (BigInt(permissions) & (ADMINISTRATOR | MANAGE_GUILD)) !== BigInt(0);
  } catch {
    return false;
  }
}
