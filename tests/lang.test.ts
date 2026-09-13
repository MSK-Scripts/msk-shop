import { describe, it, expect } from 'vitest'
import { alternatePaths, isLang, istEinmaligeAdresse, langFromHeader, localePath, splitLangPath } from '@/lib/lang'

/**
 * Since 22.08.2026 the language lives in the path. Before, this file tested
 * the cookie and the Accept-Language header; neither exists any more, because
 * two sources for the same question produced three bugs in one day.
 */

describe('splitLangPath', () => {
  it('erkennt das deutsche Präfix und gibt den Restpfad zurück', () => {
    expect(splitLangPath('/de/packages')).toEqual({ lang: 'de', path: '/packages' })
    expect(splitLangPath('/de/packages/123')).toEqual({ lang: 'de', path: '/packages/123' })
  })

  it('macht aus der nackten Sprachwurzel die Startseite', () => {
    expect(splitLangPath('/de')).toEqual({ lang: 'de', path: '/' })
    expect(splitLangPath('/de/')).toEqual({ lang: 'de', path: '/' })
  })

  it('lässt alles ohne Präfix englisch', () => {
    expect(splitLangPath('/')).toEqual({ lang: 'en', path: '/' })
    expect(splitLangPath('/packages')).toEqual({ lang: 'en', path: '/packages' })
  })

  it('prüft das ganze Segment, nicht die ersten drei Zeichen', () => {
    // A package named "deals" must not count as the German version of "als".
    expect(splitLangPath('/deals')).toEqual({ lang: 'en', path: '/deals' })
    expect(splitLangPath('/design')).toEqual({ lang: 'en', path: '/design' })
  })
})

describe('localePath', () => {
  it('lässt Englisch ohne Präfix', () => {
    expect(localePath('en', '/packages')).toBe('/packages')
    expect(localePath('en', '/')).toBe('/')
  })

  it('setzt das deutsche Präfix davor', () => {
    expect(localePath('de', '/packages')).toBe('/de/packages')
    expect(localePath('de', '/')).toBe('/de')
  })

  it('ist mit splitLangPath umkehrbar', () => {
    for (const path of ['/', '/packages', '/packages/123', '/terms/privacy']) {
      for (const lang of ['en', 'de'] as const) {
        expect(splitLangPath(localePath(lang, path))).toEqual({ lang, path })
      }
    }
  })
})

describe('alternatePaths', () => {
  it('nennt beide Fassungen einer Seite', () => {
    expect(alternatePaths('/resources')).toEqual({ en: '/resources', de: '/de/resources' })
    expect(alternatePaths('/')).toEqual({ en: '/', de: '/de' })
  })
})

describe('langFromHeader', () => {
  it('nimmt gültige Werte und fällt sonst auf Englisch zurück', () => {
    expect(langFromHeader('de')).toBe('de')
    expect(langFromHeader('en')).toBe('en')
    expect(langFromHeader('fr')).toBe('en')
    expect(langFromHeader(null)).toBe('en')
    expect(langFromHeader(undefined)).toBe('en')
  })
})

describe('isLang', () => {
  it('erkennt die beiden unterstützten Sprachen', () => {
    expect(isLang('de')).toBe(true)
    expect(isLang('en')).toBe(true)
    expect(isLang('es')).toBe(false)
    expect(isLang(42)).toBe(false)
  })
})

describe('istEinmaligeAdresse', () => {
  /**
   * Otherwise the rewrite answered every address a second time under `/de/`.
   * Measured live on 23.08.2026: `/de/sitemap.xml` returned byte-identically
   * the same 17 774 bytes as `/sitemap.xml`, and the same held for robots.txt,
   * the XSL, every API route, favicon, logo and the `_next` assets.
   */
  it('erkennt die Dateien, die es pro Site nur einmal gibt', () => {
    for (const p of ['/robots.txt', '/sitemap.xml', '/sitemap.xsl', '/favicon.ico', '/logo.png']) {
      expect(istEinmaligeAdresse(p), p).toBe(true)
    }
  })

  it('erkennt ganze Zweige samt ihrer Unterpfade', () => {
    for (const p of ['/api', '/api/', '/api/resource-stats', '/_next/static/chunks/x.js',
                     '/auth/discord', '/botproxy', '/botproxy/irgendwas']) {
      expect(istEinmaligeAdresse(p), p).toBe(true)
    }
  })

  it('lässt normale Seiten in Ruhe', () => {
    for (const p of ['/', '/packages', '/packages/7569109', '/resources', '/ticketbot/stats',
                     '/terms/privacy']) {
      expect(istEinmaligeAdresse(p), p).toBe(false)
    }
  })

  it('prüft das ganze Segment, nicht den Wortanfang', () => {
    // A future `/apifoo` or `/authentisch` is a normal page.
    expect(istEinmaligeAdresse('/apifoo')).toBe(false)
    expect(istEinmaligeAdresse('/authentisch')).toBe(false)
    expect(istEinmaligeAdresse('/sitemap.xml.bak')).toBe(false)
  })

  it('greift genau auf dem Pfad, den splitLangPath aus einer /de-Adresse macht', () => {
    // This is how the proxy sees the request: split first, then ask.
    expect(istEinmaligeAdresse(splitLangPath('/de/sitemap.xml').path)).toBe(true)
    expect(istEinmaligeAdresse(splitLangPath('/de/packages').path)).toBe(false)
  })
})
