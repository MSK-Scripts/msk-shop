import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5',
        'text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
        'outline-none transition-all duration-150',
        'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-primary)_25%,transparent)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
})
