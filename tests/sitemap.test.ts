import { describe, it, expect } from 'vitest'

import { buildSitemapEntries, renderSitemapXml, type SitemapEntry } from '@/lib/sitemap'

const BASE = 'https://www.msk-scripts.de'

const find = (entries: SitemapEntry[], url: string) => entries.find(e => e.url === url)

describe('buildSitemapEntries', () => {
  it('gibt statischen Seiten kein lastmod', async () => {
    const entries = await buildSitemapEntries()

    for (const path of ['/en', '/de', '/en/fivem/free', '/en/stats', '/de/statistiken', '/en/legal/terms', '/de/rechtliches/impressum']) {
      expect(find(entries, `${BASE}${path}`)?.lastModified, path).toBeUndefined()
    }
  })

  it('nennt für alle vier Bot-Landingpages en, de und x-default', async () => {
    const entries = await buildSitemapEntries()

    for (const [path, rest] of [
      ['/en/discord/ticket-bot',   '/discord/ticket-bot'],
      ['/de/discord/ticket-bot',   '/discord/ticket-bot'],
      ['/en/discord/giveaway-bot', '/discord/giveaway-bot'],
      ['/de/discord/giveaway-bot', '/discord/giveaway-bot'],
    ] as const) {
      expect(find(entries, `${BASE}${path}`)?.alternates, path).toEqual({
        'en':        `${BASE}/en${rest}`,
        'de':        `${BASE}/de${rest}`,
        // The root picks the language and redirects.
        'x-default': `${BASE}/`,
      })
    }
  })

  it('lists every page under its own address in both languages', async () => {
    const entries = await buildSitemapEntries()

    // The German entry carries the German words, not the English folder name.
    expect(find(entries, `${BASE}/de/rechtliches/agb`)?.alternates).toEqual({
      'en':        `${BASE}/en/legal/terms`,
      'de':        `${BASE}/de/rechtliches/agb`,
      'x-default': `${BASE}/`,
    })
    expect(find(entries, `${BASE}/de/legal/terms`)).toBeUndefined()
    // No address without a language: those only redirect.
    expect(entries.filter(e => !/^https:\/\/www\.msk-scripts\.de\/(en|de)(\/|$)/.test(e.url))).toEqual([])
  })

  // Since 05.11.2026 every FiveM script is free on GitHub. The catalogue,
  // the product and category pages, cart and checkout only redirect now, so
  // none of them belongs in the sitemap; the free scripts page is the one
  // FiveM page left.
  it('lists the free scripts page and none of the retired shop pages', async () => {
    const entries = await buildSitemapEntries()
    const fivem = entries.map(e => e.url).filter(u => /\/fivem(\/|$)/.test(u))
    expect(fivem.sort()).toEqual([`${BASE}/de/fivem/kostenlos`, `${BASE}/en/fivem/free`])
    for (const retired of ['/en/cart', '/de/warenkorb', '/en/checkout', '/de/kasse']) {
      expect(find(entries, `${BASE}${retired}`), retired).toBeUndefined()
    }
  })
})

describe('renderSitemapXml', () => {
  it('verweist auf das XSL-Stylesheet, sonst ist die Datei im Browser unlesbar', () => {
    const xml = renderSitemapXml([{ url: `${BASE}/` }])
    expect(xml).toContain('<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>')
    // The declaration must come before the stylesheet instruction.
    expect(xml.indexOf('<?xml version')).toBeLessThan(xml.indexOf('<?xml-stylesheet'))
  })

  it('schreibt weder priority noch changefreq, Google ignoriert beide', () => {
    const xml = renderSitemapXml([
      { url: `${BASE}/` },
      { url: `${BASE}/packages/1`, lastModified: new Date('2026-07-28T12:21:09Z') },
    ])
    expect(xml).not.toContain('<priority>')
    expect(xml).not.toContain('<changefreq>')
  })

  it('serialisiert lastmod nur, wenn eines gesetzt ist', () => {
    const xml = renderSitemapXml([
      { url: `${BASE}/` },
      { url: `${BASE}/packages/1`, lastModified: new Date('2026-07-28T12:21:09Z') },
    ])
    expect(xml.match(/<lastmod>/g)).toHaveLength(1)
    expect(xml).toContain('<lastmod>2026-07-28T12:21:09.000Z</lastmod>')
  })

  it('deklariert den xhtml-Namensraum nur bei vorhandenen Alternates', () => {
    expect(renderSitemapXml([{ url: `${BASE}/` }])).not.toContain('xmlns:xhtml')

    const withAlternates = renderSitemapXml([
      { url: `${BASE}/ticketbot`, alternates: { en: `${BASE}/ticketbot`, de: `${BASE}/de/ticketbot` } },
    ])
    expect(withAlternates).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    expect(withAlternates).toContain('<xhtml:link rel="alternate" hreflang="de" href="https://www.msk-scripts.de/de/ticketbot" />')
  })

  it('maskiert Sonderzeichen, statt kaputtes XML zu erzeugen', () => {
    const xml = renderSitemapXml([{ url: `${BASE}/packages?a=1&b=2` }])
    expect(xml).toContain('<loc>https://www.msk-scripts.de/packages?a=1&amp;b=2</loc>')
    expect(xml).not.toContain('a=1&b=2')
  })

  it('erzeugt wohlgeformtes XML mit einem url-Block pro Eintrag', () => {
    const xml = renderSitemapXml([
      { url: `${BASE}/` },
      { url: `${BASE}/packages` },
      { url: `${BASE}/ticketbot`, alternates: { 'x-default': `${BASE}/ticketbot` } },
    ])
    expect(xml.match(/<url>/g)).toHaveLength(3)
    expect(xml.match(/<\/url>/g)).toHaveLength(3)
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true)
  })
})
