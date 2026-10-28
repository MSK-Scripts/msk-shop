import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Contrast of the design tokens against WCAG 2.2 AA.
 *
 * Reads the values straight from `app/globals.css`, so the test checks the real
 * tokens and not a copy that silently drifts apart. Every pair below is a
 * combination that is actually rendered: text (4.5:1) or a control border,
 * focus ring or sign (3:1) on the surface it sits on. The last test makes sure
 * that no colour token is left without a pair, so a new token cannot ship
 * untested.
 *
 * Deliberately not measured in the browser: `color-mix()` comes back there as
 * `color(srgb …)`, and CSS transitions freeze at their start value in renderers
 * running headless. Both produce false findings. Tints are mixed in sRGB here,
 * the components mix in oklab; at 8 to 12 percent the two differ by less than
 * the margin the values keep above the limit.
 */

const CSS = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

function readTokens(scope: 'light' | 'dark'): Record<string, string> {
  const start = scope === 'light' ? CSS.indexOf('@theme {') : CSS.indexOf('.dark {')
  expect(start, `token block for ${scope} not found`).toBeGreaterThan(-1)
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

/** A token name, a literal `#rrggbb`, or a tint of one token over another. */
type Ref = string | { mix: [Ref, Ref, number] }
type Pair = [label: string, fg: Ref, bg: Ref, need: number]

function resolve(t: Record<string, string>, ref: Ref): string | undefined {
  if (typeof ref !== 'string') {
    const [a, b, p] = ref.mix
    const [x, y] = [resolve(t, a), resolve(t, b)]
    return x && y ? mix(x, y, p) : undefined
  }
  return ref.startsWith('#') ? ref : t[ref]
}

function tokenNames(ref: Ref): string[] {
  if (typeof ref !== 'string') return [...tokenNames(ref.mix[0]), ...tokenNames(ref.mix[1])]
  return ref.startsWith('#') ? [] : [ref]
}

const tint = (color: string, over: string, p: number): Ref => ({ mix: [color, over, p] })

const STATUS = ['success', 'warning', 'danger', 'info'] as const

const PAIRS: Pair[] = [
  // Ground, tile and card.
  ['Text on the ground',                 'foreground',       'background', 4.5],
  ['Text on the tile',                   'foreground',       'muted',      4.5],
  ['Text on a card',                     'card-foreground',  'card',       4.5],
  ['Muted text on the ground',           'muted-foreground', 'background', 4.5],
  ['Muted text on the tile',             'muted-foreground', 'muted',      4.5],
  ['Muted text on a card',               'muted-foreground', 'card',       4.5],
  // Striped table rows mix the tile into the ground (legal texts, Tebex tables).
  ['Muted text on a striped row',        'muted-foreground', tint('muted', 'background', 0.4), 4.5],

  // MSK green: fill with its label, and green text on every light surface.
  ['Label on the primary fill',          'primary-foreground', 'primary',       4.5],
  ['Label on the primary hover fill',    'primary-foreground', 'primary-hover', 4.5],
  ['Green text on the ground',           'primary',            'background',    4.5],
  ['Green text on the tile',             'primary',            'muted',         4.5],
  ['Green text on a card',               'primary',            'card',          4.5],
  // Text links turn to the hover green while the pointer is on them.
  ['Hovered green link on the ground',   'primary-hover',      'background',    4.5],
  ['Hovered green link on a card',       'primary-hover',      'card',          4.5],

  // Soft green surface: a chosen variant, table heads, framework tags.
  ['Text on the soft green surface',       'foreground',       'accent-soft', 4.5],
  ['Muted text on the soft green surface', 'muted-foreground', 'accent-soft', 4.5],
  ['Green text on the soft green surface', 'primary',          'accent-soft', 4.5],

  // Anthracite band and green band; both keep their colours in both themes.
  ['Text in the anthracite band',          'band-foreground',        'band',        4.5],
  ['Muted text in the anthracite band',    'band-muted',             'band',        4.5],
  ['Green text in the anthracite band',    'band-accent',            'band',        4.5],
  ['Label on green in the band',           'band-accent-foreground', 'band-accent', 4.5],
  ['Text in the green band',               'brand-foreground',       'brand',       4.5],
  ['Muted text in the green band',         'brand-muted',            'brand',       4.5],
  // The white button of the closing band, at rest and on hover. Its label
  // must stay dark green in the dark theme too.
  ['Label on the white button in the green band',   'brand-button-foreground', 'brand-button', 4.5],
  ['Label on the hovered button in the green band', 'brand-button-foreground', 'brand-muted',  4.5],

  // The grey secondary button, at rest and on hover (it fills with the tile).
  ['Label on the secondary button',         'secondary-foreground', 'secondary', 4.5],
  ['Label on the hovered secondary button', 'secondary-foreground', 'muted',     4.5],

  // Controls (WCAG 1.4.11): field borders and the focus ring.
  ['Form control border on a card',      'input', 'card',       3],
  ['Form control border on the ground',  'input', 'background', 3],
  ['Focus ring on the ground',           'ring',  'background', 3],
  ['Focus ring on a card',               'ring',  'card',       3],

  // Status colours of the dashboards: word, sign and border on the ground, a
  // card, the tile (Notice) and their own tint (StatusBadge at 8 %, the
  // upload and verify notes at 10 %; the 10 % tint is the stricter case).
  ...STATUS.flatMap((s): Pair[] => [
    [`Status ${s} on the ground`,           s, 'background', 4.5],
    [`Status ${s} on a card`,               s, 'card',       4.5],
    [`Status ${s} on the tile`,             s, 'muted',      4.5],
    [`Status ${s} on its tint over a card`, s, tint(s, 'card', 0.1),       4.5],
    [`Status ${s} on its tint over the ground`, s, tint(s, 'background', 0.1), 4.5],
  ]),
  ['Label on the destructive button',    'danger-foreground', 'danger', 4.5],

  // Discord: the fill of Discord actions, and the mark beside them (non-text).
  ['White label on the Discord fill',    '#ffffff', 'discord',    4.5],
  ['Discord mark on a card',             'discord', 'card',       3],
  ['Discord mark on the ground',         'discord', 'background', 3],

  // Breakdown charts of the statistics pages: each label sits in the
  // colour of its bar on the tile.
  ['Chart label rose on the tile',       'chart-rose',    'muted', 4.5],
  ['Chart label violet on the tile',     'chart-violet',  'muted', 4.5],
  ['Chart label teal on the tile',       'chart-teal',    'muted', 4.5],
  ['Chart label fuchsia on the tile',    'chart-fuchsia', 'muted', 4.5],
  ['Chart label Business on the tile',   'tier-business', 'muted', 4.5],

  // Sale price on a product card, in the buy box and in a chosen variant.
  ['Sale price on a card',               'sale', 'card',        4.5],
  ['Sale price on the ground',           'sale', 'background',  4.5],
  ['Sale price on the soft green surface', 'sale', 'accent-soft', 4.5],

  // Live log console of the hosted bot. Its surface is dark in both themes,
  // so both runs show the same numbers here.
  ['Log line on the console',            'log-text',  'console', 4.5],
  ['Dimmed log line',                    'log-dim',   'console', 4.5],
  ['Error line in the log',              'log-error', 'console', 4.5],
  ['Warning line in the log',            'log-warn',  'console', 4.5],
  ['Success line in the log',            'log-ok',    'console', 4.5],
  ['Info line in the log',               'log-info',  'console', 4.5],
]

/** Tokens that are hairlines only and never carry or sit under text. */
const LINES_ONLY = ['border', 'band-line']

const light = readTokens('light')
// Dark overrides only some of the tokens, the rest is inherited.
const dark = { ...light, ...readTokens('dark') }

describe.each([
  ['Light theme', light],
  ['Dark theme', dark],
])('%s: contrast reaches WCAG AA', (_name, t) => {
  it.each(PAIRS)('%s', (_label, fg, bg, need) => {
    const [a, b] = [resolve(t, fg), resolve(t, bg)]
    expect(a, `token ${JSON.stringify(fg)} missing`).toBeTruthy()
    expect(b, `token ${JSON.stringify(bg)} missing`).toBeTruthy()
    expect(contrast(a!, b!)).toBeGreaterThanOrEqual(need)
  })
})

describe('Coverage', () => {
  it('every colour token of globals.css is in at least one pair', () => {
    const covered = new Set(PAIRS.flatMap(([, fg, bg]) => [...tokenNames(fg), ...tokenNames(bg)]))
    const missing = Object.keys(light).filter(name => !covered.has(name) && !LINES_ONLY.includes(name))
    expect(missing).toEqual([])
  })

  it('every token a pair names exists', () => {
    const named = new Set(PAIRS.flatMap(([, fg, bg]) => [...tokenNames(fg), ...tokenNames(bg)]))
    expect([...named].filter(name => !(name in light))).toEqual([])
  })
})

describe('The calculation itself', () => {
  it('knows the known extremes', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    expect(contrast('#27762e', '#ffffff')).toBeCloseTo(contrast('#ffffff', '#27762e'), 10)
  })
})
