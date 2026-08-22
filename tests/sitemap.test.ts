import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

// Tebex wird gemockt, damit die Sitemap ohne Netzwerk und ohne Token läuft.
vi.mock('@/lib/tebex', () => ({ getPackages: vi.fn(), getCategories: vi.fn() }))

import { getPackages, getCategories } from '@/lib/tebex'
import sitemap from '@/app/sitemap'

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

const find = (entries: Awaited<ReturnType<typeof sitemap>>, url: string) =>
  entries.find(e => e.url === url)

describe('sitemap', () => {
  it('führt weder priority noch changefreq, Google ignoriert beide', async () => {
    (getPackages as Mock).mockResolvedValue([pkg(1, '2026-07-28T12:21:09+00:00')])
    ;(getCategories as Mock).mockResolvedValue([
      { id: 9, packages: [pkg(1, '2026-07-28T12:21:09+00:00')] },
    ])

    for (const entry of await sitemap()) {
      expect(entry).not.toHaveProperty('priority')
      expect(entry).not.toHaveProperty('changeFrequency')
    }
  })

  it('gibt statischen Seiten kein lastmod', async () => {
    const entries = await sitemap()

    for (const path of ['/', '/packages', '/resources', '/terms', '/terms/imprint']) {
      expect(find(entries, `${BASE}${path}`)?.lastModified).toBeUndefined()
    }
  })

  it('nimmt für Paketseiten das echte updated_at aus Tebex', async () => {
    (getPackages as Mock).mockResolvedValue([pkg(5159927, '2026-07-28T12:21:09+00:00')])

    const entry = find(await sitemap(), `${BASE}/packages/5159927`)
    expect(entry?.lastModified).toEqual(new Date('2026-07-28T12:21:09+00:00'))
  })

  it('lässt lastmod weg, wenn Tebex keinen brauchbaren Zeitstempel liefert', async () => {
    (getPackages as Mock).mockResolvedValue([pkg(1, null), pkg(2, 'nicht-datierbar')])

    const entries = await sitemap()
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

    const entries = await sitemap()
    expect(find(entries, `${BASE}/categories/2105296`)?.lastModified)
      .toEqual(new Date('2026-07-28T12:22:45+00:00'))
    // Kategorie ohne Pakete: lieber kein Datum als ein erfundenes.
    expect(find(entries, `${BASE}/categories/3392436`)?.lastModified).toBeUndefined()
  })

  it('nennt für alle vier Bot-Landingpages en, de und x-default', async () => {
    const entries = await sitemap()

    for (const [path, en] of [
      ['/ticketbot',     '/ticketbot'],
      ['/de/ticketbot',  '/ticketbot'],
      ['/giveaway',      '/giveaway'],
      ['/de/giveaway',   '/giveaway'],
    ] as const) {
      const languages = find(entries, `${BASE}${path}`)?.alternates?.languages
      expect(languages, path).toBeDefined()
      expect(languages).toMatchObject({
        'en':        `${BASE}${en}`,
        'de':        `${BASE}/de${en}`,
        'x-default': `${BASE}${en}`,
      })
    }
  })

  it('bleibt gültig, wenn die Tebex-API ausfällt', async () => {
    (getPackages as Mock).mockRejectedValue(new Error('upstream down'))
    ;(getCategories as Mock).mockRejectedValue(new Error('upstream down'))

    const entries = await sitemap()
    expect(find(entries, `${BASE}/`)).toBeDefined()
    expect(find(entries, `${BASE}/ticketbot`)).toBeDefined()
    expect(entries.every(e => !e.url.includes('/packages/'))).toBe(true)
  })
})
