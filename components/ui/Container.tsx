import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'page' | 'prose'
}

/**
 * Wrapper-Komponente für konsistente Container-Breite und Edge-Padding.
 *  - `page`  → max-w-7xl (1280 px), Standard-Seiten-Layout
 *  - `prose` → max-w-prose (≈65 ch), für Rechtstexte / Fließtexte
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { size = 'page', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        size === 'page' ? 'container-page' : 'container-prose',
        className,
      )}
      {...props}
    />
  )
})
