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

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-110 active:scale-[0.98] shadow-sm',
  secondary:
    'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)]',
  outline:
    'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
  ghost:
    'bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
  link:
    'bg-transparent text-[var(--color-primary)] hover:underline underline-offset-4 p-0 h-auto',
  discord:
    'bg-[var(--color-discord)] text-white hover:brightness-110 shadow-sm',
  danger:
    'bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:brightness-110 shadow-sm',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm:   'h-8  px-3 text-xs   gap-1.5 rounded-md',
  md:   'h-10 px-4 text-sm   gap-2   rounded-md',
  lg:   'h-12 px-6 text-base gap-2   rounded-md',
  icon: 'h-10 w-10           rounded-md',
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
        'inline-flex items-center justify-center font-medium transition-all duration-150 whitespace-nowrap',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
})
