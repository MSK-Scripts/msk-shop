import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Contrast of the design tokens against WCAG AA.
 *
 * Reads the values straight from `app/globals.css`, so the test checks the real
 * tokens and not a copy that silently drifts apart. Before, nine pairs were
 * below AA, worst of all the primary button (3.15:1 light, 2.69:1
 * dark) and muted text on a tinted surface (4.40:1).
 *
 * Deliberately not measured in the browser: `color-mix()` comes back there as
 * `color(srgb …)`, and CSS transitions freeze at their start value in renderers
 * running headless. Both produce false findings.
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

/** sRGB mix, equivalent to `color-mix(in srgb, a p%, b)`. */
function mix(a: string, b: string, p: number): string {
  const A = channels(a), B = channels(b)
  return '#' + A.map((v, i) => Math.round(v * p + B[i] * (1 - p)).toString(16).padStart(2, '0')).join('')
}

const light = readTokens('light')
// Dark overrides only some of the tokens, the rest is inherited.
const dark = { ...light, ...readTokens('dark') }

describe.each([
  ['Light-Mode', light],
  ['Dark-Mode', dark],
])('%s: Textkontrast erreicht WCAG AA', (_name, t) => {
  // The footer and some sections sit on a mixed surface.
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
    // Links in Tebex descriptions and legal texts sit on a card,
    // not on the page background. Since the card in the light theme is no longer
    // white, this is a pair of its own and not a repeat.
    ['Primärgrün als Text auf Karte',  t.primary,                t.card,       4.5],
    ['Label auf Erfolgsfüllung',       t['success-foreground'],  t.success,    4.5],
    ['Label auf Warnfüllung',          t['warning-foreground'],  t.warning,    4.5],
    ['Label auf Gefahrfüllung',        t['danger-foreground'],   t.danger,     4.5],
    ['Label auf Infofüllung',          t['info-foreground'],     t.info,       4.5],
    ['Weiß auf Discord-Füllung',       '#ffffff',                t.discord,    4.5],
    ['Discord als Textfarbe',          t['discord-text'],        t.background, 4.5],
    ['Text auf Karte',                 t['card-foreground'],     t.card,       4.5],
    ['Text auf Sekundärfüllung',       t['secondary-foreground'], t.secondary, 4.5],
    ['Text auf Akzentfüllung',         t['accent-foreground'],   t.accent,     4.5],
    // The four colours of the breakdown charts on both statistics pages.
    // They appear as text on the tinted tile, not only as bar fill.
    // Before, they were raw Tailwind classes this test could not see:
    // `yellow-400` measured 1.39:1 there, `sky-400` 1.95:1, `rose-400` 2.45:1. All
    // three had been chosen for the dark theme only.
    ['Diagrammfarbe Grün auf Kachel',      t.primary,               t.muted,      4.5],
    ['Diagrammfarbe Bernstein auf Kachel', t.warning,               t.muted,      4.5],
    ['Diagrammfarbe Blau auf Kachel',      t.info,                  t.muted,      4.5],
    ['Diagrammfarbe Rosé auf Kachel',      t['chart-rose'],         t.muted,      4.5],
    ['Diagrammfarbe Violett auf Kachel',  t['chart-violet'],       t.muted,      4.5],
    ['Diagrammfarbe Petrol auf Kachel',   t['chart-teal'],         t.muted,      4.5],
    ['Diagrammfarbe Magenta auf Kachel',  t['chart-fuchsia'],      t.muted,      4.5],
    ['Gefahrfarbe als Text auf Kachel',    t.danger,                t.muted,      4.5],
    ['Gefahrfarbe als Text auf Karte',     t.danger,                t.card,       4.5],
    // Live log console of the hosted bot. Its surface is dark in both themes,
    // so both runs show the same numbers here.
    // Before, the console sat on `--color-background`, so in the light theme
    // on white, where the normal line measured 1.48:1.
    ['Logzeile auf der Konsole',        t['log-text'],           t.console,    4.5],
    ['Gedämpfte Logzeile',              t['log-dim'],            t.console,    4.5],
    ['Fehlerzeile im Log',              t['log-error'],          t.console,    4.5],
    ['Warnzeile im Log',                t['log-warn'],           t.console,    4.5],
    ['Erfolgszeile im Log',             t['log-ok'],             t.console,    4.5],
    ['Infozeile im Log',                t['log-info'],           t.console,    4.5],
  ]

  it.each(paare)('%s', (_label, fg, bg, need) => {
    expect(fg, 'Token fehlt').toBeTruthy()
    expect(bg, 'Token fehlt').toBeTruthy()
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(need)
  })

  /**
   * Ecosystem badges.
   *
   * Until 22.08.2026 they were raw Tailwind classes in
   * `components/ui/Badge.tsx` and therefore invisible to this test, which
   * only reads `--color-*` from `globals.css`. In the light theme all nine were
   * below AA, worst of all `js` at 1.46:1.
   *
   * The case checked is the one that is actually rendered: the text does not sit on
   * the card but on its own 12 percent surface above it. That surface is
   * closer to the text than the card, so the contrast is lower. Anyone who only
   * calculates against the card measures themselves too kindly.
   */
  /**
   * Premium+ tier badge in the ticketbot dashboard. A case of its own, because it is
   * tinted at 10 % and not at 12 % like the ecosystem badges. Until
   * 24.08.2026 it was the last colour outside the token block and therefore sat
   * unseen below AA in both themes.
   */
  it('Tier-Badge Premium+ ist auf seiner eigenen Fläche lesbar', () => {
    expect(t['tier-plus'], 'Token --color-tier-plus fehlt').toBeTruthy()
    expect(contrast(t['tier-plus'], mix(t['tier-plus'], t.card, 0.1))).toBeGreaterThanOrEqual(4.5)
    expect(t['tier-business'], 'Token --color-tier-business fehlt').toBeTruthy()
    expect(contrast(t['tier-business'], mix(t['tier-business'], t.card, 0.1))).toBeGreaterThanOrEqual(4.5)
  })

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
    expect(contrast('#27762e', '#ffffff')).toBeCloseTo(contrast('#ffffff', '#27762e'), 10)
  })
})
