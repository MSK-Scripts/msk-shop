import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ArrowRight } from '@/components/icons'

// Icons are decorative unless they carry a label. Phosphor itself sets no
// aria-hidden, so without the wrapper every icon would reach screen readers
// as an unnamed graphic.
describe('icons', () => {
  it('hides a decorative icon from screen readers', () => {
    const html = renderToStaticMarkup(createElement(ArrowRight))
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('focusable="false"')
  })

  it('announces an icon that has a label', () => {
    const html = renderToStaticMarkup(createElement(ArrowRight, { 'aria-label': 'Next' }))
    expect(html).toContain('aria-label="Next"')
    expect(html).not.toContain('aria-hidden')
  })
})
