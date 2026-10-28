/**
 * The catalogue filter, as plain functions so the rules can be tested.
 *
 * Since Phase 4 of the redesign there is one facet, the framework (plan 5.5):
 * it is what a FiveM server owner chooses by. The variant and price facets
 * went with the grouping into products, because every product carries both
 * variants and a "from" price sorts nothing. The "works with" facet went too:
 * those names are requirements now, listed on the product page.
 */

export interface Facet {
  /** Stable value used for comparison. */
  value: string
  /** How many products carry it. */
  count: number
}

/** Facet values with their counts: most common first, ties alphabetical. */
export function countBy<T>(items: readonly T[], pick: (item: T) => string[]): Facet[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const value of new Set(pick(item))) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

/**
 * Whether a product passes the framework filter. Several ticked frameworks
 * mean "any of them": a server runs one framework, and someone who ticks two
 * is comparing, not looking for a script that needs both. Nothing ticked
 * lets everything through.
 */
export function matchesFrameworks(selected: ReadonlySet<string>, frameworks: readonly string[]): boolean {
  if (selected.size === 0) return true
  return frameworks.some(f => selected.has(f))
}
