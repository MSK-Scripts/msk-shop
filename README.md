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
| State | Zustand 5 (persisted) |
| Payments | Tebex Headless API |
| Auth | CFX.re (FiveM) + Discord OAuth via Tebex |
| Server | Debian + Apache2 reverse proxy + systemd |

---

## Features

- 🛒 Full shopping cart with persistent state
- 🔐 FiveM (CFX.re) authentication via Tebex
- 💬 Discord OAuth for role assignment after purchase
- 🎁 Gift packages with optional recipient Discord ID
- 🏷️ Coupon code support
- 🔖 Custom badges, tags and descriptions per package
- 📦 Custom packages section (Discord Bots, GitHub, etc.)
- 📄 Markdown-based legal pages (editable without code)
- 🟢 Live Discord online member count
- 🌐 Apache2 reverse proxy with security headers
- 🔧 Maintenance page included

---

## Project Structure

```
app/                    Next.js App Router pages & API routes
├── api/basket/         Tebex basket API proxy (keeps private key server-side)
├── api/discord/        Discord online count endpoint
├── auth/discord/       Discord OAuth callback handler
├── categories/[id]/    Category pages
├── packages/[id]/      Package detail pages
├── cart/               Cart page
├── checkout/           Checkout redirect
└── terms/              Legal pages (Impressum, Privacy, T&C)

components/
├── layout/             Navbar, Footer
├── packages/           PackageCard, AddToCartButton
├── cart/               CartDrawer
├── home/               Hero, InfoSection, CTASection, Divider
└── ui/                 DiscordButton

content/
├── custom-packages.ts  Custom packages config (Discord Bots, GitHub, etc.)
└── legal/              Markdown files for legal pages (editable without code)
    ├── impressum.md
    ├── privacy.md
    └── terms.md

lib/
├── config.ts           Featured packages, badges, tags, descriptions
├── tebex.ts            Tebex API client
├── useCart.ts          Cart hook with full auth flow
└── markdown.ts         Markdown renderer for legal pages

store/
└── cart.ts             Zustand store (persisted to localStorage)
```

---

## Configuration

All shop configuration is in **`lib/config.ts`** — no code knowledge needed for common changes:

```ts
// Which Tebex packages appear on the homepage
export const FEATURED_PACKAGE_IDS = [5301828, 6446947]

// Badges per package (esx | qb | standalone | js | lua)
export const PACKAGE_BADGES = {
  5301828: [{ label: 'ESX', variant: 'esx' }, { label: 'Lua', variant: 'lua' }],
}

// Short description shown on package cards
export const PACKAGE_DESCRIPTIONS = {
  5301828: 'Realistic handcuffs with animations, props, drag and more.',
}

// Tags shown on package cards
export const PACKAGE_TAGS = {
  5301828: ['msk_core', 'pma-voice'],
}
```

Custom packages (non-Tebex) are configured in **`content/custom-packages.ts`**.

Legal pages can be edited directly in **`content/legal/*.md`** — plain Markdown, no code required.

---

## Installation

### Requirements

- Node.js 20.x
- npm
- Apache2 with `mod_proxy`, `mod_ssl`, `mod_rewrite`, `mod_headers`
- Let's Encrypt SSL certificate
- Debian / Ubuntu with systemd

---

### 1. Clone the repository

```bash
cd /opt
git clone https://github.com/MSK-Scripts/msk-shop.git msk-shop
cd msk-shop
```

---

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
nano .env.local
```

```env
NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN=your_public_token
NEXT_PUBLIC_TEBEX_PROJECT_ID=your_project_id
TEBEX_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_BASE_URL=https://www.msk-scripts.de
```

> ⚠️ Never commit `.env.local` — it is in `.gitignore`.

---

### 3. Install dependencies & build

```bash
npm install
npm run build
```

---

### 4. Set permissions

```bash
chown -R www-data:www-data /opt/msk-shop
chmod -R 755 /opt/msk-shop
```

---

### 5. Set up systemd service

```bash
cp /opt/msk-shop/msk-shop.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable msk-shop
systemctl start msk-shop
systemctl status msk-shop
```

---

### 6. Configure Apache2

```bash
a2enmod proxy proxy_http rewrite ssl headers

cp /opt/msk-shop/msk-shop.apache.conf /etc/apache2/sites-available/msk-shop.conf
a2ensite msk-shop.conf

# Get SSL certificate if not already done
apt install certbot python3-certbot-apache
certbot --apache -d msk-scripts.de -d www.msk-scripts.de

systemctl reload apache2
```

---

### 7. Done

Visit `https://www.msk-scripts.de` — the shop should be live.

---

## Updating

```bash
cd /opt/msk-shop
git pull
npm install
npm run build
systemctl restart msk-shop
```

---

## Troubleshooting

```bash
# Next.js logs
journalctl -u msk-shop -f

# Apache error log
tail -f /var/log/apache2/msk-shop-error.log

# Restart everything
systemctl restart msk-shop
systemctl reload apache2
```

---

## Links

- 🌐 [msk-scripts.de](https://www.msk-scripts.de)
- 📖 [Documentation](https://docu.msk-scripts.de)
- 💬 [Discord](https://discord.gg/5hHSBRHvJE)
- 🐙 [GitHub / MSK-Scripts](https://github.com/MSK-Scripts)
