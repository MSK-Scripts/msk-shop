// ============================================================
// Tier configuration – single source of truth for limits.
// ============================================================

export type Tier = "basic" | "premium" | "premium_plus" | "business";

export interface TierConfig {
  /** Maximum allowed size of the transcript HTML in bytes. */
  transcriptMaxBytes: number;
  /** Maximum total size of all attachments per ticket in bytes. 0 = not allowed. */
  attachmentMaxBytes: number;
  /** How many days files are kept before being deleted. */
  storageDays: number;
  /** Whether custom domains are allowed. */
  customDomain: boolean;
  /**
   * Whether the guild may have its bot hosted and managed by us: an own
   * directory under BOT_CONFIG_BASE_PATH, a PM2 process, and a public host for
   * the bot's own dashboard.
   *
   * This is the most expensive thing we sell, which is why it starts at
   * `premium_plus` and not at `premium`. The arithmetic behind that boundary
   * (19.09.2026): of a 3.99 € plan, 3.68 € survive the Stripe fee
   * (1.5 % + 0.25 € on EEA cards, i.e. 7.8 % at that amount), while ten minutes
   * of support cost 6.67 € at a 40 €/h rate. Hosting is precisely the feature
   * that produces support contacts — someone else's bot token, someone else's
   * config, someone else's Discord server — so a single contact turned a hosted
   * 3.99 € customer loss-making. The boundary between two tiers belongs at the
   * most expensive feature, not at the most attractive one.
   */
  botHosting: boolean;
  /** Whether downloading attachments in the transcript is allowed. */
  attachments: boolean;
  /**
   * Whether the guild may remove the attribution notice the bot shows in its
   * ticket panel. The bot is AGPL-3.0 with an additional term under section
   * 7(b) requiring that notice; MSK Scripts waives it while a paid
   * subscription runs. Nothing enforces this in code, and nothing can: the
   * notice is a string in a locale file of a self-hosted bot. It is a
   * permission, which is why it belongs next to the other tier limits.
   */
  removeBranding: boolean;
  /** Max uploads per hour per API key (rate limiting). */
  uploadsPerHour: number;
  /**
   * Monthly price in euro cents, VAT not shown (§ 19 UStG).
   *
   * Lives here rather than only in the marketing copy because § 312j Abs. 2
   * BGB requires the total price to be shown *immediately before* the order
   * button. A number the checkout reads from the same place as the limits
   * cannot drift away from the tier it belongs to; a string in a copy file
   * can, and the AGB table would then be the only place that is still right.
   *
   * 0 for the free tier, which has no order button.
   */
  priceCents: number;
  /**
   * Yearly price in euro cents, same rules as `priceCents`. Two months free
   * against the monthly price, rounded to a whole euro.
   *
   * Worth having for a second reason besides retention: the Stripe fee has a
   * fixed 0.25 € component. Twelve monthly charges of 4.99 € pay 3.72 € in
   * fees (6.2 %), one yearly charge of 49 € pays 0.99 € (2.0 %). The discount
   * we grant is largely the fee we stop paying.
   *
   * 0 for the free tier.
   */
  priceCentsYearly: number;
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  basic: {
    transcriptMaxBytes: 10 * 1024 * 1024, //  10 MB
    attachmentMaxBytes: 0, //  not allowed
    storageDays: 30, //  1 month
    customDomain: false,
    botHosting: false,
    attachments: false,
    removeBranding: false,
    uploadsPerHour: 30,
    priceCents: 0,
    priceCentsYearly: 0,
  },
  premium: {
    transcriptMaxBytes: 50 * 1024 * 1024, // 50 MB
    attachmentMaxBytes: 100 * 1024 * 1024, // 100 MB
    storageDays: 180, // 6 months
    customDomain: true,
    // No hosting. See the field comment above for the arithmetic; this is the
    // single most consequential value in this file.
    botHosting: false,
    attachments: true,
    removeBranding: true,
    uploadsPerHour: 60,
    priceCents: 499,
    priceCentsYearly: 4900,
  },
  premium_plus: {
    transcriptMaxBytes: 100 * 1024 * 1024, // 100 MB
    attachmentMaxBytes: 200 * 1024 * 1024, // 200 MB
    storageDays: 365, // 1 year
    customDomain: true,
    botHosting: true,
    attachments: true,
    removeBranding: true,
    uploadsPerHour: 120,
    priceCents: 999,
    priceCentsYearly: 9900,
  },
  business: {
    transcriptMaxBytes: 200 * 1024 * 1024, // 200 MB
    attachmentMaxBytes: 500 * 1024 * 1024, // 500 MB
    storageDays: 3650, // 10 years
    customDomain: true,
    botHosting: true,
    attachments: true,
    removeBranding: true,
    uploadsPerHour: 300,
    priceCents: 1999,
    priceCentsYearly: 19900,
  },
};

/** Returns storage expiry date based on tier. */
export function getExpiresAt(tier: Tier): Date {
  const days = TIER_CONFIG[tier].storageDays;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/** Billing interval of a paid subscription. */
export type BillingInterval = 'monthly' | 'yearly';

/**
 * Price for humans, in the language of the page.
 *
 * German writes "4,99 €", English "€4.99": the same number, and both are
 * wrong in the other language. Built from the tier table rather than from a
 * literal so it can never disagree with the limits it belongs to.
 */
export function formatTierPrice(
  tier: Tier,
  lang: 'en' | 'de',
  interval: BillingInterval = 'monthly',
): string {
  const cents  = interval === 'yearly'
    ? TIER_CONFIG[tier].priceCentsYearly
    : TIER_CONFIG[tier].priceCents;
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    style: 'currency', currency: 'EUR',
  }).format(cents / 100);
}

/**
 * How many months the yearly price is cheaper than paying monthly, rounded
 * down. Feeds the "2 months free" line on the pricing table.
 *
 * Computed instead of written out because the two prices live above and a
 * hand-written "2" would survive a price change unnoticed. Returns 0 for tiers
 * without a yearly price, so the free tier renders nothing.
 */
export function yearlyMonthsFree(tier: Tier): number {
  const { priceCents, priceCentsYearly } = TIER_CONFIG[tier];
  if (priceCents <= 0 || priceCentsYearly <= 0) return 0;
  return Math.floor((priceCents * 12 - priceCentsYearly) / priceCents);
}
