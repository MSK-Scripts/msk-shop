import type { ReactNode } from 'react'

import { CheckCircle, Info, Warning, X, XCircle, type IconComponent } from '@/components/icons'
import { cn } from '@/lib/utils'

export type NoticeTone = 'success' | 'warning' | 'danger' | 'info'

const TONE: Record<NoticeTone, { bar: string; text: string; icon: IconComponent }> = {
  success: { bar: 'border-[var(--color-success)]', text: 'text-[var(--color-success)]', icon: CheckCircle },
  warning: { bar: 'border-[var(--color-warning)]', text: 'text-[var(--color-warning)]', icon: Warning },
  danger:  { bar: 'border-[var(--color-danger)]',  text: 'text-[var(--color-danger)]',  icon: XCircle },
  info:    { bar: 'border-[var(--color-info)]',    text: 'text-[var(--color-info)]',    icon: Info },
}

/**
 * A message inside a dashboard page (plan 6.3, "Meldungen"): the result of an
 * action, a warning, a step that is still open.
 *
 * Tone in three features, never colour alone: the sign, the coloured bar and
 * a title in the tone's colour. The body stays in the normal text colours, so
 * longer text reads at full contrast. `role` is for messages that appear
 * after an action: `status` announces politely, `alert` interrupts and is for
 * errors and deadlines only.
 */
export function Notice({ tone, title, children, action, role, onDismiss, dismissLabel, className }: {
  tone: NoticeTone
  title?: ReactNode
  children?: ReactNode
  /** One next step: a button or a link. */
  action?: ReactNode
  role?: 'status' | 'alert'
  onDismiss?: () => void
  /** Name of the dismiss button, in the language of the page. */
  dismissLabel?: string
  className?: string
}) {
  const { bar, text, icon: Icon } = TONE[tone]
  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-3 rounded-md border-l-4 bg-[var(--color-muted)] px-4 py-3',
        bar,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', text)} weight="bold" />
      <div className="grid min-w-0 flex-1 gap-1">
        {title && <p className={cn('max-w-[65ch] font-semibold', text)}>{title}</p>}
        {/* Running text stays at a readable width; a copy field or a log
            inside the notice may use the full width. */}
        {children != null && children !== false && (
          <div className="min-w-0 text-small text-[var(--color-foreground)] [&_p]:max-w-[65ch]">
            {typeof children === 'string' || typeof children === 'number' ? <p>{children}</p> : children}
          </div>
        )}
        {action && <div className="mt-1.5 flex flex-wrap gap-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="tap-target -m-1 shrink-0 rounded-sm p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
