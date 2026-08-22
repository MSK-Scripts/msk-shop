import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

// Tebex wird gemockt, damit die Sitemap ohne Netzwerk und ohne Token läuft.
vi.mock('@/lib/tebex', () => ({ getPackages: vi.fn(), getCategories: vi.fn() }))

import { getPackages, getCategories } from '@/lib/tebex'
import { buildSitemapEntries, renderSitemapXml, type SitemapEntry } from '@/lib/sitemap'

const BASE = 'https://www.msk-scripts.de'

/** Minimales Paket. Nur die Felder, die die Sitemap anfasst. */
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

    for (const path of ['/', '/packages', '/resources', '/terms', '/terms/imprint']) {
      expect(find(entries, `${BASE}${path}`)?.lastModified, path).toBeUndefined()
    }
  })

  it('nimmt für Paketseiten das echte updated_at aus Tebex', async () => {
    (getPackages as Mock).mockResolvedValue([pkg(5159927, '2026-07-28T12:21:09+00:00')])

    const entry = find(await buildSitemapEntries(), `${BASE}/packages/5159927`)
    expect(entry?.lastModified).toEqual(new Date('2026-07-28T12:21:09+00:00'))
  })

  it('lässt lastmod weg, wenn Tebex keinen brauchbaren Zeitstempel liefert', async () => {
    (getPackages as Mock).mockResolvedValue([pkg(1, null), pkg(2, 'nicht-datierbar')])

    const entries = await buildSitemapEntries()
    expect(find(entries, `${BASE}/packages/1`)?.lastModified).toBeUndefined()
    expect(find(entries, `${BASE}/packages/2`)?.lastModified).toBeUndefined()
  })

  it('setzt für Kategorien das jüngste updated_at ihrer Pakete', async () => {
    (getCategories as Mock).mockResolvedValue([
      {
        id: 2105296,
        packages: [
          pkg(1, '2026-06-14T10:14:22+00:00'),
          pkg(2, '2026-07-28T12:22:45+00:00'), // das jüngste
          pkg(3, null),
        ],
      },
      { id: 3392436, packages: [] },
    ])

    const entries = await buildSitemapEntries()
    expect(find(entries, `${BASE}/categories/2105296`)?.lastModified)
      .toEqual(new Date('2026-07-28T12:22:45+00:00'))
    // Kategorie ohne Pakete: lieber kein Datum als ein erfundenes.
    expect(find(entries, `${BASE}/categories/3392436`)?.lastModified).toBeUndefined()
  })

  it('nennt für alle vier Bot-Landingpages en, de und x-default', async () => {
    const entries = await buildSitemapEntries()

    for (const [path, en] of [
      ['/ticketbot',    '/ticketbot'],
      ['/de/ticketbot', '/ticketbot'],
      ['/giveaway',     '/giveaway'],
      ['/de/giveaway',  '/giveaway'],
    ] as const) {
      expect(find(entries, `${BASE}${path}`)?.alternates, path).toEqual({
        'en':        `${BASE}${en}`,
        'de':        `${BASE}/de${en}`,
        'x-default': `${BASE}${en}`,
      })
    }
  })

  it('bleibt gültig, wenn die Tebex-API ausfällt', async () => {
    (getPackages as Mock).mockRejectedValue(new Error('upstream down'))
    ;(getCategories as Mock).mockRejectedValue(new Error('upstream down'))

    const entries = await buildSitemapEntries()
    expect(find(entries, `${BASE}/`)).toBeDefined()
    expect(find(entries, `${BASE}/ticketbot`)).toBeDefined()
    expect(entries.every(e => !e.url.includes('/packages/'))).toBe(true)
  })
})

describe('renderSitemapXml', () => {
  it('verweist auf das XSL-Stylesheet, sonst ist die Datei im Browser unlesbar', () => {
    const xml = renderSitemapXml([{ url: `${BASE}/` }])
    expect(xml).toContain('<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>')
    // Die Deklaration muss vor der Stylesheet-Anweisung stehen.
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
