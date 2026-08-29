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
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  basic: {
    transcriptMaxBytes: 10 * 1024 * 1024, //  10 MB
    attachmentMaxBytes: 0, //  not allowed
    storageDays: 30, //  1 month
    customDomain: false,
    attachments: false,
    removeBranding: false,
    uploadsPerHour: 30,
  },
  premium: {
    transcriptMaxBytes: 50 * 1024 * 1024, // 50 MB
    attachmentMaxBytes: 100 * 1024 * 1024, // 100 MB
    storageDays: 180, // 6 months
    customDomain: true,
    attachments: true,
    removeBranding: true,
    uploadsPerHour: 60,
  },
  premium_plus: {
    transcriptMaxBytes: 100 * 1024 * 1024, // 100 MB
    attachmentMaxBytes: 200 * 1024 * 1024, // 200 MB
    storageDays: 365, // 1 year
    customDomain: true,
    attachments: true,
    removeBranding: true,
    uploadsPerHour: 120,
  },
  business: {
    transcriptMaxBytes: 200 * 1024 * 1024, // 200 MB
    attachmentMaxBytes: 500 * 1024 * 1024, // 500 MB
    storageDays: 3650, // 10 years
    customDomain: true,
    attachments: true,
    removeBranding: true,
    uploadsPerHour: 300,
  },
};

/** Returns storage expiry date based on tier. */
export function getExpiresAt(tier: Tier): Date {
  const days = TIER_CONFIG[tier].storageDays;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
