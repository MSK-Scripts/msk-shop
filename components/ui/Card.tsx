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
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)]',
        'shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-150',
        // A clickable card answers with a green border and a shadow, it does not jump.
        hoverLift && 'hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-primary)]',
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
