# Development

Stack, project layout, database, configuration, security architecture and styling, for anyone working on the code. Back to the [README](../README.md).

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
├── [lang]/                 Every page, once, under /en and /de (English folder names = /en paths)
│   ├── layout.tsx          Root layout of the shop, sets <html lang>
│   ├── [...rest]/          Catch-all: unknown addresses get the 404 inside the layout
│   ├── account/            User account page
│   ├── admin/              Admin dashboard (one *Tab.tsx per area, English UI in both languages)
│   ├── cart/, checkout/    Cart page, post-payment redirect handler
│   ├── fivem/              Package list, [id]/ detail pages, categories/[id]/
│   ├── discord/            ticket-bot/ (landing, compare/, stats/), giveaway-bot/ (landing, stats/, g/[token]/)
│   ├── dashboard/          ticket-bot/ and giveaway-bot/ dashboards, each with verify/
│   ├── tools/images/       Gallery: overview, [category]/, [category]/[name]/, upload/
│   ├── stats/              Resource statistics page (fivestats.io)
│   ├── legal/              terms/, imprint/, privacy/, withdrawal/, dpa/
│   ├── withdraw-contract/  Contract withdrawal form (§ 356a BGB)
│   ├── cancel-contract/    Contract cancellation form (§ 312k BGB)
│   ├── report/             DSA content report form
│   └── login/              Login page
├── auth/discord/           Tebex Discord return (own root layout, no language prefix)
├── botproxy/               Reverse proxy route for the hosted bot dashboard
├── llms.txt/               /llms.txt: map of the site for language models, built by lib/llms.ts
└── sitemap.xml/            Sitemap route (+ sitemap.xsl/, sitemap-images.xml/)

components/
├── bots/                   Ticket Bot and Giveaway Bot landing pages, comparison table
├── cart/                   Slide-in cart drawer
├── home/                   Homepage sections (Hero, ProofLine, Catalog, Bots, WebTools, FreeScripts, About)
├── i18n/                   LangProvider, LanguageDropdown, LocaleLink (internal path -> address of the page language)
├── icons/                  Local brand marks (GitHub and others)
├── images/                 Gallery cards, search, copy-URL button, brand notice
├── layout/                 Header (main nav, mobile menu, account menu), Footer, closing band, 404 page, payment marks
├── legal/                  Legal-text renderer
├── packages/               PackagePrice, AddToCartButton, PackageGallery
├── products/               Product card, catalogue filter, product page with buy box (Encrypted/Source), comparison table
├── theme/                  ThemeProvider + ThemeSwitch (system, light, dark)
├── ui/                     Button, Card, Badge, Container, Input, Skeleton, NewsPopup
└── BotConfigEditor.tsx     Hosted-bot panel: bot control and live log console. The name
                            is historic, the config editor moved into the bot itself

content/
├── custom-packages.ts      Non-Tebex packages (Discord bots, GitHub, etc.)
├── resource-stats.ts       Resource list for the /stats page
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
├── i18n.ts, lang.ts, serverLang.ts   Translations, language basics
├── routes.ts               Route table: public address per language, old addresses, proxy decision
├── seo.ts, pageSeo.ts, botSeo.ts, jsonLd.ts, sitemap.ts, llms.ts   Metadata, structured data, /llms.txt
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

A fresh database gets everything from `schema.sql`. Existing databases are updated through `database/migrations/NNN-name.sql`, which `scripts/deploy.sh` applies once each, in order, and records in `schema_migrations`. Migrations must be additive, because they run while the previous version is still serving. The rules are in [database/migrations/README.md](../database/migrations/README.md).

---

## Configuration

Most of the shop configuration lives in **`lib/config.ts`**:

```ts
// What the shop says about a product, keyed by its slug (see "Products" below)
export const PRODUCT_COPY: Record<string, ProductCopy> = {
  handcuffs: {
    summary: { en: 'Realistic handcuffs with …', de: 'Realistische Handschellen mit …' },
    seo: { en: { title: '…', description: '…' }, de: { title: '…', description: '…' } },
    frameworks: ['ESX', 'QBCore'],          // tags on the card, catalogue filter
    requires: ['msk_core', 'oxmysql'],      // "Requirements" on the product page
    optional: ['pma-voice or saltychat'],
  },
}

// News popup, shown on every full page load
export const NEWS_POPUP = {
  enabled: true,
  title: 'Discord Ticket Bot',
  text: 'Get your API Key now and create a ticket system for your community!',
  button: { label: 'Get API Key', href: '/dashboard/ticket-bot/verify' },
  secondButton: { label: 'Dashboard', href: '/dashboard/ticket-bot' },
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
- **SEO titles and descriptions** for pages, products and categories live in `lib/pageSeo.ts` and `lib/config.ts`, in both languages.

### Products

Tebex keeps every script twice, as an Encrypted and a Source package. The shop sells one product with the two as a choice on its page. `lib/products.ts` is the one place that groups them:

- The pairing comes from `content/resource-stats.ts` (the two package ids of every paid resource) and `SUBSCRIPTION_PACKAGE_IDS` in `lib/config.ts`. Nothing is maintained twice.
- The address is `/fivem/<slug>` in both languages. The slug of a script is its resource name without `msk_` (`msk_garage` is `/fivem/garage`); the subscription is `/fivem/all-access` (`/de/fivem/alle-scripts`).
- Old addresses with a Tebex id (`/en/fivem/5732588`, `/packages/5732588`) answer 308 to the product in one hop, with `?variant=source` when the id was the Source package. The canonical address never carries the variant.
- An unknown slug or id is answered by the proxy with the 404 page of its language and status 404, before a page renders.
- A package added in Tebex without an entry still gets a product: paired with a partner of the same Tebex slug stem (`radio-e`, `radio-s`), otherwise on its own, under a derived slug. The proxy asks Tebex (at most once a minute) for addresses the configured products do not know. Add the resource to `content/resource-stats.ts` and its copy to `PRODUCT_COPY` to give it a stable slug, a summary and requirements.

---

## Security

The short version, the full write-up is in [SECURITY.md](../SECURITY.md):

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

Everything is Tailwind CSS v4 (CSS-first). The design tokens are `@theme` variables (`--color-*`) in **`app/globals.css`**, and `tailwind.config.ts` only holds the content paths. The `.dark` scope (set by `next-themes`) overrides the tokens. MSK green (`--color-primary`) is the brand accent, `#27762e` in light mode and `#60b02f` in dark mode, both sampled from the logo. The design system is documented in [DESIGN.md](../DESIGN.md).

Fonts are Inter (`--font-sans`) and JetBrains Mono (`--font-mono`), fully self-hosted through `@fontsource-variable` (imported in `app/layout.tsx`, no `next/font/google`, so nothing gets fetched from Google).

There is a backward-compat layer in `globals.css` that keeps the old `msk-*` utility classes (`msk-btn-primary`, `msk-card`, `msk-input`, `msk-badge`, `msk-label` and friends) and the legacy token aliases (`bg`, `surface`, `border`, `accent`, `text` and so on) mapped onto the new `--color-*` tokens. That way code that hasn't been migrated yet (mainly `BotConfigEditor`) still renders correctly in both themes.

A couple of theme-specific styles also live in `globals.css`:

- `.tebex-description` makes the Tebex HTML (`dangerouslySetInnerHTML`) readable.
- `.legal-content` renders the Markdown legal pages (h1 to h3, lists, tables, code).
