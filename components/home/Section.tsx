import type { ReactNode } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight } from '@/components/icons'
import { cn } from '@/lib/utils'

/**
 * Frame of a home page section (sample page of Phase 0): kicker, heading and
 * a short intro, then the content. From 1600 px the head stands left of the
 * content and stays in view while the content scrolls (plan 4.7); below that
 * they stack. The content is a size container, so its grids follow their own
 * width instead of the window's.
 */
export function Section({
  id, kicker, title, intro, action, children, className,
}: {
  id: string
  kicker: string
  title: string
  intro?: string
  /** Links that lead deeper, below the intro. */
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section aria-labelledby={id} className={cn('border-t border-[var(--color-border)] py-[var(--space-section)]', className)}>
      <div className="container-page grid gap-[var(--space-stack)] min-[1600px]:grid-cols-[clamp(20rem,22vw,36rem)_minmax(0,1fr)] min-[1600px]:gap-x-[clamp(3rem,4vw,8rem)]">
        <div className="grid content-start gap-2.5 self-start min-[1600px]:sticky min-[1600px]:top-[calc(var(--header-height)+2rem)]">
          <span className="kicker">{kicker}</span>
          <h2 id={id} className="text-h2 font-bold tracking-[-0.015em]">{title}</h2>
          {intro && <p className="max-w-[34rem] text-[var(--color-muted-foreground)]">{intro}</p>}
          {action && <div className="flex flex-wrap gap-x-6">{action}</div>}
        </div>
        <div className="@container min-w-0">{children}</div>
      </div>
    </section>
  )
}

/** The third level of the button hierarchy: a green text link with an arrow. */
export function TextLink({
  href, children, prefetch, external,
}: {
  href: string
  children: ReactNode
  prefetch?: false
  external?: { newTab: string }
}) {
  const cls = 'group inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline'
  const arrow = <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-[3px]" />
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        {arrow}
        <span className="sr-only"> {external.newTab}</span>
      </a>
    )
  }
  return <Link href={href} prefetch={prefetch} className={cls}>{children}{arrow}</Link>
}
