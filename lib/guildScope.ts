/**
 * A guild id whose origin has been verified.
 *
 * The problem this type solves: `query()` in `lib/db.ts` is deliberately
 * unscoped, tenant isolation sits one level above it. Until now that was
 * pure convention: `authorizeGuild()` returned a `string`, and
 * `body.guildId` is a `string` too. A new call that skipped the check
 * compiled without errors.
 *
 * `ScopedGuildId` is a branded type: at runtime still a string, but for the
 * compiler reachable only through two paths.
 *
 *   1. `authorizeGuild()` in `lib/dashboardAuth.ts`: session plus
 *      `WHERE guild_id = ? AND discord_user_id = ?`.
 *   2. `trustedGuildId(id, reason)` here: for contexts without a user session
 *      in which the id comes from another verified source.
 *
 * A function that requires `ScopedGuildId` can therefore no longer be fed a
 * value from the request body by accident.
 *
 * To be honest about its reach: the brand proves the **origin** of the id, not
 * that the SQL actually uses it. `teardownCustomDomain(scope)` could internally
 * still touch the wrong row. It closes exactly the gap that
 * `tests/routeGuards.test.ts` can only probe from the outside, and no other.
 */

declare const GUILD_SCOPE: unique symbol

export type ScopedGuildId = string & { readonly [GUILD_SCOPE]: true }

/** Discord snowflake. Same check as in `authorizeGuild()`. */
const GUILD_ID_RE = /^\d{17,20}$/

/**
 * Contexts in which there is no user session and the id is still verified.
 * The list is intentionally a closed union instead of a free-form string: a
 * new bypass reason has to be added here, and that makes it visible in
 * review instead of disappearing into a comment.
 */
export type TrustedGuildSource =
  /**
   * `authorizeGuild()` itself. The id comes from a row that was already
   * restricted to the session's `discord_user_id`. This is the main path, not
   * a bypass reason. It is listed here because `authorizeGuild()` uses the same
   * constructor instead of writing its own `as ScopedGuildId`.
   */
  | 'dashboard-session'
  /** Stripe webhook, signature verified against STRIPE_WEBHOOK_SECRET, id from `metadata.guild_id`. */
  | 'stripe-webhook'
  /** The bot's API key: the guild is derived from the key, never from the body. */
  | 'api-key'
  /** Admin dashboard, `adminRoute()` has already checked session, permission and origin. */
  | 'admin-route'
  /** Maintenance cron without a request context (cleanup.js, stripe-reconcile.js). */
  | 'maintenance-cron'

/**
 * Marks a guild id as verified, without a dashboard session.
 *
 * The format is validated at runtime and throws on failure: the brand is
 * compile-time only, an `as ScopedGuildId` at this point would be a claim
 * without backing. The throw is intended: at none of the calling sites is an
 * unusable guild id an expected state, and a silent `null` return value would
 * only lead to an update without a `WHERE` match one level later.
 */
export function trustedGuildId(guildId: string, source: TrustedGuildSource): ScopedGuildId {
  const id = String(guildId ?? '').trim()
  if (!GUILD_ID_RE.test(id)) {
    throw new Error(`[guildScope] invalid guild id from ${source}: ${JSON.stringify(guildId)}`)
  }
  return id as ScopedGuildId
}
