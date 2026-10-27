import { Slot } from '@radix-ui/react-slot'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'discord' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

// One main action per area in green (primary), the second one outlined, the
// third a text link. Red only in confirmation dialogs.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]',
  secondary:
    'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)]',
  outline:
    'border-[1.5px] border-[var(--color-input)] bg-transparent text-[var(--color-foreground)] hover:border-[var(--color-foreground)]',
  ghost:
    'bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
  link:
    'bg-transparent text-[var(--color-primary)] hover:underline underline-offset-4 p-0 min-h-0 h-auto',
  discord:
    'bg-[var(--color-discord)] text-white hover:brightness-110',
  danger:
    'bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:brightness-95',
}

// Heights are minimums, so a long German label wraps instead of being cut.
// md and lg reach the 44 px touch target, sm (36 px) is for tables and
// dashboards, icon keeps 40 px visible plus the 44 px tap-target area.
const sizeClasses: Record<ButtonSize, string> = {
  sm:   'min-h-9  px-3.5 py-1.5 text-sm   gap-1.5 rounded-md',
  md:   'min-h-11 px-4.5 py-2   text-base gap-2   rounded-md',
  lg:   'min-h-12 px-6   py-2.5 text-lead gap-2   rounded-md',
  icon: 'h-10 w-10                        rounded-md tap-target',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', asChild = false, className, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(
        // Focus uses the global 3 px outline from globals.css.
        'inline-flex items-center justify-center text-center leading-tight font-semibold transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
})
