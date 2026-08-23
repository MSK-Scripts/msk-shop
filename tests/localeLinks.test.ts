import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/**
 * Repo-Form statt Logik: prüft, dass interne Links das Sprachpräfix nicht
 * verlieren und es nicht doppelt bekommen.
 *
 * Warum ein Test und keine Sorgfalt: der Umbau vom 22.08.2026 hat die
 * Import-Zeile in 17 Dateien getauscht und **vier übersehen**
 * (`ResourcesClient`, `Bots`, `ProofLine`, `NewsPopup`). Jede davon warf einen
 * deutschen Besucher beim Klick zurück auf Englisch. Umgekehrt blieben drei
 * Stellen aus der Zeit stehen, als `/de/ticketbot` noch eine eigene Route war,
 * und bauten mit `LocaleLink` zusammen `/de/de/ticketbot`.
 *
 * Beides ist keine Frage der Logik, sondern der Frage, welche Datei was
 * importiert. Genau das lässt sich nur so prüfen.
 */

const WURZELN = ['app', 'components']

/** `LocaleLink` selbst muss `next/link` importieren, es wickelt es ein. */
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
    // Backticks sind ausgenommen: die Kommentare in diesen Dateien nennen
    // Beispieladressen wie `/de/packages`, und die sind erwünscht.
    const suender = ALLE.filter(p => /['"]\/de(\/|['"])/.test(readFileSync(p, 'utf8')))
    expect(suender, `Präfix von Hand, LocaleLink setzt es bereits: ${suender.join(', ')}`).toEqual([])
  })
})
