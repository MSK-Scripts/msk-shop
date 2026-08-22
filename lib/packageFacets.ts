import type { Lang } from '@/lib/i18n'

/**
 * Facet counting for the package catalogue.
 *
 * This lives in lib/ rather than inside the browser component so the ordering
 * rules can be tested. The two orders are deliberately different: variant and
 * compatibility entries have no natural sequence, so the most common one goes
 * first and ties fall back to the alphabet. Prices do have a natural sequence,
 * and sorting them by frequency is what produced the live order
 * "10-20 EUR, under 10 EUR, 20-40 EUR" (found 2026-08-22).
 */

export interface Facet {
  /** Stable value used for comparison. */
  value: string
  /** How many packages carry it, before this facet's own filter is applied. */
  count: number
}

/** Price bucket boundaries in EUR. Chosen from the actual catalogue spread. */
export const PRICE_STEPS = [10, 20, 40] as const

/**
 * Every bucket, cheapest first. This array is also the render order of the
 * price facet, so the boundaries and the order can never drift apart.
 */
export const PRICE_BUCKETS = [
  `<${PRICE_STEPS[0]}`,
  `${PRICE_STEPS[0]}-${PRICE_STEPS[1]}`,
  `${PRICE_STEPS[1]}-${PRICE_STEPS[2]}`,
  `${PRICE_STEPS[2]}+`,
] as const

export function priceBucket(price: number): string {
  if (price < PRICE_STEPS[0]) return PRICE_BUCKETS[0]
  if (price < PRICE_STEPS[1]) return PRICE_BUCKETS[1]
  if (price < PRICE_STEPS[2]) return PRICE_BUCKETS[2]
  return PRICE_BUCKETS[3]
}

export function bucketLabel(bucket: string, lang: Lang): string {
  const under = lang === 'de' ? 'unter' : 'under'
  const from = lang === 'de' ? 'ab' : 'from'
  if (bucket.startsWith('<')) return `${under} ${bucket.slice(1)} €`
  if (bucket.endsWith('+')) return `${from} ${bucket.slice(0, -1)} €`
  const [lo, hi] = bucket.split('-')
  return `${lo}–${hi} €`
}

function tally<T>(items: T[], pick: (item: T) => string[]): Facet[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const value of pick(item)) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count }))
}

/** Facets without a natural order: most common first, then alphabetical. */
export function countBy<T>(items: T[], pick: (item: T) => string[]): Facet[] {
  return tally(items, pick).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

/** The price facet, always cheapest first regardless of how many land where. */
export function countPriceBuckets<T>(items: T[], priceOf: (item: T) => number): Facet[] {
  const rank = (value: string) => {
    const i = PRICE_BUCKETS.indexOf(value as (typeof PRICE_BUCKETS)[number])
    // An unknown bucket cannot happen while priceBucket() is the only source,
    // but sorting it to the end beats silently placing it first.
    return i === -1 ? PRICE_BUCKETS.length : i
  }
  return tally(items, item => [priceBucket(priceOf(item))]).sort(
    (a, b) => rank(a.value) - rank(b.value),
  )
}

/**
 * Kurze Gruppen bleiben immer ganz sichtbar. Erst darueber lohnt ein
 * Ausklapper, sonst versteckt er zwei Zeilen hinter einer dritten.
 */
const COLLAPSE_FROM = 6

/**
 * Trennt die Facetten, die wirklich einengen, von ihrem Schwanz.
 *
 * Anlass: "Funktioniert mit" hatte elf Einträge, acht davon mit Zähler 2.
 * Zwei heißt im heutigen Katalog "genau ein Produkt", weil jedes Script
 * doppelt im Regal steht, encrypted und source. So ein Haken engt nichts ein,
 * er springt zu einem einzelnen Produkt, das auf derselben Seite ohnehin schon
 * sichtbar ist.
 *
 * Die Grenze kommt deshalb aus den Daten und nicht aus einer festen Zahl:
 * alles, was so selten vorkommt wie der seltenste Eintrag, wandert hinter den
 * Ausklapper. Das überlebt auch die geplante Zusammenfassung der Paare, nach
 * der die Zähler sich halbieren. Sind alle Einträge gleich häufig, gibt es
 * keinen Schwanz und die Gruppe bleibt vollständig stehen.
 */
export function splitFacets(facets: Facet[]): { primary: Facet[]; rest: Facet[] } {
  if (facets.length < COLLAPSE_FROM) return { primary: facets, rest: [] }
  const rarest = Math.min(...facets.map(f => f.count))
  const primary = facets.filter(f => f.count > rarest)
  if (primary.length === 0) return { primary: facets, rest: [] }
  return { primary, rest: facets.filter(f => f.count <= rarest) }
}
