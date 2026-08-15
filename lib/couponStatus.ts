/**
 * Decides whether a Tebex coupon is still usable.
 *
 * The Plugin API returns every coupon the store has ever had — 860 of them at
 * the time of writing, of which 4 are live. The Tebex creator panel only lists
 * the usable ones, so the admin dashboard has to reproduce that filter itself.
 *
 * Three things make a coupon unusable, and the API exposes all three:
 *
 *   - it has not started yet   (`start_date` in the future)
 *   - it has expired           (`expire.expire_never` false and `expire.date` past)
 *   - it has no redemptions left (`expire.redeem_unlimited` false and `expire.limit` 0)
 *
 * Two traps in the payload, both confirmed against the live store:
 *
 *   - `expire_never` and `redeem_unlimited` are the STRINGS "true"/"false", not
 *     booleans, so a plain truthiness check marks every coupon as unexpiring.
 *   - an unexpiring coupon carries `expire.date = 1970-01-01`, so the date has
 *     to be read only after `expire_never` says it means anything.
 *
 * What the API does NOT expose is how often a coupon has already been redeemed
 * as a separate figure: `expire.limit` is the REMAINING count and hits 0 when
 * the coupon is used up. That is enough for this filter but means "used up" and
 * "created with a limit of 0" are indistinguishable from the outside.
 */

export interface CouponExpiry {
  redeem_unlimited?: boolean | string;
  expire_never?:     boolean | string;
  limit?:            number | string;
  date?:             string | null;
}

export interface CouponLike {
  expire?:     CouponExpiry;
  start_date?: string | null;
}

export type CouponState = 'active' | 'scheduled' | 'expired' | 'used_up';

/** Tebex sends "true"/"false" as strings on the coupon endpoints. */
export function isTrue(value: boolean | string | undefined): boolean {
  return value === true || value === 'true';
}

/** Parses a Tebex timestamp, returning null for missing or unparseable values. */
function timestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Classifies a coupon at the given moment. `now` is injectable so the tests do
 * not depend on the wall clock.
 */
export function couponState(coupon: CouponLike, now: number = Date.now()): CouponState {
  const start = timestamp(coupon.start_date);
  if (start !== null && start > now) return 'scheduled';

  if (!isTrue(coupon.expire?.expire_never)) {
    const end = timestamp(coupon.expire?.date);
    // A coupon that neither never-expires nor carries a usable date is treated
    // as live: guessing "expired" would hide a coupon that still works.
    if (end !== null && end <= now) return 'expired';
  }

  // Only call a coupon spent when the payload actually says so. A missing
  // `limit` is unknown, not zero — defaulting it would hide a working coupon.
  const limit = Number(coupon.expire?.limit);
  if (!isTrue(coupon.expire?.redeem_unlimited) && Number.isFinite(limit) && limit <= 0) {
    return 'used_up';
  }

  return 'active';
}

export function isCouponActive(coupon: CouponLike, now: number = Date.now()): boolean {
  return couponState(coupon, now) === 'active';
}

/** Counts per state, for the "showing x of y" line in the admin dashboard. */
export function countCouponStates<T extends CouponLike>(
  coupons: T[],
  now: number = Date.now(),
): Record<CouponState, number> & { total: number } {
  const counts = { active: 0, scheduled: 0, expired: 0, used_up: 0, total: coupons.length };
  for (const coupon of coupons) counts[couponState(coupon, now)]++;
  return counts;
}
