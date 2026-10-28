import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The privacy policy promises no language cookie without the visitor's own
// choice: the language is in the address. The proxy runs on every request, so
// it must never write one; only the language switcher does, on click.
const source = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

describe('language cookie', () => {
  it('is never set by the proxy', () => {
    const proxy = source('proxy.ts')
    expect(proxy).not.toMatch(/cookies\.set\(\s*LANG_COOKIE/)
    expect(proxy).not.toMatch(/cookies\.set\(\s*['"]msk_lang/)
  })

  it('is written by the language switcher when a language is chosen', () => {
    expect(source('components/i18n/LanguageDropdown.tsx')).toMatch(/onClick=\{\(\) => \{ rememberLanguage\(l\.code\)/)
  })
})
