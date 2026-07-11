// ═══════════════════════════════════════════════════════════════
//  RESOURCE STATS
//  Configuration for the fivestats.io resource statistics page
//  (/resources). Each entry is tracked live via the fivestats API.
//
//  HOW IT WORKS:
//    - `resourceName` MUST match the FiveM resource folder name exactly
//      (this is the `resource_name` fivestats.io indexes by).
//    - Free resources link to their GitHub repository.
//    - Paid resources link to their two Tebex variants (Encrypted + Source).
//
//  The API key lives server-side only (FIVESTATS_API_KEY in .env.local) —
//  it never reaches the client. See lib/fivestats.ts.
// ═══════════════════════════════════════════════════════════════

// Game the resources run on. fivestats.io: 'gta5' | 'rdr3'.
export const RESOURCE_STATS_GAME = 'gta5' as const

// Time window (hours) for the history chart + change calculation.
// 168 = 7 days.
export const RESOURCE_STATS_PERIOD_HOURS = 168

export interface ResourceStatEntry {
  /** Exact FiveM resource folder name = fivestats `resource_name`. */
  resourceName: string
  /** Human-readable name shown on the card. */
  displayName: string
  tier: 'free' | 'paid'
  /** Free resources: GitHub repository URL. */
  github?: string
  /** Paid resources: Tebex package IDs for both variants. */
  packages?: {
    /** Encrypted (escrow) variant — Tebex package ID. */
    encrypted: number
    /** Source (unencrypted) variant — Tebex package ID. */
    source: number
  }
}

const GITHUB_ORG = 'https://github.com/MSK-Scripts'

export const RESOURCE_STATS: ResourceStatEntry[] = [
  // ─── Free ────────────────────────────────────────────────────
  {
    resourceName: 'msk_core',
    displayName: 'MSK Core',
    tier: 'free',
    github: `${GITHUB_ORG}/msk_core`,
  },
  {
    resourceName: 'msk_enginetoggle',
    displayName: 'MSK EngineToggle',
    tier: 'free',
    github: `${GITHUB_ORG}/msk_enginetoggle`,
  },
  {
    resourceName: 'msk_fuel',
    displayName: 'MSK Fuel',
    tier: 'free',
    github: `${GITHUB_ORG}/msk_fuel`,
  },
  {
    resourceName: 'msk_givevehicle',
    displayName: 'MSK GiveVehicle',
    tier: 'free',
    github: `${GITHUB_ORG}/msk_givevehicle`,
  },
  {
    resourceName: 'msk_jobGPS',
    displayName: 'MSK JobGPS',
    tier: 'free',
    github: `${GITHUB_ORG}/msk_jobGPS`,
  },

  // ─── Paid ────────────────────────────────────────────────────
  {
    resourceName: 'msk_garage',
    displayName: 'MSK Garage',
    tier: 'paid',
    packages: { encrypted: 5732587, source: 5732588 },
  },
  {
    resourceName: 'msk_handcuffs',
    displayName: 'MSK Handcuffs',
    tier: 'paid',
    packages: { encrypted: 5159927, source: 5301828 },
  },
  {
    resourceName: 'msk_vehiclekeys',
    displayName: 'MSK VehicleKeys',
    tier: 'paid',
    packages: { encrypted: 6446936, source: 6446947 },
  },
  {
    resourceName: 'msk_storage',
    displayName: 'MSK Storage',
    tier: 'paid',
    packages: { encrypted: 6372773, source: 6372865 },
  },
]
