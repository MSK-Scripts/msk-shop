/**
 * Does the owner of a guild row still administer that guild on Discord?
 *
 * Until 2026-09-12 nothing ever asked again. `ticketbot_guilds.discord_user_id`
 * is written once by the verify flow, and the dashboard listed guilds with a
 * plain `WHERE discord_user_id = ?`. The Discord permission check
 * (`canManageGuild`) only ever ran inside the OAuth callback, so it decided
 * which guilds a person could REGISTER and never which guilds they kept. An
 * admin removed from a Discord server therefore kept the API key, the
 * transcripts, the custom domain and the bot controls of a server they no
 * longer had anything to do with.
 *
 * Two columns carry the answer:
 *
 *   access_checked_at - when we last had a trustworthy answer from Discord
 *   access_lost_at    - when we FIRST saw the rights gone (NULL = all fine)
 *
 * `access_lost_at` is a timestamp rather than a flag because losing access
 * starts a grace period instead of cutting immediately. A role removed by
 * accident, a Discord outage, an admin reshuffle: none of those should cost a
 * paying customer their dashboard the same minute. The same reasoning shaped
 * the 30-day transcript clamp on downgrade and the 14-day archive purge.
 */

import { query } from '@/lib/db';

/**
 * How long a guild stays reachable after we first saw the rights gone.
 * Matches the 14 days that `cleanup.js` keeps an archived bot directory, so a
 * customer has one window to remember rather than two.
 */
export const ACCESS_GRACE_DAYS = 14;

/** How old a check may get before the dashboard asks Discord again. */
export const ACCESS_STALE_HOURS = 24;

const DAY_MS  = 86_400_000;
const HOUR_MS = 3_600_000;

export type AccessState =
  /** Rights confirmed (or never seen missing). Full access. */
  | 'ok'
  /** Rights gone, still inside the grace period. Access plus a warning. */
  | 'grace'
  /** Rights gone for longer than the grace period. No access. */
  | 'revoked';

export interface AccessRow {
  access_checked_at: unknown;
  access_lost_at:    unknown;
}

/**
 * Milliseconds for a DATETIME coming out of mysql2.
 *
 * The driver hands back `Date` objects; the string branch is for values that
 * went through JSON on the way here (server component to client props). A
 * non-ISO string is parsed as local time while the column holds UTC, which is
 * off by the host offset - irrelevant against a 24-hour and a 14-day
 * threshold, and called out here so nobody reads exactness into it.
 */
function toMillis(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }
  const t = Date.parse(String(value));
  return Number.isNaN(t) ? null : t;
}

/** Where a guild row stands right now. */
export function accessState(row: AccessRow, now: number = Date.now()): AccessState {
  const lost = toMillis(row.access_lost_at);
  if (lost === null) return 'ok';
  return now - lost < ACCESS_GRACE_DAYS * DAY_MS ? 'grace' : 'revoked';
}

/** End of the grace period as ms epoch, or null while access is fine. */
export function accessGraceEndsAt(row: AccessRow): number | null {
  const lost = toMillis(row.access_lost_at);
  return lost === null ? null : lost + ACCESS_GRACE_DAYS * DAY_MS;
}

/**
 * Should the dashboard ask Discord again?
 *
 * A row that was never checked counts as stale: every guild registered before
 * these columns existed has `access_checked_at = NULL`, and those are exactly
 * the ones nobody has ever verified. They must not be silently treated as
 * confirmed.
 */
export function isAccessStale(row: AccessRow, now: number = Date.now()): boolean {
  const checked = toMillis(row.access_checked_at);
  if (checked === null) return true;
  return now - checked > ACCESS_STALE_HOURS * HOUR_MS;
}

export interface ReconcileResult {
  /** True when Discord's answer was not trustworthy and we wrote nothing. */
  skipped:  boolean;
  /** Rows confirmed (or un-marked after the rights came back). */
  restored: number;
  /** Rows newly or still marked as lost. */
  lost:     number;
}

/**
 * Write down what Discord just told us about one person's guilds.
 *
 * Called from the OAuth callback, which is the one moment we hold a fresh,
 * authoritative list for free.
 *
 * `complete` is a hard gate: a partial list makes absent guilds look
 * unmanaged, and absence is what marks a row as lost. Acting on a truncated
 * or failed fetch would strip a customer over a Discord hiccup, so an
 * untrustworthy answer writes nothing at all - not even `access_checked_at`,
 * because that would refresh the staleness clock on the strength of an answer
 * we just rejected.
 *
 * Deliberately two independent statements and no transaction. This is not a
 * two-part invariant: each UPDATE stands on its own, both are idempotent, and
 * the next login recomputes everything from scratch. A partial run repairs
 * itself; a transaction would only buy consistency between two writes that do
 * not depend on each other.
 */
export async function reconcileGuildAccess(
  discordUserId: string,
  manageableGuildIds: string[],
  complete: boolean,
): Promise<ReconcileResult> {
  if (!complete || !discordUserId) {
    return { skipped: true, restored: 0, lost: 0 };
  }

  // Dedupe and drop anything that is not a snowflake before it reaches SQL.
  const ids = [...new Set(manageableGuildIds.filter(id => /^\d{17,20}$/.test(id)))];

  let restored = 0;
  let lost     = 0;

  if (ids.length > 0) {
    const holes = ids.map(() => '?').join(', ');

    // Rights confirmed. Clearing access_lost_at is what makes a re-added admin
    // whole again without anyone touching the database by hand.
    const back = await query(
      `UPDATE ticketbot_guilds
          SET access_checked_at = NOW(), access_lost_at = NULL
        WHERE discord_user_id = ? AND guild_id IN (${holes})`,
      [discordUserId, ...ids],
    );
    restored = affected(back);

    // Everything this person owns that Discord did not list.
    // COALESCE keeps the FIRST sighting, so the grace period runs from when
    // the rights actually went missing and not from the latest login.
    const gone = await query(
      `UPDATE ticketbot_guilds
          SET access_checked_at = NOW(),
              access_lost_at    = COALESCE(access_lost_at, NOW())
        WHERE discord_user_id = ? AND guild_id NOT IN (${holes})`,
      [discordUserId, ...ids],
    );
    lost = affected(gone);
  } else {
    // `IN ()` is a syntax error in MySQL, so the empty case is its own
    // statement. It is reachable and legitimate: someone who no longer manages
    // anything on Discord but still owns rows here.
    const gone = await query(
      `UPDATE ticketbot_guilds
          SET access_checked_at = NOW(),
              access_lost_at    = COALESCE(access_lost_at, NOW())
        WHERE discord_user_id = ?`,
      [discordUserId],
    );
    lost = affected(gone);
  }

  return { skipped: false, restored, lost };
}

/**
 * mysql2 returns an OkPacket for UPDATE, not an array of rows, while our
 * `query()` wrapper types everything as `T[]`. Read the count defensively so a
 * mocked or unexpected shape reports 0 instead of throwing - the counts are
 * for logging, nothing branches on them.
 */
function affected(res: unknown): number {
  if (res && typeof res === 'object' && 'affectedRows' in res) {
    const n = Number((res as { affectedRows: unknown }).affectedRows);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
