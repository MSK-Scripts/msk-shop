/**
 * The three constants the silent dashboard re-check is built on.
 *
 * They live in their own module because the pieces that need them sit on
 * opposite sides of the request: the dashboard server component READS the
 * cookie, the OAuth start route WRITES it, and the callback reads the state
 * prefix. Importing any of those three from another would drag a route handler
 * into a page or vice versa.
 */

/**
 * Marks the OAuth `state` as belonging to a dashboard re-check rather than the
 * verify wizard. A prefix on state instead of an extra cookie: state is
 * already compared for equality in the callback, so the marker inherits that
 * CSRF binding for free and there is no second value that can go out of sync.
 */
export const RECHECK_STATE_PREFIX = 'rc.';

/**
 * Set by the OAuth start route before it redirects, read by the dashboard.
 * While it exists the dashboard will not start another re-check, which is what
 * stops a redirect loop when Discord refuses `prompt=none` (revoked app) or
 * never answers at all.
 */
export const RECHECK_COOKIE = 'msk_access_recheck';

/**
 * One hour. Long enough that a failing re-check cannot turn into a redirect
 * storm, short enough that a customer who genuinely lost access sees it the
 * same day. The authoritative freshness window is ACCESS_STALE_HOURS in
 * lib/guildAccess.ts; this is only the retry damper underneath it.
 */
export const RECHECK_COOKIE_TTL_S = 3600;

/** True when `state` came from a dashboard re-check. */
export function isRecheckState(state: string | null | undefined): boolean {
  return typeof state === 'string' && state.startsWith(RECHECK_STATE_PREFIX);
}
