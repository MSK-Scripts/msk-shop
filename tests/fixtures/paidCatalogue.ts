import type { ResourceStatEntry } from '@/content/resource-stats'

/**
 * The paid catalogue as it was configured until 05.11.2026, when the three
 * scripts went free on GitHub and the subscription was switched off.
 *
 * The product model in lib/products.ts (grouping, router index, variant
 * choice) is Tebex code that stays until it is removed in a cleanup of its
 * own. Its tests run against this configuration, mocked in place of
 * content/resource-stats.ts and `SUBSCRIPTION_PACKAGE_IDS`, together with the
 * package fixture of the same date. What the live configuration does with
 * these ids now is tested in tests/routes.test.ts (they redirect to GitHub).
 */
export const PAID_RESOURCE_STATS: ResourceStatEntry[] = [
  { resourceName: 'msk_garage',      versionsFile: 'Garage.json',      displayName: 'MSK Garage',      tier: 'paid', packages: { encrypted: 5732587, source: 5732588 } },
  { resourceName: 'msk_handcuffs',   versionsFile: 'Handcuffs.json',   displayName: 'MSK Handcuffs',   tier: 'paid', packages: { encrypted: 5159927, source: 5301828 } },
  { resourceName: 'msk_vehiclekeys', versionsFile: 'VehicleKeys.json', displayName: 'MSK VehicleKeys', tier: 'paid', packages: { encrypted: 6446936, source: 6446947 } },
]

export const PAID_SUBSCRIPTION_PACKAGE_IDS = { encrypted: 7569109, source: 7569121 }
