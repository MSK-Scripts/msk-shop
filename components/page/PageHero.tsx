import { Fragment, type ReactNode } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight, CaretRight, Check } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  /** Internal path; the last crumb, the page itself, has none. */
  href?: string
}

/**
 * The head of a page on the anthracite band (sample page of Phase 0, plan
 * 4.4): kicker, the heading with its brand words in the band green, a lead,
 * the actions. From 1280 px an aside stands to the right of the heading,
 * as in the home page hero (plan 4.7).
 *
 * Heading and lead keep their measure on UWQHD: the heading at 20 characters
 * of display size, the lead at 46, below the 65 the plan allows.
 */
export function PageHero({
  id, kicker, title, lead, actions, aside, crumbs, children, breadcrumbLabel = 'Breadcrumb',
}: {
  /** Id of the h1, which names the section. */
  id: string
  /** Green label above the heading. Left out where green would claim a
      success that is not there (e.g. statistics that are unavailable). */
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  actions?: ReactNode
  aside?: ReactNode
  crumbs?: Crumb[]
  /** Below the actions: a proof line, the language switch. */
  children?: ReactNode
  breadcrumbLabel?: string
}) {
  return (
    <section aria-labelledby={id} className="surface-band">
      <div
        className={cn(
          'container-page grid gap-[var(--space-stack)] py-[clamp(2.5rem,1.5rem+4vw,9rem)]',
          aside && 'min-[1280px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] min-[1280px]:items-end min-[1280px]:gap-x-[clamp(3rem,5vw,10rem)]',
        )}
      >
        <div className="grid min-w-0 content-start gap-[clamp(1rem,0.5rem+1vw,2rem)]">
          {crumbs && crumbs.length > 0 && (
            <nav aria-label={breadcrumbLabel} className="text-small text-[var(--color-band-muted)]">
              <ol className="flex flex-wrap items-center gap-x-1.5">
                {crumbs.map((c, i) => (
                  <li key={c.label} className="flex items-center gap-x-1.5">
                    {i > 0 && <CaretRight className="h-3 w-3" />}
                    {c.href ? (
                      <Link
                        href={c.href}
                        className="inline-flex min-h-11 items-center underline-offset-4 hover:text-[var(--color-band-foreground)] hover:underline"
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current="page" className="inline-flex min-h-11 items-center text-[var(--color-band-foreground)]">{c.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="grid gap-2.5">
            {kicker && <span className="kicker">{kicker}</span>}
            <h1 id={id} className="max-w-[20ch] text-display font-[750] tracking-[-0.02em] text-balance">
              {title}
            </h1>
          </div>
          {lead && <p className="max-w-[46ch] text-lead text-[var(--color-band-muted)]">{lead}</p>}
          {actions && <div className="flex flex-wrap items-center gap-x-5 gap-y-3">{actions}</div>}
          {children}
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </section>
  )
}

/** A brand word in the heading, in the band green (plan 4.4). */
export function Accent({ children }: { children: ReactNode }) {
  return <em className="not-italic text-[var(--color-band-accent)]">{children}</em>
}

const BRAND_WORDS: Record<string, string> = { fivem: 'FiveM', discord: 'Discord' }

/** A heading from a translation, its `{fivem}` and `{discord}` set as brand words. */
export function BrandTitle({ template }: { template: string }) {
  return template.split(/\{(fivem|discord)\}/).map((part, i) =>
    i % 2 === 1 ? <Accent key={i}>{BRAND_WORDS[part]}</Accent> : <Fragment key={i}>{part}</Fragment>,
  )
}

/**
 * Links beside the heading, one row each, as in the entry list of the home
 * page hero: title, a line under it, an arrow. An `href` starting with `#`
 * jumps within the page.
 */
export function HeroLinks({
  label, links,
}: {
  label: string
  links: Array<{ href: string; title: string; sub?: string; price?: string }>
}) {
  return (
    <nav aria-label={label} className="border-t-2 border-[var(--color-band-accent)]">
      <ul>
        {links.map(l => {
          const cls = 'group flex min-h-16 items-center justify-between gap-3 border-b border-[var(--color-band-line)] px-1 py-3.5 text-[var(--color-band-foreground)]'
          const body = (
            <>
              <span className="grid gap-0.5">
                <span className="font-display text-h3 font-[650] group-hover:text-[var(--color-band-accent)]">{l.title}</span>
                {l.sub && <span className="text-small text-[var(--color-band-muted)]">{l.sub}</span>}
                {l.price && <span className="text-small font-semibold tabular-nums">{l.price}</span>}
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-band-accent)] transition-transform duration-150 group-hover:translate-x-[3px]" />
            </>
          )
          return (
            <li key={l.href}>
              {/* A jump within the page is a plain anchor; LocaleLink is for paths. */}
              {l.href.startsWith('#')
                ? <a href={l.href} className={cls}>{body}</a>
                : <Link href={l.href} className={cls}>{body}</Link>}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * The facts beside the heading: a line in band green on top, one row per
 * fact, a check mark in front of each. Same frame as the entry list of the
 * home page hero, so the two heads read as one family.
 */
export function HeroFacts({
  label, lead, items,
}: {
  label: string
  /** First row, set larger: usually the price. */
  lead?: ReactNode
  items: string[]
}) {
  return (
    <div className="border-t-2 border-[var(--color-band-accent)]">
      {lead && (
        <p className="border-b border-[var(--color-band-line)] px-1 py-3.5 font-display text-h3 font-[650] tabular-nums">
          {lead}
        </p>
      )}
      <ul aria-label={label}>
        {items.map(item => (
          <li key={item} className="flex items-start gap-2.5 border-b border-[var(--color-band-line)] px-1 py-3">
            <Check className="mt-[0.3em] h-4 w-4 shrink-0 text-[var(--color-band-accent)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
