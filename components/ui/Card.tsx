import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, hoverLift = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)]',
        'shadow-[var(--shadow-card)] transition-all duration-200',
        hoverLift && 'hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] hover:border-[color-mix(in_oklab,var(--color-primary)_30%,var(--color-border))]',
        className,
      )}
      {...props}
    />
  )
})

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
})

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function CardTitle(
  { className, ...props },
  ref,
) {
  return (
    <h3
      ref={ref}
      className={cn('text-lg font-bold leading-tight tracking-tight', className)}
      {...props}
    />
  )
})

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(function CardDescription(
  { className, ...props },
  ref,
) {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--color-muted-foreground)] leading-relaxed', className)}
      {...props}
    />
  )
})

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
})

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardFooter(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
})
