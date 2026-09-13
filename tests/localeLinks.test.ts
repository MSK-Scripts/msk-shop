import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/**
 * Repo shape instead of logic: checks that internal links do not lose the
 * language prefix and do not get it twice.
 *
 * Why a test and not care: the rework of 22.08.2026 swapped the
 * import line in 17 files and **missed four**
 * (`ResourcesClient`, `Bots`, `ProofLine`, `NewsPopup`). Each of them threw a
 * German visitor back to English on click. Conversely, three
 * places were left over from the time when `/de/ticketbot` was still a route of its own,
 * and together with `LocaleLink` they built `/de/de/ticketbot`.
 *
 * Neither is a question of logic, but of which file imports
 * what. That can only be checked this way.
 */

const WURZELN = ['app', 'components']

/** `LocaleLink` itself has to import `next/link`, it wraps it. */
const DARF_NEXT_LINK = join('components', 'i18n', 'LocaleLink.tsx')

function dateien(dir: string): string[] {
  const out: string[] = []
  for (const eintrag of readdirSync(dir)) {
    const voll = join(dir, eintrag)
    if (statSync(voll).isDirectory()) out.push(...dateien(voll))
    else if (voll.endsWith('.tsx') || voll.endsWith('.ts')) out.push(voll)
  }
  return out
}

const ALLE = WURZELN.flatMap(w => dateien(join(process.cwd(), w)))
  .map(p => relative(process.cwd(), p))

describe('interne Links behalten die Sprache', () => {
  it('findet überhaupt Dateien', () => {
    expect(ALLE.length).toBeGreaterThan(50)
  })

  it('niemand importiert next/link direkt ausser LocaleLink', () => {
    const suender = ALLE.filter(p => {
      if (p.split(sep).join(sep) === DARF_NEXT_LINK) return false
      return /from ['"]next\/link['"]/.test(readFileSync(p, 'utf8'))
    })
    expect(suender, `next/link statt LocaleLink: ${suender.join(', ')}`).toEqual([])
  })

  it('kein Sprachpräfix von Hand in einem String-Literal', () => {
    // Backticks are excluded: the comments in these files mention
    // example addresses like `/de/packages`, and those are wanted.
    const suender = ALLE.filter(p => /['"]\/de(\/|['"])/.test(readFileSync(p, 'utf8')))
    expect(suender, `Präfix von Hand, LocaleLink setzt es bereits: ${suender.join(', ')}`).toEqual([])
  })
})
