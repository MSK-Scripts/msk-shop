import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * Loading-Placeholder mit subtilem Pulse-Effekt.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--color-muted)]',
        className,
      )}
      {...props}
    />
  )
}
