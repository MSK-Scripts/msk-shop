import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Plan 4.7: the shop follows the visitor's system settings for motion,
// contrast and the Windows contrast themes. These rules live in globals.css.
const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

function block(query: string): string {
  const start = css.indexOf(`@media (${query})`)
  expect(start, `no @media (${query}) in globals.css`).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('\n}', start))
}

describe('system preferences', () => {
  it('stops motion when reduced motion is asked for', () => {
    expect(block('prefers-reduced-motion: reduce')).toMatch(/transition-duration:\s*0\.01ms/)
  })

  it('raises secondary text and lines to full strength for more contrast', () => {
    const rules = block('prefers-contrast: more')
    expect(rules).toMatch(/--color-muted-foreground:\s*var\(--color-foreground\)/)
    expect(rules).toMatch(/--color-border:\s*var\(--color-input\)/)
  })

  it('gives controls a system border in forced colours', () => {
    expect(block('forced-colors: active')).toMatch(/border:\s*1px solid ButtonText/)
  })
})
