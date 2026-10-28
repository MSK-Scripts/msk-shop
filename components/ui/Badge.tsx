import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type BadgeProps = HTMLAttributes<HTMLSpanElement>

/**
 * A tag: the framework or category a product belongs to, in green text on
 * the soft green surface (4.88:1 light, 6.29:1 dark). Every tag has the same
 * colour, whatever ecosystem it names. For the state of a system object
 * ("Running", "Refunded") use `StatusBadge` from components/dashboard.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        // Small radius, not a pill: nothing in the system is a pill.
        'inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-0.5',
        'text-[0.6875rem] font-bold uppercase tracking-wider',
        'bg-[var(--color-accent-soft)] text-[var(--color-primary)] border-transparent',
        className,
      )}
      {...props}
    />
  )
})
