# MSK Scripts Shop

A headless storefront for [MSK Scripts](https://www.msk-scripts.de) — built with **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS** and the **Tebex Headless API**.

> **Live:** [msk-scripts.de](https://www.msk-scripts.de)

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 15.5 (App Router) |
| Language | TypeScript 5.8 (strict mode) |
| UI | React 19.2 |
| Styling | Tailwind CSS 4 (CSS-first — `@theme` tokens in `app/globals.css`) |
| Theming | Light + Dark (default Dark) via `next-themes` |
| Fonts | Inter + JetBrains Mono — self-hosted via `@fontsource-variable` |
| State | Zustand 5 (persisted to localStorage) |
| Data Fetching | SWR 2 |
| Database | MariaDB / MySQL (via mysql2) |
| Payments | Tebex Headless API (shop) + Stripe (Ticket Bot subscriptions) |
| Editor | CodeMirror (`@uiw/react-codemirror`) — Bot-Config editor |
| JSONC parsing | `jsonc-parser` |
| Icons | `lucide-react` |
| Image processing | `sharp` — re-encodes uploaded image attachments |
| Cookies (client) | `js-cookie` |
| Auth | CFX.re (FiveM) + Discord OAuth via Tebex |
| Verify Flow | Discord OAuth + signed session cookies |
| Server | Debian + Apache2 reverse proxy + systemd |
| Bot process manager | PM2 (`pm2-musiker15.service`) |
| CI/CD | GitHub Actions — CI gate + **server-side git deploy** on push to `main` |

---

## Features

- 🛒 Full shopping cart with persistent state (survives page reload)
- 🔐 FiveM (CFX.re) authentication via Tebex
- 💬 Discord OAuth for role assignment after purchase
- 🎁 Gift packages with optional recipient Discord ID
- 🏷️ Coupon code support (apply & remove)
- 🔖 Custom badges, tags and descriptions per package
- 📦 Custom packages section (Discord Bots, GitHub, etc.)
- 📄 Markdown-based legal pages in English & German (editable without code)
- 🟢 Live Discord online member count
- 📰 News popup with optional coupon code display (configurable, shown on every page load)
- 📊 Public Ticket Bot statistics page (`/ticketbot/stats`) — with allowlist via `STATS_IGNORED_API_KEYS`
- 🎟️ Ticket Bot verify flow — Discord OAuth, API key issuance, account-scoped ownership
- 🗂️ Ticket transcript hosting with attachment support (MariaDB-backed) — uploads hardened with an extension allowlist, `<uuid>.<ext>` filenames and `sharp` image re-encoding
- 🌍 Custom domain support per guild with DNS validation and Let's Encrypt SSL
- 💳 Stripe subscriptions — in-app checkout, **14-day free trial for new customers**, Stripe customer portal for self-service cancellation, webhook-driven tier assignment
- 📊 Account dashboard — manage **all** your servers from one login (guild switcher), subscriptions (upgrade / manage via Stripe portal), API keys, domains and transcripts
- 🤖 Hosted bot management for `is_hosted` customers:
  - Config editor for `config.jsonc`, `snippets.jsonc`, `.env` **and the active locale file** (`locales/<lang>.json`, with `en.json` fallback)
  - Bot control: start / stop / restart / update (git pull) via PM2
  - Live log console with Server-Sent Events streaming PM2 error logs (`tail -F`)
- 🚪 Dashboard logout endpoint to switch between bots
- 🎉 **Giveaway Bot** — free, invite-based Discord giveaways: button entry (no privileged intents), restart-safe scheduling, weighted bonus entries, eligibility rules (roles / account age / membership), pause-resume, templates and winner reroll
- 🖥️ Giveaway **web dashboard** — create & manage giveaways and per-server settings from the browser (Discord login, no commands needed)
- 🏆 Public shareable **results page** per finished giveaway + live **stats page** (`/giveaway/stats`, anonymous, EN/DE)
- 🌍 Multilingual giveaway bot (EN / DE / FR / ES) with per-guild branding
- 🔒 Security headers, rate limiting, path traversal protection, signed session cookies
- 🛡️ Nonce-based CSP via Edge middleware (`'strict-dynamic'`, no `unsafe-inline`/`unsafe-eval` in `script-src` or `style-src`, `default-src 'none'`)
- 🌐 Apache2 reverse proxy with HSTS (2 years + preload) and centralized security headers
- 🔧 Apache fallback page for 502/503 errors (`under-construction.html`, server-only)
- 🚀 Server-side git deploy via GitHub Actions on push to `main` (CI-gated, health-checked, rollback-capable — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

---

## Project Structure

```
app/                        Next.js App Router pages & API routes
├── api/auth/
│   └── discord-verify/     Discord OAuth for the verify flow (scopes: identify, guilds)
│       └── callback/
├── api/basket/             Tebex basket API proxy (private key stays server-side)
│   ├── auth.ts             Shared auth helper for basket routes
│   ├── route.ts            Create basket
│   └── [ident]/
│       ├── auth/           Auth provider URLs (CFX.re / Discord)
│       ├── coupons/        Apply & remove coupons
│       │   └── [code]/     Remove specific coupon
│       ├── packages/       Add & remove packages (+ remove/)
│       └── route.ts        Fetch basket
├── api/bot-config/         Read & write hosted bot configs (config.jsonc, snippets.jsonc, .env, locales/<lang>.json)
├── api/bot-control/        Start / stop / restart / update bot via PM2
├── api/bot-logs/           Fetch last 100 lines of PM2 error log (one-shot)
├── api/bot-logs-stream/    Server-Sent Events — real-time PM2 log stream via tail -F
├── api/dashboard/
│   └── logout/             Clear dashboard session cookie (switch bot)
├── api/debug/              Debug route (returns 404 in production)
├── api/discord/            Discord online member count (cached 60s)
│   └── health/             Discord API health check
├── api/domain/             Custom domain set / remove / validate
├── api/giveaway/auth/      Giveaway dashboard Discord OAuth
├── api/giveaway-stats/     Live giveaway stats (read-only giveaway_bot DB)
├── api/packages/           Package list endpoint
├── api/stats/              Public Ticket Bot statistics
├── api/stripe/
│   ├── checkout/           Create a Stripe Checkout session (subscription + 14-day trial)
│   └── portal/             Create a Stripe customer-portal session (manage / cancel)
├── api/transcript/upload/  Ticket transcript upload (authenticated via API key)
├── api/verify/             Verify status / complete / check-guild / redirect-dashboard
├── api/webhook/
│   └── stripe/             Stripe webhook handler (signature-verified)
├── account/                User account page
├── auth/discord/           Discord OAuth callback handler (purchase flow)
├── cart/                   Cart page
├── categories/[id]/        Category pages (+ loading.tsx)
├── checkout/               Post-payment redirect handler
├── ticketbot/              Ticket Bot hub (landing page)
│   ├── verify/             Ticket Bot verify flow
│   ├── dashboard/          API key, domain & hosted-bot management
│   └── stats/              Public Ticket Bot statistics page
├── giveaway/               Giveaway Bot hub (landing page)
│   ├── verify/             Giveaway dashboard login (Discord OAuth)
│   ├── dashboard/          Giveaway management dashboard
│   └── stats/              Public giveaway statistics
├── login/                  Login page
├── packages/               Full package list page
│   └── [id]/               Package detail pages (+ loading.tsx)
└── terms/                  Legal pages
    ├── imprint/            Imprint (EN + DE)
    ├── privacy/            Privacy Policy (EN + DE, GDPR compliant)
    └── page.tsx            Terms & Conditions (EN + DE)

components/
├── cart/CartDrawer.tsx     Slide-in cart drawer (trust signals, theme-aware modal)
├── home/                   Homepage sections: Hero, TrustBar, WhyMSK, FeaturedPackages, CustomPackages, CTASection
│                           (InfoSection, Divider = empty deprecation stubs)
├── layout/                 Header (sticky nav: theme toggle, cart, ⌘K search, dropdowns) + Footer (+ Footer.module.css)
│                           — Navbar.tsx is a backward-compat re-export of Header
├── legal/LegalContent.tsx  Legal-text renderer with EN / DE switcher
├── packages/               PackageCard, PackagePrice, AddToCartButton, PackageGallery
├── search/SearchDialog.tsx Command-palette search (⌘K)
├── theme/                  ThemeProvider + ThemeToggle (next-themes, CSP-nonce-safe)
├── ui/                     Component library: Button, Card, Badge, Container, Input, Skeleton, NewsPopup
│                           (DiscordButton = deprecation stub)
├── BotConfigEditor.tsx     Hosted-bot dashboard — config editor (incl. locale tab), bot control, live log console
└── SalePriceFetcher.tsx    Client component — pre-fetches sale prices on mount

content/
├── custom-packages.ts      Non-Tebex packages (Discord Bots, GitHub, etc.)
└── legal/                  Editable Markdown files — no code needed
    ├── imprint.md / imprint-de.md
    ├── privacy.md / privacy-de.md   (GDPR / DSGVO)
    └── terms.md / terms-de.md

database/
└── schema.sql              MariaDB schema — run once on a fresh database

lib/
├── auth.ts                 Auth URL helpers (basket auth providers)
├── config.ts               All shop configuration (packages, badges, news popup, etc.)
├── dashboardSession.ts     Signed dashboard session cookies (guildId)
├── db.ts                   mysql2 connection pool (singleton) + query/queryOne wrappers
├── giveawayControl.ts      Server-side client for the giveaway bot's localhost control endpoint (guildId from signed session → IDOR-safe)
├── giveawayDb.ts           Read-only mysql2 pool for the separate giveaway_bot DB (GIVEAWAY_DB_*)
├── giveawaySession.ts      Scoped signed giveaway sessions (separate HMAC scope, same SESSION_SECRET)
├── giveawayStats.ts        Shared loader for the anonymous giveaway stats (page + API route)
├── i18n.ts                 Language helpers (EN / DE) + translation tables
├── lang.ts                 Language detection (cookie + Accept-Language) + setLangCookie helper
├── markdown.ts             Markdown → HTML renderer (tables, lists, links, code)
├── rateLimit.ts            In-memory rate limiter for API routes (per IP)
├── session.ts              Signed verify session cookies (HMAC-SHA256) + OAuth state
├── statsIgnore.ts          API keys excluded from /ticketbot/stats
├── tebex.ts                Tebex API client (read-only direct, mutations via /api/basket)
├── tiers.ts                Tier definitions (basic / premium / premium_plus) + limits
├── useCart.ts              Cart hook (auth flow, basket management)
└── utils.ts                `cn()` helper (clsx + tailwind-merge)

store/
├── cart.ts                 Zustand store (persisted to localStorage, key: "msk-cart")
└── salePrices.ts           Sale price store (Zustand)

public/
├── logo.png                Shop logo
├── favicon.ico
└── *.png                   Custom package banner images

types/
└── tebex.ts                TypeScript types for the Tebex API (Category, Package, Basket)

scripts/                    deployed with the repo to /opt/msk-shop/scripts (kept root:root)
├── deploy.sh               Server-side deploy: git checkout + build + restart + health-check
├── cleanup.js              Housekeeping script (expired transcripts etc.) — daily cron
├── vhost-create.sh         Apache2 vhost + Let's-Encrypt SSL setup for custom domains
└── vhost-delete.sh         Remove Apache2 vhost for custom domains

docs/
└── DEPLOYMENT.md           Server setup + deploy runbook

middleware.ts               Edge middleware — generates a per-request nonce
                            and sets all security headers (CSP with
                            'strict-dynamic', HSTS, COOP, CORP, etc.)
```

---

## Tiers (`lib/tiers.ts`)

Single source of truth for all limits. Tiers: `basic` · `premium` · `premium_plus`.

| Limit | basic | premium | premium_plus |
|---|---|---|---|
| Transcript max. | 10 MB | 100 MB | 250 MB |
| Attachments max. | — | 150 MB | 500 MB |
| Storage retention | 30 days | 180 days | 365 days |
| Custom domain | ✗ | ✓ | ✓ |
| Attachment downloads | ✗ | ✓ | ✓ |
| Uploads / hour | 30 | 60 | 300 |

`getExpiresAt(tier)` derives the expiry date from `storageDays`.

---

## Database

The shop uses **MariaDB / MySQL** for the Ticket Bot feature (API keys, transcripts, custom domains, Stripe subscriptions). The Tebex shop itself does **not** require a database.

```bash
# Create the database and run the schema
mysql -u root -p -e "CREATE DATABASE msk_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p msk_shop < database/schema.sql
```

Tables created by `database/schema.sql`:

| Table | Purpose |
|---|---|
| `ticketbot_guilds` | Guild registrations, API keys, tier, custom domain status, `is_hosted` flag, Stripe customer/subscription IDs |
| `ticketbot_customers` | One row per person (Discord user ↔ Stripe customer) + free-trial eligibility (`trial_used`) |
| `ticketbot_transcripts` | Ticket transcript metadata + expiry |
| `ticketbot_attachments` | File attachments for Premium transcripts |
| `ticketbot_rate_limits` | Per-API-key request rate limiting (hourly window) |

> Migration for existing databases:
> ```sql
> ALTER TABLE ticketbot_guilds ADD COLUMN is_hosted TINYINT(1) NOT NULL DEFAULT 0;
> ALTER TABLE ticketbot_guilds ADD COLUMN stripe_subscription_id VARCHAR(64) NULL UNIQUE;
> ALTER TABLE ticketbot_guilds ADD COLUMN stripe_customer_id     VARCHAR(64) NULL;
> -- + CREATE TABLE ticketbot_customers (see database/schema.sql)
> ```

---

## Configuration

All shop configuration lives in **`lib/config.ts`**:

```ts
// Which Tebex packages appear on the homepage
export const FEATURED_PACKAGE_IDS = [5301828, 6446947, 6372865]

// Multiple badges per package
// Variants: 'esx' | 'qb' | 'standalone' | 'js' | 'ts' | 'lua' | 'py' | 'discord' | 'fivem'
export const PACKAGE_BADGES: Record<number, Badge[]> = {
  5301828: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }],
  6446947: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }, { label: 'Lua', variant: 'lua' }],
}

// Short description shown on package cards
export const PACKAGE_DESCRIPTIONS: Record<number, string> = {
  5301828: 'Realistic handcuffs with animations, props, drag and more.',
}

// Tags shown on package cards
export const PACKAGE_TAGS: Record<number, string[]> = {
  5301828: ['msk_core', 'pma-voice'],
}

// News popup — shown on every full page load
export const NEWS_POPUP = {
  enabled: true,
  title: 'Discord Ticket Bot',
  text: 'Get your API Key now and create a ticket system for your community!',
  button: { label: 'Get API Key', href: '/ticketbot/verify' },
  secondButton: { label: 'Dashboard', href: '/ticketbot/dashboard' },
  coupon: null, // or e.g. 'NEWSHOP20' — renders a copyable coupon field
}

// Site metadata
export const SITE_CONFIG = {
  name: 'MSK Scripts Shop',
  tagline: 'High quality FiveM resources & Discord bots for your server',
  discord: 'https://discord.gg/5hHSBRHvJE',
  github: 'https://github.com/MSK-Scripts',
  docs: 'https://docu.msk-scripts.de',
}
```

**Custom packages** (non-Tebex) → **`content/custom-packages.ts`**

**Legal pages** → **`content/legal/*.md`** — plain Markdown, EN + DE versions

---

## CI/CD — Auto Deploy

**Server-side git deploy.** The repo lives as a full git clone at `/opt/msk-shop`,
and `scripts/deploy.sh` builds and restarts the app **on the server** — no build
artifacts are transferred. Full setup + runbook: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

```
Push → CI (lint · typecheck · build) ── green ──▶ Deploy (workflow_run)
                                                  └─ SSH (ForceCommand) ─▶ deploy.sh <sha>
```

1. **CI** (`.github/workflows/ci.yml`, name `CI`): `lint` + `typecheck` (`tsc --noEmit`) + `build` on every push / PR to `main`.
2. **Deploy** (`.github/workflows/deploy.yml`): triggers via `workflow_run` **only after CI is green** on `main`; also manually via *Run workflow* with an optional `commit_sha` (**rollback**).
3. The Action SSHes in and runs `deploy.sh`, which on the server does:
   `git checkout <sha>` → `npm ci` → `npm run build` (loads `/opt/msk-shop/.env.local`) →
   `systemctl restart msk-shop` → **health-check** (`curl :3005`, aborts on failure) → deploy tag.
   The script is **self-updating** (pulls the latest `deploy.sh` from `main` before each run).

> **Security:** The Action's SSH key is pinned with `ForceCommand` (can only run `deploy.sh`),
> with strict known-hosts checking. The **build runs on the server**, so the
> `NEXT_PUBLIC_*` + `TEBEX_PRIVATE_KEY` values must be present in `/opt/msk-shop/.env.local`
> (Next.js loads `.env.local` at build time). All other server-side secrets live there too.

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `DEPLOY_SSH_KEY` | Private key of the Action deploy key (ed25519) |
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_HOST_FINGERPRINT` | `ssh-keyscan -t ed25519 [-p <port>] <host>` output |
| `DEPLOY_USER` *(opt, default `root`)* | SSH user |
| `DEPLOY_PORT` *(opt, default `22`)* | SSH port |
| `NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN` | Tebex public token (CI build) |
| `NEXT_PUBLIC_TEBEX_PROJECT_ID` | Tebex project ID (CI build) |
| `NEXT_PUBLIC_BASE_URL` | `https://www.msk-scripts.de` (CI build) |
| `TEBEX_PRIVATE_KEY` | Tebex private key (CI build) |

**Additional workflows:** `codeql.yml` (code scanning), `release.yml`,
`dependency-review.yml`, `secret-scan.yml`.

---

## Manual Installation

### Requirements

- Node.js 22.x
- npm
- MariaDB or MySQL
- Apache2 with `mod_proxy`, `mod_ssl`, `mod_rewrite`, `mod_headers`
- Let's Encrypt SSL certificate (Certbot)
- Debian / Ubuntu with systemd
- PM2 (only required for hosted bot management)

### Steps

```bash
# 1. Clone
cd /opt
git clone https://github.com/MSK-Scripts/msk-shop.git msk-shop
cd msk-shop

# 2. Environment variables
cp .env.example .env.local
nano .env.local

# 3. Database
mysql -u root -p -e "CREATE DATABASE msk_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p msk_shop < database/schema.sql

# 4. Install & build
npm ci
npm run build

# 5. Permissions (service runs as user "musiker15" on port 3005)
chown -R musiker15:musiker15 /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next

# 6. systemd service
cp msk-shop.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable msk-shop
systemctl start msk-shop

# 7. Apache2
a2enmod proxy proxy_http rewrite ssl headers
# Copy Apache config — see msk-shop.conf and msk-shop_ssl.conf
systemctl reload apache2
```

**.env.local** (see `.env.example` for all variables):
```env
# Tebex
NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN=your_public_token
NEXT_PUBLIC_TEBEX_PROJECT_ID=your_project_id
TEBEX_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_BASE_URL=https://www.msk-scripts.de

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=msk_shop

# Session
SESSION_SECRET=<openssl rand -hex 32>

# Discord OAuth (verify flow — scopes: identify, guilds)
DISCORD_VERIFY_CLIENT_ID=your_client_id
DISCORD_VERIFY_CLIENT_SECRET=your_client_secret

# Stripe (Ticket Bot subscriptions)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_PREMIUM_PLUS=price_xxx

# Transcripts (served by Apache under /transcripts)
TRANSCRIPT_BASE_PATH=/var/www/html/transcripts

# DNS validation & SSL
SERVER_PUBLIC_IP=your.server.ip
ADMIN_EMAIL=info@msk-scripts.de

# Hosted bot management (is_hosted customers)
# Each guild has its own subfolder: {BOT_CONFIG_BASE_PATH}/{guild_id}/
BOT_CONFIG_BASE_PATH=/opt/customer_ticketbots

# Public stats — comma-separated API keys to exclude from /stats
STATS_IGNORED_API_KEYS=key1,key2,key3
```

> ⚠️ Never commit `.env.local` — it is listed in `.gitignore`.

---

## Updating (Manual)

> On the production server this is automated: a push to `main` runs CI and then
> `scripts/deploy.sh` (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)). The steps below
> are the manual fallback / first-time bootstrap and are equivalent to `deploy.sh`.

```bash
cd /opt/msk-shop
git pull
npm ci
npm run build
chown -R musiker15:musiker15 /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next
systemctl restart msk-shop
# or simply: /opt/msk-shop/scripts/deploy.sh
```

---

## Troubleshooting

```bash
# Next.js service logs
journalctl -u msk-shop -f

# Apache error log
tail -f /var/log/apache2/msk-shop-error.log

# Restart
systemctl restart msk-shop
systemctl reload apache2

# Fix permission errors (EACCES on .next/)
chown -R musiker15:musiker15 /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next
systemctl restart msk-shop

# Test database connection
mysql -u your_db_user -p msk_shop -e "SHOW TABLES;"

# Hosted bot PM2 status
systemctl status pm2-musiker15
sudo -u musiker15 pm2 list
```

---

## Security

- **Private key** (`TEBEX_PRIVATE_KEY`) is never exposed to the client — all mutations go through Next.js API routes
- **Session cookies** are signed with `SESSION_SECRET` (HMAC-SHA256) and are `HttpOnly` + `Secure`
- **Rate limiting** on basket creation and API key endpoints — in-memory per IP (`lib/rateLimit.ts`),
  plus database-side per-API-key limiting in `ticketbot_rate_limits`
- **Path traversal protection** on markdown file reads (allowlist)
- **File uploads** (transcript attachments) — strict extension allowlist (no `html`/`svg`/`php`),
  files stored as `<uuid>.<ext>` so attacker-controlled names can't reach the web root, and
  image attachments re-encoded via `sharp` (strips polyglots/payloads, rejects non-images).
  Custom-domain vhosts serve transcripts locked down (`Options -Indexes`, `Require all denied`
  by default, `FilesMatch` allowlist, no PHP handler)
- **URL validation** — redirect URLs are always constructed server-side from `NEXT_PUBLIC_BASE_URL`
- **Security Headers** are set centrally in **`middleware.ts`** (Edge runtime, per-request)
  so the Apache vhost does not need to send any duplicates:
  - **CSP** with a cryptographic **nonce** per request + `'strict-dynamic'` —
    no `'unsafe-inline'` / `'unsafe-eval'` in `script-src`, and no `'unsafe-inline'`
    in `style-src` either (Next.js attaches the nonce automatically to its inline
    `<style>` tags). `style-src-attr 'unsafe-inline'` covers React `style={{}}`
    attributes — Mozilla Observatory only scores `style-src`, not `style-src-attr`.
  - **`default-src 'none'`** (deny-by-default) — every used resource directive
    (`script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `worker-src`,
    `manifest-src`, `media-src`, `object-src`) is explicitly listed.
  - **HSTS** `max-age=63072000; includeSubDomains; preload` (2 years).
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
    `Referrer-Policy: strict-origin-when-cross-origin`,
    `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`,
    `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`,
    `X-DNS-Prefetch-Control: on`.
  - The Apache vhost must `Header always unset` any duplicates from
    `/etc/apache2/conf-enabled/security.conf` — otherwise headers arrive twice
    at the client and Mozilla Observatory will refuse to parse them.
  - The root layout (`app/layout.tsx`) opts into Dynamic Rendering via
    `await headers()` so Next.js can inject the nonce into its hydration scripts.
- **Debug route** (`/api/debug`) returns 404 in production
- **Stripe webhook** is verified via the Stripe signature (`constructEvent`, raw body); handlers are idempotent. No card data is received or stored — only Stripe customer/subscription IDs.
- **Dashboard authorization** is account-scoped: every guild-scoped route re-checks `WHERE guild_id = ? AND discord_user_id = ?` against the signed session (`lib/dashboardAuth.ts`), so one account cannot act on another's guild.
- **OAuth flows** use a random `state` token (CSRF protection)

---

## Design / Styling

**Tailwind CSS v4 (CSS-first).** Design tokens are `@theme` variables (`--color-*`)
in **`app/globals.css`** — `tailwind.config.ts` only holds the content paths. Light
mode is the default; the `.dark` scope (set by `next-themes`, GitHub-Dark-inspired)
overrides the tokens. MSK green (`--color-primary` `#4ea426`) is the brand accent.

**Fonts:** Inter (`--font-sans`) + JetBrains Mono (`--font-mono`) — 100% self-hosted
via `@fontsource-variable` (imported in `app/layout.tsx`, **no** `next/font/google`).

A **backward-compat layer** in `globals.css` keeps the legacy `msk-*` utility classes
(`msk-btn-primary`, `msk-card`, `msk-input`, `msk-badge`, `msk-label`, …) and the old
token aliases (`bg`, `surface`, `border`, `accent`, `text`, …) mapped onto the new
`--color-*` tokens, so non-migrated code (e.g. `BotConfigEditor`) still works in both themes.

Theme-specific styles also in `globals.css`:
- `.tebex-description` — renders Tebex HTML (`dangerouslySetInnerHTML`) readable
- `.legal-content` — renders the Markdown legal pages (h1–h3, lists, tables, code)
- CodeMirror overrides for the Bot Config editor (`.cm-editor`, `.cm-scroller`)

---

## Links

- 🌐 [msk-scripts.de](https://www.msk-scripts.de)
- 📖 [Documentation](https://docu.msk-scripts.de)
- 💬 [Discord](https://discord.gg/5hHSBRHvJE)
- 🐙 [GitHub / MSK-Scripts](https://github.com/MSK-Scripts)

---
