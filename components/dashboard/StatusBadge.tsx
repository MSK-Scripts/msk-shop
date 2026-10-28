import type { ReactNode } from 'react'

import { CheckCircle, Info, Minus, Warning, XCircle, type IconComponent } from '@/components/icons'
import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const TONE: Record<StatusTone, { className: string; icon: IconComponent }> = {
  // Word and border in the status colour. Every status colour reaches 4.5:1
  // on card and ground in both themes (plan 4.4), the 8 % tint below keeps
  // that, and the border is the 3:1 a control needs.
  success: { className: 'text-[var(--color-success)] border-[var(--color-success)] bg-[color-mix(in_oklab,var(--color-success)_8%,transparent)]', icon: CheckCircle },
  warning: { className: 'text-[var(--color-warning)] border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_8%,transparent)]', icon: Warning },
  danger:  { className: 'text-[var(--color-danger)] border-[var(--color-danger)] bg-[color-mix(in_oklab,var(--color-danger)_8%,transparent)]', icon: XCircle },
  info:    { className: 'text-[var(--color-info)] border-[var(--color-info)] bg-[color-mix(in_oklab,var(--color-info)_8%,transparent)]', icon: Info },
  neutral: { className: 'text-[var(--color-muted-foreground)] border-[var(--color-input)] bg-transparent', icon: Minus },
}

/**
 * State of a system object: "Running", "Refunded", "Pending DNS" (plan 6.3).
 *
 * Always a word and a sign, never colour alone (WCAG 1.4.1): the icon is the
 * second feature, the border the third. Same state, same tone across the
 * three dashboards. Only for system states, not for categories or tags; those
 * are `Badge` from components/ui.
 */
export function StatusBadge({ tone, children, icon, className }: {
  tone: StatusTone
  /** One or two words, a participle where it fits ("Stopped", "Erstattet"). */
  children: ReactNode
  /** A sign of its own for this state; the tone's sign otherwise. */
  icon?: IconComponent
  className?: string
}) {
  const { className: toneClass, icon: ToneIcon } = TONE[tone]
  const Icon = icon ?? ToneIcon
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-sm border-[1.5px] px-2 py-0.5 text-small font-semibold leading-tight',
        toneClass,
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" weight="bold" />
      {children}
    </span>
  )
}
