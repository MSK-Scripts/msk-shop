import { describe, expect, it } from 'vitest'

import { DEFAULT_OG_IMAGE, alternatesFor, openGraphFor, plainExcerpt } from '@/lib/seo'

describe('plainExcerpt', () => {
  it('gibt bei leerer Eingabe einen leeren String zurück', () => {
    expect(plainExcerpt(undefined)).toBe('')
    expect(plainExcerpt(null)).toBe('')
    expect(plainExcerpt('')).toBe('')
  })

  it('entfernt Tags und kollabiert Whitespace', () => {
    expect(plainExcerpt('<p>Hallo   <strong>Welt</strong></p>')).toBe('Hallo Welt')
  })

  it('trennt Blöcke, damit Sätze nicht zusammenkleben', () => {
    expect(plainExcerpt('<p>Erster Satz.</p><p>Zweiter Satz.</p>')).toBe('Erster Satz. Zweiter Satz.')
    expect(plainExcerpt('Zeile eins<br>Zeile zwei')).toBe('Zeile eins Zeile zwei')
  })

  it('löst die von Tebex genutzten Entities auf', () => {
    expect(plainExcerpt('Tom &amp; Jerry')).toBe('Tom & Jerry')
    expect(plainExcerpt('a&nbsp;b')).toBe('a b')
    expect(plainExcerpt('&quot;zitiert&quot;')).toBe('"zitiert"')
    expect(plainExcerpt('it&#39;s')).toBe("it's")
    expect(plainExcerpt('it&apos;s')).toBe("it's")
  })

  // CodeQL js/double-escaping: resolving `&amp;` before `&lt;` would turn `&amp;lt;`
  // into a real `<` over two steps.
  it('löst jede Entity nur einmal auf (kein Double-Unescaping)', () => {
    expect(plainExcerpt('&amp;lt;script&amp;gt;')).toBe('&lt;script&gt;')
    expect(plainExcerpt('&amp;amp;')).toBe('&amp;')
  })

  // CodeQL js/incomplete-multi-character-sanitization: a single
  // strip pass leaves a `<script>` behind from `<scr<b>ipt>`.
  it('entfernt Tags auch bei Verschachtelung vollständig', () => {
    expect(plainExcerpt('<scr<b>ipt>alert(1)')).toBe('alert(1)')
    expect(plainExcerpt('<<div>div>Text')).toBe('Text')
  })

  it('lässt escapetes Markup nicht als echtes Markup durch', () => {
    expect(plainExcerpt('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('alert(1)')
  })

  it('kürzt an einer Wortgrenze und hängt ein Auslassungszeichen an', () => {
    const long = 'Wort '.repeat(60).trim()
    const out = plainExcerpt(long, 40)

    expect(out.length).toBeLessThanOrEqual(41) // 40 + ellipsis
    expect(out.endsWith('…')).toBe(true)
    expect(out).not.toMatch(/ …$/) // no space before the character
  })

  it('kürzt nicht, wenn der Text unter der Grenze liegt', () => {
    expect(plainExcerpt('<p>kurz</p>', 40)).toBe('kurz')
  })

  it('schneidet hart ab, wenn es keine brauchbare Wortgrenze gibt', () => {
    const out = plainExcerpt('a'.repeat(50), 20)
    expect(out).toBe(`${'a'.repeat(20)}…`)
  })
})

describe('openGraphFor', () => {
  // Next.js merges metadata only shallowly: without passed-in defaults every
  // page that sets openGraph loses the og:image from the root layout.
  it('gibt die Defaults inklusive Bild mit', () => {
    const og = openGraphFor({ url: '/packages' })

    expect(og.siteName).toBe('MSK Scripts')
    // `type` discriminates the OpenGraph union, so without narrowing it is not
    // directly accessible.
    expect((og as { type?: string }).type).toBe('website')
    expect(og.images).toEqual([
      { url: DEFAULT_OG_IMAGE, width: 1920, height: 1080, alt: 'MSK Scripts' },
    ])
  })

  it('lässt sich pro Seite überschreiben', () => {
    const og = openGraphFor({
      url:    '/packages/1',
      title:  'Paket',
      images: [{ url: 'https://cdn/x.png', alt: 'Paket' }],
    })

    expect(og.title).toBe('Paket')
    expect(og.images).toEqual([{ url: 'https://cdn/x.png', alt: 'Paket' }])
  })
})

/**
 * The crawl of 25.11.2026 reported all 8,669 hreflang annotations as non-200,
 * because `x-default` named the root `/`, which answers 307. And 138 pages of
 * the paginated gallery named page 1 as canonical and in hreflang.
 */
describe('alternatesFor', () => {
  it('names the English version of the same page as x-default, never the root', () => {
    for (const lang of ['en', 'de'] as const) {
      const languages = alternatesFor(lang, '/legal/terms').languages as Record<string, string>
      expect(languages['x-default']).toBe('/en/legal/terms')
      expect(languages['x-default']).not.toBe('/')
    }
  })

  it('carries a page of a list into canonical and every language version', () => {
    const alt = alternatesFor('de', '/tools/images/items', '?page=3')
    expect(alt.canonical).toBe('/de/web-tools/bilder/items?page=3')
    expect(alt.languages).toEqual({
      'en':        '/en/tools/images/items?page=3',
      'de':        '/de/web-tools/bilder/items?page=3',
      'x-default': '/en/tools/images/items?page=3',
    })
  })
})
