/**
 * Giveaway managers, for the giveaway dashboard.
 *
 * The bot gates its commands on `isManager` = ManageGuild OR the configured
 * `managerRole` (see `src/utils/permissions.js` in discord_giveaway). The
 * dashboard only ever knew the first half, so somebody who could run every
 * `/g*` command by role could not open the dashboard that configures them.
 * The open question from the 2026-09-03 session; decided on 2026-09-12: the
 * manager belongs in the dashboard.
 *
 * Why this needs its own module and a Discord round trip: `managerRole` is a
 * ROLE id, and a user's roles are not in the OAuth `guilds` payload. The
 * `guilds.members.read` scope plus `GET /users/@me/guilds/{id}/member` is the
 * only way to learn them without a bot token - and we hold no bot token for
 * customer guilds, only the customers themselves do.
 *
 * The Tebex section of the dashboard is unaffected. It hangs off the `owner`
 * flag, a manager never gets it, and the bot re-checks against `guild.ownerId`
 * anyway.
 */

import { giveawayQuery }         from '@/lib/giveawayDb';
import { fetchGuildMemberRoles } from '@/lib/discordGuilds';

const GUILD_ID_RE = /^\d{17,20}$/;

/**
 * Ceiling on member lookups per login. Realistically the candidate set is one
 * or two guilds - it is only the guilds where the user is NOT an admin, the
 * giveaway bot IS present and a manager role IS configured. The cap is there
 * so a user in a hundred such servers cannot turn one login into a hundred
 * Discord requests.
 */
const MAX_MEMBER_LOOKUPS = 25;

/** How many member lookups run at once. Small on purpose, to stay clear of
 *  Discord's rate limits for a request count nobody is waiting on. */
const BATCH_SIZE = 5;

interface SettingsRow {
  guildId:     string;
  managerRole: string | null;
}

/**
 * Of `candidateGuildIds`, which ones does this user manage by manager role?
 *
 * Pass only guilds that FAILED `canManageGuild` - an admin needs no role
 * lookup, and skipping them keeps the Discord traffic at zero for the normal
 * case.
 *
 * Fails closed throughout: a guild is returned only when Discord positively
 * confirmed the role. A failed lookup, a missing scope, an unreachable
 * database - each means "cannot say", and cannot say is not a yes. Same stance
 * as the unreadable-bitfield branch in `canManageGuild`.
 */
export async function resolveManagerGuilds(
  accessToken: string,
  candidateGuildIds: string[],
): Promise<string[]> {
  const candidates = [...new Set(candidateGuildIds.filter(id => GUILD_ID_RE.test(id)))];
  if (candidates.length === 0 || !accessToken) return [];

  // One query, not one per guild: ask which of these the bot is even in and
  // has a manager role configured for. Everything else needs no role lookup.
  let rows: SettingsRow[];
  try {
    const holes = candidates.map(() => '?').join(', ');
    rows = await giveawayQuery<SettingsRow>(
      `SELECT guildId, managerRole FROM \`GuildSettings\`
        WHERE managerRole IS NOT NULL AND guildId IN (${holes})`,
      candidates,
    );
  } catch (err) {
    // The giveaway database is a separate, read-only pool and may be down
    // independently of ours. Losing the manager path is a degraded login, not
    // a broken one: admins still get in the usual way.
    console.error('[giveawayManager] GuildSettings lookup failed:', err);
    return [];
  }

  const wanted = rows
    .filter(r => r.managerRole && GUILD_ID_RE.test(String(r.guildId)))
    .slice(0, MAX_MEMBER_LOOKUPS);

  const allowed: string[] = [];

  for (let i = 0; i < wanted.length; i += BATCH_SIZE) {
    const batch = wanted.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (row) => {
        const roles = await fetchGuildMemberRoles(accessToken, String(row.guildId));
        // null = could not ask. Not the same as "has no roles", and treated as
        // a no either way, but keeping them distinct here stops a later reader
        // from turning the null branch into a default-allow.
        if (roles === null) return null;
        return roles.includes(String(row.managerRole)) ? String(row.guildId) : null;
      }),
    );
    for (const id of results) if (id) allowed.push(id);
  }

  return allowed;
}
