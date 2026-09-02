import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

import { getLegalContent, renderMarkdown } from '@/lib/markdown'

// Diese Tests pruefen nicht Formulierungen, sondern zwei Dinge, die beim
// Uebernehmen fremder Texte schiefgehen und die niemand im Browser bemerkt:
// durchgereichte HTML-Kommentare und ein Rechtstext, den die Allowlist nicht
// kennt und der deshalb erst live wirft.

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
    // Der Pfad-Traversal-Schutz dieser Datei. Ohne ihn liesse sich jede Datei
    // unter content/legal ausliefern.
    expect(() => getLegalContent('../../.env')).toThrow()
  })

  it.each(SLUGS)('%s enthaelt keine HTML-Kommentare', slug => {
    // Die Quelltexte trugen Hinweise an den Bearbeiter in <!-- -->. Der Renderer
    // escaped kein HTML, ein stehengebliebener Kommentar landete also
    // unsichtbar im ausgelieferten Markup.
    expect(getLegalContent(slug)).not.toContain('<!--')
  })

  it.each(SLUGS)('%s rendert ohne HTML-Kommentar im Ergebnis', slug => {
    expect(renderMarkdown(getLegalContent(slug))).not.toContain('<!--')
  })

  it('traegt in jeder Fassung dasselbe Stand-Datum', () => {
    // Vier Texte mit drei verschiedenen Staenden sind der Normalfall, wenn
    // niemand darauf schaut, und ein veraltetes Datum entwertet die Aussage
    // "Stand" ueberall sonst mit.
    const files = fs.readdirSync(LEGAL_DIR).filter(f => f.endsWith('.md'))
    const stamps = new Set<string>()
    for (const f of files) {
      const text = fs.readFileSync(path.join(LEGAL_DIR, f), 'utf-8')
      const m = text.match(/(?:Stand|Last updated):\s*\**\s*([A-Za-zä]+\s+\d{4})/)
      expect(m, `${f} nennt keinen Stand`).not.toBeNull()
      // Monatsnamen unterscheiden sich je Sprache, verglichen wird das Jahr
      // plus die Position im Kalender ueber den Monatsindex der jeweiligen
      // Fassung — praktisch reicht das Jahr plus "September/September".
      stamps.add(m![1].replace('September', 'M9'))
    }
    expect(stamps.size, `verschiedene Staende: ${[...stamps].join(', ')}`).toBe(1)
  })
})

describe('renderMarkdown', () => {
  it('macht aus einem Blockquote ein blockquote-Element', () => {
    // Ohne diesen Zweig stand im Text ein sichtbares '>' vor dem Hinweis auf
    // das Widerspruchsrecht nach Art. 21 DSGVO.
    const html = renderMarkdown('> **Hinweis:** Text\n> zweite Zeile')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<strong>Hinweis:</strong>')
    expect(html).not.toContain('&gt;')
  })

  it('hebt den Art.-21-Hinweis in beiden Datenschutzfassungen hervor', () => {
    for (const slug of ['privacy', 'privacy-de'] as const) {
      const html = renderMarkdown(getLegalContent(slug))
      expect(html, slug).toContain('<blockquote>')
      // `[\s\S]` statt des s-Flags: das Build-Target liegt unter es2018 und
      // lehnt `/s` ab, obwohl `tsc --noEmit` es durchgehen liess.
      expect(html, slug).toMatch(/blockquote>[\s\S]*Art\. 21/)
    }
  })

  it('laesst einen Absatz mit '.concat('>', ' in der Mitte in Ruhe'), () => {
    const html = renderMarkdown('Ein Preis > 5 Euro.')
    expect(html).toContain('<p>')
    expect(html).not.toContain('<blockquote>')
  })
})
