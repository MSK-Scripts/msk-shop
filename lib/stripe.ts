import Stripe from 'stripe';
import type { BillingInterval, Tier } from '@/lib/tiers';

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

/**
 * Stripe price id configured for a paid tier and interval, or null for `basic`
 * and for an interval that has no price configured yet.
 *
 * Returning null rather than falling back to the monthly price is deliberate:
 * a missing yearly price must surface as "billing is not configured", never as
 * a customer who clicked "yearly" and gets charged monthly.
 */
export function priceIdForTier(
  tier: Tier,
  interval: BillingInterval = 'monthly',
): string | null {
  if (interval === 'yearly') {
    switch (tier) {
      case 'premium':      return process.env.STRIPE_PRICE_PREMIUM_YEARLY      ?? null;
      case 'premium_plus': return process.env.STRIPE_PRICE_PREMIUM_PLUS_YEARLY ?? null;
      case 'business':     return process.env.STRIPE_PRICE_BUSINESS_YEARLY     ?? null;
      default:             return null;
    }
  }
  switch (tier) {
    case 'premium':      return process.env.STRIPE_PRICE_PREMIUM      ?? null;
    case 'premium_plus': return process.env.STRIPE_PRICE_PREMIUM_PLUS ?? null;
    case 'business':     return process.env.STRIPE_PRICE_BUSINESS     ?? null;
    default:             return null;
  }
}

/**
 * Reverse mapping: resolve the internal tier from a Stripe price id. Returns
 * `basic` for any unknown/unconfigured price so a stray subscription can never
 * silently grant a paid tier.
 *
 * Both intervals of a tier map to the same tier. That is the whole point of
 * keeping this function the only reader of the env vars: the webhook and the
 * reconcile cron decide access from it, and neither of them cares how often
 * someone pays.
 *
 * Every comparison guards against an unset env var. Without that, an
 * unconfigured `STRIPE_PRICE_BUSINESS_YEARLY` is `undefined`, and a price id
 * that is also absent would compare equal and grant Business.
 */
export function resolveTierFromPrice(priceId: string | null | undefined): Tier {
  if (!priceId) return 'basic';
  const match = (envValue: string | undefined) => Boolean(envValue) && envValue === priceId;

  if (match(process.env.STRIPE_PRICE_PREMIUM)
   || match(process.env.STRIPE_PRICE_PREMIUM_YEARLY))      return 'premium';
  if (match(process.env.STRIPE_PRICE_PREMIUM_PLUS)
   || match(process.env.STRIPE_PRICE_PREMIUM_PLUS_YEARLY)) return 'premium_plus';
  if (match(process.env.STRIPE_PRICE_BUSINESS)
   || match(process.env.STRIPE_PRICE_BUSINESS_YEARLY))     return 'business';
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

/**
 * Whether this subscription can charge anyone when the trial ends. Checks the
 * subscription's own default first, then the customer's default (the billing
 * portal writes the card there, not onto the subscription).
 *
 * The customer must be passed expanded; a bare id says nothing about payment
 * methods and is treated as "no method known", which only ever leads to one
 * extra reminder mail, never to a missed charge.
 */
export function hasPaymentMethod(
  sub:      Stripe.Subscription,
  customer: Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): boolean {
  if (sub.default_payment_method) return true;
  if (sub.default_source) return true;
  if (!customer || customer.deleted) return false;
  const settings = customer.invoice_settings;
  return Boolean(settings?.default_payment_method ?? customer.default_source);
}

/**
 * The recurring price of a subscription, formatted for a human ("3,99 €" in
 * German, "€3.99" in English). Read off the subscription rather than from a
 * constant so the mail can never quote a price the customer is not on.
 */
export function formatSubscriptionPrice(sub: Stripe.Subscription, lang: 'en' | 'de'): string {
  const price  = sub.items.data[0]?.price;
  const amount = price?.unit_amount;
  if (amount == null) return '';
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    style:    'currency',
    currency: (price?.currency ?? 'eur').toUpperCase(),
  }).format(amount / 100);
}
