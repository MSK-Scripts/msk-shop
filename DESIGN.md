---
name: MSK Scripts Shop
description: A specialist shop, not a terminal. One person sells the tools they build, and shows them.
colors:
  ground: "#f6f6f4"
  ground-dark: "#18191b"
  card: "#ffffff"
  card-dark: "#212225"
  tile: "#ededea"
  tile-dark: "#111214"
  text: "#1c1d1f"
  text-dark: "#ececea"
  muted-text: "#5a5d61"
  muted-text-dark: "#a7a9ad"
  hairline: "#dcdcd8"
  hairline-dark: "#313337"
  control-border: "#84878b"
  control-border-dark: "#6d7075"
  msk-green: "#27762e"
  msk-green-dark: "#6dbb3d"
  msk-green-hover: "#1d5e23"
  msk-green-hover-dark: "#86cc58"
  soft-green: "#e8f1e4"
  soft-green-dark: "#1d2a1f"
  band: "#26282b"
  band-text: "#f2f2f0"
  band-green: "#7cc04b"
  warning: "#8f4e08"
  warning-dark: "#e2a457"
  danger: "#b3261e"
  danger-dark: "#f28b80"
  info: "#0b5d94"
  info-dark: "#72b6e6"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.2rem + 2.4vw, 5rem)"
    fontWeight: 750
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.2rem + 1.1vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
  h3:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.05rem + 0.45vw, 1.75rem)"
    fontWeight: 650
    lineHeight: 1.25
  product:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1.1rem + 0.55vw, 2rem)"
    fontWeight: 750
    fontStretch: "112%"
  body:
    fontFamily: "Source Sans 3 Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 0.9rem + 0.2vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Source Sans 3 Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(0.8125rem, 0.75rem + 0.08vw, 0.9375rem)"
    fontWeight: 600
    letterSpacing: "0.08em"
    textTransform: uppercase
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.625rem"
  xl: "1rem"
---

# Design System: MSK Scripts Shop

The reference for how msk-scripts.de and its three dashboards look and behave. The values
live in [`app/globals.css`](app/globals.css); this file says what they are for. Where a topic
has its own page, this file links it instead of repeating it: the stack and the styling setup
are in [docs/development.md](docs/development.md#design-and-styling), the admin areas in
[docs/admin-dashboard.md](docs/admin-dashboard.md).

## Principles

**"A specialist shop, not a terminal."** The shop looks like a place where one person sells
the tools they build: light, tidy, with real pictures of what is bought and a recognisable
person behind it.

- **Structure before looks.** A good-looking page is forgiven small faults, not large ones.
- **Show the work.** Real screenshots, numbers that come from a source and link to it, the
  purchase steps named as they are. A number the code cannot source is not shown.
- **One accent.** Anthracite and white carry the page, MSK green marks the brand and what can
  be acted on. Dark bands give weight; no effect without a job.
- **Fewer boxes.** Groups come from spacing and hairlines, not frames. Cards are for things
  that are clicked or hold a task of their own.
- **Fluid, not stepped.** Type, spacing, gutter and column grow with the window through
  `clamp()`; components follow their container, not the screen.
- **Both themes are equal.** Light is the default ground of the shop, dark is a palette of its
  own, the system setting decides (`next-themes`, `defaultTheme="system"`). Every pair is
  computed, not judged by eye.
- **The CSP is a design constraint.** Nothing may inject a `<style>` element or a script at
  runtime, so fonts are local, dialogs and menus are native elements, and chrome is built by
  hand rather than taken from a library that styles itself.
- **No photo of the owner.** The about page carries the MSK logo and lives on text, figures
  and links.

## Exclusion list

Binding for the shop and the dashboards (decided on 27.10.2026):

- Inter and JetBrains Mono, not even as a fallback in a token.
- The GitHub dark palette (`#0d1117`, `#161a20`, `#1f242c`, `#e6edf3`, `#8b949e`).
- Terminal mockups, a "release log" in terminal style, `>_` icons.
- Green monospace eyebrows with a leading dash.
- Lucide as the icon set.
- Rows of three or four equal cards with icon, title and two lines of text.
- The same banner as the picture of every product.
- Countdowns, artificial scarcity, prompts on entering the page.
- Em dashes in visible copy, in either language.

## Colour

Light values are the default in `@theme`, the `.dark` scope overrides them. Tailwind reads
them as `bg-[var(--color-…)]` and friends; the code always names the token, never a raw value.

### Tokens

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-background` | `#f6f6f4` | `#18191b` | The ground of every page |
| `--color-card` | `#ffffff` | `#212225` | Cards, dialogs, fields, the header bar |
| `--color-muted` | `#ededea` | `#111214` | The tile: table heads, notices, chart tiles, ghost hover |
| `--color-foreground`, `--color-card-foreground` | `#1c1d1f` | `#ececea` | Text |
| `--color-muted-foreground` | `#5a5d61` | `#a7a9ad` | Secondary text, hints, placeholders |
| `--color-border` | `#dcdcd8` | `#313337` | Hairlines and dividers, never text |
| `--color-input` | `#84878b` | `#6d7075` | Border of fields, outline buttons and radio cards (3:1) |
| `--color-ring` | `#27762e` | `#6dbb3d` | The focus outline |
| `--color-primary` | `#27762e` | `#6dbb3d` | MSK green: links, primary fill, active state |
| `--color-primary-foreground` | `#ffffff` | `#0e150e` | Label on the green fill |
| `--color-primary-hover` | `#1d5e23` | `#86cc58` | Hovered green fill and hovered text link |
| `--color-accent-soft` | `#e8f1e4` | `#1d2a1f` | Soft green surface: chosen variant, tags, highlighted heads |
| `--color-secondary`, `-foreground` | `#ededea`, `#1c1d1f` | `#2a2b2e`, `#ececea` | Grey secondary button |
| `--color-band`, `-foreground`, `-muted`, `-line` | `#26282b`, `#f2f2f0`, `#adb0b4`, `#3b3e42` | same | Anthracite band: hero, page heads, footer |
| `--color-band-accent`, `-foreground` | `#7cc04b`, `#101710` | same | Green on the band and the label on it |
| `--color-brand`, `-foreground`, `-muted` | `#27762e`, `#ffffff`, `#eaf4e6` | same | MSK green band before the footer, header stripe |
| `--color-brand-button`, `-foreground` | `#ffffff`, `#1d5e23` | same | The white button in the green band |
| `--color-success` | `#27762e` | `#6dbb3d` | Status: done, running |
| `--color-warning` | `#8f4e08` | `#e2a457` | Status: attention, pending |
| `--color-danger`, `-foreground` | `#b3261e`, `#ffffff` | `#f28b80`, `#18191b` | Status: error; fill of the destructive button |
| `--color-info` | `#0b5d94` | `#72b6e6` | Status: information |
| `--color-discord` | `#5865F2` | same | Fill of Discord actions, the Discord mark |
| `--color-chart-rose`, `-violet`, `-teal`, `-fuchsia` | | | Further series of the statistics charts |
| `--color-tier-business` | `#7d6200` | `#d9a400` | The Business tier in the ticket bot statistics |
| `--color-sale` | `#c90000` | `#ff6663` | Sale price |
| `--color-console`, `--color-log-*` | | same | The live log of the hosted bot, dark in both themes |

The bands keep their colours in both themes. On the anthracite band the page green measures
about 2.3:1, so the band has its own green (`--color-band-accent`) and `.surface-band` turns
the focus ring and the kicker to it; `.surface-brand` turns the ring white.

### Where green belongs

MSK green is visibly the brand, in fixed places only:

- the 4 px stripe above the header (`--color-brand`) and the green band before the footer
  (`.surface-brand`, on every page `hasClosingBand()` in `lib/routes.ts` allows);
- the brand words in a hero heading and the line above the entry list beside it
  (`Accent`, `HeroLinks`, `HeroFacts`, all in the band green);
- the kicker above headings (`.kicker`);
- everything that can be clicked: text links, the primary button, the active menu item, the
  cart count;
- check marks, framework tags, highlighted table heads and anything selected
  (`--color-accent-soft` with green text).

Status colours appear in the dashboards only, and never alone: a word and a sign always go
with them (`StatusBadge`, `Notice`). Red fills belong to confirmation dialogs and danger zones.

### The logo ramp

`public/logo.png` is a gradient in which hue and chroma follow the lightness (H 150.1 / C
0.076 at L 0.31, H 136.4 / C 0.179 at L 0.69), so "the green from the logo" is a ramp, not a
value. A green takes the lightness its role needs to pass its contrast pairs, then the hue and
chroma the logo carries at that lightness, then snaps to the nearest pixel colour the logo
actually contains. Beyond the logo's lightness range, keep its end hue and continue the
chroma; extrapolating the hue turns the colour into a lime the logo never shows.

### Contrast

WCAG 2.2 AA is the floor in both themes: 4.5:1 for text, 3:1 for control borders, focus rings
and signs that carry meaning. [`tests/contrast.test.ts`](tests/contrast.test.ts) reads the tokens
from `app/globals.css` and recomputes every pair that is rendered, per theme: text on ground,
tile, card and the soft green, the green as text and as a fill, both bands, the status colours
on their surfaces and their own tint, chart labels on the tile, the sale price, the log lines
on the console. A coverage test fails when a colour token has no pair at all, so a new token
cannot ship untested. Only the two hairline tokens are exempt.

## Typography

| Role | Size (phone to UWQHD) | Font | Utility |
|---|---|---|---|
| Display (H1) | `clamp(2.25rem, 1.2rem + 2.4vw, 5rem)`, 36 to 80 px, line height 1.06 | Archivo 750, tracking -0.02em | `text-display` |
| H2 | `clamp(1.75rem, 1.2rem + 1.1vw, 3rem)`, 28 to 48 px | Archivo 700 | `text-h2` |
| H3 | `clamp(1.25rem, 1.05rem + 0.45vw, 1.75rem)`, 20 to 28 px | Archivo 650 | `text-h3` |
| Product name | `clamp(1.375rem, 1.1rem + 0.55vw, 2rem)`, width axis 112 % | Archivo 750 | `text-product [font-stretch:112%]` |
| Lead | `clamp(1.1875rem, 1rem + 0.35vw, 1.5rem)` | Source Sans 3 400 | `text-lead` |
| Body | `clamp(1.0625rem, 0.9rem + 0.2vw, 1.25rem)`, 17 to 20 px, line height 1.6 | Source Sans 3 400 | `text-body` (the body default) |
| Small | `clamp(0.9375rem, 0.85rem + 0.12vw, 1.0625rem)` | Source Sans 3 400 | `text-small` |
| Label | `clamp(0.8125rem, 0.75rem + 0.08vw, 0.9375rem)`, uppercase, 0.08em | Source Sans 3 600 | `text-label` |

- **Fonts:** Archivo (`--font-display`) for headings and product names, Source Sans 3
  (`--font-sans`) for everything else, both variable and loaded locally through
  `@fontsource-variable` in `app/[lang]/layout.tsx` and `app/auth/layout.tsx`. Code, keys and
  ids use the system monospace (`--font-mono`), no web font.
- **Zoom:** every maximum is at most 2.5 times its minimum, so browser zoom reaches 200 %
  (WCAG 1.4.4).
- **Measure:** running text stays under 65 characters per line, on UWQHD too (`max-w-[65ch]`,
  `.tebex-description` at 38rem). The three legal pages are the one deliberate exception:
  82rem at 1.125rem with line height 1.75, taken from `musiker15.de/impressum`; size, leading
  and measure move together or not at all.
- Headings start with their most telling words and are balanced (`text-wrap: balance`).
- Prices, counts and table figures use `tabular-nums`.
- Monospace marks what a machine reads or writes: keys, ids, commands, file names. It never
  makes prose look technical.

## Layout

One shell for the public site, `container-page`: header, content and footer sit in it on
every route and share one edge. Content that does not gain from the width caps itself inside
(`max-w-*`, the measures above), it never gets a second shell.

| Token | Value | Use |
|---|---|---|
| `--page-column` | `clamp(72rem, 84vw, 180rem)` | Width of the page column |
| `--page-gutter` | `clamp(1rem, 4vw, 7.5rem)` | Side gutter, at least the safe area |
| `--header-height` | `clamp(3.75rem, 3rem + 1vw, 5rem)` | Header bar, plus its 4 px stripe |
| `--space-section` | `clamp(3rem, 1.5rem + 3.5vw, 7.5rem)` | Vertical rhythm between sections |
| `--space-stack` | `clamp(1.25rem, 0.75rem + 1vw, 2.5rem)` | Rhythm between blocks in a section |
| `--grid-card` | `clamp(18rem, 16.25rem + 6.3vw, 30rem)` | Card minimum: 351 px at 1440, 421 at 2560, 477 at 3440 |
| `--grid-card-wide` | `clamp(20.5rem, 18.75rem + 6.3vw, 32.5rem)` | Cards with a sparkline (resource statistics) |
| `--app-topbar`, `--app-sidebar`, `--app-gutter`, `--app-gutter-y` | fluid | Dashboard app shell, denser than the site |
| `--app-content` | `130rem` | Content cap of the dashboards |
| `--app-tabbar` | `3.75rem` | Bottom tab bar of the bot dashboards on a phone |

- **Card grids** are `grid-cols-[repeat(auto-fill,minmax(min(100%,var(--grid-card)),1fr))]`.
  The minimum grows with the window, so extra width buys bigger cards first and more columns
  second; no card is narrower than at 1920 px and no width costs a column.
- **Container queries first.** Components that sit in more than one place are `@container`
  and switch with `@md:` to `@7xl:` or `@min-[…]:` on their own width.
- **Viewport breakpoints in use:** `md` (768 px) for spacing steps, `lg` (1024 px) for the
  dashboard sidebar (below it a drawer), `xl` (1280 px) for the desktop navigation, because
  the German header is wider than a tablet, `min-[1280px]` for the two hero columns and
  `min-[1600px]` for a section head beside its content.
- **No sideways scrolling** down to 320 px (WCAG 1.4.10). Wide tables scroll in their own
  focusable container.

## Surface and shape

- **Radii:** `rounded-sm` (4 px) for tags and status badges, `rounded-md` (6 px) for buttons,
  fields and radio cards, `rounded-lg` (10 px) for cards and dialogs. `rounded-xl` (16 px) is
  still on the verify pages, the gallery cards and the news popup; new surfaces use
  `rounded-lg`. Buttons and tags are never pills; round shapes are kept for dots, the cart count
  and bars.
- **Borders:** hairlines are 1 px `--color-border`. Controls carry 1.5 px `--color-input`, which
  reaches 3:1. Emphasis is a colour change of the border, not a thicker one.
- **Shadow answers a pointer.** At rest a card has a seam (`--shadow-card`); a clickable card
  (`Card hoverLift`) takes `--shadow-card-hover` and a green border on hover and does not move.
- **Bands:** `.surface-band` (anthracite) for hero, page heads of the content pages and footer,
  `.surface-brand` (green) for the closing band. The checkerboard `.checker-bg` sits behind the
  transparent gallery images.

## Components

Base components live in `components/ui`, page heads in `components/page`, the dashboard kit in
`components/dashboard`. Reach for these before writing markup of your own.

### Base (`components/ui`)

| Component | Use it for |
|---|---|
| `Button` | Every button and button-styled link (`asChild`). Variants: `primary` (one main action per area), `outline` (second action), `link` (third), `ghost` (quiet icon and toolbar actions), `secondary` (grey, beside a primary where both are a real choice), `danger` (confirming a destructive action), `discord`, and `band` / `band-outline` on the anthracite band. Sizes `sm` (36 px, tables and dashboards), `md` and `lg` (44 px and up), `icon` (40 px plus the 44 px `tap-target`). Heights are minimums, so a long German label wraps. |
| `Card` | A surface for something clicked or a task of its own; `hoverLift` for clickable ones. Padding comes from the caller. |
| `Badge` | A tag: framework or category, green on the soft green surface. Not for states. |
| `Input`, `Select`, `fieldClassName` | Text fields and native selects: 16 px text or more (no zoom on iOS), 3:1 border, red border once `aria-invalid`. |
| `RadioCard` | A choice between variants: a native radio covering the whole card. |
| `Dialog` | Modal dialog on the native `<dialog>`: focus trap, Escape and the inert page come from the browser. |
| `Skeleton` | Placeholder while data loads. |
| `NewsPopup` | The news popup the admin edits. |

### Page heads (`components/page`) and sections

| Component | Use it for |
|---|---|
| `PageHero` (+ `Accent`, `BrandTitle`, `HeroLinks`, `HeroFacts`) | The head of a content page on the anthracite band: kicker, heading with brand words in band green, lead, actions, from 1280 px an aside. |
| `PageHead` | The head of a task page on the light ground (cart, checkout, sign-in, account, legal forms): no band, so the task stays on the first screen. |
| `FactList` | Items with a short title and a sentence, grouped by spacing and hairlines; the replacement for rows of icon cards. |
| `Section`, `TextLink` (`components/home/Section.tsx`) | Frame of a page section (kicker, heading, intro, then a size container), and the third button level: a green text link with an arrow. |
| `StatsHero`, `FigureList`, `Breakdown` (`components/stats`) | The two public statistics pages. |

### Dashboards (`components/dashboard`)

| Component | Use it for |
|---|---|
| `AppShell` | The frame of all three dashboards: top bar with the green stripe, labelled sidebar groups, drawer below 1024 px, bottom tab bar for the bot dashboards. Renders the one `<main id="main">`. |
| `ServerSwitcher` | Choosing among the servers the session may manage, at the top of the sidebar. |
| `PageHeader` | Title, at most one primary action, a status, breadcrumbs below the sidebar level. |
| `SectionCard` | A labelled section of a page with its own actions. |
| `StatTile`, `StatGrid` | One figure per tile, a trend only with arrow, colour and words. |
| `DataTable` | Tables: caption, sortable headers with `aria-sort`, own scroll container, empty row. |
| `RowMenu` | The overflow actions of a table row, on the native popover. |
| `StatusBadge` | The state of a system object, always word plus sign, same tone for the same state everywhere. |
| `Notice` | A message inside a page: tone bar, sign and title in the tone colour, body in text colour; `role="status"` or `alert` when it appears after an action. |
| `EmptyState` | Never a blank list: first use, no results, error or unavailable, each with one next step. |
| `FormField`, `FormSection` | Label, hint, field and error wired together; groups with the explanation beside the fields where there is room. |
| `SaveBar` | Save and Discard while a settings page holds changes. |
| `ConfirmDialog` | Asking before serious consequences only; buttons name the consequence, irreversible ones ask to type the name. |
| `CopyField` | A value to copy that stays selectable text. |

The admin adds a few helpers of its own in `app/[lang]/admin/adminUi.tsx` (area header, filter
chips, pager, masked values); see [docs/admin-dashboard.md](docs/admin-dashboard.md).

## Icons

- **One set:** Phosphor (`@phosphor-icons/react`), regular weight, imported only from
  [`components/icons`](components/icons/index.tsx), which uses the SSR build so the same
  import works in server and client components. Status signs use `weight="bold"`.
- **Decorative by default:** every icon renders `aria-hidden` and not focusable. Give it an
  `aria-label` or `aria-labelledby` and it is announced instead. An icon-only button carries its
  name on the button.
- **Sizes:** `h-4 w-4` beside small text, `h-5 w-5` beside body text and in notices.
- **Brand marks** (GitHub, payment methods) are local SVG in their original shape
  (`components/icons/GithubMark.tsx`, `components/layout/PaymentMarks.tsx`).
- The module lists only icons something imports, which keeps the bundle to what is used.

## Motion

- Motion answers an action: colour and border transitions of 150 ms on controls and cards,
  200 ms for fades, the skip link and the theme colours. Nothing moves on its own.
- The one ambient animation is the pulsing dot of a live indicator (`.pulse-dot`);
  `Skeleton` pulses while data loads. No auto-advancing carousels.
- `prefers-reduced-motion: reduce` cuts every animation and transition to 0.01 ms and turns
  smooth scrolling off (end of `app/globals.css`). Switching the theme disables transitions for
  that moment (`disableTransitionOnChange`).

## Accessibility

- **Skip link** "Skip to content" as the first element, to the one `<main id="main">`.
- **Focus** is a 3 px outline in `--color-ring` with 2 px offset on `:focus-visible`, adjusted on
  both bands. `scroll-padding-top` keeps a focused element clear of the sticky header (WCAG
  2.4.11).
- **Targets** are at least 44 px: buttons through their minimum height, small controls through
  `tap-target`, which extends the hit area without growing the box.
- **Native first:** real radio buttons for variants, native `<select>`, `<dialog>` and popover.
  Fewer scripts, nothing the CSP has to allow, and the browser's own keyboard handling.
- **Forms:** labels above the field, never a placeholder as label; hint and error tied to the
  field through `aria-describedby`, `aria-invalid` on error, what was typed is kept.
- **Never colour alone:** states carry a word and a sign, trends an arrow and words, chart
  values their figure.
- **Tables** have a caption and scroll in themselves; sort order is announced through
  `aria-sort`.
- **Language:** `<html lang>` follows the page language.
- **System settings:** `prefers-reduced-motion` stops transitions and animations;
  `prefers-contrast: more` raises muted text and lines to full strength; under
  `forced-colors` controls get a system border and focus the system highlight, and
  `RadioCard` keeps its choice visible. All in `app/globals.css`, guarded by
  `tests/a11yPreferences.test.ts`.

## Two languages

- Every page exists under `/en` and `/de`. The route table [`lib/routes.ts`](lib/routes.ts) holds
  the public path per language (`/legal/terms` is `/de/rechtliches/agb`); folder names under
  `app/[lang]/` are the English paths. Links take the internal path through `LocaleLink`
  (`components/i18n`), which writes the address of the current language. The language switch
  links to the same page in the other language. `/` redirects by the remembered choice, then
  the browser language.
- Strings live in `lib/i18n.ts`, one table per area with `en` and `de`; long landing copy in
  `content/*-copy.ts`. The admin is English only for now.
- Dates, numbers and sizes go through [`lib/format.ts`](lib/format.ts): `27.10.2026` in German,
  `Oct 27, 2026` in English, always in German time, so server and browser render the same text.
- German labels run longer: controls have minimum heights and wrap rather than cut, and the
  desktop navigation switches on at `xl` for the German header's sake.
- Product names, bot names and slash commands are not translated. No em dashes in either
  language.

## Adding a colour

1. Ask first whether an existing token fits; most new needs are a role of `--color-primary`,
   a status colour or `--color-muted-foreground`.
2. Add the light value in `@theme` and, if the dark theme needs a different one, the dark
   value in `.dark` in `app/globals.css`. Name it after its role, not its hue. A green follows
   the logo ramp above.
3. Choose the value by computing, not by eye: lightness until the pair passes with a little
   margin (about 4.6:1 for text).
4. Add every rendered pair to `PAIRS` in `tests/contrast.test.ts`. The coverage test fails until
   the token appears in one.
5. Use it as `[var(--color-name)]` in a utility and add a row to the token table above.

## Adding an icon

1. Find it in Phosphor (regular weight) and add `Name as NameBase` to the import in
   `components/icons/index.tsx`, in alphabetical order.
2. Add `export const Name = decorative(NameBase)` to the export list.
3. Import it from `@/components/icons`, never from the package directly.
4. When the last import of an icon goes, remove it from the module too.
