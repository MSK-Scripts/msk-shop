import type { ReactNode } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CaretRight } from '@/components/icons'
import type { Crumb } from '@/components/page/PageHero'
import { cn } from '@/lib/utils'

/**
 * The head of a task page on the light ground: cart, checkout, sign-in,
 * account and the three legal forms. Breadcrumb, an optional green kicker
 * (plan 4.4), the heading and a lead.
 *
 * Not the anthracite PageHero: these pages are a step in a task, and a band
 * of a third of the screen would push the task itself below the first
 * screen on a phone. The heading keeps the display size of every H1 (plan
 * 4.7); the lead keeps its measure on UWQHD.
 */
export function PageHead({
  id, crumbs, kicker, title, lead, children, className, breadcrumbLabel = 'Breadcrumb',
}: {
  /** Id of the h1. */
  id: string
  crumbs?: Crumb[]
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  /** Below the lead, e.g. a status line. */
  children?: ReactNode
  className?: string
  breadcrumbLabel?: string
}) {
  return (
    <header className={cn('grid gap-[clamp(0.75rem,0.5rem+0.6vw,1.5rem)]', className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label={breadcrumbLabel} className="text-small text-[var(--color-muted-foreground)]">
          <ol className="flex flex-wrap items-center gap-x-1.5">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex items-center gap-x-1.5">
                {i > 0 && <CaretRight className="h-3 w-3" />}
                {c.href ? (
                  <Link
                    href={c.href}
                    className="inline-flex min-h-11 items-center underline-offset-4 hover:text-[var(--color-foreground)] hover:underline"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="inline-flex min-h-11 items-center text-[var(--color-foreground)]">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="grid gap-2.5">
        {kicker && <span className="kicker">{kicker}</span>}
        <h1 id={id} className="max-w-[24ch] text-display font-[750] tracking-[-0.02em] text-balance">{title}</h1>
      </div>
      {lead && <p className="max-w-[40rem] text-lead text-[var(--color-muted-foreground)]">{lead}</p>}
      {children}
    </header>
  )
}
