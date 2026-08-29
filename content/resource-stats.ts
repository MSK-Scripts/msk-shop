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

/**
 * Resource whose live server count is shown in the homepage hero badge.
 *
 * Deliberately a **single** resource, not a sum: a server running msk_core and
 * msk_handcuffs would otherwise be counted twice, and the total would overstate
 * the real reach. msk_core is the shared library behind the other scripts, so it
 * is both the highest and the most representative number.
 *
 * Must match a `resourceName` in RESOURCE_STATS below.
 */
export const RESOURCE_STATS_HEADLINE = 'msk_core'

export interface ResourceStatEntry {
  /** Exact FiveM resource folder name = fivestats `resource_name`. */
  resourceName: string
  /** Human-readable name shown on the card. */
  displayName: string
  tier: 'free' | 'paid'
  /**
   * File name inside the public `MSK-Scripts/VERSIONS` repository.
   *
   * This is the same file the resource's own version checker polls at runtime
   * (`server/versionchecker.lua`), so it is authoritative rather than a second
   * list that could drift. Used by `lib/releases.ts` for the homepage release
   * log. Omit for resources that should not appear there.
   */
  versionsFile?: string
  /** Free resources: GitHub repository URL. */
  github?: string
  /** Paid resources: Tebex package IDs for both variants. */
  packages?: {
    /** Encrypted (escrow) variant — Tebex package ID. */
    encrypted: number
    /** Source variant (escrowed too, only the core functions stay encrypted) — Tebex package ID. */
    source: number
  }
}

const GITHUB_ORG = 'https://github.com/MSK-Scripts'

export const RESOURCE_STATS: ResourceStatEntry[] = [
  // ─── Free ────────────────────────────────────────────────────
  // msk_core is always listed first; the remaining free resources follow
  // alphabetically.
  {
    resourceName: "msk_core",
    versionsFile: "Lib.json",
    displayName: "MSK Core",
    tier: "free",
    github: `${GITHUB_ORG}/msk_core`,
  },
  {
    resourceName: "msk_aimedic",
    displayName: "MSK AI Medic",
    tier: "free",
    github: `${GITHUB_ORG}/msk_aimedic`,
  },
  {
    resourceName: "msk_aitaxi",
    displayName: "MSK AI Taxi",
    tier: "free",
    github: `${GITHUB_ORG}/msk_aitaxi`,
  },
  {
    resourceName: "msk_enginetoggle",
    versionsFile: "EngineToggle.json",
    displayName: "MSK EngineToggle",
    tier: "free",
    github: `${GITHUB_ORG}/msk_enginetoggle`,
  },
  {
    resourceName: "msk_fuel",
    versionsFile: "Fuel.json",
    displayName: "MSK Fuel",
    tier: "free",
    github: `${GITHUB_ORG}/msk_fuel`,
  },
  {
    resourceName: "msk_givevehicle",
    versionsFile: "GiveVehicle.json",
    displayName: "MSK GiveVehicle",
    tier: "free",
    github: `${GITHUB_ORG}/msk_givevehicle`,
  },
  {
    resourceName: "msk_jobGPS",
    displayName: "MSK JobGPS",
    tier: "free",
    github: `${GITHUB_ORG}/msk_jobGPS`,
  },
  {
    resourceName: "msk_storage",
    versionsFile: "Storage.json",
    displayName: "MSK Storage",
    tier: "free",
    github: `${GITHUB_ORG}/msk_storage`,
  },

  // ─── Paid ────────────────────────────────────────────────────
  {
    resourceName: "msk_garage",
    versionsFile: "Garage.json",
    displayName: "MSK Garage",
    tier: "paid",
    packages: { encrypted: 5732587, source: 5732588 },
  },
  {
    resourceName: "msk_handcuffs",
    versionsFile: "Handcuffs.json",
    displayName: "MSK Handcuffs",
    tier: "paid",
    packages: { encrypted: 5159927, source: 5301828 },
  },
  {
    resourceName: "msk_vehiclekeys",
    versionsFile: "VehicleKeys.json",
    displayName: "MSK VehicleKeys",
    tier: "paid",
    packages: { encrypted: 6446936, source: 6446947 },
  },
];
