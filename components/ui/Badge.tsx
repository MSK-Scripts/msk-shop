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
  standalone:
    'bg-[color-mix(in_oklab,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] border-[color-mix(in_oklab,var(--color-primary)_30%,transparent)]',
  // Ökosystem-Badges: Fläche, Rahmen und Text leiten sich aus einem einzigen
  // Token ab. Dadurch prüft `tests/contrast.test.ts` genau das Paar, das auch
  // gerendert wird, statt einer Kopie davon.
  sale:
    'bg-[color-mix(in_oklab,var(--color-badge-sale)_12%,transparent)] text-[var(--color-badge-sale)] border-[color-mix(in_oklab,var(--color-badge-sale)_30%,transparent)]',
  esx:
    'bg-[color-mix(in_oklab,var(--color-badge-esx)_12%,transparent)] text-[var(--color-badge-esx)] border-[color-mix(in_oklab,var(--color-badge-esx)_30%,transparent)]',
  qb:
    'bg-[color-mix(in_oklab,var(--color-badge-qb)_12%,transparent)] text-[var(--color-badge-qb)] border-[color-mix(in_oklab,var(--color-badge-qb)_30%,transparent)]',
  lua:
    'bg-[color-mix(in_oklab,var(--color-badge-lua)_12%,transparent)] text-[var(--color-badge-lua)] border-[color-mix(in_oklab,var(--color-badge-lua)_30%,transparent)]',
  js:
    'bg-[color-mix(in_oklab,var(--color-badge-js)_12%,transparent)] text-[var(--color-badge-js)] border-[color-mix(in_oklab,var(--color-badge-js)_30%,transparent)]',
  ts:
    'bg-[color-mix(in_oklab,var(--color-badge-ts)_12%,transparent)] text-[var(--color-badge-ts)] border-[color-mix(in_oklab,var(--color-badge-ts)_30%,transparent)]',
  py:
    'bg-[color-mix(in_oklab,var(--color-badge-py)_12%,transparent)] text-[var(--color-badge-py)] border-[color-mix(in_oklab,var(--color-badge-py)_30%,transparent)]',
  discord:
    'bg-[color-mix(in_oklab,var(--color-badge-discord)_12%,transparent)] text-[var(--color-badge-discord)] border-[color-mix(in_oklab,var(--color-badge-discord)_30%,transparent)]',
  fivem:
    'bg-[color-mix(in_oklab,var(--color-badge-fivem)_12%,transparent)] text-[var(--color-badge-fivem)] border-[color-mix(in_oklab,var(--color-badge-fivem)_30%,transparent)]',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'default', className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        // `rounded-sm` statt `rounded-full`: das Badge war die einzige Pille im
        // System, und DESIGN.md sagt ausdrücklich, nichts ist eine Pille.
        'inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-0.5',
        'text-[0.6875rem] font-bold uppercase tracking-wider',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
})
