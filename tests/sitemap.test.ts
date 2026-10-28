import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

// Tebex is mocked so that the sitemap runs without network and without a token.
vi.mock('@/lib/tebex', () => ({ getPackages: vi.fn(), getCategories: vi.fn() }))

import { getPackages, getCategories } from '@/lib/tebex'
import { buildSitemapEntries, renderSitemapXml, type SitemapEntry } from '@/lib/sitemap'

const BASE = 'https://www.msk-scripts.de'

/** Minimal package. Only the fields the sitemap touches. */
function pkg(id: number, updatedAt: string | null) {
  return { id, updated_at: updatedAt }
}

beforeEach(() => {
  (getPackages as Mock).mockReset()
  ;(getCategories as Mock).mockReset()
  ;(getPackages as Mock).mockResolvedValue([])
  ;(getCategories as Mock).mockResolvedValue([])
})

const find = (entries: SitemapEntry[], url: string) => entries.find(e => e.url === url)

describe('buildSitemapEntries', () => {
  it('gibt statischen Seiten kein lastmod', async () => {
    const entries = await buildSitemapEntries()

    for (const path of ['/en', '/de', '/en/fivem', '/en/stats', '/de/statistiken', '/en/legal/terms', '/de/rechtliches/impressum']) {
      expect(find(entries, `${BASE}${path}`)?.lastModified, path).toBeUndefined()
    }
  })

  it('takes the newest updated_at of the variants for a product page', async () => {
    // Encrypted and Source of the handcuffs: one page, the newer date.
    (getPackages as Mock).mockResolvedValue([
      pkg(5159927, '2026-07-28T12:21:09+00:00'),
      pkg(5301828, '2026-08-02T08:00:00+00:00'),
    ])

    const entries = await buildSitemapEntries()
    expect(find(entries, `${BASE}/en/fivem/handcuffs`)?.lastModified).toEqual(new Date('2026-08-02T08:00:00+00:00'))
    expect(find(entries, `${BASE}/de/fivem/handcuffs`)).toBeDefined()
    // The package ids only redirect, they are no pages of their own.
    expect(entries.filter(e => /\/fivem\/\d+$/.test(e.url))).toEqual([])
  })

  it('lässt lastmod weg, wenn Tebex keinen brauchbaren Zeitstempel liefert', async () => {
    // Packages no product configures still get a page, under a derived slug.
    (getPackages as Mock).mockResolvedValue([pkg(1, null), pkg(2, 'nicht-datierbar')])

    const entries = await buildSitemapEntries()
    expect(find(entries, `${BASE}/en/fivem/script-1`)?.lastModified).toBeUndefined()
    expect(find(entries, `${BASE}/de/fivem/script-2`)?.lastModified).toBeUndefined()
  })

  it('setzt für Kategorien das jüngste updated_at ihrer Pakete', async () => {
    (getCategories as Mock).mockResolvedValue([
      {
        id: 2105296,
        packages: [
          pkg(1, '2026-06-14T10:14:22+00:00'),
          pkg(2, '2026-07-28T12:22:45+00:00'), // the most recent
          pkg(3, null),
        ],
      },
      { id: 3392436, packages: [] },
    ])

    const entries = await buildSitemapEntries()
    expect(find(entries, `${BASE}/en/fivem/categories/2105296`)?.lastModified)
      .toEqual(new Date('2026-07-28T12:22:45+00:00'))
    // Category without packages: better no date than a made-up one.
    expect(find(entries, `${BASE}/de/fivem/categories/3392436`)?.lastModified).toBeUndefined()
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

  it('bleibt gültig, wenn die Tebex-API ausfällt', async () => {
    (getPackages as Mock).mockRejectedValue(new Error('upstream down'))
    ;(getCategories as Mock).mockRejectedValue(new Error('upstream down'))

    const entries = await buildSitemapEntries()
    expect(find(entries, `${BASE}/en`)).toBeDefined()
    expect(find(entries, `${BASE}/en/discord/ticket-bot`)).toBeDefined()
    expect(entries.every(e => !e.url.includes('/fivem/'))).toBe(true)
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
