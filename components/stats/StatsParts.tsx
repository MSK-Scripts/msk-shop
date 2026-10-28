import { WarningCircle } from '@/components/icons'
import { PageHero, type Crumb } from '@/components/page/PageHero'
import type { Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * Building blocks of the two bot statistics pages, restyled in Phase 5 of the
 * redesign (28.10.2026): the head on the anthracite band, the figures as a
 * list grouped by hairlines instead of a grid of icon cards (exclusion list
 * 4.2), labels in Source Sans instead of green monospace.
 */

export function formatNum(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US').format(n)
}

export function StatsHero({
  id, crumbs, live, labels, title, subtitle,
}: {
  id: string
  crumbs: Crumb[]
  live: boolean
  labels: { live: string; refresh: string; unavailable: string; unreachable: string }
  title: string
  subtitle: string
}) {
  // A state is said in words and with a sign, never by colour alone (plan 4.4).
  const status = live ? (
    <p className="flex flex-wrap items-center gap-x-2 text-small text-[var(--color-band-muted)]">
      <span aria-hidden className="pulse-dot inline-block h-2 w-2 rounded-full bg-[var(--color-band-accent)]" />
      {labels.refresh}
    </p>
  ) : (
    <p className="flex flex-wrap items-center gap-x-2 text-small text-[var(--color-band-foreground)]">
      <WarningCircle className="h-4 w-4 shrink-0" />
      {labels.unreachable}
    </p>
  )
  return (
    <PageHero
      id={id}
      crumbs={crumbs}
      // No green kicker without data: the warning line below says it in words.
      kicker={live ? labels.live : undefined}
      title={title}
      lead={subtitle}
    >
      {status}
    </PageHero>
  )
}

export interface Figure {
  label: string
  value: string
  sub?: string
}

/**
 * The figures as a definition list. The columns follow the container: one
 * on a phone, then as many as fit at the card minimum of the page.
 */
export function FigureList({ figures, headingId, heading }: { figures: Figure[]; headingId: string; heading: string }) {
  return (
    <section aria-labelledby={headingId}>
      {/* Visible it would repeat the page title; it gives the list its place
          between the h1 and the breakdowns. */}
      <h2 id={headingId} className="sr-only">{heading}</h2>
      <dl className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--grid-card)),1fr))] gap-x-[clamp(2rem,3vw,4rem)]">
        {figures.map(f => (
          <div key={f.label} className="grid content-start gap-1 border-t border-[var(--color-border)] py-5">
            <dt className="font-semibold">{f.label}</dt>
            <dd className="font-display text-h2 font-bold tabular-nums tracking-[-0.015em]">{f.value}</dd>
            {f.sub && <dd className="max-w-[34rem] text-small text-[var(--color-muted-foreground)]">{f.sub}</dd>}
          </div>
        ))}
      </dl>
    </section>
  )
}

export interface BreakdownItem {
  key:   string
  label: string
  /** Fill of the bar segment. */
  bg:    string
  /** Text colour of the label; each pair is in tests/contrast.test.ts on the muted tile. */
  text:  string
}

/**
 * One distribution as a bar plus a tile per value. The bar is decoration for
 * a sighted reader; the tiles carry the same numbers as text.
 */
export function Breakdown({
  items, data, total, label, lang,
}: {
  items: BreakdownItem[]
  data:  Record<string, number>
  total: number
  label: string
  lang:  Lang
}) {
  return (
    <section className="@container grid content-start gap-4 border-t border-[var(--color-border)] pt-5">
      <h2 className="font-display text-h3 font-[650]">{label}</h2>

      {total > 0 ? (
        <div aria-hidden className="flex h-3 gap-px overflow-hidden rounded-full">
          {items.map(({ key, bg }) => {
            const pct = ((data[key] ?? 0) / total) * 100
            return pct > 0 ? (
              // A width from data has no class; style-src-attr allows it (proxy.ts).
              <div key={key} className={cn(bg, 'transition-all')} style={{ width: `${pct}%` }} />
            ) : null
          })}
        </div>
      ) : (
        <div aria-hidden className="h-3 rounded-full bg-[var(--color-muted)]" />
      )}

      {/* Four columns regardless of the count, two on a narrow container.
          Until 25.08.2026 the rule depended on the count, and with the
          seventh language PT stood alone in a third row. */}
      <dl className="grid grid-cols-2 gap-3 @lg:grid-cols-4">
        {items.map(({ key, label: itemLabel, text }) => (
          <div key={key} className="flex flex-col gap-0.5 rounded-md bg-[var(--color-muted)] px-3 py-2.5">
            <dt className={cn('text-label font-semibold uppercase tracking-[0.08em]', text)}>{itemLabel}</dt>
            <dd className="font-display text-h3 font-bold tabular-nums">{formatNum(data[key] ?? 0, lang)}</dd>
            <dd className="text-small text-[var(--color-muted-foreground)]">
              {total > 0 ? `${(((data[key] ?? 0) / total) * 100).toFixed(1)}%` : '–'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
