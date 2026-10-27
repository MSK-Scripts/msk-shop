import { describe, it, expect } from 'vitest'

import {
  LEGACY_ROUTES, ROUTES, alternatePaths, chooseRootLang, internalPath, isExemptPath,
  langFromAcceptLanguage, legacyTarget, parsePublicPath, publicPath, resolveRequest, splitLangPrefix,
} from '@/lib/routes'
import { LANGS } from '@/lib/lang'

/** A concrete path for a pattern: every dynamic segment gets a sample value. */
function sample(pattern: string): string {
  return pattern.replace(/\[([^\]]+)\]/g, (_, name: string) => `sample-${name}`)
}


describe('route table', () => {
  it('gives every internal path a public form in both languages', () => {
    for (const r of ROUTES) {
      for (const lang of LANGS) {
        expect(r.public[lang], `${r.internal} (${lang})`).toMatch(/^\//)
      }
    }
  })

  it('keeps dynamic segments in the same place in every form', () => {
    // The translation copies segment values by name and by position. A public
    // form that moved or renamed a dynamic segment would silently mix them up.
    for (const r of ROUTES) {
      const internal = r.internal.split('/')
      for (const lang of LANGS) {
        const pub = r.public[lang].split('/')
        expect(pub.length, `${r.internal} (${lang})`).toBe(internal.length)
        pub.forEach((seg, i) => {
          if (seg.startsWith('[') || internal[i].startsWith('[')) expect(seg, `${r.internal} (${lang})`).toBe(internal[i])
        })
      }
    }
  })

  it('uses ASCII only in public paths', () => {
    // Umlauts would be percent-encoded in the address bar.
    for (const r of ROUTES) for (const lang of LANGS) expect(r.public[lang]).toMatch(/^[a-z0-9/[\]-]+$/)
  })

  it('round-trips public -> internal -> public in both languages', () => {
    for (const r of ROUTES) {
      const internal = sample(r.internal)
      for (const lang of LANGS) {
        const pub = publicPath(lang, internal)
        const split = splitLangPrefix(pub)
        expect(split?.lang, pub).toBe(lang)
        const back = internalPath(lang, split!.rest)
        expect(back, `${pub} -> internal`).toBe(internal)
        expect(publicPath(lang, back!), `${internal} (${lang})`).toBe(pub)
      }
    }
  })

  it('never gives two internal paths the same public path', () => {
    const seen = new Map<string, string>()
    for (const r of ROUTES) {
      for (const lang of LANGS) {
        const pub = publicPath(lang, sample(r.internal))
        expect(seen.get(pub), `${pub} for ${r.internal} and ${seen.get(pub)}`).toBeUndefined()
        seen.set(pub, r.internal)
      }
    }
    expect(seen.size).toBe(ROUTES.length * LANGS.length)
  })

  it('never uses the German words of one page as the English words of another', () => {
    // The proxy accepts the other language's form and redirects. If /de/x were
    // the German form of A and the English form of B, one of them would be
    // unreachable under /de.
    for (const a of ROUTES) {
      for (const b of ROUTES) {
        if (a === b) continue
        expect(sample(a.public.de), `${a.internal} vs ${b.internal}`).not.toBe(sample(b.public.en))
      }
    }
  })

  it('serves every canonical address without a redirect', () => {
    for (const r of ROUTES) {
      for (const lang of LANGS) {
        const pub = publicPath(lang, sample(r.internal))
        expect(resolveRequest(pub), pub).toMatchObject({ kind: 'page', lang, path: sample(r.internal) })
      }
    }
  })
})

describe('publicPath', () => {
  it('translates the approved German paths', () => {
    expect(publicPath('de', '/')).toBe('/de')
    expect(publicPath('en', '/')).toBe('/en')
    expect(publicPath('de', '/legal/terms')).toBe('/de/rechtliches/agb')
    expect(publicPath('de', '/fivem/free')).toBe('/de/fivem/kostenlos')
    expect(publicPath('de', '/tools')).toBe('/de/web-tools')
    expect(publicPath('de', '/withdraw-contract')).toBe('/de/vertrag-widerrufen')
    expect(publicPath('en', '/legal/dpa')).toBe('/en/legal/dpa')
  })

  it('keeps the value of a dynamic segment', () => {
    expect(publicPath('de', '/fivem/5732587')).toBe('/de/fivem/5732587')
    expect(publicPath('de', '/tools/images/weapons/pistol')).toBe('/de/web-tools/images/weapons/pistol')
  })

  it('keeps English sub-segments below a translated parent', () => {
    expect(publicPath('de', '/tools/images/whatever/deep/path')).toBe('/de/web-tools/images/whatever/deep/path')
  })

  it('keeps query string and hash', () => {
    expect(publicPath('de', '/dashboard/ticket-bot/verify?error=x')).toBe('/de/dashboard/ticket-bot/verify?error=x')
    expect(publicPath('de', '/legal/terms#section-3')).toBe('/de/rechtliches/agb#section-3')
    expect(publicPath('de', '/cart?a=1#b')).toBe('/de/warenkorb?a=1#b')
  })

  it('names both versions for hreflang', () => {
    expect(alternatePaths('/stats')).toEqual({ en: '/en/stats', de: '/de/statistiken' })
  })
})

describe('splitLangPrefix and parsePublicPath', () => {
  it('checks the whole segment', () => {
    expect(splitLangPrefix('/de')).toEqual({ lang: 'de', rest: '/' })
    expect(splitLangPrefix('/en/fivem')).toEqual({ lang: 'en', rest: '/fivem' })
    expect(splitLangPrefix('/deals')).toBeNull()
    expect(splitLangPrefix('/english')).toBeNull()
    expect(splitLangPrefix('/')).toBeNull()
  })

  it('reads language and internal path from what the browser shows', () => {
    expect(parsePublicPath('/de/rechtliches/agb')).toEqual({ lang: 'de', path: '/legal/terms' })
    expect(parsePublicPath('/en/legal/terms')).toEqual({ lang: 'en', path: '/legal/terms' })
    // During the server render `usePathname()` can return the rewrite target.
    expect(parsePublicPath('/de/legal/terms')).toEqual({ lang: 'de', path: '/legal/terms' })
    expect(parsePublicPath('/auth/discord')).toEqual({ lang: 'en', path: '/auth/discord' })
  })
})

/**
 * Every page address of the app before the move, and where it lives now.
 * The list is the file tree of `app/` on 27.10.2026, plus the redirects that
 * used to be in next.config.js.
 */
const OLD_ADDRESSES: Array<[string, string]> = [
  ['/packages',                  '/en/fivem'],
  ['/packages/5732587',          '/en/fivem/5732587'],
  ['/categories/2105296',        '/en/fivem/categories/2105296'],
  ['/resources',                 '/en/stats'],
  ['/images',                    '/en/tools/images'],
  ['/images/upload',             '/en/tools/images/upload'],
  ['/images/weapons',            '/en/tools/images/weapons'],
  ['/images/weapons/pistol',     '/en/tools/images/weapons/pistol'],
  ['/terms',                     '/en/legal/terms'],
  ['/terms/imprint',             '/en/legal/imprint'],
  ['/terms/privacy',             '/en/legal/privacy'],
  ['/terms/widerruf',            '/en/legal/withdrawal'],
  ['/terms/avv',                 '/en/legal/dpa'],
  ['/vertrag-widerrufen',        '/en/withdraw-contract'],
  ['/vertrag-kuendigen',         '/en/cancel-contract'],
  ['/ticketbot',                 '/en/discord/ticket-bot'],
  ['/ticketbot/compare',         '/en/discord/ticket-bot/compare'],
  ['/ticketbot/stats',           '/en/discord/ticket-bot/stats'],
  ['/ticketbot/dashboard',       '/en/dashboard/ticket-bot'],
  ['/ticketbot/verify',          '/en/dashboard/ticket-bot/verify'],
  ['/giveaway',                  '/en/discord/giveaway-bot'],
  ['/giveaway/stats',            '/en/discord/giveaway-bot/stats'],
  ['/giveaway/g/abc123',         '/en/discord/giveaway-bot/g/abc123'],
  ['/giveaway/dashboard',        '/en/dashboard/giveaway-bot'],
  ['/giveaway/verify',           '/en/dashboard/giveaway-bot/verify'],
  ['/account',                   '/en/account'],
  ['/cart',                      '/en/cart'],
  ['/checkout',                  '/en/checkout'],
  ['/login',                     '/en/login'],
  ['/report',                    '/en/report'],
  ['/admin',                     '/en/admin'],
  // formerly in next.config.js
  ['/package/5732587',           '/en/fivem/5732587'],
  ['/category/2105296',          '/en/fivem/categories/2105296'],
  ['/verify',                    '/en/dashboard/ticket-bot/verify'],
  ['/dashboard',                 '/en/dashboard/ticket-bot'],
  ['/stats',                     '/en/discord/ticket-bot/stats'],
  // the German versions under the old scheme
  ['/de/packages',               '/de/fivem'],
  ['/de/packages/5732587',       '/de/fivem/5732587'],
  ['/de/categories/2105296',     '/de/fivem/categories/2105296'],
  ['/de/resources',              '/de/statistiken'],
  ['/de/images',                 '/de/web-tools/images'],
  ['/de/images/upload',          '/de/web-tools/images/upload'],
  ['/de/images/weapons/pistol',  '/de/web-tools/images/weapons/pistol'],
  ['/de/terms',                  '/de/rechtliches/agb'],
  ['/de/terms/imprint',          '/de/rechtliches/impressum'],
  ['/de/terms/privacy',          '/de/rechtliches/datenschutz'],
  ['/de/terms/widerruf',         '/de/rechtliches/widerrufsbelehrung'],
  ['/de/terms/avv',              '/de/rechtliches/avv'],
  ['/de/vertrag-widerrufen',     '/de/vertrag-widerrufen'],
  ['/de/vertrag-kuendigen',      '/de/vertrag-kuendigen'],
  ['/de/ticketbot',              '/de/discord/ticket-bot'],
  ['/de/ticketbot/compare',      '/de/discord/ticket-bot/compare'],
  ['/de/ticketbot/stats',        '/de/discord/ticket-bot/stats'],
  ['/de/ticketbot/dashboard',    '/de/dashboard/ticket-bot'],
  ['/de/ticketbot/verify',       '/de/dashboard/ticket-bot/verify'],
  ['/de/giveaway',               '/de/discord/giveaway-bot'],
  ['/de/giveaway/stats',         '/de/discord/giveaway-bot/stats'],
  ['/de/giveaway/g/abc123',      '/de/discord/giveaway-bot/g/abc123'],
  ['/de/giveaway/dashboard',     '/de/dashboard/giveaway-bot'],
  ['/de/giveaway/verify',        '/de/dashboard/giveaway-bot/verify'],
  ['/de/account',                '/de/konto'],
  ['/de/cart',                   '/de/warenkorb'],
  ['/de/checkout',               '/de/kasse'],
  ['/de/login',                  '/de/anmelden'],
  ['/de/report',                 '/de/inhalt-melden'],
  ['/de/admin',                  '/de/admin'],
]

describe('old addresses', () => {
  it.each(OLD_ADDRESSES)('%s ends up at %s', (from, to) => {
    const res = resolveRequest(from)
    if (from === to) {
      // Two German paths kept their name; they are canonical as they are.
      expect(res).toMatchObject({ kind: 'page' })
      return
    }
    expect(res).toEqual({ kind: 'redirect', status: 308, location: to })
  })

  it('redirects in one hop: every target is served as it is', () => {
    for (const [, to] of OLD_ADDRESSES) {
      expect(resolveRequest(to), to).toMatchObject({ kind: 'page' })
    }
  })

  it('sends the English form under /de to the German one', () => {
    expect(resolveRequest('/de/legal/terms')).toEqual({ kind: 'redirect', status: 308, location: '/de/rechtliches/agb' })
    expect(resolveRequest('/de/fivem/free')).toEqual({ kind: 'redirect', status: 308, location: '/de/fivem/kostenlos' })
    expect(resolveRequest('/de/tools/images/weapons')).toEqual({ kind: 'redirect', status: 308, location: '/de/web-tools/images/weapons' })
  })

  it('sends the German form under /en to the English one', () => {
    expect(resolveRequest('/en/rechtliches/agb')).toEqual({ kind: 'redirect', status: 308, location: '/en/legal/terms' })
  })

  it('maps nothing that is not an old address', () => {
    for (const p of ['/', '/fivemx', '/termsx', '/ticketbots', '/stats/x']) {
      expect(legacyTarget(p), p).toBeNull()
    }
  })

  it('has no legacy entry that shadows a page of the new table', () => {
    // An old address equal to a new English path would turn the new page
    // into a redirect for anyone typing it without a prefix.
    for (const entry of LEGACY_ROUTES) {
      if (entry.exact) continue
      expect(internalPath('en', entry.from), entry.from).toBeNull()
    }
  })
})

describe('exempt addresses', () => {
  const EXEMPT = [
    '/api/discord/health', '/api/webhook/stripe', '/api/admin/auth/callback',
    '/api/auth/discord-verify/callback', '/api/giveaway/auth/callback', '/api/images/upload/auth/callback',
    '/auth/discord', '/botproxy', '/transcripts/123/abc.html', '/_next/static/chunks/x.js',
    '/robots.txt', '/sitemap.xml', '/sitemap-images.xml', '/sitemap.xsl', '/llms.txt', '/favicon.ico', '/logo.png',
  ]

  it.each(EXEMPT)('%s is passed through untouched', path => {
    expect(isExemptPath(path)).toBe(true)
    expect(resolveRequest(path)).toEqual({ kind: 'pass' })
  })

  it.each(EXEMPT)('%s gets no second name under a language prefix', path => {
    for (const lang of LANGS) {
      const res = resolveRequest(`/${lang}${path}`)
      expect(res.kind, `/${lang}${path}`).toBe('page')
      // Routed as it is, so it lands on the 404 and not on a rewritten copy.
      expect(res).toMatchObject({ target: `/${lang}${path}` })
    }
  })

  it('checks the whole segment, not the start of the word', () => {
    expect(isExemptPath('/apifoo')).toBe(false)
    expect(isExemptPath('/authentisch')).toBe(false)
    expect(isExemptPath('/sitemap.xml.bak')).toBe(false)
  })

  it('passes static files through', () => {
    expect(resolveRequest('/msk_core-banner.webp')).toEqual({ kind: 'pass' })
  })

  it('renders an unknown address in English without a redirect', () => {
    expect(resolveRequest('/does-not-exist')).toMatchObject({ kind: 'page', lang: 'en', target: '/en/does-not-exist' })
  })
})

describe('root redirect', () => {
  it('uses the remembered language first', () => {
    expect(chooseRootLang({ cookie: 'de', acceptLanguage: 'en-US,en;q=0.9' })).toBe('de')
    expect(chooseRootLang({ cookie: 'en', acceptLanguage: 'de-DE,de;q=0.9' })).toBe('en')
  })

  it('falls back to Accept-Language, by weight', () => {
    expect(chooseRootLang({ acceptLanguage: 'de-DE,de;q=0.9,en;q=0.8' })).toBe('de')
    expect(chooseRootLang({ acceptLanguage: 'fr-FR,fr;q=0.9,de;q=0.8,en;q=0.7' })).toBe('de')
    expect(chooseRootLang({ acceptLanguage: 'en;q=0.5,de;q=0.9' })).toBe('de')
    expect(chooseRootLang({ cookie: 'fr', acceptLanguage: 'de' })).toBe('de')
  })

  it('ends with English', () => {
    expect(chooseRootLang({})).toBe('en')
    expect(chooseRootLang({ acceptLanguage: 'fr-FR,fr;q=0.9' })).toBe('en')
    expect(chooseRootLang({ acceptLanguage: 'de;q=0' })).toBe('en')
    expect(langFromAcceptLanguage('')).toBeNull()
  })

  it('answers / with 307 to the chosen language', () => {
    expect(resolveRequest('/', { cookie: 'de' })).toEqual({ kind: 'redirect', status: 307, location: '/de' })
    expect(resolveRequest('/', { acceptLanguage: 'de-AT' })).toEqual({ kind: 'redirect', status: 307, location: '/de' })
    expect(resolveRequest('/', {})).toEqual({ kind: 'redirect', status: 307, location: '/en' })
  })
})
