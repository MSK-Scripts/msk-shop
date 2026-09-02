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
   * the bot's own dashboard. Every paid tier gets it — the limit is server
   * capacity, not the price, and a Premium customer who cannot host has to run
   * the bot somewhere themselves, which is the part most of them cannot do.
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
  },
  premium: {
    transcriptMaxBytes: 50 * 1024 * 1024, // 50 MB
    attachmentMaxBytes: 100 * 1024 * 1024, // 100 MB
    storageDays: 180, // 6 months
    customDomain: true,
    botHosting: true,
    attachments: true,
    removeBranding: true,
    uploadsPerHour: 60,
    priceCents: 399,
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
    priceCents: 699,
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
    priceCents: 999,
  },
};

/** Returns storage expiry date based on tier. */
export function getExpiresAt(tier: Tier): Date {
  const days = TIER_CONFIG[tier].storageDays;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Monthly price for humans, in the language of the page.
 *
 * German writes "3,99 €", English "€3.99" — the same number, and both are
 * wrong in the other language. Built from `priceCents` rather than from a
 * literal so it can never disagree with the tier table above.
 */
export function formatTierPrice(tier: Tier, lang: 'en' | 'de'): string {
  const amount = TIER_CONFIG[tier].priceCents / 100;
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    style: 'currency', currency: 'EUR',
  }).format(amount);
}
