'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { PackageCard } from '@/components/packages/PackageCard'
import { PACKAGE_BADGES, PACKAGE_TAGS, PACKAGE_DESCRIPTIONS } from '@/lib/config'
import { packagesTranslations, type Lang } from '@/lib/i18n'
import type { TebexPackage } from '@/types/tebex'

/**
 * Filterable package list.
 *
 * The facets are built from data that already exists and is already maintained:
 * the variant comes from the Tebex category a package sits in, and the
 * compatibility entries from PACKAGE_TAGS in lib/config.ts. There is
 * deliberately no framework facet — nothing in the data models which framework
 * a resource supports, and a filter that guesses is worse than one that is
 * missing.
 *
 * Filter state is local rather than in the URL. Nothing here is worth linking
 * to on its own, and a query string would have to be kept in sync with the
 * facets on every catalogue change.
 */

interface Facet {
  /** Stable value used for comparison. */
  value: string
  /** How many packages carry it, before this facet's own filter is applied. */
  count: number
}

interface Props {
  lang: Lang
  packages: TebexPackage[]
}

/** Price bucket boundaries in EUR. Chosen from the actual catalogue spread. */
const PRICE_STEPS = [10, 20, 40] as const

function priceBucket(price: number): string {
  if (price < PRICE_STEPS[0]) return `<${PRICE_STEPS[0]}`
  if (price < PRICE_STEPS[1]) return `${PRICE_STEPS[0]}-${PRICE_STEPS[1]}`
  if (price < PRICE_STEPS[2]) return `${PRICE_STEPS[1]}-${PRICE_STEPS[2]}`
  return `${PRICE_STEPS[2]}+`
}

function bucketLabel(bucket: string, lang: Lang): string {
  const under = lang === 'de' ? 'unter' : 'under'
  const from = lang === 'de' ? 'ab' : 'from'
  if (bucket.startsWith('<')) return `${under} ${bucket.slice(1)} €`
  if (bucket.endsWith('+')) return `${from} ${bucket.slice(0, -1)} €`
  const [lo, hi] = bucket.split('-')
  return `${lo}–${hi} €`
}

function tagsOf(pkg: TebexPackage): string[] {
  return PACKAGE_TAGS[pkg.id] ?? []
}

function countBy(packages: TebexPackage[], pick: (p: TebexPackage) => string[]): Facet[] {
  const counts = new Map<string, number>()
  for (const p of packages) {
    for (const v of pick(p)) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

function FacetGroup({
  title, facets, selected, onToggle, label,
}: {
  title: string
  facets: Facet[]
  selected: Set<string>
  onToggle: (value: string) => void
  label?: (value: string) => string
}) {
  if (facets.length === 0) return null
  return (
    <fieldset className="mt-6 first:mt-0">
      <legend className="mb-3 font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
        {title}
      </legend>
      <div className="flex flex-col gap-0.5">
        {facets.map(f => (
          <label
            key={f.value}
            className="group flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <input
              type="checkbox"
              checked={selected.has(f.value)}
              onChange={() => onToggle(f.value)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded border border-[var(--color-border)] transition-colors peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-ring)]"
            >
              <svg
                viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-foreground)"
                strokeWidth="3.5" className="h-2.5 w-2.5"
                style={{ opacity: selected.has(f.value) ? 1 : 0 }}
              >
                <path d="m5 13 4 4 10-10" />
              </svg>
            </span>
            <span className="peer-checked:font-semibold peer-checked:text-[var(--color-foreground)]">
              {label ? label(f.value) : f.value}
            </span>
            <span className="ml-auto font-mono text-xs tabular-nums">{f.count}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function PackagesBrowser({ lang, packages }: Props) {
  const t = packagesTranslations[lang]

  const [variants, setVariants] = useState<Set<string>>(new Set())
  const [compat, setCompat] = useState<Set<string>>(new Set())
  const [buckets, setBuckets] = useState<Set<string>>(new Set())

  const facets = useMemo(() => ({
    variants: countBy(packages, p => (p.category?.name ? [p.category.name] : [])),
    compat:   countBy(packages, tagsOf),
    buckets:  countBy(packages, p => [priceBucket(p.total_price ?? p.base_price ?? 0)]),
  }), [packages])

  const shown = useMemo(() => packages.filter(p => {
    if (variants.size > 0 && !variants.has(p.category?.name ?? '')) return false
    // Mehrere Kompatibilitäts-Haken heißen „alle davon", nicht „irgendeins":
    // wer ox_inventory und msk_core anklickt, sucht etwas, das mit beidem läuft.
    if (compat.size > 0 && ![...compat].every(c => tagsOf(p).includes(c))) return false
    if (buckets.size > 0 && !buckets.has(priceBucket(p.total_price ?? p.base_price ?? 0))) return false
    return true
  }), [packages, variants, compat, buckets])

  const active: Array<{ value: string; label: string; clear: () => void }> = [
    ...[...variants].map(v => ({
      value: `v:${v}`, label: v,
      clear: () => setVariants(s => { const n = new Set(s); n.delete(v); return n }),
    })),
    ...[...compat].map(v => ({
      value: `c:${v}`, label: v,
      clear: () => setCompat(s => { const n = new Set(s); n.delete(v); return n }),
    })),
    ...[...buckets].map(v => ({
      value: `p:${v}`, label: bucketLabel(v, lang),
      clear: () => setBuckets(s => { const n = new Set(s); n.delete(v); return n }),
    })),
  ]

  const toggle = (set: (fn: (s: Set<string>) => Set<string>) => void) => (value: string) =>
    set(s => {
      const next = new Set(s)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })

  const resetAll = () => { setVariants(new Set()); setCompat(new Set()); setBuckets(new Set()) }

  return (
    <div className="grid gap-0 border-t border-[var(--color-border)] lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="py-7 lg:border-r lg:border-[var(--color-border)] lg:pr-7" aria-label={t.filters}>
        <FacetGroup
          title={t.facet_variant}
          facets={facets.variants}
          selected={variants}
          onToggle={toggle(setVariants)}
        />
        <FacetGroup
          title={t.facet_price}
          facets={facets.buckets}
          selected={buckets}
          onToggle={toggle(setBuckets)}
          label={v => bucketLabel(v, lang)}
        />
        <FacetGroup
          title={t.facet_compat}
          facets={facets.compat}
          selected={compat}
          onToggle={toggle(setCompat)}
        />

        <p className="mt-7 border-t border-[var(--color-border)] pt-4 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          {t.escrow_note}
          <Link
            href="/#ablauf"
            className="mt-1.5 block font-semibold text-[var(--color-primary)] hover:underline"
          >
            {t.escrow_link} →
          </Link>
        </p>
      </aside>

      <div className="py-7 lg:pl-8">
        <div className="mb-5 flex flex-wrap items-center gap-2.5 text-sm text-[var(--color-muted-foreground)]">
          {active.length > 0 ? (
            <>
              <span>{t.filtered_label}</span>
              {active.map(a => (
                <button
                  key={a.value}
                  type="button"
                  onClick={a.clear}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--color-primary)_40%,var(--color-border))] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)]"
                >
                  {a.label}
                  <X className="h-3 w-3" aria-hidden />
                  <span className="sr-only">{t.reset}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={resetAll}
                className="underline underline-offset-4 transition-colors hover:text-[var(--color-foreground)]"
              >
                {t.reset}
              </button>
            </>
          ) : null}
          <span className="ml-auto font-mono text-xs tabular-nums">
            {t.showing.replace('{shown}', String(shown.length)).replace('{total}', String(packages.length))}
          </span>
        </div>

        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-20 text-center">
            <p className="text-lg font-semibold">{t.empty_title}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">{t.empty_body}</p>
            <button
              type="button"
              onClick={resetAll}
              className="mt-2 text-sm font-semibold text-[var(--color-primary)] underline underline-offset-4"
            >
              {t.reset}
            </button>
          </div>
        ) : (
          // Spaltenzahl kommt aus der verfügbaren Breite, nicht aus
          // Breakpoints: `auto-fill` legt so viele 300-px-Spalten an, wie
          // hineinpassen. Damit skaliert das Raster stufenlos vom Telefon bis
          // zum Ultrawide, ohne dass für jede Fenstergröße eine eigene Klasse
          // gepflegt werden muss. `min(100%, …)` verhindert einen Überlauf,
          // wenn der Viewport schmaler als die Mindestspalte ist.
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6">
            {shown.map(pkg => (
              <PackageCard
                key={pkg.id}
                lang={lang}
                pkg={pkg}
                badges={PACKAGE_BADGES[pkg.id]}
                tags={PACKAGE_TAGS[pkg.id]}
                description={PACKAGE_DESCRIPTIONS[pkg.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
