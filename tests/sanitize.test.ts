import { describe, it, expect } from 'vitest'
import { sanitizeTebexHtml } from '@/lib/sanitize'

describe('sanitizeTebexHtml', () => {
  it('strips script tags and inline event handlers', () => {
    const out = sanitizeTebexHtml('<p onclick="evil()">hello</p><script>steal()</script>')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('onclick')
    expect(out).toContain('hello')
  })

  it('drops javascript: URLs but keeps safe links and forces rel', () => {
    expect(sanitizeTebexHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:')
    const safe = sanitizeTebexHtml('<a href="https://msk-scripts.de">x</a>')
    expect(safe).toContain('href="https://msk-scripts.de"')
    expect(safe).toContain('rel="noopener noreferrer"')
  })

  it('replaces known emoji shortcodes and leaves unknown ones untouched', () => {
    const out = sanitizeTebexHtml('<p>:rocket: :notacode:</p>')
    expect(out).toContain('🚀')
    expect(out).toContain(':notacode:')
  })

  it('rebuilds a GFM pipe table into a real table', () => {
    const out = sanitizeTebexHtml('<p>| A | B |\n| --- | --- |\n| 1 | 2 |</p>')
    expect(out).toContain('<table>')
    expect(out).toContain('<thead>')
    expect(out).toContain('<th>A</th>')
    expect(out).toContain('<td>1</td>')
  })

  it('handles null/undefined input', () => {
    expect(sanitizeTebexHtml(null)).toBe('')
    expect(sanitizeTebexHtml(undefined)).toBe('')
  })
})
