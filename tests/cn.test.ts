import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

/**
 * `cn` merges class lists and drops the loser of a conflict. It has to know
 * the type scale of globals.css as font sizes: taken for colours, `text-lead`
 * removed the label colour of every large button (found 28.10.2026).
 */
describe('cn', () => {
  it('keeps a text colour next to a size of the type scale', () => {
    const merged = cn('text-[var(--color-primary-foreground)] text-base', 'text-lead')
    expect(merged).toContain('text-[var(--color-primary-foreground)]')
    expect(merged).toContain('text-lead')
    expect(merged).not.toContain('text-base')
  })

  it('still lets the later of two scale sizes win', () => {
    expect(cn('text-small', 'text-label')).toBe('text-label')
  })
})
