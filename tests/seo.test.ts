import { describe, expect, it } from 'vitest'

import { DEFAULT_OG_IMAGE, openGraphFor, packageImage, plainExcerpt } from '@/lib/seo'

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

  // CodeQL js/double-escaping: `&amp;` vor `&lt;` aufzulösen würde `&amp;lt;`
  // über zwei Schritte zu einem echten `<` machen.
  it('löst jede Entity nur einmal auf (kein Double-Unescaping)', () => {
    expect(plainExcerpt('&amp;lt;script&amp;gt;')).toBe('&lt;script&gt;')
    expect(plainExcerpt('&amp;amp;')).toBe('&amp;')
  })

  // CodeQL js/incomplete-multi-character-sanitization: ein einzelner
  // Strip-Durchlauf lässt aus `<scr<b>ipt>` ein `<script>` zurück.
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

    expect(out.length).toBeLessThanOrEqual(41) // 40 + Auslassungszeichen
    expect(out.endsWith('…')).toBe(true)
    expect(out).not.toMatch(/ …$/) // kein Leerzeichen vor dem Zeichen
  })

  it('kürzt nicht, wenn der Text unter der Grenze liegt', () => {
    expect(plainExcerpt('<p>kurz</p>', 40)).toBe('kurz')
  })

  it('schneidet hart ab, wenn es keine brauchbare Wortgrenze gibt', () => {
    const out = plainExcerpt('a'.repeat(50), 20)
    expect(out).toBe(`${'a'.repeat(20)}…`)
  })
})

describe('packageImage', () => {
  it('bevorzugt das explizite image-Feld', () => {
    expect(packageImage({ image: 'https://cdn/a.png', media: [] })).toBe('https://cdn/a.png')
  })

  it('nimmt sonst das als primär markierte Medium', () => {
    expect(packageImage({
      image: undefined,
      media: [
        { type: 'image', name: 'b', url: 'https://cdn/b.png', primary: false },
        { type: 'image', name: 'c', url: 'https://cdn/c.png', primary: true },
      ],
    })).toBe('https://cdn/c.png')
  })

  it('nimmt sonst das erste Medium', () => {
    expect(packageImage({
      image: undefined,
      media: [{ type: 'image', name: 'b', url: 'https://cdn/b.png', primary: false }],
    })).toBe('https://cdn/b.png')
  })

  it('fällt auf das Seiten-Banner zurück', () => {
    expect(packageImage({ image: undefined, media: [] })).toBe(DEFAULT_OG_IMAGE)
    // media kann laut Tebex-Response fehlen
    expect(packageImage({ image: undefined, media: undefined as never })).toBe(DEFAULT_OG_IMAGE)
  })
})

describe('openGraphFor', () => {
  // Next.js merged metadata nur flach: Ohne mitgegebene Defaults verliert jede
  // Seite, die openGraph setzt, das og:image aus dem Root-Layout.
  it('gibt die Defaults inklusive Bild mit', () => {
    const og = openGraphFor({ url: '/packages' })

    expect(og.siteName).toBe('MSK Scripts')
    // `type` diskriminiert die OpenGraph-Union, ist ohne Narrowing also nicht
    // direkt zugreifbar.
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
