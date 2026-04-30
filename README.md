# MSK Scripts Shop

A headless storefront for [MSK Scripts](https://msk-scripts.de) — built with **Next.js 15**, **TypeScript**, **Tailwind CSS** and the **Tebex Headless API**.

> **Live:** [msk-scripts.de](https://www.msk-scripts.de)

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Fonts | Inter (self-hosted via next/font) |
| State | Zustand 5 (persisted to localStorage) |
| Payments | Tebex Headless API |
| Auth | CFX.re (FiveM) + Discord OAuth via Tebex |
| Server | Debian + Apache2 reverse proxy + systemd |
| CI/CD | GitHub Actions (auto-deploy on push to main) |

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
- 📰 News popup (configurable, shown on every page load)
- 🔒 Security headers, rate limiting, path traversal protection
- 🌐 Apache2 reverse proxy with CSP, HSTS and security headers
- 🔧 Maintenance page included (`public/maintenance.html`)
- 🚀 Auto-deploy via GitHub Actions on push to `main`

---

## Project Structure

```
app/                        Next.js App Router pages & API routes
├── api/basket/             Tebex basket API proxy (private key stays server-side)
│   └── [ident]/
│       ├── auth/           Auth provider URLs
│       ├── coupons/        Apply & remove coupons
│       │   └── [code]/     Remove specific coupon (POST /coupons/remove)
│       └── packages/       Add & remove packages
├── api/discord/            Discord online member count (cached 60s)
├── api/debug/              Debug route (returns 404 in production)
├── auth/discord/           Discord OAuth callback handler
├── cart/                   Cart page
├── categories/[id]/        Category pages
├── checkout/               Post-payment redirect handler
├── packages/[id]/          Package detail pages
└── terms/                  Legal pages
    ├── imprint/            Imprint (EN + DE)
    ├── privacy/            Privacy Policy (EN + DE, GDPR compliant)
    └── page.tsx            Terms & Conditions (EN + DE)

components/
├── cart/                   CartDrawer (slide-in)
├── home/                   Hero, InfoSection, CTASection, Divider
├── layout/                 Navbar, Footer
├── legal/                  LegalContent (language switcher)
├── packages/               PackageCard, AddToCartButton
└── ui/                     DiscordButton, NewsPopup

content/
├── custom-packages.ts      Non-Tebex packages (Discord Bots, GitHub, etc.)
└── legal/                  Editable Markdown files — no code needed
    ├── imprint.md          English
    ├── imprint-de.md       German
    ├── privacy.md          English (GDPR)
    ├── privacy-de.md       German (DSGVO)
    ├── terms.md            English
    └── terms-de.md         German

lib/
├── config.ts               All shop configuration (packages, badges, news popup, etc.)
├── markdown.ts             Markdown → HTML renderer (tables, lists, links, code)
├── rateLimit.ts            In-memory rate limiter for API routes
├── tebex.ts                Tebex API client (read-only calls)
└── useCart.ts              Cart hook (auth flow, basket management)

store/
├── cart.ts                 Zustand store (persisted to localStorage)
└── salePrices.ts           Sale price store

public/
├── logo.png                Shop logo
├── favicon.ico
├── maintenance.html        Maintenance page (serve via Apache when needed)
└── *.png                   Custom package banner images
```

---

## Configuration

All shop configuration lives in **`lib/config.ts`**:

```ts
// Which Tebex packages appear on the homepage
export const FEATURED_PACKAGE_IDS = [5301828, 6446947]

// Multiple badges per package (esx | qb | standalone | js | lua)
export const PACKAGE_BADGES: Record<number, Badge[]> = {
  5301828: [{ label: 'ESX', variant: 'esx' }],
  6446947: [{ label: 'ESX', variant: 'esx' }, { label: 'QBCore', variant: 'qb' }],
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
  title: '🎉 New Release',
  text: 'Your news text here...',
  button: { label: 'View Package', href: '/packages/...' }, // or null
  secondButton: null,
}
```

**Custom packages** (non-Tebex) → **`content/custom-packages.ts`**

**Legal pages** → **`content/legal/*.md`** — plain Markdown, EN + DE versions

---

## CI/CD — Auto Deploy

Pushing to `main` automatically deploys via GitHub Actions:

1. Install dependencies (`npm ci`)
2. Build (`npm run build` with secrets injected)
3. Transfer build output to server via SCP
4. Write `.env.local` from GitHub Secrets
5. Install production deps, fix permissions, restart service

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `FTP_SERVER` | Server IP or hostname |
| `FTP_USERNAME` | SSH username (e.g. `root`) |
| `FTP_PASSWORD` | SSH password |
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
- Apache2 with `mod_proxy`, `mod_ssl`, `mod_rewrite`, `mod_headers`
- Let's Encrypt SSL certificate
- Debian / Ubuntu with systemd

### Steps

```bash
# 1. Clone
cd /opt
git clone https://github.com/MSK-Scripts/msk-shop.git msk-shop
cd msk-shop

# 2. Environment variables
cp .env.local.example .env.local
nano .env.local

# 3. Install & build
npm ci
npm run build

# 4. Permissions
chown -R www-data:www-data /opt/msk-shop
chmod -R u+w /opt/msk-shop/.next

# 5. systemd service
cp msk-shop.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable msk-shop
systemctl start msk-shop

# 6. Apache2
a2enmod proxy proxy_http rewrite ssl headers
# Copy your Apache config files (not included in repo — server-specific)
# See msk-shop.conf.example and msk-shop_ssl.conf.example
systemctl reload apache2
```

**.env.local:**
```env
NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN=your_public_token
NEXT_PUBLIC_TEBEX_PROJECT_ID=your_project_id
TEBEX_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_BASE_URL=https://www.msk-scripts.de
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
```

---

## Security

- **Private key** (`TEBEX_PRIVATE_KEY`) is never exposed to the client — all mutations go through Next.js API routes
- **Rate limiting** on basket creation (10 req/min per IP)
- **Path traversal protection** on markdown file reads (allowlist)
- **URL validation** — redirect URLs are always constructed server-side from `NEXT_PUBLIC_BASE_URL`
- **CSP headers** restrict script, style, font and connect sources
- **Debug route** (`/api/debug`) returns 404 in production

---

## Links

- 🌐 [msk-scripts.de](https://www.msk-scripts.de)
- 📖 [Documentation](https://docu.msk-scripts.de)
- 💬 [Discord](https://discord.gg/5hHSBRHvJE)
- 🐙 [GitHub / MSK-Scripts](https://github.com/MSK-Scripts)
