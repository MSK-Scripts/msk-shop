# Frontend-Redesign — msk-shop

> **Status (2026-05-27):** Vollständig umgesetzt. Alle Pages bis auf den
> `BotConfigEditor` (eigene Refactor-Wave) nutzen die neue Component-Library
> und sind theme-aware (Light + Dark). Backward-Compat-Layer ist drin für
> einzelne Legacy-Stellen.
> **Vorbild:** [`musiker15-website`](../../Docusaurus/musiker15-website) (Next.js 16 + MDX + Tailwind v4)
> **Ziel:** Modern, frisch, intuitiv. Weg vom „klassisch dunkelgrünen FiveM-Shop"-Look hin zu
> einer aufgeräumten, hellen-im-dunklen, atmungsfreudigen Storefront mit klarem
> Component-System und Light/Dark-Mode.

---

## 0. TL;DR

Der msk-shop bekommt:
- **Tailwind v4 (CSS-First)** statt v3 mit JS-Config
- **Design-Token-System** (`--color-primary`, `--color-background`, …)
- **Light- + Dark-Mode** mit Theme-Toggle (Default: Dark — bleibt zur Marke passend)
- **Lokale Fonts** via `@fontsource-variable/*` (Inter Variable + JetBrains Mono Variable)
- **Echte Component-Library** (`Button`, `Card`, `Badge`, `Container`, …) statt nur `msk-*` Utility-Klassen
- **Neuer Split-Hero** (Text links + visuelles Code/NUI-Mockup rechts)
- **Mehr Whitespace** — größere Typo, breiterer Container (max-w-7xl statt max-w-6xl), mehr py-Spacing
- **Modernisierte Sub-Pages** (Packages-Listing mit Filter-Bar, Cart als richtige Page, Verify als Step-Wizard)
- **Polished Micro-Interactions** (Hover-Lift, Fade-In, Skeleton-Loader)
- **Bessere Texte** — kürzer, schärfer, kunden-zentriert (Value-Prop statt langer Über-uns-Absätze)

Was **nicht** angefasst wird:
- Tebex-API-Layer (`lib/tebex.ts`, `/api/basket/*`)
- Verify-Flow-Logik (`lib/session.ts`, OAuth-Routen)
- Bot-Config-Editor-Logik (CodeMirror + jsonc-parser)
- Datenbankschema
- Security-Header & CSP (Nonce-Mechanik bleibt unverändert — das neue Frontend muss
  weiterhin ohne `unsafe-inline` auskommen)
- Apache-vhost / systemd-Service

---

## 1. Analyse — wo steht das Frontend heute?

### 1.1 Stärken
- Konsistente MSK-Farbpalette (Grün als klares Brand-Element)
- Funktionierende Cart-Drawer-UX
- Saubere `msk-*` Utility-Klassen (`msk-btn-primary`, `msk-card`, `msk-input`)
- Inter-Font self-hosted via `next/font/google`
- Solide CSP (Nonce + `'strict-dynamic'`)

### 1.2 Schwächen / „oldschool"-Symptome
| Symptom | Beleg | Konsequenz |
|---|---|---|
| Sehr dichte Typografie | `text-xs`, `text-[15px]` als Default | Wirkt gedrungen, Inhalte „kleben" |
| Wenig Whitespace | `py-7`, `py-8` als Section-Padding | Layout fühlt sich „eng" an |
| Kleiner Container | `max-w-6xl` (1152 px) | Auf großen Screens viel ungenutzter Rand |
| Reines Dark-Theme | kein Theme-Toggle | Vermutete Zielgruppe (Server-Owner / Developer) erwartet zumindest Wahlmöglichkeit |
| Hero zu simpel | Logo + Tagline + 2 Buttons, kein visuelles Highlight | Kein „Wow"-Moment beim Erstbesuch |
| Inhalte sind länger als nötig | 4-Absatz-„About Us" auf der Homepage | Konversions-killer; Besucher wollen Pakete sehen |
| Wenig Brand-Visualität | Grünes Logo + grüne Buttons, sonst kaum visuelle Identität | Verwechselbar mit jedem anderen FiveM-Shop |
| Utility-Klassen statt Komponenten | `msk-btn-primary` als CSS-Klasse | Kein TypeScript-API für Varianten, kein `asChild`-Pattern für Links |
| Keine Light-/System-Mode | hartkodiertes Dark | Performance auf hellen Monitoren (Sonnenlicht) leidet |
| Keine echten Trust-Signals | „500 happy customers" als Backup-Kommentar, nirgends sichtbar | Vertrauen muss erst aufgebaut werden |

### 1.3 Was am Vorbild (`musiker15-website`) konkret besser ist
| Element | musiker15 | msk-shop heute |
|---|---|---|
| Container-Breite | `container-page` ≈ 80 rem (1280 px) | `max-w-6xl` (1152 px) |
| Hero | Split-Layout mit Terminal-Mockup | Zentriert, nur Text |
| Section-Padding | `py-16 md:py-20 lg:py-28` | `py-7` / `py-8` |
| Hero-Headline | `text-4xl md:text-5xl lg:text-6xl` | `text-4xl md:text-5xl` |
| Theme | Light + Dark via `next-themes`, GitHub-Dark im Dark-Mode | nur Dark |
| Fonts | `@fontsource-variable/inter` + `…/jetbrains-mono` (100% lokal) | `next/font/google` Inter (lokal nach Build) |
| Button | TypeScript-API mit `variant` + `size` + Radix `Slot` (`asChild`) | CSS-Klasse `msk-btn-primary` |
| Card | `Card` + `CardHeader` + `CardTitle` + `CardContent` | `msk-card` als CSS-Klasse |
| Tailwind | v4 mit CSS-First Tokens (`@theme`) | v3 mit `tailwind.config.ts` |

---

## 2. Design-Sprache — neuer Look

### 2.1 Leitprinzipien
1. **Atmung vor Dichte.** Lieber 80 % so viel Inhalt mit doppeltem Whitespace.
2. **Eine sichtbare Marke pro Seite.** MSK-Grün bleibt Akzent, ist aber nicht mehr „die Hauptfarbe der Oberfläche".
3. **Code als Design-Element.** Wir verkaufen FiveM-Scripts — also dürfen Code-Snippets, Monospace-Akzente und Terminal-Mockups Teil der Brand sein.
4. **Konsistente Komponenten statt Einmal-Lösungen.** Jeder Button, jede Card, jedes Badge nutzt dieselbe Komponente.
5. **Dark first, aber Light möglich.** Default bleibt Dark (passt zur FiveM-/Gaming-Zielgruppe), Light-Mode ist sauber verfügbar.

### 2.2 Farbtoken (Vorschlag)

**Light-Mode**
```css
--color-background:           #ffffff;
--color-foreground:           #0a0a0a;
--color-muted:                #f4f4f5;
--color-muted-foreground:     #71717a;
--color-border:               #e4e4e7;
--color-card:                 #ffffff;
--color-card-foreground:      #0a0a0a;

/* Brand: MSK-Grün bleibt — aber etwas wärmer / sattiger */
--color-primary:              #4ea426;   /* slightly deeper than #5eb131 */
--color-primary-foreground:   #ffffff;
--color-accent:               #5eb131;   /* das bekannte MSK-Grün als Hover/Accent */
--color-accent-foreground:    #0a0a0a;

--color-success:              #16a34a;
--color-warning:              #f59e0b;
--color-danger:               #dc2626;
--color-info:                 #0284c7;
--color-discord:              #5865F2;
```

**Dark-Mode** (Default — angelehnt an GitHub-Dark + MSK-Grün)
```css
--color-background:           #0d1117;   /* statt #1b1b1d — leicht ins blau-graue */
--color-foreground:           #e6edf3;
--color-muted:                #161b22;   /* Cards, Code-Blöcke */
--color-muted-foreground:     #8b949e;
--color-border:               #30363d;
--color-card:                 #161b22;
--color-card-foreground:      #e6edf3;

--color-primary:              #5eb131;   /* MSK-Grün leuchtet im Dark Mode klarer */
--color-primary-foreground:   #ffffff;
--color-accent:               #79e84a;   /* heller Akzent für Hover/Highlight */
--color-accent-foreground:    #0d1117;
```

> **Warum kein reines Schwarz mehr?** `#1b1b1d` wirkt „flach". `#0d1117` (GitHub-Dark)
> ist minimal ins Blau-Graue gezogen und hebt das MSK-Grün besser hervor.

### 2.3 Typografie

| Token | Wert | Einsatz |
|---|---|---|
| `--font-sans` | **Inter Variable** | Body, Headlines, UI |
| `--font-mono` | **JetBrains Mono Variable** | Code-Blöcke, Terminal-Mockup, Preise, Stat-Zahlen, kleine UPPERCASE-Labels |

**Schrift-Skala** (mobil → desktop):
- `h1`: `text-4xl md:text-5xl lg:text-6xl` (Hero only)
- `h2`: `text-2xl md:text-3xl` (Section-Titles)
- `h3`: `text-lg md:text-xl` (Card-Titles)
- Body: `text-base` (Desktop), `text-sm` für UI-Chrome
- Caption / Label: `text-xs` + `uppercase tracking-wider` (Mono-Variante denkbar)

**Quelle:** `@fontsource-variable/inter` + `@fontsource-variable/jetbrains-mono`
(NPM-Pakete — Next.js kopiert die `.woff2`-Dateien beim Build nach `_next/static/media`).
**Vorteil:** Null externe Requests, CSP-konform, Mozilla-Observatory bleibt A+.

### 2.4 Spacing & Container

| Token | Wert | Zweck |
|---|---|---|
| `container-page` | `max-w-7xl mx-auto px-4 md:px-6 lg:px-8` | Standard-Seiten-Container |
| `container-prose` | `max-w-2xl mx-auto` | Rechtstexte, lange Fließtexte |
| Section-Padding | `py-16 md:py-20 lg:py-24` | Hero, große Sections |
| Section-Padding (klein) | `py-10 md:py-12` | Sekundäre Sections |
| Card-Padding | `p-6` | Standard-Card |
| Card-Gap | `gap-6` | Grid zwischen Cards |

### 2.5 Radien & Schatten
- `--radius-sm: 0.25rem`
- `--radius-md: 0.5rem`
- `--radius-lg: 0.75rem`
- `--radius-xl: 1rem` (Cards)
- Schatten: nur **subtil**, nicht protzig. Default-Card hat `shadow-sm` (Light) bzw. keinen Schatten im Dark-Mode. Hover hebt um `shadow-md` an.

### 2.6 Animations
Definiert über `@theme`-Tokens, eingesetzt via Tailwind-Animation-Utilities:
```css
--animate-fade-in:    fadeIn  0.2s ease-out;
--animate-slide-up:   slideUp 0.3s ease-out;
--animate-slide-down: slideDown 0.3s ease-out;
```
Reduced-Motion via `@media (prefers-reduced-motion: reduce)` deaktiviert alle Animationen.

---

## 3. Technische Migration

### 3.1 Tailwind v3 → v4 (CSS-First)

**Heute:** `tailwind.config.ts` mit `theme.extend.colors = { bg: '#1b1b1d', ... }`
**Künftig:** `@theme` in `app/globals.css` mit `--color-background: #0d1117; …`

Schritte:
1. `package.json`: `tailwindcss` von `^3.4.17` auf `^4.0.0` heben, `autoprefixer` raus
   (in v4 nicht mehr nötig), `postcss.config.js` auf den v4-Plugin `@tailwindcss/postcss`
   umstellen.
2. `app/globals.css` neu strukturieren:
   ```css
   @import "tailwindcss";
   @custom-variant dark (&:where(.dark, .dark *));

   @theme {
     --color-background: #ffffff;
     --color-foreground: #0a0a0a;
     /* ... alle Tokens ... */
     --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
     --font-mono: "JetBrains Mono Variable", ui-monospace, Menlo, Monaco, Consolas, monospace;
   }

   @layer base {
     .dark { --color-background: #0d1117; /* ... */ }
     /* ... */
   }
   ```
3. `tailwind.config.ts` **löschen** (oder leer als CommonJS-Stub belassen für IDE-Hints).
4. Alle bestehenden Klassen wie `bg-bg`, `text-text`, `border-borderlt` werden durch
   `bg-[var(--color-background)]`, `text-[var(--color-foreground)]`, … ersetzt — bzw.
   per Tailwind v4 direkt durch `bg-background`, `text-foreground` (v4 mappt
   `--color-*` automatisch auf Utility-Klassen).
5. Alte `msk-*`-Utility-Klassen werden zu **Komponenten** umgebaut (siehe 3.3).

### 3.2 Font-Migration

**Heute:** `next/font/google` lädt Inter beim Build, kopiert es lokal — funktioniert,
aber bindet uns an Google.

**Künftig:**
```bash
npm install @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

Dann in `app/layout.tsx`:
```ts
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
```
Die `.woff2`-Dateien landen automatisch im Bundle. Das `Inter`-Import aus
`next/font/google` und die `--font-inter`-Variable fallen weg — stattdessen
nutzen wir die Tailwind-`--font-sans`-/`--font-mono`-Tokens.

### 3.3 Component-Library

Neues Verzeichnis `components/ui/` mit:

```
components/ui/
├── Button.tsx          // Variants: primary | secondary | outline | ghost | link | discord
├── Card.tsx            // Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
├── Badge.tsx           // Variants: default | secondary | outline | accent | sale | esx | qb | …
├── Container.tsx       // container-page / container-prose Wrapper
├── Input.tsx           // ersetzt msk-input
├── Skeleton.tsx        // Loading-Skeletons
└── Separator.tsx       // dünne Trennlinien (Radix-basiert)
```

Beispiel `Button.tsx` (übernommen vom musiker15-Vorbild, erweitert um Discord-Variante):

```tsx
import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link" | "discord";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 shadow-sm",
  secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)]",
  outline:   "border border-[var(--color-border)] hover:bg-[var(--color-muted)]",
  ghost:     "hover:bg-[var(--color-muted)]",
  link:      "text-[var(--color-primary)] hover:underline underline-offset-4 p-0 h-auto",
  discord:   "bg-[var(--color-discord)] text-white hover:opacity-90 shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:   "h-8 px-3 text-xs gap-1.5 rounded-md",
  md:   "h-10 px-4 text-sm gap-2 rounded-md",
  lg:   "h-12 px-6 text-base gap-2 rounded-md",
  icon: "h-10 w-10 rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", asChild = false, className, ...props }, ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant], sizeClasses[size], className,
      )}
      {...props}
    />
  );
});
```

**Migrations-Strategie für bestehende `msk-*`-Klassen:**
- Wo möglich: Aufrufer auf neue Komponenten umstellen (`<Button variant="primary">` statt `<button className="msk-btn-primary">`)
- Übergangsweise bleiben die `msk-*`-Klassen in `globals.css` bestehen (intern bauen sie aber auf die neuen Tokens auf), damit kein Big-Bang-Refactor nötig ist.

### 3.4 Theme-Provider (Light/Dark/System)

Neue Datei `components/theme/ThemeProvider.tsx` + `ThemeToggle.tsx`.
Wir nutzen **kein** `next-themes` direkt (das setzt inline `<script>`-Tags),
sondern eine **CSP-Nonce-kompatible** Variante analog zu `musiker15-website`:

```tsx
// components/theme/ThemeProvider.tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, nonce, ...props }: ThemeProviderProps & { nonce?: string }) {
  return <NextThemesProvider scriptProps={{ nonce }} {...props}>{children}</NextThemesProvider>;
}
```

In `app/layout.tsx`:
```tsx
const nonce = (await headers()).get("x-nonce") ?? undefined;
// ...
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange nonce={nonce}>
  {/* Navbar, main, Footer */}
</ThemeProvider>
```

Toggle-Button im Header (zwischen Cart und Login):
```
[Search] [LocaleSwitcher?] [Theme: ☀️/🌙/💻] [Cart] [Login]
```

**Wichtig:** Da der Shop heute nur EN/DE-Texte für Rechtstexte hat (über `LegalContent.tsx`),
brauchen wir noch keinen vollständigen i18n-Layer (kein `next-intl`). Locale-Switcher
können wir später ergänzen — vorerst nur Theme-Toggle.

### 3.5 CSP-Beachtung

Alle inline-`<script>`/`<style>`-Tags brauchen das Nonce-Attribut. Insbesondere:
- `next-themes` injiziert ein Inline-Script — `scriptProps={{ nonce }}` reicht.
- Falls JSON-LD-Daten eingebaut werden (Organization, Product Schema für Pakete!):
  `<script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: ld }} />`
- `style-src-attr 'unsafe-inline'` deckt React-`style={{...}}`-Attribute ab (bleibt).
- Hero-Background-Gradient: keine inline-`style`-Attribute mehr, sondern eigene
  Klasse in `globals.css` wie bei musiker15 (`.hero-decor-gradient`).

### 3.6 Dependencies — Neu / Geändert / Entfernt

**Neu:**
- `@fontsource-variable/inter` — lokales Inter Variable
- `@fontsource-variable/jetbrains-mono` — lokales JetBrains Mono Variable
- `@radix-ui/react-slot` — `asChild`-Pattern für Buttons (~1 kB)
- `@radix-ui/react-dialog` — Cart-Drawer + Mobile-Menu (ersetzt Custom-Code)
- `@radix-ui/react-dropdown-menu` — Categories-Dropdown in Navbar
- `clsx` + `tailwind-merge` — für `cn()`-Helper
- `next-themes` — Theme-Toggle (mit Nonce-Support)
- (optional) `framer-motion` — gezielt für Cart-Drawer-/Modal-Animationen,
  nur falls die CSS-Animationen nicht reichen. ⚠️ Erst evaluieren — kostet ~50 kB gzip.

**Entfernt (nach erfolgreicher Migration):**
- `tailwindcss@3.4.x` → `tailwindcss@4.x`
- `autoprefixer` (in v4 nicht mehr nötig)

**Bleibt unverändert:**
- `next@15.5.x`, `react@19.x` (Major-Bumps separat planen)
- `mysql2`, `swr`, `zustand` (Store-Logik unangetastet)
- `@uiw/react-codemirror` + `@codemirror/lang-json` (Bot-Config-Editor)
- `lucide-react` (Icons)
- `js-cookie`, `jsonc-parser`

---

## 4. Neue Komponenten- & Verzeichnisstruktur

```
msk-shop/
├── app/
│   ├── globals.css                 // Tailwind v4 @theme + Light/Dark-Tokens + Komponenten-Layer
│   ├── layout.tsx                  // ThemeProvider, Header (statt Navbar), Footer, CartDrawer
│   ├── page.tsx                    // Homepage: <Hero> <Trust> <Featured> <Why> <Custom> <CTA>
│   ├── packages/
│   │   ├── page.tsx                // Listing mit Filter-Bar (Categories / Tags / Sort)
│   │   └── [id]/page.tsx           // Detail-Page mit Gallery + Description-Tabs
│   ├── cart/page.tsx               // Modernisierte Cart-Page
│   ├── verify/page.tsx             // Step-Wizard (Discord → GitHub → API-Key)
│   ├── dashboard/page.tsx          // Tab-Layout (Domain | API-Key | Bot-Config | Transcripts)
│   ├── stats/page.tsx              // KPI-Cards + Tier-Breakdown-Chart
│   └── …
├── components/
│   ├── ui/                         // NEUE Component-Library (siehe 3.3)
│   ├── theme/                      // ThemeProvider, ThemeToggle
│   ├── layout/
│   │   ├── Header.tsx              // sticky, backdrop-blur, full-width edge-padding
│   │   ├── Navbar.tsx              // primary nav (Home / Packages / Stats / Verify)
│   │   ├── MobileMenu.tsx          // Radix-Dialog für Mobile-Nav
│   │   ├── Footer.tsx              // 4-Spalten-Layout mit modernerer Hierarchie
│   │   └── Container.tsx           // Wrapper-Komponente
│   ├── home/
│   │   ├── Hero.tsx                // Split-Layout (Text + Code-/NUI-Mockup)
│   │   ├── TrustBar.tsx            // KPI-Strip: "500+ Customers" / "20+ Resources" / "24/7 Support"
│   │   ├── FeaturedPackages.tsx    // Featured-Pakete als Grid
│   │   ├── WhyMSK.tsx              // 4-Karten-Grid: Quality / Updates / Support / Docs
│   │   ├── CustomPackages.tsx      // Discord Bots, GitHub-Resources
│   │   └── CTASection.tsx          // Discord-Banner
│   ├── packages/
│   │   ├── PackageCard.tsx         // visuell modernisiert (siehe 5.4)
│   │   ├── PackageFilters.tsx      // Filter-Sidebar / Top-Bar
│   │   └── PackageDetails.tsx      // Detail-Page Komponente mit Tabs (Description / Changelog / FAQ)
│   ├── cart/
│   │   ├── CartDrawer.tsx          // refactored auf Radix Dialog
│   │   └── CartItem.tsx            // ausgelagerte Item-Komponente
│   ├── verify/
│   │   ├── VerifyStepper.tsx       // step-indicator
│   │   └── VerifyStep[1|2|3].tsx   // separate Steps
│   ├── dashboard/
│   │   ├── DashboardTabs.tsx       // Radix Tabs
│   │   ├── DomainPanel.tsx
│   │   ├── ApiKeyPanel.tsx
│   │   ├── BotConfigEditor.tsx     // bleibt, leicht umgestylt
│   │   └── TranscriptsPanel.tsx
│   └── legal/LegalContent.tsx      // unverändert (nur Style-Anpassung über prose-Klassen)
├── content/
│   ├── home-features.ts            // NEU: 4 Feature-Items für <WhyMSK>
│   ├── custom-packages.ts          // unverändert
│   └── legal/                      // unverändert
├── lib/
│   ├── utils.ts                    // NEU: cn() Helper
│   ├── tebex.ts, db.ts, …          // unverändert
│   └── …
└── styles/                         // ggf. ausgelagerte CSS-Module
```

---

## 5. Seiten-für-Seiten-Plan

### 5.1 Homepage (`app/page.tsx`)

**Heute:** `<Hero>` (zentriert, Logo + Tagline) → `<Divider>` → `<InfoSection>` (großer „About Us"-Text) → Featured Packages → Custom Packages → `<CTASection>`

**Künftig:**

```
┌───────────────────────────────────────────────────────────────────┐
│ [Header — sticky, backdrop-blur]                                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  HERO (Split-Layout)                                              │
│  ┌─────────────────────┐  ┌────────────────────────────────────┐  │
│  │ [Badge: Live • 500+ │  │  Terminal/Code-Mockup              │  │
│  │  customers]         │  │  ──────────────────────────        │  │
│  │                     │  │  $ msk_garage:openGarage()         │  │
│  │ Premium FiveM       │  │  > Loaded msk_core v2.8.4          │  │
│  │ Scripts.            │  │  > Vehicle data fetched in 42ms    │  │
│  │ Built by a player.  │  │  > UI rendered                     │  │
│  │                     │  │                                    │  │
│  │ Clean code,         │  │                                    │  │
│  │ regular updates,    │  │  ALTERNATIVE: NUI-Screenshot       │  │
│  │ real support.       │  │  eines Garage-/Banking-Scripts     │  │
│  │                     │  │                                    │  │
│  │ [Browse Packages →] │  │                                    │  │
│  │ [View on GitHub]    │  │                                    │  │
│  └─────────────────────┘  └────────────────────────────────────┘  │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│  TRUST BAR — vier KPIs nebeneinander, subtiler Background         │
│  500+ Customers  •  20+ Resources  •  24/7 Discord  •  ESX + QB   │
├───────────────────────────────────────────────────────────────────┤
│  FEATURED PACKAGES                                                │
│  [Card] [Card] [Card]                                             │
├───────────────────────────────────────────────────────────────────┤
│  WHY MSK?  ── 4 Feature-Cards                                     │
│  [🛠️ Quality]  [🔄 Updates]  [💬 Support]  [📖 Docs]              │
├───────────────────────────────────────────────────────────────────┤
│  CUSTOM PACKAGES (Discord Bots, GitHub Resources)                 │
│  [Card] [Card] [Card]                                             │
├───────────────────────────────────────────────────────────────────┤
│  CTA — Discord Join Banner                                        │
└───────────────────────────────────────────────────────────────────┘
```

**Neue Texte (Vorschlag):**
- Hero-Badge: `LIVE · Trusted by 500+ Server Owners`
- Hero-H1: **`Premium FiveM Scripts.`** (1. Zeile, weiß) **`Built by a player.`** (2. Zeile, grün-akzent)
- Hero-Lead: *Clean code. Regular updates. Real support — from the developer who codes and tests every line himself.*
- Primary CTA: `Browse Packages →`
- Secondary CTA: `View on GitHub` (Github-Icon)

**Why-MSK Feature-Cards:**
1. **Quality over Quantity** — `Every script is personally coded, tested, and maintained — no template farms.`
2. **Regular Updates** — `New features and bugfixes ship as they're ready, not on a corporate roadmap.`
3. **Real Support** — `Discord support from the person who actually wrote the code.`
4. **Open Documentation** — `Full guides, examples, and exports — no guessing how things work.`

### 5.2 Header / Navbar

**Layout:**
```
[Logo + Brand]   [Home] [Packages] [Stats] [Verify] [Dashboard]   ⌕ 🌙 [Cart 0] [Login]
```

- Sticky mit `backdrop-blur-md` und `bg-[var(--color-background)]/85`
- Full-Width Container (`px-4 md:px-6 lg:px-8`), **kein** `max-w-6xl` mehr
- Categories ist nicht mehr Top-Level (steht in `/packages` als Filter)
- Login-Button wird kompakter (Icon-only auf Mobile)
- Theme-Toggle als Icon-Button (`Moon` / `Sun` / `Monitor`)

### 5.3 Footer

4 Spalten + Brand-Spalte:
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]               Shop          Ecosystem      Ticketbot     │
│  MSK Scripts          - Packages    - Kanbanly     - Stats       │
│  FiveM with heart 💚  - Cart        - MSK Paste    - Verify      │
│                       - Stats       - Shortener    - Dashboard   │
│  [Discord] [GitHub]                                              │
│                                                                  │
│                                                       Legal      │
│                                                       - Imprint  │
│                                                       - Privacy  │
│                                                       - Terms    │
├─────────────────────────────────────────────────────────────────┤
│  © 2026 MSK Scripts  ·  Powered by Tebex  ·  Built by Musiker15  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Package-Card

Konkret:
- Größere Bild-Fläche (`h-48` statt `h-40`)
- Hover: Bild leicht zoom (`group-hover:scale-[1.03]`) + Card-Lift (`-translate-y-1 shadow-lg`)
- Preis in **JetBrains Mono**, größerer Akzent (`text-2xl font-bold text-primary`)
- Sale-Stack: ursprünglicher Preis durchgestrichen darüber
- Badge-Variants nutzen `<Badge>` Komponente
- Button-Reihe: `[Add to Cart]` `[Details →]` mit klarem Primary/Outline-Split

**Beispiel-Markup:**
```tsx
<Card className="group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
  <div className="relative h-48 overflow-hidden">
    <Image src={pkg.image} … className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
    <div className="absolute top-3 right-3 flex gap-1.5">
      {hasDiscount && <Badge variant="sale">-{discountPct}%</Badge>}
    </div>
    <div className="absolute bottom-3 left-3 flex gap-1.5">
      {badges?.map(b => <Badge key={b.label} variant={b.variant}>{b.label}</Badge>)}
    </div>
  </div>
  <CardContent className="flex flex-1 flex-col gap-3 p-5">
    <CardTitle className="text-base">{pkg.name}</CardTitle>
    {description && <CardDescription>{description}</CardDescription>}
    <div className="mt-auto flex items-end justify-between">
      <div className="flex flex-col">
        {hasDiscount && <span className="font-mono text-xs text-muted-foreground line-through">€{basePrice.toFixed(2)}</span>}
        <span className="font-mono text-2xl font-bold text-[var(--color-primary)]">
          {isFree ? "Free" : `€${totalPrice.toFixed(2)}`}
        </span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={addToCart}>
          <ShoppingCart className="h-3.5 w-3.5" /> Add
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/packages/${pkg.id}`}>Details</Link>
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

### 5.5 `/packages` — Listing-Page

- Top-Bar mit Filtern: `Categories ▾`  `Tags ▾`  `Sort: Newest ▾`  Search-Input (rechts)
- Result-Count („**32** packages")
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Skeleton-Loader während der ersten Tebex-Anfrage (statt leerem Grid)

### 5.6 `/packages/[id]` — Detail-Page

- Two-Column-Layout:
  - **Links:** großes Hero-Bild + Bild-Carousel (falls mehrere)
  - **Rechts (sticky):** Titel + Badges + Preis + Add-to-Cart + ggf. Gift-Option
- Tabs unter dem Hero: `Description` | `Compatibility` | `Changelog` | `FAQ`
- „Related Packages" am Fuß

### 5.7 `/cart` — Cart-Page

- Bleibt das 2-Spalten-Layout, aber:
- Items als **Card mit Bild + Name + Preis + Trash-Icon + Gift-Indikator**
- Order-Summary auf der rechten Seite mit:
  - Coupon-Input prominent (nicht nur „Open Cart →"-Button)
  - Trust-Signals unter dem Checkout-Button: 🔒 SSL · 🌍 EU-VAT included · 🤝 Tebex Secure
- Empty-State mit Illustration und CTA

### 5.8 `/verify` — Step-Wizard

3 Schritte mit Progress-Indicator:
```
○ Discord  →  ○ GitHub  →  ○ API-Key
```
- Aktueller Step ist hervorgehoben, vorherige als Häkchen
- Jede Step-Komponente eigene Datei (`VerifyStep1Discord.tsx`, …)
- Beim Sponsor-Tier-Check: visuelles Feedback (Tier-Card mit Limits-Übersicht)

### 5.9 `/dashboard`

- Top-Header mit Guild-Info (Name + Icon + Tier-Badge)
- Tabs (Radix Tabs):
  - **Overview** — KPI-Cards (Transcripts, Storage, Custom Domain Status)
  - **API Key** — Key + Copy-Button + Rotate-Button
  - **Custom Domain** (nur Premium+) — DNS-Check, Status-Indicator
  - **Bot Config** (nur is_hosted) — `BotConfigEditor` bleibt funktional, aber neu gestylt
  - **Transcripts** — Tabelle mit Filter + Cleanup-Hinweisen
- Sidebar wäre Overkill — Tabs reichen.

### 5.10 `/stats`

- Großer Header mit „X+ Trusted Servers"
- KPI-Cards-Grid (4–6 Karten): Transcripts, API-Keys, Sponsors, Storage Used …
- Tier-Breakdown als horizontaler Balken oder Donut (kleine SVG-Eigenbau, kein Chart-Lib nötig)

---

## 6. Content / Copywriting

### 6.1 Hero-Tagline-Alternativen
| Version | Headline | Sub |
|---|---|---|
| A (preferred) | `Premium FiveM Scripts. Built by a player.` | `Clean code, regular updates, real support — from one developer who codes every line himself.` |
| B | `Quality FiveM resources, made with heart.` | `Trusted by 500+ server owners. ESX, QB-Core, ox_core — all supported.` |
| C | `Scripts that just work.` | `No template farm. No corporate roadmap. Just well-crafted FiveM resources.` |

### 6.2 „Why MSK?"-Microcopy
- **Quality over Quantity** — *Every script is personally coded, tested, and maintained — no template farms.*
- **Regular Updates** — *New features and bugfixes ship as they're ready, not on a corporate roadmap.*
- **Real Support** — *Discord support from the person who actually wrote the code.*
- **Open Documentation** — *Full guides, examples, and exports — no guessing how things work.*

### 6.3 Trust-Bar (4 KPIs)
- `500+` Customers
- `20+` Resources
- `24/7` Discord Support
- `ESX · QB · ox_core` Frameworks supported

### 6.4 CTA-Section (statt aktuell „Need help?")
- H3: `Join 500+ server owners already running MSK.`
- Sub: `Discord support, sneak peeks, and announcements — straight from the developer.`
- Buttons: `[Join Discord]` `[Browse GitHub]`

### 6.5 Footer-Tagline
Aktuell: *„FiveM Scripts with Heart 💚"*  → bleibt, ist sympathisch.

---

## 7. Performance & Accessibility

| Ziel | Wert |
|---|---|
| Lighthouse Performance (Desktop) | ≥ 95 |
| Lighthouse Accessibility | 100 |
| LCP | ≤ 2.0 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.05 |
| Mozilla Observatory | A+ (bleibt) |

Maßnahmen:
- Hero-Bild (Mockup) als `priority` für LCP-Optimierung
- `next/image` für alle Package-Images (bereits genutzt — bleibt)
- Skeleton-Loader während `swr`-Refetches (kein Layout-Shift)
- Reduced-Motion respektieren
- Focus-Ring sichtbar (focus-visible: `outline 2px ring-color offset 2px`)
- Skip-Link (`<a href="#main">`) für Screen-Reader
- Semantic HTML: `<header>`, `<main>`, `<nav>`, `<footer>`, `<article>` (Package-Cards)
- ARIA-Labels für Icon-Buttons (Cart, Theme-Toggle)

---

## 8. Migrations-Reihenfolge (Schritt-für-Schritt-Plan für die Umsetzung)

> ⚠️ Jeder Schritt ist isoliert testbar — kein „big bang"-Refactor.

**Schritt 1 — Foundation (Token + Library)**
- [ ] Tailwind v4 + neue Tokens in `globals.css`
- [ ] `@fontsource-variable/*` integrieren, `next/font/google` entfernen
- [ ] `lib/utils.ts` mit `cn()` anlegen
- [ ] `components/ui/{Button,Card,Badge,Input,Container,Skeleton}.tsx` schreiben
- [ ] Bestehende `msk-*`-Klassen intern auf die neuen Tokens umstellen (rückwärtskompatibel)

**Schritt 2 — Theme-Toggle**
- [ ] `next-themes` installieren + `ThemeProvider` einbauen
- [ ] `ThemeToggle`-Komponente in Header einbauen
- [ ] Light-Mode-Tests in jeder Sub-Page

**Schritt 3 — Layout (Header + Footer)**
- [ ] `components/layout/Header.tsx` + `Navbar.tsx` + `MobileMenu.tsx`
- [ ] `components/layout/Footer.tsx` mit 4-Spalten-Layout
- [ ] `app/layout.tsx` umstellen

**Schritt 4 — Homepage**
- [ ] `Hero.tsx` neu (Split-Layout, Terminal-Mockup)
- [ ] `TrustBar.tsx` neu
- [ ] `WhyMSK.tsx` neu + `content/home-features.ts`
- [ ] `FeaturedPackages.tsx` extrahieren (aus aktueller `page.tsx`)
- [ ] `CustomPackages.tsx` extrahieren
- [ ] `CTASection.tsx` rewrite
- [ ] `app/page.tsx` als reiner Compose-Layer

**Schritt 5 — Package-Cards & Listing**
- [ ] `PackageCard.tsx` rewrite (auf `Card` + `Button` + `Badge`)
- [ ] `app/packages/page.tsx` mit Filter-Top-Bar + Skeleton
- [ ] `app/packages/[id]/page.tsx` mit Detail-Layout + Tabs

**Schritt 6 — Cart**
- [ ] `CartDrawer.tsx` auf Radix Dialog
- [ ] `CartItem.tsx` extrahieren
- [ ] `app/cart/page.tsx` Modernisierung

**Schritt 7 — Verify-Wizard**
- [ ] `VerifyStepper.tsx` + `VerifyStep[1|2|3].tsx`
- [ ] `app/verify/page.tsx` als Orchestrator

**Schritt 8 — Dashboard**
- [ ] Radix-Tabs einbauen
- [ ] Sub-Komponenten extrahieren (`DomainPanel`, `ApiKeyPanel`, `TranscriptsPanel`)
- [ ] `BotConfigEditor.tsx` visuelle Anpassung (CodeMirror-Theme bleibt)

**Schritt 9 — Stats + Legal + Login + 404**
- [ ] `StatsClient.tsx` Modernisierung
- [ ] `LegalContent.tsx` prose-Styles anpassen
- [ ] `app/not-found.tsx` neu

**Schritt 10 — Polish**
- [ ] Animationen einziehen (Fade-In on Scroll für Sections via Intersection-Observer)
- [ ] Mozilla Observatory erneut prüfen (Ziel: A+ halten)
- [ ] Lighthouse-Benchmark Desktop + Mobile
- [ ] Manueller Cross-Browser-Test (Chrome, Firefox, Safari iOS, Edge)
- [ ] `CLAUDE.md` Design-Sektion aktualisieren (neue Tokens + Komponenten)

---

## 9. Risiken & Mitigation

| Risiko | Mitigation |
|---|---|
| Tailwind v3 → v4 Breaking Changes | Inkrementeller Rollout: erst Tokens, dann Komponenten, dann Pages. v3-Config darf parallel existieren bis Schritt 5 |
| `next-themes` Inline-Script vs. CSP-Nonce | `scriptProps={{ nonce }}` testen (musiker15-Vorbild funktioniert) |
| Bot-Config-Editor (CodeMirror) bricht | Nicht im Scope der visuellen Migration. Nur Wrapper-Styles ändern, CM-Theme bleibt |
| Tebex-Image-Domain | `next.config.js` weiterhin `images.remotePatterns` für Tebex pflegen |
| SEO-Regression durch H1/H2-Restruktur | Vor/Nach-Vergleich mit Lighthouse SEO-Score; Slug-Struktur bleibt unverändert |
| Bestehende `msk-*`-Klassen in Komponenten, die nicht migriert sind | `globals.css` behält die Klassen, mappt sie aber intern auf neue Tokens |
| Build-Größe wächst durch Radix-Pakete | Erfahrungswert: Radix-Pakete sind je <5 kB gzip; akzeptabel |

---

## 10. Was bleibt explizit gleich

- Tebex-API-Layer (`lib/tebex.ts`, `/api/basket/*`)
- Cart-Store-Logik (`store/cart.ts` + Zustand-Persistence)
- Verify-Flow-Logik (OAuth, Session-Cookies, Sponsor-Tier-Check)
- Bot-Config-Editor-Logik (CodeMirror + jsonc-parser)
- Datenbankschema + Queries
- Security-Header & CSP-Mechanik (`middleware.ts`)
- systemd-Service + Apache-vhost
- GitHub-Actions-Deployment

---

## 11. Definition of Done

Das Redesign ist „fertig", wenn:

1. ✅ Alle Pages nutzen die neue Component-Library (kein `msk-btn-primary` als Direkt-Klasse mehr im JSX)
2. ✅ Light- + Dark-Mode funktionieren auf allen Pages (visueller Sweep)
3. ✅ Lighthouse Desktop ≥ 95 in allen vier Kategorien
4. ✅ Mozilla Observatory bleibt **A+** (130/100)
5. ✅ Zero externe Requests im Network-Tab (Google Fonts, CDN, Analytics ausgeschlossen)
6. ✅ Mobile-Layout funktioniert auf ≤ 360 px Breite ohne horizontalen Scroll
7. ✅ `npx tsc --noEmit` läuft sauber durch
8. ✅ `npm run build` läuft fehlerfrei durch
9. ✅ Manueller Test der Kauf-Flows: Cart → Login (FiveM) → Discord-Link → Checkout
10. ✅ Manueller Test des Verify-Flows: Discord → GitHub → API-Key
11. ✅ `CLAUDE.md` Design-Sektion ist auf den neuen Stand gebracht

---

## 12. Offene Fragen für Moritz

Diese Punkte können **vor** der Umsetzung kurz besprochen werden:

1. **Default-Theme:** Dark (wie heute) oder System-Default? — *Empfehlung: Dark, weil Zielgruppe Gaming/Server*
2. **Hero-Visual rechts:** Terminal-Mockup (Lua-Code), NUI-Screenshot eines real existierenden MSK-Scripts, oder beides per Tab?
3. **Light-Mode:** Echt voll ausarbeiten oder vorerst nur als „funktioniert technisch" abliefern? — *Empfehlung: vollwertig*
4. **Header-Items:** Soll `Stats` Top-Level bleiben oder unter ein „Bot"-Dropdown wandern (`Stats`/`Verify`/`Dashboard`)? — *Empfehlung: kompakter — `Bot ▾`-Dropdown mit den drei Items*
5. **Sprache:** Aktuell EN-First mit DE-Toggle nur in Rechtstexten. Soll der Rest der Site auch DE bekommen? — *Empfehlung: vorerst nicht im Scope dieser Redesign-Iteration*
6. **News-Popup:** Aktuell unten rechts beim Page-Load. Behalten oder als Inline-Banner ins Header-Layout integrieren?
7. **Trust-Bar-Zahlen:** Sind „500+ Customers" / „20+ Resources" realistisch? Falls nicht, welche echten Zahlen?
8. **Framer-Motion ja/nein?** — *Empfehlung: erst ohne, CSS-Animationen reichen meist*

---

*Erstellt: 2026-05-27 — Frontend-Modernisierung des msk-shop, inspiriert vom musiker15-website-Design. Nach Freigabe durch Moritz beginnt die Umsetzung in der oben definierten Reihenfolge.*
