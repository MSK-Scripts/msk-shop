import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

import { getLegalContent, renderMarkdown } from '@/lib/markdown'

// These tests do not check wording, but two things that go wrong when
// adopting third-party texts and that nobody notices in the browser:
// HTML comments passed through, and a legal text the allowlist does not
// know and that therefore only throws live.

const LEGAL_DIR = path.join(process.cwd(), 'content', 'legal')

const SLUGS = [
  'imprint', 'imprint-de',
  'privacy', 'privacy-de',
  'terms',   'terms-de',
  'widerruf', 'widerruf-de',
  'avv',      'avv-de',
] as const

describe('Rechtstexte', () => {
  it.each(SLUGS)('%s ist ueber die Allowlist lesbar', slug => {
    expect(getLegalContent(slug).length).toBeGreaterThan(500)
  })

  it('weist einen unbekannten Slug ab', () => {
    // The path traversal protection of this file. Without it any file
    // under content/legal could be served.
    expect(() => getLegalContent('../../.env')).toThrow()
  })

  it.each(SLUGS)('%s enthaelt keine HTML-Kommentare', slug => {
    // The source texts carried notes to the editor in <!-- -->. The renderer
    // does not escape HTML, so a leftover comment ended up
    // invisibly in the delivered markup.
    expect(getLegalContent(slug)).not.toContain('<!--')
  })

  it.each(SLUGS)('%s rendert ohne HTML-Kommentar im Ergebnis', slug => {
    expect(renderMarkdown(getLegalContent(slug))).not.toContain('<!--')
  })

  it('traegt in jeder Fassung dasselbe Stand-Datum', () => {
    // Four texts with three different dates are the normal case when
    // nobody looks, and an outdated date devalues the "Stand" (last updated)
    // statement everywhere else too.
    const files = fs.readdirSync(LEGAL_DIR).filter(f => f.endsWith('.md'))
    const stamps = new Set<string>()
    for (const f of files) {
      const text = fs.readFileSync(path.join(LEGAL_DIR, f), 'utf-8')
      const m = text.match(/(?:Stand|Last updated):\s*\**\s*([A-Za-zä]+\s+\d{4})/)
      expect(m, `${f} nennt keinen Stand`).not.toBeNull()
      // Month names differ per language; what is compared is the year
      // plus the position in the calendar via the month index of each
      // version. In practice the year plus "September/September" is enough.
      stamps.add(m![1].replace('September', 'M9'))
    }
    expect(stamps.size, `verschiedene Staende: ${[...stamps].join(', ')}`).toBe(1)
  })
})

describe('renderMarkdown', () => {
  it('macht aus einem Blockquote ein blockquote-Element', () => {
    // Without this branch the text showed a visible '>' before the notice about
    // the right to object under Art. 21 DSGVO.
    const html = renderMarkdown('> **Hinweis:** Text\n> zweite Zeile')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<strong>Hinweis:</strong>')
    expect(html).not.toContain('&gt;')
  })

  it('hebt den Art.-21-Hinweis in beiden Datenschutzfassungen hervor', () => {
    for (const slug of ['privacy', 'privacy-de'] as const) {
      const html = renderMarkdown(getLegalContent(slug))
      expect(html, slug).toContain('<blockquote>')
      // `[\s\S]` instead of the s flag: the build target is below es2018 and
      // rejects `/s`, even though `tsc --noEmit` let it pass.
      expect(html, slug).toMatch(/blockquote>[\s\S]*Art\. 21/)
    }
  })

  it('laesst einen Absatz mit '.concat('>', ' in der Mitte in Ruhe'), () => {
    const html = renderMarkdown('Ein Preis > 5 Euro.')
    expect(html).toContain('<p>')
    expect(html).not.toContain('<blockquote>')
  })
})
