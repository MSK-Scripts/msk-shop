import { describe, it, expect } from 'vitest'
import { sanitizeTebexHtml, pickLanguageBlock } from '@/lib/sanitize'

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

describe('pickLanguageBlock', () => {
  // Die echte Struktur der Tebex-Kategorietexte, abgerufen am 22.08.2026.
  const REAL =
    '<p><strong>[GER]</strong></p>'
    + '<p>In diesen Paketen ist alles verschlüsselt außer config.lua</p>'
    + '<p><strong>[ENG]</strong></p>'
    + '<p>In these packages all is encrypted except config.lua</p>'

  it('nimmt den deutschen Block und lässt den englischen weg', () => {
    const out = pickLanguageBlock(REAL, 'de')
    expect(out).toContain('In diesen Paketen')
    expect(out).not.toContain('In these packages')
    expect(out).not.toContain('[ENG]')
  })

  it('nimmt den englischen Block und lässt den deutschen weg', () => {
    const out = pickLanguageBlock(REAL, 'en')
    expect(out).toContain('In these packages')
    expect(out).not.toContain('In diesen Paketen')
    expect(out).not.toContain('[GER]')
  })

  it('lässt verwaiste Tag-Ränder nicht stehen', () => {
    // Der Schnitt beginnt hinter `[GER]` und endet vor `[ENG]`, also direkt
    // zwischen `</strong></p>` und `<p><strong>`.
    const out = pickLanguageBlock(REAL, 'de')
    expect(out.startsWith('</strong>')).toBe(false)
    expect(out.endsWith('<strong>')).toBe(false)
    expect(out).toBe('<p>In diesen Paketen ist alles verschlüsselt außer config.lua</p>')
  })

  it('lässt einen Text ohne Marker unangetastet', () => {
    const plain = '<p>Nur ein einsprachiger Text</p>'
    expect(pickLanguageBlock(plain, 'de')).toBe(plain)
    expect(pickLanguageBlock(plain, 'en')).toBe(plain)
  })

  it('lässt den Text unangetastet, wenn nur ein Marker da ist', () => {
    const half = '<p><strong>[GER]</strong></p><p>Nur deutsch</p>'
    expect(pickLanguageBlock(half, 'en')).toBe(half)
    expect(pickLanguageBlock(half, 'de')).toBe(half)
  })

  it('kommt mit umgekehrter Reihenfolge klar', () => {
    const reversed =
      '<p>[ENG]</p><p>English first</p><p>[GER]</p><p>Deutsch danach</p>'
    expect(pickLanguageBlock(reversed, 'en')).toContain('English first')
    expect(pickLanguageBlock(reversed, 'en')).not.toContain('Deutsch danach')
    expect(pickLanguageBlock(reversed, 'de')).toContain('Deutsch danach')
    expect(pickLanguageBlock(reversed, 'de')).not.toContain('English first')
  })

  it('überlebt den Weg durch sanitizeTebexHtml', () => {
    const out = sanitizeTebexHtml(pickLanguageBlock(REAL, 'de'))
    expect(out).toContain('In diesen Paketen')
    expect(out).not.toContain('[ENG]')
    expect(out).not.toContain('<p></p>')
  })
})
