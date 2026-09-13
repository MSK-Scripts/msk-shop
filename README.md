# MSK Scripts Shop

This is the headless storefront behind [msk-scripts.de](https://www.msk-scripts.de). It sells FiveM resources through the Tebex Headless API and doubles as the management platform for our Discord Ticket Bot and Giveaway Bot. It also runs the MSK image gallery and its CDN. Built on Next.js 16, React 19, TypeScript, Tailwind CSS and MariaDB.

> **Live:** [msk-scripts.de](https://www.msk-scripts.de)

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack build) |
| Language | TypeScript 6.0 (strict mode) |
| UI | React 19.3 |
| Styling | Tailwind CSS 4 (CSS-first, `@theme` tokens in `app/globals.css`) |
| Theming | Light + Dark via `next-themes` |
| Fonts | Inter + JetBrains Mono, self-hosted through `@fontsource-variable` |
| State | Zustand 5 (persisted to localStorage) |
| Data fetching | SWR 2 |
| Database | MariaDB / MySQL (via mysql2), versioned migrations in `database/migrations/` |
| Payments | Tebex Headless API (shop) and Stripe (Ticket Bot subscriptions) |
| Mail | nodemailer over SMTP (order confirmations, trial reminders, legal receipts) |
| Icons | `lucide-react` (brand marks are local inline SVG, see `components/icons/`) |
| Image processing | `sharp`, re-encodes uploaded transcript attachments and gallery submissions |
| Cookies (client) | `js-cookie` |
| Auth | CFX.re (FiveM) and Discord OAuth via Tebex for purchases, separate Discord OAuth apps for the dashboards and `/admin` |
| Tests | Vitest 5 with `@vitest/coverage-v8` (725 tests under `tests/`) |
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
- Catalog filters, per-package badges, tags and custom descriptions
- A "custom packages" section for things that don't live on Tebex (Discord bots, GitHub repos and so on)
- Measured shop figures on the homepage (hidden rather than shown stale when the nightly snapshot is too old) and a release feed read from the public `MSK-Scripts/VERSIONS` repository
- Live resource statistics page (`/resources`) powered by fivestats.io: server counts, ranking and a 7-day trend chart for every MSK resource
- English at the root and German under `/de/`, with canonical and hreflang tags on every public page and a generated sitemap
- Legal pages in English and German, written in plain Markdown so they can be edited without touching code
- The legally required forms that work without an account: contract withdrawal (`/vertrag-widerrufen`), contract cancellation (`/vertrag-kuendigen`) and a DSA content report (`/report`), each with an email receipt
- Configurable news popup, with an optional copyable coupon code

The Ticket Bot platform:

- Public statistics page (`/ticketbot/stats`), with an allowlist via `STATS_IGNORED_API_KEYS`
- Verify flow over Discord OAuth: API key issuance and account-scoped ownership
- Ownership follows Discord: a guild whose owner lost Administrator or Manage Server gets a 14-day grace period, then disappears from their dashboard and can be claimed by the new admin team
- Transcript hosting with attachment support, backed by MariaDB. Uploads are hardened with an extension allowlist, `<uuid>.<ext>` filenames and `sharp` image re-encoding
- Custom domain per guild for transcripts, with DNS validation and Let's Encrypt SSL
- Stripe subscriptions: in-app checkout, a 14-day free trial for new customers, the Stripe customer portal for self-service cancellation, and webhook-driven tier assignment
- Account dashboard that manages every server behind a single login (guild switcher), including subscriptions, API keys, domains and transcripts
- Self-service bot hosting for paid tiers:
  - The customer enters three values (token, client ID, client secret), the rest is provisioned in the background
  - Every hosted bot gets its own dashboard address (`tickets-<hex>.msk-scripts.de`), optionally on the customer's own domain
  - Start / stop / restart / update (git pull) through PM2
  - Live log console streaming the PM2 error log over Server-Sent Events (`tail -F`)
  - An authenticated reverse proxy to the bot's own dashboard as a fallback for the owner

The Giveaway Bot platform:

- Free, invite-based Discord giveaways: button entry (no privileged intents), restart-safe scheduling, weighted bonus entries, eligibility rules (roles, account age, membership), pause and resume, templates, and winner reroll
- Web dashboard to create and manage giveaways and per-server settings straight from the browser (Discord login, open to server managers and members holding the configured giveaway manager role)
- A shareable public results page per finished giveaway, plus a live, anonymous stats page (`/giveaway/stats`, EN/DE)
- Multilingual bot (EN / DE / FR / ES) with per-guild branding

The image gallery:

- Public gallery (`/images`) of GTA V vehicles, peds, weapons and items plus MSK brand assets, with full-text search
- Images served from `cdn.msk-scripts.de` in three sizes (PNG original, 400 px and 160 px WebP), with CORS open so FiveM NUIs can load them
- Community submissions (`/images/upload`) through Discord login: files are re-encoded by `sharp` on arrival, kept in a quarantine outside any web root, and published only after moderation

The admin dashboard (`/admin`):

- Discord login with its own permission system (the owner plus a team with per-permission grants, every write recorded in an audit log)
- Tebex store management through the Plugin API: payments (including free grants and refunds), player lookup, coupons, gift cards, bans and package edits
- Ticket Bot API keys and tier overrides
- Image gallery management: edit, move and delete images, moderate submissions, run a file/database sync check

And on the infrastructure side:

- Security headers, rate limiting, path traversal protection and signed session cookies
- Nonce-based CSP through the Next.js proxy (`'strict-dynamic'`, no `unsafe-inline` or `unsafe-eval` in `script-src` or `style-src`, `default-src 'none'`)
- Apache2 reverse proxy with HSTS (2 years plus preload) and all security headers set in one place
- Apache fallback page for 502/503 errors (`under-construction.html`, server-only)
- Server-side git deploy via GitHub Actions on push to `main`: CI-gated, applies database migrations, health-checked and rollback-capable (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

---

## Project Structure

The tree lists directories and the files worth knowing about, not every file.

```
app/                        Next.js App Router pages & API routes
├── api/
│   ├── admin/              Admin dashboard backend (auth, payments, lookup, coupons,
│   │                       giftcards, bans, packages, catalog, api-keys, images,
│   │                       image-uploads, team, audit)
│   ├── auth/discord-verify/  Discord OAuth for the verify flow (+ callback/)
│   ├── basket/             Tebex basket API proxy (private key stays server-side)
│   ├── bot-control/        Start / stop / restart / update a hosted bot via PM2
│   ├── bot-dashboard/open/ Handoff token for the proxied bot dashboard
│   ├── bot-hosting/        Self-service hosting: provision, status, env, domain,
│   │                       dashboard-host, deactivate
│   ├── bot-logs/           Last 100 lines of the PM2 error log (one-shot)
│   ├── bot-logs-stream/    Server-Sent Events, real-time PM2 log stream
│   ├── dashboard/logout/   Clear the dashboard session cookie
│   ├── debug/              Debug route (returns 404 in production)
│   ├── discord/            Discord online member count (+ health/)
│   ├── domain/             Transcript custom domain set / remove / validate
│   ├── giveaway/           Giveaway dashboard: auth, data, action, verify, logout
│   ├── giveaway-result/    Public giveaway result pages: publish, delete
│   ├── giveaway-stats/     Live giveaway stats (read-only giveaway bot DB)
│   ├── images/             Public gallery API (list, categories, single image) + upload/
│   ├── legal/              Withdrawal, cancellation and DSA report forms
│   ├── packages/           Package list endpoint
│   ├── resource-stats/     Live fivestats.io resource stats (key stays server-side)
│   ├── stats/              Public Ticket Bot statistics
│   ├── stripe/             checkout/ (subscription + trial) and portal/ (manage / cancel)
│   ├── transcript/         upload/ and url/ (authenticated via API key)
│   ├── transcripts/        Dashboard transcript list for the owner's guild
│   ├── verify/             Verify status / complete / check-guild / redirect-dashboard
│   └── webhook/stripe/     Stripe webhook handler (signature-verified)
├── account/                User account page
├── admin/                  Admin dashboard (one *Tab.tsx per area)
├── auth/discord/           Discord OAuth callback (purchase flow)
├── botproxy/               Reverse proxy route for the hosted bot dashboard
├── cart/                   Cart page
├── categories/[id]/        Category pages
├── checkout/               Post-payment redirect handler
├── giveaway/               Giveaway Bot landing page + verify/, dashboard/, stats/, g/[token]/
├── images/                 Gallery: overview, [category]/, [category]/[name]/, upload/
├── login/                  Login page
├── packages/               Package list + [id]/ detail pages
├── report/                 DSA content report form
├── resources/              Resource statistics page (fivestats.io)
├── sitemap.xml/            Sitemap route (+ sitemap.xsl/, sitemap-images.xml/)
├── terms/                  Terms, imprint/, privacy/, avv/ (data processing), widerruf/
├── ticketbot/              Ticket Bot landing page + verify/, dashboard/, stats/
├── vertrag-kuendigen/      Contract cancellation form (§ 312k BGB)
└── vertrag-widerrufen/     Contract withdrawal form (§ 356a BGB)

components/
├── bots/                   Ticket Bot and Giveaway Bot landing pages, comparison table
├── cart/                   Slide-in cart drawer
├── home/                   Homepage sections (Hero, ProofLine, Catalog, Bots, HowItWorks, ...)
├── i18n/                   LangProvider, LanguageDropdown, LocaleLink (keeps the /de/ prefix)
├── icons/                  Local brand marks (GitHub and others)
├── images/                 Gallery cards, search, copy-URL button, brand notice
├── layout/                 Header, Footer, payment marks
├── legal/                  Legal-text renderer
├── packages/               PackageCard, PackagePrice, AddToCartButton, PackageGallery
├── search/                 Command-palette search (⌘K)
├── theme/                  ThemeProvider + ThemeToggle
├── ui/                     Button, Card, Badge, Container, Input, Skeleton, NewsPopup
└── BotConfigEditor.tsx     Hosted-bot panel: bot control and live log console. The name
                            is historic, the config editor moved into the bot itself

content/
├── custom-packages.ts      Non-Tebex packages (Discord bots, GitHub, etc.)
├── resource-stats.ts       Resource list for the /resources page
├── ticketbot-copy.ts, giveaway-copy.ts, ticketbot-compare-copy.ts   Landing page texts (EN + DE)
└── legal/                  Editable Markdown legal texts, one file per language

database/
├── schema.sql              Full schema for a fresh database
├── migrations/             NNN-name.sql files, applied once each by deploy.sh (see README there)
└── seed.dev.sql            Invented data for the local development database

lib/                        Server and shared logic, grouped by area:
├── tebex.ts, tebexPlugin.ts, price.ts, useCart.ts      Shop and Tebex APIs
├── session.ts, dashboardSession.ts, giveawaySession.ts,
│   adminSession.ts, uploadSession.ts                   Signed session cookies (HMAC-SHA256)
├── dashboardAuth.ts, guildScope.ts, guildAccess.ts,
│   discordGuilds.ts, discordPermissions.ts             Guild ownership and Discord rights
├── adminApi.ts, adminAuth.ts, adminPerms.ts, adminAudit.ts   Admin route wrapper and permissions
├── stripe.ts, tiers.ts, mail.ts, emails/               Subscriptions, tier limits, mail
├── botProvision.ts, botEnv.ts, dashboardHost.ts,
│   ionosDns.ts, customDomain.ts, hostedBot.ts, pm2.ts  Bot hosting and domains
├── images.ts, adminImages.ts, imageUploads.ts,
│   imagePipeline.ts, imageSyncCheck.ts                 Image gallery and CDN
├── giveawayControl.ts, giveawayDb.ts, giveawayStats.ts, giveawayManager.ts   Giveaway Bot
├── legalForms.ts           Withdrawal, cancellation and DSA report handling
├── i18n.ts, lang.ts, serverLang.ts   Translations and /de/ routing
├── seo.ts, pageSeo.ts, botSeo.ts, jsonLd.ts, sitemap.ts   Metadata and structured data
├── rateLimit.ts, sanitize.ts, db.ts   Rate limiting, HTML sanitizing, database pool
└── config.ts               Shop configuration (featured packages, badges, news popup)

store/                      Zustand stores (cart, sale prices)
types/                      TypeScript types for the Tebex API
tests/                      Vitest suite

scripts/                    Deployed with the repo to /opt/msk-shop/scripts (kept root:root)
├── deploy.sh               Server-side deploy: checkout, migrations, build, restart, health check
├── msk-cron.sh             Wrapper for the cron jobs below (logs even when loading the env fails)
├── cleanup.js              Expired transcripts, lapsed memberships, archived bots (daily)
├── stripe-reconcile.js     Re-syncs subscription state with Stripe (daily)
├── tebex-stats.js          Nightly snapshot of the shop figures shown on the homepage
├── vhost-create.sh, vhost-delete.sh           Apache vhost + SSL for transcript custom domains
├── bot-vhost-create.sh, bot-vhost-delete.sh   Apache vhost for hosted bot dashboards
├── bot-provision.js        Installs and starts a hosted bot (spawned, not a cron)
├── image-ingest.js, image-sync-check.js, image-label-import.js,
│   image-pedshot-prepare.js, labels/          Image CDN tooling
└── repair-transcript-images.js                One-off repair for expired Discord image links

docs/
├── DEPLOYMENT.md           Server setup + deploy runbook (German)
├── TEBEX_API_REFERENCE.md  Tebex HTTP API reference
└── ADMIN_DASHBOARD_PLAN.md Original plan for /admin

proxy.ts                    Next.js proxy (called middleware.ts before Next 16): generates a
                            per-request nonce and sets every security header
docker-compose.dev.yml      Local MariaDB for development
msk-shop.service            systemd unit (port 3005, user musiker15)
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

The Ticket Bot, Giveaway, admin, gallery and legal-form features use MariaDB / MySQL. The Tebex storefront itself needs no database; every database-backed view falls back gracefully when it is unreachable.

```bash
# Create the database and run the schema
mysql -u root -p -e "CREATE DATABASE your_db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p your_db_name < database/schema.sql
```

Tables created by `database/schema.sql`:

| Table | Purpose |
|---|---|
| `schema_migrations` | Which files from `database/migrations/` have been applied |
| `ticketbot_guilds` | Guild registrations: API key, tier, owner, Discord access check, Stripe IDs, custom domain, hosting state |
| `ticketbot_customers` | One row per person (Discord user to Stripe customer) plus free-trial eligibility |
| `ticketbot_hosting_jobs` | Progress of a self-service bot installation |
| `ticketbot_transcripts` | Ticket transcript metadata + expiry |
| `ticketbot_attachments` | File attachments for paid-tier transcripts |
| `ticketbot_rate_limits` | Per-API-key request rate limiting (hourly window) |
| `giveaway_results` | Public giveaway result pages (usernames only, no Discord IDs) |
| `msk_admin_team`, `msk_admin_audit` | Admin dashboard members, permissions and audit log |
| `msk_shop_stats` | Nightly shop figures for the homepage |
| `msk_image_categories`, `msk_images` | Image gallery categories and image metadata (files live on the CDN) |
| `msk_image_uploads` | Moderation queue for community submissions |
| `msk_withdrawals`, `msk_cancellations`, `msk_content_reports` | Submissions of the three legal forms |

### Migrations

A fresh database gets everything from `schema.sql`. Existing databases are updated through `database/migrations/NNN-name.sql`, which `scripts/deploy.sh` applies once each, in order, and records in `schema_migrations`. Migrations must be additive, because they run while the previous version is still serving. The rules are in [database/migrations/README.md](database/migrations/README.md).

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

A few more things worth knowing:

- **Custom packages** (the non-Tebex ones) live in **`content/custom-packages.ts`**.
- **Resource statistics** are configured in **`content/resource-stats.ts`**: each entry maps a `resource_name` (the exact FiveM folder name) to a free resource (linked to GitHub) or a paid one (linked to its two Tebex variants).
- **Legal pages** are plain Markdown in **`content/legal/*.md`**, one file per language.
- **SEO titles and descriptions** for pages, packages and categories live in `lib/pageSeo.ts` and `lib/config.ts`, in both languages.

---

## CI/CD, auto deploy

The deploy is done on the server, not by shipping build artifacts. The repo lives as a full git clone at `/opt/msk-shop`, and `scripts/deploy.sh` builds and restarts the app there. The full setup and runbook is in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

```
Push → CI (lint · typecheck · test · audit · build) ── green ──▶ Deploy (workflow_run)
                                                                └─ SSH (ForceCommand) ─▶ deploy.sh <sha>
```

1. **CI** (`.github/workflows/ci.yml`, name `CI`) runs `lint`, `typecheck` (`tsc --noEmit`), `test`, an audit of the production dependency tree (`npm audit --omit=dev --audit-level=high`) and `build` on every push and PR to `main`.
2. **Deploy** (`.github/workflows/deploy.yml`) fires via `workflow_run` only once CI is green on `main`. You can also run it manually with an optional `commit_sha`, which is how rollbacks work.
3. The Action SSHes in and runs `deploy.sh`, which does the following on the server:
   `git checkout <sha>` → database migrations → `npm ci` → `npm run build` (loading `/opt/msk-shop/.env.local`) →
   `systemctl restart msk-shop` → a health check (`curl :3005`, aborts on failure) → deploy tag.
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

There are a few more workflows in the repo: `codeql.yml` (code scanning), `code-coverage.yml` (Vitest coverage upload), `mirror.yml` (mirrors the repo to Codeberg), `dependency-review.yml` and `secret-scan.yml`. Dependabot (`.github/dependabot.yml`) groups minor and patch updates into one weekly PR and keeps `vitest` with `@vitest/*` in a group of their own, because they only install together.

---

## Manual Installation

### Requirements

- Node.js 24.x
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
mysql -u root -p -e "CREATE DATABASE your_db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p your_db_name < database/schema.sql

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

The most important `.env.local` values. `.env.example` has the complete list with a comment for every variable (giveaway bot, bot hosting, IONOS DNS, admin dashboard, image CDN and more):

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
DB_PASSWORD='your_db_password'
DB_NAME=your_db_name

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
STRIPE_PRICE_BUSINESS=price_xxx

# Mail (skipped with a log line when unset). Quote values containing < or >
SMTP_HOST=mail.example.com
SMTP_PORT=465
SMTP_USER=noreply@msk-scripts.de
SMTP_PASS=your_smtp_password
MAIL_FROM="MSK Scripts <noreply@msk-scripts.de>"

# Transcripts (served by Apache under /transcripts)
TRANSCRIPT_BASE_PATH=/var/www/html/transcripts

# DNS validation & SSL
SERVER_PUBLIC_IP=your.server.ip
ADMIN_EMAIL=info@msk-scripts.de

# Hosted bot management, one subfolder per guild: {BOT_CONFIG_BASE_PATH}/{guild_id}/
BOT_CONFIG_BASE_PATH=/opt/customer_ticketbots

# Public stats, comma-separated API keys to keep out of /ticketbot/stats
STATS_IGNORED_API_KEYS=key1,key2,key3

# Resource statistics (the /resources page)
FIVESTATS_API_KEY=your_fivestats_api_key
```

> Never commit `.env.local`. It is listed in `.gitignore`.

For local development without a server database there is `docker-compose.dev.yml`, see the last section of [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Updating (manual)

On the production server this is fully automated: a push to `main` runs CI and then `scripts/deploy.sh` (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)). Prefer running that script by hand over the steps below, because it also applies pending database migrations. The steps are the fallback for a server without the migration step.

```bash
cd /opt/msk-shop
git pull
npm ci
npm run build
chown -R musiker15:musiker15 /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next
systemctl restart msk-shop
# preferred: /opt/msk-shop/scripts/deploy.sh
```

---

## Troubleshooting

```bash
# Next.js service logs
journalctl -u msk-shop -f

# Deploy log
tail -f /var/log/msk-shop-deploy.log

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
mysql -u your_db_user -p your_db_name -e "SHOW TABLES;"

# Hosted bot PM2 status
systemctl status pm2-musiker15
sudo -u musiker15 pm2 list
```

---

## Security

The short version, the full write-up is in [SECURITY.md](SECURITY.md):

- The Tebex private key (`TEBEX_PRIVATE_KEY`) never reaches the client. Every mutation goes through a Next.js API route.
- Session cookies are signed with `SESSION_SECRET` (HMAC-SHA256, constant-time comparison), `HttpOnly` and `Secure`. There is no fallback secret, a missing `SESSION_SECRET` fails at runtime.
- Rate limiting: in-memory per IP (`lib/rateLimit.ts`, keyed on the rightmost `X-Forwarded-For` entry) on basket, domain, bot control, log and admin routes, plus a database-side per-API-key limit in `ticketbot_rate_limits`.
- Markdown file reads use an allowlist, so there is no path traversal.
- Transcript attachment uploads use a strict extension allowlist (no `html`, `svg` or `php`), store files as `<uuid>.<ext>` so an attacker-chosen name can't reach the web root, and re-encode image attachments through `sharp`. Gallery submissions are re-encoded on arrival and kept outside any web root until a moderator approves them.
- Redirect URLs are always built server-side from `NEXT_PUBLIC_BASE_URL`.
- All security headers are set in one place, in **`proxy.ts`** (per request), so the Apache vhost never sends duplicates. The file was called `middleware.ts` until Next 16 renamed the convention:
  - A CSP with a fresh cryptographic nonce per request plus `'strict-dynamic'`. No `'unsafe-inline'` or `'unsafe-eval'` in `script-src`, and no `'unsafe-inline'` in `style-src` either (Next.js attaches the nonce to its inline `<style>` tags automatically). `style-src-attr 'unsafe-inline'` covers React `style={{}}` attributes, which Mozilla Observatory does not score.
  - `default-src 'none'` (deny by default), with every used resource directive listed explicitly.
  - HSTS `max-age=63072000; includeSubDomains; preload` (2 years).
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` locking down camera, microphone, geolocation, payment and usb, plus `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy: same-origin` and `X-DNS-Prefetch-Control: on`.
  - The Apache vhost has to `Header always unset` any duplicates from `/etc/apache2/conf-enabled/security.conf`, otherwise the headers arrive twice and Mozilla Observatory refuses to parse them.
- The debug route (`/api/debug`) returns 404 in production.
- The Stripe webhook is verified with the Stripe signature (`constructEvent`, raw body) and the handlers are idempotent. No card data is received or stored, only the Stripe customer and subscription IDs.
- Dashboard access is account-scoped: every guild-scoped route re-checks `WHERE guild_id = ? AND discord_user_id = ?` against the signed session (`lib/dashboardAuth.ts`) and refuses guilds whose owner lost their Discord rights past the grace period.
- Admin routes run through one wrapper (`lib/adminApi.ts`): session, a per-route permission loaded live from the database, rate limit, an `Origin` check on every mutation, and an audit log entry for every write.
- OAuth flows use a random `state` token for CSRF protection.

---

## Design and styling

Everything is Tailwind CSS v4 (CSS-first). The design tokens are `@theme` variables (`--color-*`) in **`app/globals.css`**, and `tailwind.config.ts` only holds the content paths. The `.dark` scope (set by `next-themes`) overrides the tokens. MSK green (`--color-primary`) is the brand accent, `#27762e` in light mode and `#60b02f` in dark mode, both sampled from the logo. The design system is documented in [DESIGN.md](DESIGN.md).

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
