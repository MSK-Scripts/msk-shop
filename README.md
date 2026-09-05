# MSK Scripts Shop

This is the headless storefront behind [msk-scripts.de](https://www.msk-scripts.de). It sells FiveM resources through the Tebex Headless API and doubles as the management platform for our Discord Ticket Bot and Giveaway Bot. Built on Next.js 16, React 19, TypeScript, Tailwind CSS and MariaDB.

> **Live:** [msk-scripts.de](https://www.msk-scripts.de)

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack build) |
| Language | TypeScript 5.9 (strict mode) |
| UI | React 19.2 |
| Styling | Tailwind CSS 4 (CSS-first, `@theme` tokens in `app/globals.css`) |
| Theming | Light + Dark (Dark by default) via `next-themes` |
| Fonts | Inter + JetBrains Mono, self-hosted through `@fontsource-variable` |
| State | Zustand 5 (persisted to localStorage) |
| Data fetching | SWR 2 |
| Database | MariaDB / MySQL (via mysql2) |
| Payments | Tebex Headless API (shop) and Stripe (Ticket Bot subscriptions) |
| Icons | `lucide-react` (brand marks are local inline SVG, see `components/icons/`) |
| Image processing | `sharp`, re-encodes uploaded image attachments |
| Cookies (client) | `js-cookie` |
| Auth | CFX.re (FiveM) and Discord OAuth via Tebex |
| Verify flow | Discord OAuth with signed session cookies |
| Tests | Vitest 4 with `@vitest/coverage-v8` (294 tests under `tests/`) |
| Linting | ESLint 10 flat config with `eslint-config-next` 16, run through the ESLint CLI |
| Runtime | Node.js 24 (local, CI and production) |
| Server | Debian, Apache2 reverse proxy, systemd |
| Bot process manager | PM2 (`pm2-musiker15.service`) |
| CI/CD | GitHub Actions: CI gate plus a server-side git deploy on push to `main` |

---

## Features

The shop side:

- Full shopping cart with persistent state that survives a page reload
- FiveM (CFX.re) login through Tebex, plus Discord OAuth so roles get assigned after a purchase
- Gift packages with an optional recipient Discord ID
- Coupon codes (apply and remove)
- Per-package badges, tags and custom descriptions
- A "custom packages" section for things that don't live on Tebex (Discord bots, GitHub repos and so on)
- Live resource statistics page (`/resources`) powered by fivestats.io: server counts, ranking and a 7-day trend chart for every MSK resource
- Legal pages in English and German, written in plain Markdown so they can be edited without touching code
- Live Discord online member count
- Configurable news popup, with an optional copyable coupon code, shown on every page load

The Ticket Bot platform:

- Public statistics page (`/ticketbot/stats`), with an allowlist via `STATS_IGNORED_API_KEYS`
- Verify flow over Discord OAuth: API key issuance and account-scoped ownership
- Transcript hosting with attachment support, backed by MariaDB. Uploads are hardened with an extension allowlist, `<uuid>.<ext>` filenames and `sharp` image re-encoding
- Custom domain per guild, with DNS validation and Let's Encrypt SSL
- Stripe subscriptions: in-app checkout, a 14-day free trial for new customers, the Stripe customer portal for self-service cancellation, and webhook-driven tier assignment
- Account dashboard that manages every server behind a single login (guild switcher), including subscriptions, API keys, domains and transcripts
- Hosted bot management for `is_hosted` customers:
  - Start / stop / restart / update (git pull) through PM2
  - Live log console streaming the PM2 error log over Server-Sent Events (`tail -F`)
  - An authenticated reverse proxy to the bot's own dashboard, which is never reachable directly
- A logout endpoint to switch between bots

The Giveaway Bot platform:

- Free, invite-based Discord giveaways: button entry (no privileged intents), restart-safe scheduling, weighted bonus entries, eligibility rules (roles, account age, membership), pause and resume, templates, and winner reroll
- Web dashboard to create and manage giveaways and per-server settings straight from the browser (Discord login, no commands needed)
- A shareable public results page per finished giveaway, plus a live, anonymous stats page (`/giveaway/stats`, EN/DE)
- Multilingual bot (EN / DE / FR / ES) with per-guild branding

And on the infrastructure side:

- Security headers, rate limiting, path traversal protection and signed session cookies
- Nonce-based CSP through Edge middleware (`'strict-dynamic'`, no `unsafe-inline` or `unsafe-eval` in `script-src` or `style-src`, `default-src 'none'`)
- Apache2 reverse proxy with HSTS (2 years plus preload) and all security headers set in one place
- Apache fallback page for 502/503 errors (`under-construction.html`, server-only)
- Server-side git deploy via GitHub Actions on push to `main`: CI-gated, health-checked and rollback-capable (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

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
├── api/bot-control/        Start / stop / restart / update bot via PM2
├── api/bot-logs/           Fetch last 100 lines of PM2 error log (one-shot)
├── api/bot-logs-stream/    Server-Sent Events, real-time PM2 log stream via tail -F
├── api/dashboard/
│   └── logout/             Clear dashboard session cookie (switch bot)
├── api/debug/              Debug route (returns 404 in production)
├── api/discord/            Discord online member count (cached 60s)
│   └── health/             Discord API health check
├── api/domain/             Custom domain set / remove / validate
├── api/giveaway/auth/      Giveaway dashboard Discord OAuth
├── api/giveaway-stats/     Live giveaway stats (read-only giveaway_bot DB)
├── api/packages/           Package list endpoint
├── api/resource-stats/     Live fivestats.io resource stats (key stays server-side)
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
├── resources/              Resource statistics page (fivestats.io)
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
│                           (InfoSection, Divider are empty deprecation stubs)
├── layout/                 Header (sticky nav: theme toggle, cart, ⌘K search, dropdowns) + Footer (+ Footer.module.css)
│                           Navbar.tsx is a backward-compat re-export of Header
├── legal/LegalContent.tsx  Legal-text renderer with EN / DE switcher
├── packages/               PackageCard, PackagePrice, AddToCartButton, PackageGallery
├── search/SearchDialog.tsx Command-palette search (⌘K)
├── theme/                  ThemeProvider + ThemeToggle (next-themes, CSP-nonce-safe)
├── ui/                     Component library: Button, Card, Badge, Container, Input, Skeleton, NewsPopup
│                           (DiscordButton is a deprecation stub)
├── BotConfigEditor.tsx     Hosted-bot dashboard: bot control and live log console. The name is
│                           historic, the config editor was removed in 735f094 because the bot
│                           ships the same UI itself
└── SalePriceFetcher.tsx    Client component that pre-fetches sale prices on mount

content/
├── custom-packages.ts      Non-Tebex packages (Discord bots, GitHub, etc.)
├── resource-stats.ts       Resource list for the /resources page (resource_name, free/paid, GitHub or Tebex IDs)
└── legal/                  Editable Markdown files, no code needed
    ├── imprint.md / imprint-de.md
    ├── privacy.md / privacy-de.md   (GDPR / DSGVO)
    └── terms.md / terms-de.md

database/
└── schema.sql              MariaDB schema, run once on a fresh database

lib/
├── auth.ts                 Auth URL helpers (basket auth providers)
├── config.ts               All shop configuration (packages, badges, news popup, etc.)
├── dashboardSession.ts     Signed dashboard session cookies (guildId)
├── db.ts                   mysql2 connection pool (singleton) + query/queryOne wrappers
├── fivestats.ts            Server-only fivestats.io client + loadResourceStats() (fault-tolerant)
├── giveawayControl.ts      Server-side client for the giveaway bot's localhost control endpoint (guildId from signed session, IDOR-safe)
├── giveawayDb.ts           Read-only mysql2 pool for the separate giveaway_bot DB (GIVEAWAY_DB_*)
├── giveawaySession.ts      Scoped signed giveaway sessions (separate HMAC scope, same SESSION_SECRET)
├── giveawayStats.ts        Shared loader for the anonymous giveaway stats (page + API route)
├── i18n.ts                 Language helpers (EN / DE) + translation tables
├── lang.ts                 Language detection (cookie + Accept-Language) + setLangCookie helper
├── markdown.ts             Markdown to HTML renderer (tables, lists, links, code)
├── rateLimit.ts            In-memory rate limiter for API routes (per IP)
├── session.ts              Signed verify session cookies (HMAC-SHA256) + OAuth state
├── statsIgnore.ts          API keys excluded from /ticketbot/stats
├── tebex.ts                Tebex API client (reads direct, mutations via /api/basket)
├── tiers.ts                Tier definitions (basic / premium / premium_plus / business) + limits
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

scripts/                    Deployed with the repo to /opt/msk-shop/scripts (kept root:root)
├── deploy.sh               Server-side deploy: git checkout + build + restart + health-check
├── cleanup.js              Housekeeping (expired transcripts, etc.), daily cron
├── vhost-create.sh         Apache2 vhost + Let's-Encrypt SSL setup for custom domains
└── vhost-delete.sh         Remove Apache2 vhost for custom domains

docs/
└── DEPLOYMENT.md           Server setup + deploy runbook

proxy.ts                    Edge proxy (the file convention Next 16 renamed
                            from middleware): generates a per-request nonce
                            and sets every security header (CSP with
                            'strict-dynamic', HSTS, COOP, CORP, and so on)
```

---

## Tiers (`lib/tiers.ts`)

This file is the single source of truth for all the limits. The tiers are `basic`, `premium`, `premium_plus` and `business`.

| Limit | basic | premium | premium_plus | business |
|---|---|---|---|---|
| Transcript max. | 10 MB | 50 MB | 100 MB | 200 MB |
| Attachments max. | none | 100 MB | 200 MB | 500 MB |
| Storage retention | 30 days | 180 days | 365 days | 10 years |
| Custom domain | no | yes | yes | yes |
| Bot hosting | no | yes | yes | yes |
| Attachment downloads | no | yes | yes | yes |
| Remove branding | no | yes | yes | yes |
| Uploads / hour | 30 | 60 | 120 | 300 |

`getExpiresAt(tier)` derives the expiry date from `storageDays`.

Every paid tier carries every perk, so code that gates on one asks
`tier !== 'basic'` instead of listing tiers. Enumerating them is how `business`
lost the dashboard shortcut in the verify flow when it was introduced.

---

## Database

The shop uses MariaDB / MySQL for the Ticket Bot side (API keys, transcripts, custom domains, Stripe subscriptions). The Tebex storefront itself needs no database at all.

```bash
# Create the database and run the schema
mysql -u root -p -e "CREATE DATABASE msk_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p msk_shop < database/schema.sql
```

Tables created by `database/schema.sql`:

| Table | Purpose |
|---|---|
| `ticketbot_guilds` | Guild registrations, API keys, tier, custom domain status, `is_hosted` flag, Stripe customer/subscription IDs |
| `ticketbot_customers` | One row per person (Discord user to Stripe customer) plus free-trial eligibility (`trial_used`) |
| `ticketbot_transcripts` | Ticket transcript metadata + expiry |
| `ticketbot_attachments` | File attachments for Premium transcripts |
| `ticketbot_rate_limits` | Per-API-key request rate limiting (hourly window) |

If you are migrating an existing database:

```sql
ALTER TABLE ticketbot_guilds ADD COLUMN is_hosted TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE ticketbot_guilds ADD COLUMN stripe_subscription_id VARCHAR(64) NULL UNIQUE;
ALTER TABLE ticketbot_guilds ADD COLUMN stripe_customer_id     VARCHAR(64) NULL;
-- plus CREATE TABLE ticketbot_customers (see database/schema.sql)
```

---

## Configuration

Most of the shop configuration lives in **`lib/config.ts`**:

```ts
// Which Tebex packages show up on the homepage
export const FEATURED_PACKAGE_IDS = [5301828, 6446947, 6372865]

// One or more badges per package
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

// News popup, shown on every full page load
export const NEWS_POPUP = {
  enabled: true,
  title: 'Discord Ticket Bot',
  text: 'Get your API Key now and create a ticket system for your community!',
  button: { label: 'Get API Key', href: '/ticketbot/verify' },
  secondButton: { label: 'Dashboard', href: '/ticketbot/dashboard' },
  coupon: null, // or e.g. 'NEWSHOP20', renders a copyable coupon field
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

Two more things worth knowing:

- **Custom packages** (the non-Tebex ones) live in **`content/custom-packages.ts`**.
- **Resource statistics** are configured in **`content/resource-stats.ts`**: each entry maps a `resource_name` (the exact FiveM folder name) to a free resource (linked to GitHub) or a paid one (linked to its two Tebex variants).
- **Legal pages** are plain Markdown in **`content/legal/*.md`**, one file per language.

---

## CI/CD, auto deploy

The deploy is done on the server, not by shipping build artifacts. The repo lives as a full git clone at `/opt/msk-shop`, and `scripts/deploy.sh` builds and restarts the app there. The full setup and runbook is in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

```
Push → CI (lint · typecheck · build) ── green ──▶ Deploy (workflow_run)
                                                  └─ SSH (ForceCommand) ─▶ deploy.sh <sha>
```

1. **CI** (`.github/workflows/ci.yml`, name `CI`) runs `lint`, `typecheck` (`tsc --noEmit`) and `build` on every push and PR to `main`.
2. **Deploy** (`.github/workflows/deploy.yml`) fires via `workflow_run` only once CI is green on `main`. You can also run it manually with an optional `commit_sha`, which is how rollbacks work.
3. The Action SSHes in and runs `deploy.sh`, which does the following on the server:
   `git checkout <sha>` → `npm ci` → `npm run build` (loading `/opt/msk-shop/.env.local`) →
   `systemctl restart msk-shop` → a health-check (`curl :3005`, aborts on failure) → deploy tag.
   The script pulls the latest `deploy.sh` from `main` before every run, so it updates itself.

A note on security: the Action's SSH key is pinned with `ForceCommand`, so it can only ever run `deploy.sh`, and known-hosts checking is strict. Because the build happens on the server, the `NEXT_PUBLIC_*` and `TEBEX_PRIVATE_KEY` values have to be present in `/opt/msk-shop/.env.local` (Next.js reads `.env.local` at build time). Every other server-side secret lives there too.

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `DEPLOY_SSH_KEY` | Private key of the Action deploy key (ed25519) |
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_HOST_FINGERPRINT` | `ssh-keyscan -t ed25519 [-p <port>] <host>` output |
| `DEPLOY_USER` *(optional, default `root`)* | SSH user |
| `DEPLOY_PORT` *(optional, default `22`)* | SSH port |
| `NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN` | Tebex public token (CI build) |
| `NEXT_PUBLIC_TEBEX_PROJECT_ID` | Tebex project ID (CI build) |
| `NEXT_PUBLIC_BASE_URL` | `https://www.msk-scripts.de` (CI build) |
| `TEBEX_PRIVATE_KEY` | Tebex private key (CI build) |

There are a few more workflows in the repo: `codeql.yml` (code scanning), `mirror.yml` (mirrors the repo to Codeberg), `dependency-review.yml` and `secret-scan.yml`.

---

## Manual Installation

### Requirements

- Node.js 22.x
- npm
- MariaDB or MySQL
- Apache2 with `mod_proxy`, `mod_ssl`, `mod_rewrite`, `mod_headers`
- A Let's Encrypt SSL certificate (Certbot)
- Debian / Ubuntu with systemd
- PM2 (only if you use hosted bot management)

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

# 5. Permissions (the service runs as user "musiker15" on port 3005)
chown -R musiker15:musiker15 /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next

# 6. systemd service
cp msk-shop.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable msk-shop
systemctl start msk-shop

# 7. Apache2
a2enmod proxy proxy_http rewrite ssl headers
# Copy the Apache config, see msk-shop.conf and msk-shop_ssl.conf
systemctl reload apache2
```

The most important `.env.local` values (see `.env.example` for the complete list):

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

# Discord OAuth (verify flow, scopes: identify, guilds)
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
# Each guild gets its own subfolder: {BOT_CONFIG_BASE_PATH}/{guild_id}/
BOT_CONFIG_BASE_PATH=/opt/customer_ticketbots

# Public stats, comma-separated API keys to keep out of /stats
STATS_IGNORED_API_KEYS=key1,key2,key3

# Resource statistics (the /resources page)
FIVESTATS_API_KEY=your_fivestats_api_key
```

> Never commit `.env.local`. It is listed in `.gitignore`.

---

## Updating (manual)

On the production server this is fully automated: a push to `main` runs CI and then `scripts/deploy.sh` (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)). The steps below are the manual fallback and the first-time bootstrap, and they do the same thing `deploy.sh` does.

```bash
cd /opt/msk-shop
git pull
npm ci
npm run build
chown -R musiker15:musiker15 /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next
systemctl restart msk-shop
# or just: /opt/msk-shop/scripts/deploy.sh
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

# Test the database connection
mysql -u your_db_user -p msk_shop -e "SHOW TABLES;"

# Hosted bot PM2 status
systemctl status pm2-musiker15
sudo -u musiker15 pm2 list
```

---

## Security

The short version, the full write-up is in [SECURITY.md](SECURITY.md):

- The Tebex private key (`TEBEX_PRIVATE_KEY`) never reaches the client. Every mutation goes through a Next.js API route.
- Session cookies are signed with `SESSION_SECRET` (HMAC-SHA256) and are `HttpOnly` and `Secure`.
- Rate limiting sits on basket creation and the API-key endpoints: in-memory per IP (`lib/rateLimit.ts`), plus a database-side per-API-key limit in `ticketbot_rate_limits`.
- Markdown file reads use an allowlist, so there is no path traversal.
- Transcript attachment uploads use a strict extension allowlist (no `html`, `svg` or `php`), store files as `<uuid>.<ext>` so an attacker-chosen name can't reach the web root, and re-encode image attachments through `sharp` to strip polyglots and reject anything that isn't really an image. Custom-domain vhosts serve transcripts locked down (`Options -Indexes`, `Require all denied` by default, a `FilesMatch` allowlist, no PHP handler).
- Redirect URLs are always built server-side from `NEXT_PUBLIC_BASE_URL`.
- All security headers are set in one place, in **`proxy.ts`** (Edge runtime, per request), so the Apache vhost never sends duplicates. The file was called `middleware.ts` until Next 16 renamed the convention:
  - A CSP with a fresh cryptographic nonce per request plus `'strict-dynamic'`. No `'unsafe-inline'` or `'unsafe-eval'` in `script-src`, and no `'unsafe-inline'` in `style-src` either (Next.js attaches the nonce to its inline `<style>` tags automatically). `style-src-attr 'unsafe-inline'` covers React `style={{}}` attributes, which Mozilla Observatory does not score.
  - `default-src 'none'` (deny by default), with every used resource directive listed explicitly (`script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `worker-src`, `manifest-src`, `media-src`, `object-src`).
  - HSTS `max-age=63072000; includeSubDomains; preload` (2 years).
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` locking down camera, microphone, geolocation, payment and usb, plus `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy: same-origin` and `X-DNS-Prefetch-Control: on`.
  - The Apache vhost has to `Header always unset` any duplicates from `/etc/apache2/conf-enabled/security.conf`, otherwise the headers arrive twice and Mozilla Observatory refuses to parse them.
- The debug route (`/api/debug`) returns 404 in production.
- The Stripe webhook is verified with the Stripe signature (`constructEvent`, raw body) and the handlers are idempotent. No card data is received or stored, only the Stripe customer and subscription IDs.
- Dashboard access is account-scoped: every guild-scoped route re-checks `WHERE guild_id = ? AND discord_user_id = ?` against the signed session (`lib/dashboardAuth.ts`), so one account can never act on another account's guild.
- OAuth flows use a random `state` token for CSRF protection.

---

## Design and styling

Everything is Tailwind CSS v4 (CSS-first). The design tokens are `@theme` variables (`--color-*`) in **`app/globals.css`**, and `tailwind.config.ts` only holds the content paths. Light mode is the default; the `.dark` scope (set by `next-themes`, GitHub-Dark-inspired) overrides the tokens. MSK green (`--color-primary`, `#4ea426`) is the brand accent.

Fonts are Inter (`--font-sans`) and JetBrains Mono (`--font-mono`), fully self-hosted through `@fontsource-variable` (imported in `app/layout.tsx`, no `next/font/google`, so nothing gets fetched from Google).

There is a backward-compat layer in `globals.css` that keeps the old `msk-*` utility classes (`msk-btn-primary`, `msk-card`, `msk-input`, `msk-badge`, `msk-label` and friends) and the legacy token aliases (`bg`, `surface`, `border`, `accent`, `text` and so on) mapped onto the new `--color-*` tokens. That way code that hasn't been migrated yet (mainly `BotConfigEditor`) still renders correctly in both themes.

A couple of theme-specific styles also live in `globals.css`:

- `.tebex-description` makes the Tebex HTML (`dangerouslySetInnerHTML`) readable.
- `.legal-content` renders the Markdown legal pages (h1 to h3, lists, tables, code).

---

## License

**This is not an open-source project.** The source is readable, not free to use.

It runs under the **MSK Source Available License (MSK-SAL) v1.1**:
[English](LICENSE.md) · [Deutsch](LICENSE_DE.md). The German version is the
binding one (§ 12.4).

What that means in practice:

| | |
|---|---|
| ✅ **Allowed** | Reading the code, running it locally for private study, opening issues, submitting pull requests, security research along [SECURITY.md](SECURITY.md) |
| ❌ **Not allowed** | Copying or reusing the code, derivative works, hosting it publicly, any commercial use, redistribution, recreating the design of the protected components |
| ⚖️ **Untouched** | The statutory rights under § 69d and § 69e UrhG, which no contract can take away (§ 5 of the license) |

Two things the license does **not** cover: the npm dependencies, which keep their
own licenses, and the media served from `cdn.msk-scripts.de`, whose origin is
recorded per image in the database (§ 8).

Names and logos are not licensed either. A copyright license is not a trademark
license (§ 7).

**Contributing?** Read [Rights in your contribution](CONTRIBUTING.md#rights-in-your-contribution)
first. Opening a pull request grants MSK Scripts an exclusive right of use in it,
while your copyright and your right to attribution stay with you.

For commercial licenses, collaborations or white-label requests, write to
`info@msk-scripts.de` with the subject `MSK License Request`.

---

## Links

- [msk-scripts.de](https://www.msk-scripts.de)
- [Documentation](https://docu.msk-scripts.de)
- [Discord](https://discord.gg/5hHSBRHvJE)
- [GitHub / MSK-Scripts](https://github.com/MSK-Scripts)

---
