// ============================================================
// Tier configuration – single source of truth for limits.
// ============================================================

export type Tier = 'basic' | 'premium' | 'premium_plus';

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
  /** Max uploads per hour per API key (rate limiting). */
  uploadsPerHour: number;
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  basic: {
    transcriptMaxBytes:  10  * 1024 * 1024,   //  10 MB
    attachmentMaxBytes:  0,                    //  not allowed
    storageDays:         30,
    customDomain:        false,
    attachments:         false,
    uploadsPerHour:      30,
  },
  premium: {
    transcriptMaxBytes:  100 * 1024 * 1024,   // 100 MB
    attachmentMaxBytes:  150 * 1024 * 1024,   // 150 MB
    storageDays:         60,
    customDomain:        true,
    attachments:         true,
    uploadsPerHour:      60,
  },
  premium_plus: {
    transcriptMaxBytes:  250 * 1024 * 1024,   // 250 MB
    attachmentMaxBytes:  500 * 1024 * 1024,   // 500 MB
    storageDays:         120,
    customDomain:        true,
    attachments:         true,
    uploadsPerHour:      300,
  },
};

/** Returns storage expiry date based on tier. */
export function getExpiresAt(tier: Tier): Date {
  const days = TIER_CONFIG[tier].storageDays;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
