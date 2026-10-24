# Features

What the shop does and how the Ticket Bot tiers are defined. Back to the [README](../README.md).

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
- Server-side git deploy via GitHub Actions on push to `main`: CI-gated, applies database migrations, health-checked and rollback-capable (see [docs/DEPLOYMENT.md](DEPLOYMENT.md))

---

## Tiers (`lib/tiers.ts`)

This file is the single source of truth for all the limits. The tiers are `basic`, `premium`, `premium_plus` and `business`.

| Limit | basic | premium | premium_plus | business |
|---|---|---|---|---|
| Transcript max. | 10 MB | 50 MB | 100 MB | 200 MB |
| Attachments max. | none | 100 MB | 200 MB | 500 MB |
| Storage retention | 30 days | 180 days | 365 days | 10 years |
| Custom domain | no | yes | yes | yes |
| Bot hosting | no | no | yes | yes |
| Attachment downloads | no | yes | yes | yes |
| Remove branding | no | yes | yes | yes |
| Uploads / hour | 30 | 60 | 120 | 300 |

`getExpiresAt(tier)` derives the expiry date from `storageDays`.

Every paid tier carries every perk, so code that gates on one asks
`tier !== 'basic'` instead of listing tiers. Enumerating them is how `business`
lost the dashboard shortcut in the verify flow when it was introduced.
