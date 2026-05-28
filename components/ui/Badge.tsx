import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'outline'
  | 'sale'
  | 'esx'
  | 'qb'
  | 'lua'
  | 'js'
  | 'ts'
  | 'py'
  | 'standalone'
  | 'discord'
  | 'fivem'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] border-[var(--color-border)]',
  primary:
    'bg-[color-mix(in_oklab,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] border-[color-mix(in_oklab,var(--color-primary)_30%,transparent)]',
  outline:
    'bg-transparent text-[var(--color-muted-foreground)] border-[var(--color-border)]',
  sale:
    'bg-red-500/10 text-red-500 border-red-500/30',
  esx:
    'bg-[#F7941D]/12 text-[#F7941D] border-[#F7941D]/30',
  qb:
    'bg-purple-500/12 text-purple-400 border-purple-500/30',
  lua:
    'bg-blue-500/12 text-blue-400 border-blue-500/30',
  js:
    'bg-yellow-500/12 text-yellow-400 border-yellow-500/30',
  ts:
    'bg-[#3178C6]/12 text-[#5b9fe3] border-[#3178C6]/30',
  py:
    'bg-sky-500/12 text-sky-400 border-sky-500/30',
  standalone:
    'bg-[color-mix(in_oklab,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] border-[color-mix(in_oklab,var(--color-primary)_30%,transparent)]',
  discord:
    'bg-indigo-500/12 text-indigo-400 border-indigo-500/30',
  fivem:
    'bg-orange-500/12 text-orange-400 border-orange-500/30',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'default', className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-[0.6875rem] font-bold uppercase tracking-wider',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
})
