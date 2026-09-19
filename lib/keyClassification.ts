/**
 * How a ticket bot API key came about, and whether it counts towards the
 * public figures on /ticketbot/stats.
 *
 * Pure types and logic, no database access, so the admin UI can import it for
 * labels and the API routes for validation.
 *
 * ## Why two separate things
 *
 * Until 19.09.2026 there was one mechanism, the env variable
 * `STATS_IGNORED_API_KEYS`, and it could only do one thing: remove a key from
 * the statistics entirely. That produced two problems at once.
 *
 * The public page derived its "giveaway keys" figure by subtraction: every
 * paid tier without a live Stripe subscription was counted as a giveaway. A
 * key granted as sponsoring, and the internal test server while it still had a
 * paid tier, were both counted as giveaways because nothing could say
 * otherwise.
 *
 * And the two questions turned out to be independent:
 *
 *   `statsExcluded`  does this key count towards the public figures?
 *   `origin`         how did this key come about?
 *
 * The internal test server is excluded and regular. A giveaway key is visible
 * and a giveaway. A single four-state field would lose the second fact the
 * moment the first is set, and would make "sponsored but not counted"
 * impossible to express.
 */

/** Cheapest to most notable; the order the admin dropdown renders in. */
export const KEY_ORIGINS = ['normal', 'giveaway', 'sponsored'] as const;

export type KeyOrigin = (typeof KEY_ORIGINS)[number];

/** Narrow an arbitrary value to a known origin. */
export function isKeyOrigin(value: unknown): value is KeyOrigin {
  return typeof value === 'string' && (KEY_ORIGINS as readonly string[]).includes(value);
}

/**
 * Labels for the admin dashboard, which is English-only (internal tool, same
 * rule as the rest of `app/admin`).
 */
export const KEY_ORIGIN_LABELS: Record<KeyOrigin, { label: string; description: string }> = {
  normal:    { label: 'Regular',   description: 'Verified through the normal flow, or paid for' },
  giveaway:  { label: 'Giveaway',  description: 'Handed out as a giveaway prize' },
  sponsored: { label: 'Sponsored', description: 'Granted by MSK Scripts free of charge' },
};
