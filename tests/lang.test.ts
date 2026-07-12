import { describe, it, expect } from 'vitest'
import { parseAcceptLanguage, resolveLang } from '@/lib/lang'

describe('parseAcceptLanguage', () => {
  it('picks the highest-quality supported language', () => {
    expect(parseAcceptLanguage('de-DE,de;q=0.9,en;q=0.8')).toBe('de')
    expect(parseAcceptLanguage('fr-FR,en;q=0.5')).toBe('en')
    expect(parseAcceptLanguage('en;q=0.8,de;q=0.9')).toBe('de')
  })

  it('defaults to en for empty or unsupported headers', () => {
    expect(parseAcceptLanguage(null)).toBe('en')
    expect(parseAcceptLanguage('')).toBe('en')
    expect(parseAcceptLanguage('fr,es')).toBe('en')
  })
})

describe('resolveLang', () => {
  it('prefers a valid cookie over the header', () => {
    expect(resolveLang('de', 'en-US')).toBe('de')
    expect(resolveLang('en', 'de-DE')).toBe('en')
  })

  it('falls back to the header when the cookie is missing or invalid', () => {
    expect(resolveLang(undefined, 'de-DE')).toBe('de')
    expect(resolveLang('xx', 'de-DE')).toBe('de')
  })
})
