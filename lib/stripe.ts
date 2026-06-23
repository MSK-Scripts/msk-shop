import Stripe from 'stripe';
import type { Tier } from '@/lib/tiers';

// ── Stripe client ────────────────────────────────────────────────────────────
//
// Lazily instantiated so a build without STRIPE_SECRET_KEY still compiles; only
// runtime use requires the env var. The API version is intentionally left at the
// SDK default (pinned by the installed `stripe` package) so upgrades stay in one
// place.

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// ── Trial ────────────────────────────────────────────────────────────────────

/** Free trial length in days, granted once per customer (new customers only). */
export const TRIAL_DAYS = 14;

// ── Tier ⇄ Price mapping ─────────────────────────────────────────────────────
//
// Only the two paid tiers map to a Stripe price. `basic` is the free default and
// never has a subscription.

/** Stripe price id configured for a paid tier, or null for `basic`. */
export function priceIdForTier(tier: Tier): string | null {
  switch (tier) {
    case 'premium':      return process.env.STRIPE_PRICE_PREMIUM      ?? null;
    case 'premium_plus': return process.env.STRIPE_PRICE_PREMIUM_PLUS ?? null;
    default:             return null;
  }
}

/**
 * Reverse mapping: resolve the internal tier from a Stripe price id. Returns
 * `basic` for any unknown/unconfigured price so a stray subscription can never
 * silently grant a paid tier.
 */
export function resolveTierFromPrice(priceId: string | null | undefined): Tier {
  if (!priceId) return 'basic';
  if (priceId === process.env.STRIPE_PRICE_PREMIUM)      return 'premium';
  if (priceId === process.env.STRIPE_PRICE_PREMIUM_PLUS) return 'premium_plus';
  return 'basic';
}

// ── Subscription helpers ─────────────────────────────────────────────────────

/** Subscription statuses that should grant the paid tier (incl. the free trial). */
export function isActiveSubStatus(status: Stripe.Subscription.Status): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Pull the (first) price id off a subscription object. Subscriptions in this shop
 * always carry exactly one line item (one tier per guild).
 */
export function priceIdFromSubscription(sub: Stripe.Subscription): string | null {
  return sub.items.data[0]?.price?.id ?? null;
}

/**
 * The unix timestamp (seconds) the current paid/trial period ends at, taken from
 * the subscription's first item. Returns null if absent.
 */
export function periodEndFromSubscription(sub: Stripe.Subscription): number | null {
  return sub.items.data[0]?.current_period_end ?? null;
}
