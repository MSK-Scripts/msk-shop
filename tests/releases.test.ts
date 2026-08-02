import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { summarize, newestVersion, loadReleases } from '@/lib/releases'

/**
 * Der Loader zieht aus einer fremden Quelle (GitHub) und darf die Startseite
 * unter keinen Umständen kippen. Die Tests decken deshalb vor allem die
 * Fehlerpfade ab, nicht den Glücksfall.
 */

describe('summarize', () => {
  it('nimmt die erste inhaltliche Zeile und entfernt den Aufzählungsstrich', () => {
    expect(summarize(['- Fixed the group check', '- Something else'])).toBe('Fixed the group check')
  })

  it('überspringt reine Dateilisten', () => {
    expect(summarize(['- Changed files [a.lua, b.lua]', '- Added a faction filter']))
      .toBe('Added a faction filter')
  })

  it('gibt leer zurück, wenn es nur Dateilisten gibt', () => {
    expect(summarize(['- Changed files [all files]'])).toBe('')
  })

  it('kürzt lange Zeilen auf einer Wortgrenze', () => {
    const lang = 'Added ' + 'wort '.repeat(60)
    const out = summarize([`- ${lang}`])
    expect(out.length).toBeLessThanOrEqual(131)
    expect(out.endsWith('…')).toBe(true)
    expect(out).not.toContain('  ')
  })

  it('lässt kurze Zeilen unangetastet', () => {
    expect(summarize(['- Kurz und gut'])).toBe('Kurz und gut')
  })

  it('verträgt Unsinn statt eines Arrays', () => {
    expect(summarize(null)).toBe('')
    expect(summarize('kein Array')).toBe('')
    expect(summarize([1, 2, 3])).toBe('')
    expect(summarize([])).toBe('')
  })
})

describe('newestVersion', () => {
  it('nimmt den ersten Eintrag', () => {
    expect(newestVersion([{ version: '5.4.2' }, { version: '5.4.1' }])?.version).toBe('5.4.2')
  })

  it('weist leere, falsch getypte oder versionslose Daten zurück', () => {
    expect(newestVersion([])).toBeNull()
    expect(newestVersion(null)).toBeNull()
    expect(newestVersion({ version: '1.0' })).toBeNull()
    expect(newestVersion([{ changelogs: [] }])).toBeNull()
    expect(newestVersion([{ version: 42 }])).toBeNull()
    expect(newestVersion([{ version: '   ' }])).toBeNull()
  })
})

describe('loadReleases', () => {
  const originalFetch = globalThis.fetch

  const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response
  const commit = (date: string) => [{ commit: { author: { date } } }]

  beforeEach(() => { vi.restoreAllMocks() })
  afterEach(() => { globalThis.fetch = originalFetch })

  it('sortiert nach Datum, neueste zuerst, und deckelt auf das Limit', async () => {
    let n = 0
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const u = String(url)
      if (u.includes('/commits')) {
        // Absteigende Jahre, damit die Sortierung nachweisbar greift.
        return ok(commit(`20${10 + (n++ % 8)}-01-01T00:00:00Z`))
      }
      return ok([{ version: '1.0.0', changelogs: ['- Etwas gemacht'] }])
    }) as typeof fetch

    const out = await loadReleases(3)
    expect(out).toHaveLength(3)
    const zeiten = out.map(r => Date.parse(r.date))
    expect(zeiten).toEqual([...zeiten].sort((a, b) => b - a))
  })

  it('gibt ein leeres Array zurück, wenn die Quelle komplett ausfällt', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('Netzwerk weg') }) as unknown as typeof fetch
    await expect(loadReleases()).resolves.toEqual([])
  })

  it('überspringt einzelne Ausfälle, statt alles zu verwerfen', async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const u = String(url)
      if (u.includes('Garage.json') && !u.includes('/commits')) {
        return { ok: false, status: 404, json: async () => ({}) } as Response
      }
      if (u.includes('/commits')) return ok(commit('2026-01-01T00:00:00Z'))
      return ok([{ version: '1.0.0', changelogs: ['- Etwas gemacht'] }])
    }) as typeof fetch

    const out = await loadReleases(20)
    expect(out.length).toBeGreaterThan(0)
    expect(out.some(r => r.resourceName === 'msk_garage')).toBe(false)
  })

  it('verwirft Einträge ohne brauchbares Datum', async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const u = String(url)
      if (u.includes('/commits')) return ok([{ commit: { author: { date: 'Freitag' } } }])
      return ok([{ version: '1.0.0', changelogs: ['- Etwas'] }])
    }) as typeof fetch

    await expect(loadReleases()).resolves.toEqual([])
  })

  it('verträgt einen HTTP-200 mit unerwartetem Rumpf', async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes('/commits')) return ok(commit('2026-01-01T00:00:00Z'))
      return ok({ unerwartet: true })
    }) as typeof fetch

    await expect(loadReleases()).resolves.toEqual([])
  })

  it('fragt kein Limit unter null ab', async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes('/commits')) return ok(commit('2026-01-01T00:00:00Z'))
      return ok([{ version: '1.0.0', changelogs: ['- Etwas'] }])
    }) as typeof fetch

    await expect(loadReleases(-5)).resolves.toEqual([])
  })
})
