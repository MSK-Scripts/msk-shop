import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean
}

/**
 * A surface for something that is clicked or that holds a task of its own
 * (a form, a buy box). Groups of facts are built from spacing and hairlines
 * instead, see components/page/FactList. The padding is set by the caller.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, hoverLift = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)]',
        'shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-150',
        // A clickable card answers with a green border and a shadow, it does not jump.
        hoverLift && 'hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-primary)]',
        className,
      )}
      {...props}
    />
  )
})
