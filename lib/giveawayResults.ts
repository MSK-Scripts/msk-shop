import { query } from '@/lib/db';

/**
 * The public result pages of the giveaway bot (`giveaway_results` in the shop
 * database, published by the bot through /api/giveaway-result/publish).
 *
 * Two ways a page goes: the bot leaves a server and every page of that server
 * is removed (/api/giveaway-result/delete, bot-authenticated), or a manager
 * deletes one giveaway in the dashboard and its page goes with it
 * (/api/giveaway/action, guild from the signed session). Both take the guild
 * first, so no call can reach a page of another server.
 */

/** A giveaway id as the bot issues it (its ID_RE), after upper-casing. */
export const GIVEAWAY_ID = /^[A-Z0-9]{4,12}$/;

/** A Discord snowflake. */
export const GUILD_ID = /^\d{17,20}$/;

/**
 * Deletes the result pages of a guild, or of one giveaway of that guild.
 * Throws on an id that does not look like one instead of running a query
 * that could match more than meant.
 */
export async function deleteResultPages(guildId: string, giveawayId?: string): Promise<void> {
  if (!GUILD_ID.test(guildId)) throw new Error('deleteResultPages: invalid guild id');
  if (giveawayId === undefined) {
    await query('DELETE FROM giveaway_results WHERE guild_id = ?', [guildId]);
    return;
  }
  if (!GIVEAWAY_ID.test(giveawayId)) throw new Error('deleteResultPages: invalid giveaway id');
  await query('DELETE FROM giveaway_results WHERE guild_id = ? AND giveaway_id = ?', [guildId, giveawayId]);
}
