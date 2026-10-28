import { useId, type ReactNode } from 'react'

import { WarningCircle } from '@/components/icons'
import { cn } from '@/lib/utils'

/** What a field needs to be tied to its label, hint and error. */
export interface FieldProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  required?: boolean
}

/**
 * Label, hint, field and error in one column (plan 4.7, 6.3).
 *
 * The field comes as a render function, so any control (Input, Select, a
 * textarea, a group of radios) gets the same wiring: the label points at it,
 * hint and error are its description, and an error sets `aria-invalid`. The
 * error sits at the field and keeps what was typed (NN/g).
 */
export function FormField({ label, hint, error, required, className, children }: {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: (field: FieldProps) => ReactNode
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <label htmlFor={id} className="font-semibold">
        {label}
        {required && <span aria-hidden className="text-[var(--color-danger)]"> *</span>}
      </label>
      {hint && <p id={hintId} className="text-small text-[var(--color-muted-foreground)]">{hint}</p>}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-small font-semibold text-[var(--color-danger)]">
          <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * A group of fields with a heading and a line below it (Shopify settings):
 * the explanation beside the fields where there is room, above them where
 * there is not (container query).
 */
export function FormSection({ title, description, children, className }: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={cn('@container border-t border-[var(--color-border)] py-6 first:border-t-0 first:pt-0', className)}>
      <div className="grid gap-x-10 gap-y-4 @3xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-1">
          <h2 id={id} className="font-display text-h3 font-[650]">{title}</h2>
          {description && <p className="max-w-[45ch] text-small text-[var(--color-muted-foreground)]">{description}</p>}
        </div>
        <div className="grid gap-5">{children}</div>
      </div>
    </section>
  )
}
