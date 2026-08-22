---
name: MSK Scripts Shop
description: A one-person FiveM script shop that shows its work instead of advertising it.
colors:
  workshop-green: "#3a7d1c"
  workshop-green-dark: "#5eb131"
  signal-green: "#5eb131"
  signal-green-dark: "#79e84a"
  workbench-charcoal: "#0d1117"
  paper-white: "#ffffff"
  ink: "#0a0a0a"
  ink-inverted: "#e6edf3"
  panel-light: "#f4f4f5"
  panel-dark: "#161b22"
  hairline-light: "#e4e4e7"
  hairline-dark: "#30363d"
  quiet-light: "#6b6b74"
  quiet-dark: "#8b949e"
  danger: "#dc2626"
  success: "#157f3b"
  warning: "#a45709"
  info: "#0369a1"
  discord-blurple: "#5865F2"
typography:
  display:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.15em"
rounded:
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
spacing:
  card: "1.5rem"
  grid-gap: "1rem"
  section: "2.5rem"
  section-lg: "3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.workshop-green}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.workshop-green}"
    textColor: "{colors.paper-white}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.5rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "2.5rem"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "2.5rem"
  card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card}"
  input:
    backgroundColor: "{colors.panel-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.625rem 0.75rem"
  badge-primary:
    textColor: "{colors.workshop-green}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.label}"
---

# Design System: MSK Scripts Shop

## Overview

**Creative North Star: "The Developer's Workbench"**

This is the workspace of one person who would rather show the work than advertise
it. Everything on the surface behaves like a tool on a bench: it is labelled, it
is within reach, and it does not pretend to be more than it is. The live server
count links to the page where it can be checked. The purchase flow names the
Escrow and Keymaster steps instead of smoothing them over. Numbers come from a
cron job, not from a copywriter.

The visual consequence is restraint that reads as competence rather than as
timidity. Surfaces are flat and separated by a single hairline. The green appears
where something can be acted on and almost nowhere else. Monospace is reserved
for things that are literally machine-readable: identifiers, counts, key
fragments, and the small labels that name a section the way a label names a
drawer.

The anti-reference is the anonymous FiveM script shop: neon glow, gradient slabs,
"PREMIUM" badges, borrowed render art, no person behind it, and round numbers
with no source. Every rule below exists because a buyer comparing this against
those shops is deciding whether one developer will still be here in a year.

**Key Characteristics:**
- Dark by default, light fully equal, both driven by the same tokens
- Flat at rest; motion only ever answers an action
- One accent colour, used where something happens
- Monospace means machine-readable, never decoration
- Every displayed number traceable to a source

## Colors

Two greens on a near-neutral ground, and nothing else competing for attention.

### Primary
- **Workshop Green** (`#3a7d1c` light, `#5eb131` dark): every element the visitor
  can act on. Primary buttons, active navigation, focus rings, links inside
  running text, the rule in front of a section label. It carries two jobs at once,
  as a fill under white text and as text on the page ground, which is why the
  light value is this deep: at `#4ea426` it measured 3.15:1 and failed both.

### Secondary
- **Signal Green** (`#5eb131` light, `#79e84a` dark): fills only, never text. The
  brighter historical MSK green, used for tinted surfaces such as the 12 % badge
  wash and the icon plates. It is too light to carry a label in either theme.

### Neutral
- **Workbench Charcoal** (`#0d1117`): the dark ground. GitHub-dark adjacent on
  purpose, because the audience already reads code on that background.
- **Paper White** (`#ffffff`): the light ground and the card surface in light mode.
- **Ink** (`#0a0a0a` light) / **Inverted Ink** (`#e6edf3` dark): primary text.
- **Panel** (`#f4f4f5` light, `#161b22` dark): raised surfaces, inputs, card
  interiors in dark mode.
- **Hairline** (`#e4e4e7` light, `#30363d` dark): every border and divider. This
  is the system's main separation device, doing the work a shadow would do
  elsewhere.
- **Quiet** (`#6b6b74` light, `#8b949e` dark): secondary text, captions, helper
  copy. The light value is deliberately not `#71717a`, which measured 4.40:1 on
  the panel surface.

### Functional
- **Danger** (`#dc2626` light, `#f87171` dark), **Success** (`#157f3b` / `#4ade80`),
  **Warning** (`#a45709` / `#f59e0b`), **Info** (`#0369a1` / `#38bdf8`): status
  only. Their foreground colour flips per theme, because a functional colour dark
  enough to carry white in light mode is too dark to sit on charcoal.
- **Discord Blurple** (`#5865F2`): only for Discord actions. It exists twice in
  the tokens, as a fill and as a text colour (`#7d86f5` in dark), because one
  value cannot serve both at 4.5:1.

### Named Rules

**The Two Greens Rule.** Workshop Green acts, Signal Green fills. If a green is
carrying text, it is Workshop Green. If it is a background wash, an icon plate, or
a badge tint, it is Signal Green. Swapping them breaks contrast in one theme or
the other, every time.

**The Measured Contrast Rule.** Colour pairs are computed, not eyeballed.
`tests/contrast.test.ts` reads the tokens straight out of `app/globals.css` and
recalculates every pair; a value changed without recomputation fails there. WCAG
AA is the floor for both themes.

## Typography

**Display and Body Font:** Inter Variable (with system sans fallbacks)
**Label / Mono Font:** JetBrains Mono Variable (with system mono fallbacks)

Both are bundled locally through `@fontsource-variable`. This is not a preference,
it is a constraint: the nonce-based CSP admits no external font host.

**Character:** Inter does the talking and stays out of the way; JetBrains Mono
appears exactly where something is machine-readable. The pairing is a workshop
pairing, plain lettering on the sign and stencilled type on the parts bin.

### Hierarchy
- **Display** (700, `clamp(2.25rem, 5vw, 3.75rem)`, 1.05, -0.025em): page-opening
  headline. One per page, never twice.
- **Headline** (700, `clamp(1.875rem, 3vw, 2.25rem)`, 1.15, -0.025em): section
  headings.
- **Title** (700, 1.125rem, 1.25): card and panel headings.
- **Body** (400, 0.875rem base, 1.625): running copy, in Quiet for anything
  secondary. Prose columns cap at 65ch through `container-prose`.
- **Label** (600, 0.6875rem, 0.15em, uppercase, mono): section labels, table
  headers, key fragments, counts.

### Named Rules

**The Machine-Readable Mono Rule.** Monospace marks things a machine produced or
consumes: identifiers, counts, key fragments, timestamps, file paths. It is never
used to make prose look technical.

**The Eyebrow Ration Rule.** The small green mono label above a heading
(`.eyebrow`, with its 24 px rule) is an emphasis device, not a section frame. At
most **one per three sections** on any page. It reached four of five sections on
the landing page and stopped reading as emphasis; it reads as a template. When in
doubt, drop it. The heading carries the section on its own.

## Layout

Content sits in one of four containers, chosen by what the visitor is doing
rather than by page type. This is the distinction the system got wrong until
22 August 2026, when statistics pages and dashboards were still using the catalog
container and ran to 2560 px.

- **`container-prose`** (65ch): running text. Legal pages, long-form copy.
- **`container-app`** (90rem / 1440 px): work surfaces. Both dashboards, both
  statistics pages, the admin cockpit. Someone here is reading rows and numbers,
  and a figure parked 2000 px from the page edge is slower to find, not faster.
- **`container-page`** (120rem / 1920 px): ordinary pages.
- **`container-wide`** (160rem / 2560 px): card grids only, currently `/packages`
  and `/resources`. These are the only layouts that genuinely gain from another
  column.

Horizontal padding steps 1rem, 2rem at 768 px, 3rem at 1536 px. Section rhythm is
`2.5rem` vertical, `3.5rem` from the medium breakpoint. Card interiors are
`1.5rem`, grid gaps `1rem`.

Card grids use `repeat(auto-fit, minmax(min(100%, <n>px), 1fr))` rather than
breakpoint column counts, with a fixed image height instead of an aspect ratio.
An aspect ratio scales with column width and produces a 300 px tall banner at two
columns, so the card changes shape as the viewport moves.

The desktop navigation appears at `xl` (1280 px), not `md`. The header's intrinsic
content is wider than 768 px in German, and switching at `md` made the page scroll
sideways across the three most common laptop widths.

### Named Rules

**The Working-Surface Cap Rule.** If the visitor is working rather than browsing,
the content is capped at `container-app`. Dashboards, settings, statistics and
admin never run to the full viewport. A 1920 px wide form field is not more usable
than a 1000 px one, only harder to read.

**The Reachable Control Rule.** Interactive controls carry a 44 px hit area. Where
a control must stay visually small, `tap-target` extends the hit area through a
pseudo-element rather than growing the box, because the header carries six
controls side by side at 375 px. WCAG AA asks for 24 px and is already met; 44 px
is the target because this shop gets bought on phones.

## Elevation & Depth

The system is flat and separates by line, not by shadow. Every surface at rest
sits on the page with a 1 px hairline and a shadow that is barely there
(`0 1px 2px rgb(0 0 0 / 0.05)`). Depth is tonal: the panel colour steps away from
the page ground, and the border draws the edge.

Shadow is a response, not a property. It appears when a card is hovered, and then
it appears clearly.

### Shadow Vocabulary
- **Resting** (`0 1px 2px 0 rgb(0 0 0 / 0.05)` light, `/ 0.4` dark): the seam
  under a card. Present so the card does not look printed on, invisible otherwise.
- **Lifted** (`0 8px 24px -8px rgb(0 0 0 / 0.12)` light, `0 12px 32px -8px rgb(0 0 0 / 0.6)` dark):
  hover on an interactive card, paired with a 4 px rise and a border that tints
  30 % toward Workshop Green.

### Named Rules

**The Flat-At-Rest Rule.** Nothing is elevated until it is touched. If a surface
needs a shadow to be legible while idle, the layout is wrong, not the shadow.

## Shapes

Corners are consistently soft and quiet: `0.25rem` for badges, `0.5rem` for
buttons and inputs, `0.75rem` for icon plates, `1rem` for cards. Nothing is a
pill, nothing is square. The one recurring geometric motif is the 24 × 1 px rule
in front of a section label, which reads as a margin mark rather than as
decoration.

Borders are always 1 px and always the hairline token. Emphasis is a colour shift
in the border, never a thickness change.

## Components

### Buttons
Restrained but responsive: a button acknowledges the press and then gets out of
the way.

- **Shape:** softly rounded (`0.5rem`), never pill, never square.
- **Sizes:** small `2rem`, medium `2.5rem` (default), large `3rem`, icon
  `2.5rem` square. Icon buttons carry `tap-target`.
- **Primary:** Workshop Green fill with its paired foreground, a resting shadow.
- **Hover / Active:** `brightness-110` on the fill, `scale(0.98)` on press,
  150 ms. No colour change on hover, only luminance, so the same rule works in
  both themes.
- **Outline / Ghost:** transparent, hairline border on outline only, both fill
  with the Panel colour on hover.
- **Link:** Workshop Green, underline on hover with a 4 px offset, no box.
- **Discord:** Blurple fill, reserved for Discord actions.
- **Focus:** a 2 px ring in Workshop Green with a 2 px offset in the page ground,
  on `:focus-visible` only.

### Cards
- **Corner:** `1rem`, the softest radius in the system.
- **Surface:** card colour on the page ground, 1 px hairline, resting shadow.
- **Hover (opt-in through `hoverLift`):** rises 4 px, takes the lifted shadow, and
  the border tints toward Workshop Green. Only cards that lead somewhere get it.
- **Padding:** `1.5rem`, header and content sharing the same inset.

### Inputs
- **Style:** Panel fill, 1 px hairline, `0.5rem` radius, `0.625rem` vertical inset.
- **Focus:** border shifts to Workshop Green with a 25 % tinted ring. No glow.
- **Labels sit above the field.** Placeholder is never the label.

### Badges
Small, quiet, monospace-adjacent. A tinted wash at 12 %, a 30 % border of the same
hue, and the hue's text colour. The framework badges (ESX, QBCore, Lua, TypeScript
and the rest) each carry their ecosystem's own colour, which is the one sanctioned
exception to the single-accent rule: they are identifiers, and a buyer scans for
them.

### Navigation
- Sticky, full-bleed, translucent with a backdrop blur, hairline underneath.
- Desktop links appear at `xl`; below that everything collapses into the menu.
- Active state is Workshop Green; hover fills with the Panel colour.
- Dropdowns are hand-built rather than taken from a component library. Anything
  that injects a `<style>` element at runtime is blocked by the CSP, which rules
  out most off-the-shelf menus and scroll locks.

### Section Label (`.eyebrow`)
The signature small element: a 24 px rule, then a mono label in Workshop Green at
0.6875 rem, 600 weight, 0.15em tracking, uppercase. Subject to the Eyebrow Ration
Rule above.

## Do's and Don'ts

### Do:
- **Do** pick the container from what the visitor is doing. `container-app` for
  work surfaces, `container-wide` only for card grids.
- **Do** separate with the hairline token and tonal steps. The border is the
  system's depth device.
- **Do** give every interactive control a 44 px hit area, through `tap-target`
  where the box must stay small.
- **Do** keep both themes equal. Every colour lives in the token block, and
  `tests/contrast.test.ts` recomputes the pairs.
- **Do** show a measured number with a link to where it can be checked, and let
  it disappear when the source is unreachable.
- **Do** use monospace for identifiers, counts and key fragments.
- **Do** build interactive chrome by hand when a library would inject styles at
  runtime. The CSP is a design constraint, not an implementation detail.

### Don't:
- **Don't** put an eyebrow above every section. One per three, at most.
- **Don't** elevate a surface at rest. Shadow answers hover, nothing else.
- **Don't** put Signal Green under text or Workshop Green into a large flat fill.
- **Don't** animate anything that no one triggered. No ambient loops, no drifting
  gradients, no perpetual pulses outside a genuine live indicator.
- **Don't** introduce a second accent colour. Framework badges are identifiers and
  are the only exception.
- **Don't** reach for a glow, a gradient slab or a "PREMIUM" flourish. That is the
  anti-reference, and the buyer is comparing against it right now.
- **Don't** state a number the code cannot source. A smaller measured figure beats
  a larger comfortable one.
- **Don't** use an em dash in visible copy, in either language.
