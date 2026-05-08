# MSK Scripts Shop

A headless storefront for [MSK Scripts](https://msk-scripts.de) — built with **Next.js 15**, **TypeScript**, **Tailwind CSS** and the **Tebex Headless API**.

> **Live:** [msk-scripts.de](https://www.msk-scripts.de)

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 15.5 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Fonts | Inter (self-hosted via next/font) |
| State | Zustand 5 (persisted to localStorage) |
| Data Fetching | SWR 2 |
| Database | MariaDB / MySQL (via mysql2) |
| Payments | Tebex Headless API |
| Auth | CFX.re (FiveM) + Discord OAuth via Tebex |
| Verify Flow | Discord OAuth + GitHub OAuth + Session cookies |
| Server | Debian + Apache2 reverse proxy + systemd |
| CI/CD | GitHub Actions (auto-deploy on push to `main`) |

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
- 🎟️ Ticket Bot verify flow — Discord + GitHub OAuth, API key issuance, tier management
- 🗂️ Ticket transcript hosting with attachment support (MariaDB-backed)
- 🌍 Custom domain support per guild with DNS validation and Let's Encrypt SSL
- 💰 GitHub Sponsors webhook — auto-assigns tiers on sponsorship events
- 📊 Dashboard page for managing API keys, domains and transcripts
- 🔒 Security headers, rate limiting, path traversal protection, signed session cookies
- 🌐 Apache2 reverse proxy with CSP, HSTS and security headers
- 🔧 Maintenance page included (`public/maintenance.html`)
- 🚀 Auto-deploy via GitHub Actions on push to `main`

---

## Project Structure

```
app/                        Next.js App Router pages & API routes
├── api/auth/
│   ├── discord-verify/     Discord OAuth for the verify flow
│   │   └── callback/
│   └── github/             GitHub OAuth for sponsor tier detection
│       └── callback/
├── api/basket/             Tebex basket API proxy (private key stays server-side)
│   └── [ident]/
│       ├── auth/           Auth provider URLs
│       ├── coupons/        Apply & remove coupons
│       │   └── [code]/     Remove specific coupon
│       └── packages/       Add & remove packages
├── api/discord/            Discord online member count (cached 60s)
├── api/domain/             Custom domain set / remove / validate
├── api/packages/           Package list endpoint
├── api/transcript/upload/  Ticket transcript upload (authenticated via API key)
├── api/verify/             Verify status & completion
├── api/webhook/
│   └── github-sponsors/    GitHub Sponsors webhook handler
├── api/debug/              Debug route (returns 404 in production)
├── account/                User account page
├── auth/discord/           Discord OAuth callback handler (purchase flow)
├── cart/                   Cart page
├── categories/[id]/        Category pages
├── checkout/               Post-payment redirect handler
├── dashboard/              API key & domain management dashboard
├── login/                  Login page
├── packages/[id]/          Package detail pages
├── verify/                 Ticket Bot verify flow
└── terms/                  Legal pages
    ├── imprint/            Imprint (EN + DE)
    ├── privacy/            Privacy Policy (EN + DE, GDPR compliant)
    └── page.tsx            Terms & Conditions (EN + DE)

components/
├── cart/                   CartDrawer (slide-in)
├── home/                   Hero, InfoSection, CTASection, Divider
├── layout/                 Navbar, Footer
├── legal/                  LegalContent (language switcher)
├── packages/               PackageCard, AddToCartButton, PackagePrice
├── SalePriceFetcher.tsx    Client component — pre-fetches sale prices on mount
└── ui/                     DiscordButton, NewsPopup

content/
├── custom-packages.ts      Non-Tebex packages (Discord Bots, GitHub, etc.)
└── legal/                  Editable Markdown files — no code needed
    ├── imprint.md / imprint-de.md
    ├── privacy.md / privacy-de.md   (GDPR / DSGVO)
    └── terms.md / terms-de.md

database/
└── schema.sql              MariaDB schema — run once on a fresh database

lib/
├── auth.ts                 Auth helpers (session validation, Discord/GitHub OAuth)
├── config.ts               All shop configuration (packages, badges, news popup, etc.)
├── dashboardSession.ts     Session helpers for the dashboard
├── db.ts                   mysql2 connection pool
├── i18n.ts                 Language helpers
├── markdown.ts             Markdown → HTML renderer (tables, lists, links, code)
├── rateLimit.ts            In-memory rate limiter for API routes
├── session.ts              Signed session cookie utilities
├── tebex.ts                Tebex API client (read-only calls)
├── tiers.ts                Tier definitions (basic / premium / premium_plus)
└── useCart.ts              Cart hook (auth flow, basket management)

store/
├── cart.ts                 Zustand store (persisted to localStorage)
└── salePrices.ts           Sale price store (Zustand)

public/
├── logo.png                Shop logo
├── favicon.ico
├── maintenance.html        Maintenance page (serve via Apache when needed)
└── *.png                   Custom package banner images

scripts/
├── cleanup.js              Housekeeping script (expired transcripts etc.)
├── vhost-create.sh         Apache2 vhost + SSL setup for custom domains
└── vhost-delete.sh         Remove Apache2 vhost for custom domains
```

---

## Database

The shop uses **MariaDB / MySQL** for the Ticket Bot feature (API keys, transcripts, custom domains, GitHub Sponsors). The Tebex shop itself does **not** require a database.

```bash
# Create the database and run the schema
mysql -u root -p -e "CREATE DATABASE msk_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p msk_shop < database/schema.sql
```

Tables created by `database/schema.sql`:

| Table | Purpose |
|---|---|
| `ticketbot_guilds` | Guild registrations, API keys, tier, custom domain status |
| `ticketbot_transcripts` | Ticket transcript metadata + expiry |
| `ticketbot_attachments` | File attachments for Premium transcripts |
| `ticketbot_rate_limits` | Per-API-key request rate limiting (hourly window) |
| `ticketbot_sponsors` | GitHub Sponsors mirror (written by webhook, read during verify) |

---

## Configuration

All shop configuration lives in **`lib/config.ts`**:

```ts
// Which Tebex packages appear on the homepage
export const FEATURED_PACKAGE_IDS = [5301828, 6446947, 6372865]

// Multiple badges per package
// Variants: 'esx' | 'qb' | 'standalone' | 'js' | 'lua' | 'py' | 'discord' | 'fivem'
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
  button: { label: 'Get API Key', href: '/verify' },
  secondButton: { label: 'Dashboard', href: '/dashboard' },
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

Pushing to `main` automatically deploys via GitHub Actions:

1. Install dependencies (`npm ci`)
2. Build (`npm run build` with secrets injected)
3. Transfer build output + `content/` to server via SCP
4. Write `.env.local` from GitHub Secrets
5. Install production deps, fix permissions, reload systemd service

> **Authentication:** The workflow uses an **SSH private key** (`SSH_PRIVATE_KEY`), not a password.

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `FTP_SERVER` | Server IP or hostname |
| `FTP_USERNAME` | SSH username (e.g. `root`) |
| `SSH_PRIVATE_KEY` | Private key for SSH authentication |
| `FTP_PORT` | SSH port (e.g. `22`) |
| `NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN` | Tebex public token |
| `NEXT_PUBLIC_TEBEX_PROJECT_ID` | Tebex project ID |
| `NEXT_PUBLIC_BASE_URL` | `https://www.msk-scripts.de` |
| `TEBEX_PRIVATE_KEY` | Tebex private key |

---

## Manual Installation

### Requirements

- Node.js 20.x
- npm
- MariaDB or MySQL
- Apache2 with `mod_proxy`, `mod_ssl`, `mod_rewrite`, `mod_headers`
- Let's Encrypt SSL certificate (Certbot)
- Debian / Ubuntu with systemd

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

# 5. Permissions
chown -R www-data:www-data /opt/msk-shop
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

# Discord OAuth (verify flow)
DISCORD_VERIFY_CLIENT_ID=your_client_id
DISCORD_VERIFY_CLIENT_SECRET=your_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# GitHub Sponsors webhook
GITHUB_SPONSORS_WEBHOOK_SECRET=your_webhook_secret

# Transcripts
TRANSCRIPT_BASE_PATH=/var/www/html/transcripts

# DNS validation & SSL
SERVER_PUBLIC_IP=your.server.ip
ADMIN_EMAIL=info@msk-scripts.de
```

> ⚠️ Never commit `.env.local` — it is listed in `.gitignore`.

---

## Updating (Manual)

```bash
cd /opt/msk-shop
git pull
npm ci
npm run build
chown -R www-data:www-data /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next
systemctl restart msk-shop
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
chown -R www-data:www-data /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next
systemctl restart msk-shop

# Test database connection
mysql -u your_db_user -p msk_shop -e "SHOW TABLES;"
```

---

## Security

- **Private key** (`TEBEX_PRIVATE_KEY`) is never exposed to the client — all mutations go through Next.js API routes
- **Session cookies** are signed with `SESSION_SECRET` and are `HttpOnly` + `Secure`
- **Rate limiting** on basket creation and API key endpoints (in-memory, per IP)
- **Path traversal protection** on markdown file reads (allowlist)
- **URL validation** — redirect URLs are always constructed server-side from `NEXT_PUBLIC_BASE_URL`
- **CSP headers** restrict script, style, font and connect sources
- **Debug route** (`/api/debug`) returns 404 in production
- **GitHub Sponsors webhook** is verified via HMAC-SHA256 signature

---

## Links

- 🌐 [msk-scripts.de](https://www.msk-scripts.de)
- 📖 [Documentation](https://docu.msk-scripts.de)
- 💬 [Discord](https://discord.gg/5hHSBRHvJE)
- 🐙 [GitHub / MSK-Scripts](https://github.com/MSK-Scripts)


---
