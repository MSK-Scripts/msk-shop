'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { PackageCard } from '@/components/packages/PackageCard'
import { PACKAGE_BADGES, PACKAGE_TAGS, PACKAGE_DESCRIPTIONS } from '@/lib/config'
import {
  bucketLabel, countBy, countPriceBuckets, priceBucket, type Facet,
} from '@/lib/packageFacets'
import { packagesTranslations, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
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
 *
 * Counting and ordering live in lib/packageFacets.ts so they can be tested.
 */

interface Props {
  lang: Lang
  packages: TebexPackage[]
}

function priceOf(pkg: TebexPackage): number {
  return pkg.total_price ?? pkg.base_price ?? 0
}

function tagsOf(pkg: TebexPackage): string[] {
  return PACKAGE_TAGS[pkg.id] ?? []
}

function FacetGroup({
  title, facets, selected, onToggle, label, countLabel,
}: {
  title: string
  facets: Facet[]
  selected: Set<string>
  onToggle: (value: string) => void
  label?: (value: string) => string
  /** Liest die nackte Zahl für Screenreader aus, siehe unten. */
  countLabel: (count: number) => string
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
            {/* Die nackte Zahl stand im <label> und wurde als „Encrypted
                Version 4" vorgelesen. Sichtbar bleibt sie eine Zahl, gehört
                wird sie zu „4 Pakete". */}
            <span aria-hidden className="ml-auto font-mono text-xs tabular-nums">{f.count}</span>
            <span className="sr-only">{countLabel(f.count)}</span>
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
  // Wirkt nur unterhalb von lg. Am Telefon stand die Filterspalte 852 px hoch
  // vor der ersten Produktkarte (gemessen am 22.08.2026 bei 375 × 812: erste
  // Karte bei y = 1114), also anderthalb Bildschirme Kästen vor der Ware.
  const [filtersOpen, setFiltersOpen] = useState(false)

  const facets = useMemo(() => ({
    variants: countBy(packages, p => (p.category?.name ? [p.category.name] : [])),
    compat:   countBy(packages, tagsOf),
    buckets:  countPriceBuckets(packages, priceOf),
  }), [packages])

  const shown = useMemo(() => packages.filter(p => {
    if (variants.size > 0 && !variants.has(p.category?.name ?? '')) return false
    // Mehrere Kompatibilitäts-Haken heißen „alle davon", nicht „irgendeins":
    // wer ox_inventory und msk_core anklickt, sucht etwas, das mit beidem läuft.
    if (compat.size > 0 && ![...compat].every(c => tagsOf(p).includes(c))) return false
    if (buckets.size > 0 && !buckets.has(priceBucket(priceOf(p)))) return false
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

  const countLabel = (n: number) =>
    (n === 1 ? t.count_one : t.count_many).replace('{n}', String(n))

  const resetAll = () => { setVariants(new Set()); setCompat(new Set()); setBuckets(new Set()) }

  return (
    <div className="grid gap-0 border-t border-[var(--color-border)] lg:grid-cols-[232px_minmax(0,1fr)]">
      <div className="lg:border-r lg:border-[var(--color-border)] lg:pr-7">
        {/* Ab lg ist die Spalte immer offen und der Schalter verschwindet.
            Deshalb steht er außerhalb des <aside>: das wird am Telefon
            ausgeblendet, der Schalter muss aber sichtbar bleiben. */}
        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          aria-expanded={filtersOpen}
          aria-controls="package-filters"
          className="flex w-full items-center gap-2.5 border-b border-[var(--color-border)] py-3.5 text-sm font-semibold transition-colors hover:text-[var(--color-primary)] lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4 text-[var(--color-muted-foreground)]" aria-hidden />
          {t.filters}
          {active.length > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-sm bg-[var(--color-primary)] px-1 font-mono text-xs tabular-nums text-[var(--color-primary-foreground)]">
              {active.length}
            </span>
          ) : null}
          <ChevronDown
            aria-hidden
            className={cn(
              'ml-auto h-4 w-4 text-[var(--color-muted-foreground)] transition-transform',
              filtersOpen && 'rotate-180',
            )}
          />
        </button>

        <aside
          id="package-filters"
          aria-labelledby="package-filters-heading"
          className={cn('py-7', filtersOpen ? 'block' : 'hidden lg:block')}
        >
          <h2 id="package-filters-heading" className="sr-only">{t.region_filters}</h2>
          <FacetGroup
            title={t.facet_variant}
            facets={facets.variants}
            selected={variants}
            onToggle={toggle(setVariants)}
            countLabel={countLabel}
          />
          <FacetGroup
            title={t.facet_price}
            facets={facets.buckets}
            selected={buckets}
            onToggle={toggle(setBuckets)}
            label={v => bucketLabel(v, lang)}
            countLabel={countLabel}
          />
          <FacetGroup
            title={t.facet_compat}
            facets={facets.compat}
            selected={compat}
            onToggle={toggle(setCompat)}
            countLabel={countLabel}
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
      </div>

      <section className="py-7 lg:pl-8" aria-labelledby="package-results-heading">
        <h2 id="package-results-heading" className="sr-only">{t.region_results}</h2>
        {/* Der Lizenzunterschied ist Schritt 1 des Kaufablaufs und stand bis
            zum 22.08.2026 nur in der Meta-Description, also fuer Google. */}
        <p className="mb-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          {t.variant_note}
        </p>

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
          {/* role="status" meldet die neue Trefferzahl nach jedem Filterklick.
              Ohne das ändert sich das Raster still, und wer es nicht sieht,
              erfährt nicht, dass überhaupt etwas passiert ist. */}
          <span role="status" className="ml-auto font-mono text-xs tabular-nums">
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
      </section>
    </div>
  )
}
