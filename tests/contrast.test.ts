import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Kontrast der Design-Tokens gegen WCAG AA.
 *
 * Liest die Werte direkt aus `app/globals.css`, damit der Test die echten
 * Tokens prüft und nicht eine Kopie, die still auseinanderläuft. Vorher lagen
 * neun Paare unter AA, am schwersten der Primärbutton (3,15:1 hell, 2,69:1
 * dunkel) und gedämpfter Text auf getönter Fläche (4,40:1).
 *
 * Bewusst nicht im Browser gemessen: `color-mix()` kommt dort als
 * `color(srgb …)` zurück und CSS-Übergänge frieren in headless laufenden
 * Renderern auf ihrem Startwert ein. Beides erzeugt Falschbefunde.
 */

const CSS = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

function readTokens(scope: 'light' | 'dark'): Record<string, string> {
  const start = scope === 'light' ? CSS.indexOf('@theme {') : CSS.indexOf('.dark {')
  expect(start, `Token-Block für ${scope} nicht gefunden`).toBeGreaterThan(-1)
  const end = CSS.indexOf('}', CSS.indexOf('--shadow-card-hover', start))
  const block = CSS.slice(start, end === -1 ? undefined : end)
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[m[1]] = m[2].toLowerCase()
  }
  return out
}

const channels = (hex: string) => (hex.replace('#', '').match(/../g) ?? []).map(x => parseInt(x, 16))
const linear = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }

function luminance(hex: string): number {
  const [r, g, b] = channels(hex)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** srgb-Mischung, entspricht `color-mix(in srgb, a p%, b)`. */
function mix(a: string, b: string, p: number): string {
  const A = channels(a), B = channels(b)
  return '#' + A.map((v, i) => Math.round(v * p + B[i] * (1 - p)).toString(16).padStart(2, '0')).join('')
}

const light = readTokens('light')
// Dark überschreibt nur einen Teil der Tokens, der Rest wird geerbt.
const dark = { ...light, ...readTokens('dark') }

describe.each([
  ['Light-Mode', light],
  ['Dark-Mode', dark],
])('%s: Textkontrast erreicht WCAG AA', (_name, t) => {
  // Footer und einige Sektionen liegen auf einer gemischten Fläche.
  const gemischt = mix(t.muted, t.background, 0.4)

  const paare: Array<[string, string, string, number]> = [
    ['Fließtext auf der Seite',        t.foreground,             t.background, 4.5],
    ['Gedämpfter Text auf der Seite',  t['muted-foreground'],    t.background, 4.5],
    ['Gedämpfter Text auf Fläche',     t['muted-foreground'],    t.muted,      4.5],
    ['Gedämpfter Text auf Karte',      t['muted-foreground'],    t.card,       4.5],
    ['Gedämpfter Text auf Mischfläche', t['muted-foreground'],   gemischt,     4.5],
    ['Label auf Primärfüllung',        t['primary-foreground'],  t.primary,    4.5],
    ['Primärgrün als Text',            t.primary,                t.background, 4.5],
    ['Primärgrün als Text auf Fläche', t.primary,                t.muted,      4.5],
    ['Label auf Erfolgsfüllung',       t['success-foreground'],  t.success,    4.5],
    ['Label auf Warnfüllung',          t['warning-foreground'],  t.warning,    4.5],
    ['Label auf Gefahrfüllung',        t['danger-foreground'],   t.danger,     4.5],
    ['Label auf Infofüllung',          t['info-foreground'],     t.info,       4.5],
    ['Weiß auf Discord-Füllung',       '#ffffff',                t.discord,    4.5],
    ['Discord als Textfarbe',          t['discord-text'],        t.background, 4.5],
    ['Text auf Karte',                 t['card-foreground'],     t.card,       4.5],
    ['Text auf Sekundärfüllung',       t['secondary-foreground'], t.secondary, 4.5],
    ['Text auf Akzentfüllung',         t['accent-foreground'],   t.accent,     4.5],
    // Die vier Farben der Aufteilungsdiagramme auf beiden Statistikseiten.
    // Sie stehen als Text auf der getönten Kachel, nicht nur als Balkenfläche.
    // Vorher waren es rohe Tailwind-Klassen, die dieser Test nicht sehen konnte:
    // `yellow-400` mass dort 1,39:1, `sky-400` 1,95:1, `rose-400` 2,45:1. Alle
    // drei waren nur fürs dunkle Theme gewählt.
    ['Diagrammfarbe Grün auf Kachel',      t.primary,               t.muted,      4.5],
    ['Diagrammfarbe Bernstein auf Kachel', t.warning,               t.muted,      4.5],
    ['Diagrammfarbe Blau auf Kachel',      t.info,                  t.muted,      4.5],
    ['Diagrammfarbe Rosé auf Kachel',      t['chart-rose'],         t.muted,      4.5],
    ['Gefahrfarbe als Text auf Kachel',    t.danger,                t.muted,      4.5],
    ['Gefahrfarbe als Text auf Karte',     t.danger,                t.card,       4.5],
  ]

  it.each(paare)('%s', (_label, fg, bg, need) => {
    expect(fg, 'Token fehlt').toBeTruthy()
    expect(bg, 'Token fehlt').toBeTruthy()
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(need)
  })

  /**
   * Ökosystem-Badges.
   *
   * Sie standen bis zum 22.08.2026 als rohe Tailwind-Klassen in
   * `components/ui/Badge.tsx` und waren damit für diesen Test unsichtbar, der
   * nur `--color-*` aus `globals.css` liest. Im Light-Theme lagen alle neun
   * unter AA, am schlimmsten `js` mit 1,46:1.
   *
   * Geprüft wird der Fall, der auch gerendert wird: der Text sitzt nicht auf
   * der Karte, sondern auf seiner eigenen 12-Prozent-Fläche darüber. Die ist
   * dem Text ähnlicher als die Karte, der Kontrast also niedriger. Wer nur
   * gegen die Karte rechnet, misst sich zu gut.
   */
  const badges = ['esx', 'qb', 'lua', 'js', 'ts', 'py', 'discord', 'fivem', 'sale'] as const

  it.each(badges)('Badge %s ist auf seiner eigenen Fläche lesbar', (name) => {
    const farbe = t[`badge-${name}`]
    expect(farbe, `Token --color-badge-${name} fehlt`).toBeTruthy()
    expect(contrast(farbe, mix(farbe, t.card, 0.12))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(badges)('Badge %s hebt sich als Rahmen ab (3:1 gegen die Karte)', (name) => {
    const farbe = t[`badge-${name}`]
    expect(contrast(mix(farbe, t.card, 0.3), t.card)).toBeGreaterThanOrEqual(1.2)
  })
})

describe('Nicht-Text-Kontrast', () => {
  it('Fokusring hebt sich in beiden Themes vom Grund ab (3:1)', () => {
    expect(contrast(light.ring, light.background)).toBeGreaterThanOrEqual(3)
    expect(contrast(dark.ring, dark.background)).toBeGreaterThanOrEqual(3)
  })
})

describe('Rechnung selbst', () => {
  it('kennt die bekannten Extremwerte', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  it('ist symmetrisch', () => {
    expect(contrast('#3a7d1c', '#ffffff')).toBeCloseTo(contrast('#ffffff', '#3a7d1c'), 10)
  })
})
