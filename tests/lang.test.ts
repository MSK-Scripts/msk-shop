import { describe, it, expect } from 'vitest'
import { isLang, langFromHeader } from '@/lib/lang'

/**
 * The language basics. Prefix handling, the exempt addresses and the
 * translated paths moved to lib/routes.ts with the redesign and are tested in
 * tests/routes.test.ts.
 */

describe('langFromHeader', () => {
  it('takes valid values and falls back to English otherwise', () => {
    expect(langFromHeader('de')).toBe('de')
    expect(langFromHeader('en')).toBe('en')
    expect(langFromHeader('fr')).toBe('en')
    expect(langFromHeader(null)).toBe('en')
    expect(langFromHeader(undefined)).toBe('en')
  })
})

describe('isLang', () => {
  it('recognises the two supported languages', () => {
    expect(isLang('de')).toBe(true)
    expect(isLang('en')).toBe(true)
    expect(isLang('es')).toBe(false)
    expect(isLang(42)).toBe(false)
  })
})
