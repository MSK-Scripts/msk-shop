'use client'

import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/products/ProductCard'
import { countBy, matchesFrameworks } from '@/lib/packageFacets'
import { packagesTranslations, type Lang } from '@/lib/i18n'
import type { ProductCardData } from '@/lib/productView'

interface Props {
  lang: Lang
  cards: ProductCardData[]
}

/**
 * The script grid of the catalogue with its one filter, the framework.
 *
 * The filter sits above the grid, not in a column beside it. A 232 px column
 * left two cards per row at 1440 px (measured on 28.10.2026: 945 px for the
 * grid, two cards of 351 px), and a filter of two or three values does not
 * need a column. Above the grid it is one row, and the grid gets the full
 * width: three columns at 1440, four at 1920.
 *
 * Filter state is local rather than in the URL. Nothing here is worth linking
 * to on its own.
 */
export function ProductBrowser({ lang, cards }: Props) {
  const t = packagesTranslations[lang]
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const facets = useMemo(() => countBy(cards, c => c.frameworks), [cards])
  const shown = cards.filter(c => matchesFrameworks(selected, c.frameworks))

  const toggle = (value: string) =>
    setSelected(s => {
      const next = new Set(s)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })

  const countLabel = (n: number) => (n === 1 ? t.count_one : t.count_many).replace('{n}', String(n))

  return (
    <section aria-labelledby="results-heading">
      <h2 id="results-heading" className="sr-only">{t.region_results}</h2>

      {/* A filter with one value filters nothing. */}
      {facets.length > 1 && (
        <div className="mb-[clamp(1rem,0.75rem+0.75vw,1.75rem)] flex flex-wrap items-center gap-x-3 gap-y-2.5">
          <div role="group" aria-labelledby="framework-filter" className="flex flex-wrap items-center gap-2">
            <span id="framework-filter" className="mr-1 text-label font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
              {t.facet_framework}
            </span>
            {facets.map(f => (
              <label
                key={f.value}
                className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border-[1.5px] border-[var(--color-input)] bg-[var(--color-card)] px-3.5 font-semibold transition-colors duration-150 hover:border-[var(--color-foreground)] has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-accent-soft)] has-[:checked]:text-[var(--color-primary)] has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--color-ring)] forced-colors:has-[:checked]:outline-solid forced-colors:has-[:checked]:outline-[3px] forced-colors:has-[:checked]:outline-[color:Highlight]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(f.value)}
                  onChange={() => toggle(f.value)}
                  className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
                />
                {f.value}
                <span aria-hidden className="text-small font-normal tabular-nums text-[var(--color-muted-foreground)]">{f.count}</span>
                <span className="sr-only">{countLabel(f.count)}</span>
              </label>
            ))}
          </div>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="min-h-11 px-1 text-small font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
            >
              {t.reset}
            </button>
          )}
          {/* Announces the new count after every click; without it the grid
              changes silently for anyone who cannot see it. */}
          <span role="status" className="ml-auto text-small tabular-nums text-[var(--color-muted-foreground)]">
            {t.showing.replace('{shown}', String(shown.length)).replace('{total}', String(cards.length))}
          </span>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] px-4 py-16 text-center">
          <p className="font-display text-h3 font-[650]">{t.empty_title}</p>
          <p className="text-[var(--color-muted-foreground)]">{t.empty_body}</p>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="min-h-11 font-semibold text-[var(--color-primary)] underline underline-offset-4"
          >
            {t.reset}
          </button>
        </div>
      ) : (
        // `auto-fill` with the card minimum from globals.css: the grid gains
        // columns on a wide screen, a card never gets narrower than 18rem
        // (plan 4.7). `min(100%, …)` keeps a 320 px phone from overflowing.
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--grid-card)),1fr))] gap-[clamp(1rem,1.2vw,1.75rem)]">
          {shown.map(card => (
            <li key={card.slug} className="grid">
              <ProductCard card={card} lang={lang} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
