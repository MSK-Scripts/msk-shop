# Tebex API Reference

> Complete reference of every Tebex **HTTP API** relevant for building integrations
> and a self-hosted admin dashboard. Compiled from the official docs at
> <https://docs.tebex.io> (Plugin API, Headless API, Checkout API, Game Server API,
> Affiliate API, Webhooks). Frontend/SDK surfaces (Tebex.js, Twig templates, Unity,
> Unreal) are intentionally out of scope.
>
> **Purpose in this repo:** groundwork for an admin dashboard on the shop website
> (Discord login + own Discord-ID team/permission system) that manages the Tebex store
> without logging into the Tebex control panel. Read the "Admin dashboard implications"
> section at the end first.

---

## 0. The 5 Tebex HTTP APIs at a glance

| API | Base URL | Auth | Purpose |
|---|---|---|---|
| **Headless API** | `https://headless.tebex.io/api/accounts/{token}` | Public Token in path + Private Key (HTTP Basic, only for user-specific calls) | Storefront: read catalog + build baskets + send to checkout. **Already used by this shop.** |
| **Plugin API** | `https://plugin.tebex.io` | `X-Tebex-Secret` header (game-server secret key) | Command execution + operational management (payments, coupons, gift cards, bans, packages) |
| **Checkout API** | `https://checkout.tebex.io/api` | HTTP Basic: Project ID + Private Key | Ad-hoc products with **dynamic price**, no pre-defined package |
| **Game Server API** | plugin host (see notes) | `X-Tebex-Secret` header | Pure command execution, consumed by the official server plugins |
| **Affiliate API** | `https://affiliate.tebex.io/api` | `Authorization: Bearer <key>` | Hosting-partner one-click setup only, not relevant to this shop |

**Key facts about auth model:**
- There is **no** GraphQL or OAuth-based "creator/admin API". Every key is a static secret with full access, no scoping, no per-user login.
- Store management (create/delete packages, categories, store settings, design, gateways, team accounts) is **not exposed by any API**. It stays in the Tebex Creator Panel.
- Team members can only be added by **email invitation** in the panel. No API, no Discord ID. Any Discord-ID team/permission system must be built on our side.

---

## 1. Plugin API (`plugin.tebex.io`)

The most important API for an admin dashboard. Primarily a game-server command API, but
also exposes operational management endpoints.

### 1.1 Basics

| Aspect | Value |
|---|---|
| Base URL | `https://plugin.tebex.io/` |
| RPC base | `https://plugin.tebex.io/rpc/` (trailing slash required) |
| Transport | HTTPS mandatory |
| Auth header | `X-Tebex-Secret: <game-server-secret-key>` on every request |
| Key source | `https://creator.tebex.io/game-servers` -> server -> Edit |
| Invalid key | `403 Forbidden` |
| **Rate limit** | **500 requests / 5 minutes per secret key** (status/headers on breach not documented, treat defensively as `429`) |
| Errors | JSON with standard HTTP codes; field `error_message` is user-friendly and safe to show to clients |

**RPC** (`POST /rpc/`) is only a transport wrapper for frameworks that cannot send
PUT/DELETE. Body: `method` (HTTP verb string), `params` (`SecretKey`, `Path`, optional
`Body`). It rebuilds the real REST call internally. No extra functionality.

### 1.2 Endpoints

All require `X-Tebex-Secret`. Base `https://plugin.tebex.io`.

#### Information
- `GET /information` -> `account { id, domain, name, currency{iso_4217, symbol}, online_mode, game_type, log_events }`, `server { id, name }`. **READ.**

#### Command Queue
- `GET /queue` -> `meta { execute_offline, next_check (int seconds), more }`, `players[] { id, name, uuid }`
- `GET /queue/offline-commands` -> `commands[] { id, command, payment, package, conditions.delay, player }`
- `GET /queue/online-commands/{player-id}` -> `commands[] { id, command, payment, package, conditions.delay, conditions.slots }`
- `DELETE /queue` -> body `ids` (array, required) -> `204`
- **READ + DELETE.**

#### Listing
- `GET /listing` -> **DEPRECATED.** Use the Headless API to display categories/products.

#### Packages
- `GET /packages` -> **DEPRECATED**
- `GET /package/{package}` -> **DEPRECATED**
- `PUT /package/{package}` -> **ACTIVE.** Body: `disabled` (bool), `name` (string), `price` (int) -> `204`
- **UPDATE only, limited to 3 fields. No create, no delete, no description/images/category.**

#### Community Goals
- `GET /community_goals`, `GET /community_goals/{id}` -> fields `id, created_at, updated_at, account, name, description, image, target, current, repeatable, last_achieved, times_achieved, status, sale`
- **READ only.**

#### Payments (operationally the richest area)
- `GET /payments?limit={n}` -> list
- `GET /payments?paged=1&page={n}` -> paginated `{ total, per_page, current_page, last_page, next_page_url, prev_page_url, from, to, data }`
- `GET /payments/{transaction}` -> single payment
- `GET /payments/fields/{package}` -> required fields for a payment against a package
- `POST /payments` -> **create manual payment.** Body: `note`, `packages[]` (each `id`, `options`), `price`, `ign`. **`price: 0` gives a package for free.**
- `PUT /payments/{transaction}` -> body `username`, `status` (`complete` / `chargeback` / `refund`)
- `POST /payments/{transaction}/note` -> body `note`
- Payment object: `id, amount, date, currency{iso_4217, symbol}, gateway{id, name}, status, email, player{id, name, uuid}, packages{id, name}, notes, creator_code`
- **CREATE + READ + UPDATE. No delete.**

#### Checkout
- `POST /checkout` -> body `package_id` (string), `username` (string) -> `201 { url, expires (ISO 8601) }`. Adds a package to the player's basket and returns a pay URL. **CREATE.**

#### Gift Cards (full lifecycle)
- `GET /gift-cards`, `GET /gift-cards/{id}`, `GET /gift-cards/lookup/{code}`
- `POST /gift-cards` -> body `amount` (number, required), `expires_at` (`yyyy-mm-dd hh:mm:ss`, opt), `note` (opt)
- `PUT /gift-cards/{id}` -> body `amount` (string, required) — top up balance
- `DELETE /gift-cards/{id}` -> void/disable
- Object: `id, code, balance{starting, remaining, currency}, note, void`
- **CREATE + READ + UPDATE + DELETE.**

#### Coupons
- `GET /coupons` -> paginated `{ totalResults, currentPage, lastPage, previous, next }`
- `GET /coupons/{id}`
- `POST /coupons` -> body: `code`, `effective_on` (`package`/`category`/`cart`), `packages[]`, `categories[]`, `discount_type` (`percentage`/`value`), `discount_amount` (int), `discount_percentage` (int), `redeem_unlimited` (bool), `expire_never` (bool), `expire_limit` (number), `expire_date` (`yyyy-mm-dd`), `start_date` (`yyyy-mm-dd`), `basket_type` (`single`/`subscription`/`both`), `minimum` (number), `discount_application_method` (0/1/2), `username`, `note`
- `DELETE /coupons/{id}`
- Object: `id, code, effective{type, packages, categories}, discount{type, percentage, value}, expire{redeem_unlimited, expire_never, limit, date}, basket_type, start_date, user_limit, minimum, username, note, discount_application_method`
- **CREATE + READ + DELETE. No update (delete + recreate).**

#### Bans
- `GET /bans` -> `id, time, ip, payment_email, reason, user{ign, uuid}`
- `POST /bans` -> body `reason` (string), `ip` (string), `user` (string, username or UUID)
- **CREATE + READ. No unban via API.**

#### Sales
- `GET /sales` -> `data[] { id, name, effective{type (package/category), packages[], categories[]}, discount{type (percentage), percentage, value}, start (unix), expire (unix), order }`
- **READ only. Cannot create sales via API.**

#### Player Lookup
- `GET /user/{user}` (UUID or username) -> `player{id, username, meta, plugin_username_id}, banCount, chargebackRate, payments[]{txn_id, time (unix), price, currency, status}, purchaseTotals{}`
- **READ.**

#### Customer Purchases
- `GET /player/{id}/packages?package={id}` -> `[{ txn_id, date (ISO 8601), quantity, package{id, name} }]` (optional `package` filter to check ownership)
- **READ.**

### 1.3 Plugin API capability summary

**Manageable:** payments (create manual / free, set status, refund, notes), gift cards
(full CRUD), coupons (create/read/delete), bans (create/read), package name+price+visibility,
command queue, player/purchase lookups.

**Not possible:** create/delete packages, any category management, create sales, store
settings, gateways, webhooks config, team accounts, subscriptions management, creator-code
management, unban, edit coupon.

---

## 2. Headless API (`headless.tebex.io`)

Customer-facing commerce API. **Read catalog + build baskets only.** This is what
`lib/tebex.ts` and `/api/basket/*` already use.

### 2.1 Basics

| Aspect | Value |
|---|---|
| Base URL | `https://headless.tebex.io/api/accounts/{token}` (Public Token is in the path) |
| Auth | HTTP Basic: username = Public Token, password = Private Key. **Only needed for user-specific data and `PATCH /tiers`.** Most endpoints need no auth. |
| Private Key | Full account access. Never client-side. Source: `creator.tebex.io/developers/api-keys` |
| Errors | RFC-9457 Problem Details (`type, title, detail, instance`) |
| Sandbox | None. Use Test Mode (Settings -> Checkout -> Test Mode); produces real records + webhooks |

### 2.2 Endpoints

**READ (catalog, no auth, idempotent):**
- `GET /` -> webstore info
- `GET /pages` -> custom CMS pages (HTML `content`)
- `GET /categories` (`?includePackages=1`, `?basketIdent=`, `?usernameId=`)
- `GET /categories/{categoryId}`
- `GET /packages` (`?ipAddress=`, `?basketIdent=`; does not support dynamic categories)
- `GET /packages/{packageId}` (id or slug)
- `GET /sidebar`

**WRITE (basket mutations only, mostly no auth):**
- `POST /baskets` -> body `complete_url, cancel_url, custom, complete_auto_redirect, ip_address`
- `GET /baskets/{basketIdent}`
- `GET /baskets/{basketIdent}/auth?returnUrl=` -> auth provider URLs (CFX.re/Discord/Steam)
- `POST /{basketIdent}/packages` -> `package_id, quantity, dynamic, variable_data, custom, target_username[_id]` (gifting)
- `POST /{basketIdent}/packages/remove` -> `package_id` (removes fully, not decrement)
- `PUT /{basketIdent}/packages/{packageId}` -> `quantity` (**user must be logged in**)
- `PUT /baskets/{basketIdent}/dynamic-packages`
- `POST /baskets/{basketIdent}/coupons` + `/remove` -> `coupon_code`
- `POST /baskets/{basketIdent}/giftcards` + `/remove` -> `card_number`
- `POST /baskets/{basketIdent}/creator-codes` + `/remove` -> `creator_code`

**WRITE (subscription tier, auth + special enablement):**
- `PATCH /tiers/{tierId}` -> body `package_id`. Switches a **customer's** subscription tier
  (upgrade/downgrade within a tiered category), processes payment immediately, fires
  `recurring_payment_updated` webhook. **Must be enabled by Tebex support.** This is
  customer subscription management, NOT store management.

### 2.3 Package object fields

`id, name, description, image, type, category{id,name}, base_price, sales_tax, total_price,
currency, prorate_price, discount, disable_quantity, disable_gifting, expiration_date,
media[{type,name,url,featured,primary}], order, slug, user_limit, creator_meta_data,
options, variables, created_at, updated_at`

> Note on sale display: Tebex reports a user-specific sale via `base_price` (post-discount),
> `discount` (amount), `total_price` (payable). Original price = `base_price + discount`.
> See `lib/price.ts` (`resolveDisplayPrice`).

### 2.4 Headless API capability summary

**Read catalog + build baskets + send to checkout.** No endpoint creates/edits/deletes
packages, categories, prices, coupons, gift cards or settings. All POST/PUT/PATCH mutate a
**basket** or a customer's subscription tier, never the store catalog. **Not an admin API.**

---

## 3. Checkout API (`checkout.tebex.io`)

Lets creators use Tebex as merchant-of-record **without a webstore**, with **ad-hoc
products at dynamic prices** defined inline per request.

> **BLOCKER for FiveM:** "Using the Checkout API requires prior approval from our compliance
> teams" and it is **not available for certain UGC creators on platforms like FiveM or RedM.**
> Must be cleared with Tebex before relying on it for msk-scripts.

### 3.1 Basics

| Aspect | Value |
|---|---|
| Base URL | `https://checkout.tebex.io/api` |
| Auth | HTTP Basic: username = **Project ID**, password = **Private Key** (`creator.tebex.io/developers/api-keys`) |
| Headers | `Authorization: Basic base64(projectId:privateKey)`, `Content-Type: application/json` |
| Errors | RFC 7807 (`type, title, status, detail, instance`); 400 validation, 401/403 auth, 404, 5xx |

Two approaches: **Direct Checkout** (everything in one `/checkout` call) or **Managed
Basket** (create basket, add packages/sales, redirect, verify payment).

### 3.2 Endpoints

- `GET /baskets/{ident}` -> basket object (`ident, expire, price, priceDetails{...}, rows[], links{payment, checkout}`, etc.)
- `POST /baskets` -> body `return_url, complete_url, custom, first_name, last_name, email, complete_auto_redirect, country, creator_code, ip`
- `POST /baskets/{ident}/packages` -> body `package{ name, price, type (single|subscription), qty, expiry_period, expiry_length, custom }, qty, type, revenue_share[{wallet_ref, amount, gateway_fee_percent}]`. **Ad-hoc price lives here.**
- `DELETE /baskets/{ident}/packages/{rows.id}` -> `204`
- `POST /baskets/{ident}/sales` -> body `name, discount_type (percentage), amount`
- `POST /checkout` -> body `basket{...}, items[{package{...}}], sale{...}` (all in one)
- `GET /payments/{txnId}?type=txn_id` (txn starts `tbx-`) -> full payment object
- `POST /payments/{txnId}/refund?type=txn_id`
- `GET /recurring-payments/{reference}`
- `PUT /recurring-payments/{reference}/status` -> body `status` (e.g. `Paused`), `paused_until`
- `PUT /baskets/{ident}` -> body `country, name, state_id, first_name, last_name, postal_code, creator_code, complete_auto_redirect, expires_at`

Redirect to checkout: `https://pay.tebex.io/{ident}` (equals `links.checkout`). Embedded via
Tebex.js keeps the customer on our site.

> **Warning:** once the customer starts payment, a copy of the basket is frozen as a pending
> payment. Later basket changes do not apply unless checkout is restarted.

---

## 4. Webhooks

Tebex sends webhooks after platform events. **Always verify that items/amounts in the
payload match what was expected** (especially with self-managed baskets).

### 4.1 Event types

`payment.completed`, `payment.declined`, `payment.refunded`,
`payment.dispute.opened|won|lost|closed`,
`recurring-payment.started|renewed|ended|cancellation.requested|cancellation.aborted`,
`validation.webhook` (handshake on endpoint creation).

### 4.2 Payload

```json
{ "id": "...", "type": "event.name", "date": "ISO 8601", "subject": { } }
```
`subject` holds event-specific data (payment object for payment events).

### 4.3 Signature verification (HMAC-SHA256, two-stage)

- Header: **`X-Signature`**
- Method: SHA256-hash the raw JSON body first, then HMAC-SHA256 that hash with the webhook
  secret as key.
- **Use the RAW body** (frameworks that auto-parse JSON break the signature).
- Secret source: Developers -> Webhooks -> Endpoints.

```javascript
const bodyHash = crypto.createHash('sha256').update(rawBody, 'utf-8').digest('hex');
const expected = crypto.createHmac('sha256', secret).update(bodyHash).digest('hex');
// compare `expected` to the X-Signature header (constant-time)
```

> This differs from the existing GitHub-Sponsors webhook, which HMACs the body directly.
> Tebex does SHA256 first, then HMAC.

### 4.4 Validation handshake

On endpoint creation Tebex sends `validation.webhook`. Respond `200` with JSON echoing the
`id`: `{ "id": "<same id>" }`. Answer all webhooks with 2XX.

### 4.5 IP allowlist

Payment webhooks come **only** from `18.209.80.3` and `54.87.231.232`. Reject other senders
(e.g. `404`).

### 4.6 Login webhooks (separate mechanism, no HMAC)

Player login verification. Tebex sends `GET` to your endpoint with query params `ign`, `ip`,
`country`. Respond JSON:
```json
{ "verified": true,  "message": "optional message" }
{ "verified": false, "error": "shown to the customer" }
```

---

## 5. Game Server API

Server-side interface consumed by the official game-server plugins to fetch and execute
commands (deliver item/rank after purchase). Reference: the official Minecraft plugin.

- Auth: `X-Tebex-Secret` (secret key from `creator.tebex.io/game-servers`), HTTPS only.
- Errors: JSON + standard codes; invalid key -> `403`; `error_message` is user-friendly.
- Base URL and full endpoint list are on subpages not enumerated in the overview.
- Official plugins/source: Tebex-Minecraft, Tebex-FiveM (`github.com/BuycraftPlugin/Tebex-FiveM`),
  Tebex-Oxide (Rust), Tebex-Ark, Tebex-Gmod, Tebex-Unturned, Tebex-RconAdapter, etc.

For most stores you never call this directly — the installed plugin handles it. The Plugin
API's command-queue endpoints are the operational counterpart.

---

## 6. Affiliate API (`affiliate.tebex.io/api`) — not relevant here

Only for approved hosting partners offering one-click Tebex setup in server panels.

- Auth: `Authorization: Bearer <key>` + `Accept: application/json` (key from `affiliate.tebex.io/settings`)
- `POST /api/referrals` -> `link, reference, game_type_id, server_name, email, first_name, last_name` -> `{reference, secret, game_type.id, setup_at}`
- `GET /api/referrals/:reference`
- `GET /api/referrals/:reference/config/:platform`
- `GET /api/game-types` -> `data[{id, name}]`
- Webhook: server-setup notification, header `X-Tebex-Signature`, HMAC-SHA256 over raw body
  (single-stage, unlike the payment webhooks).

---

## 7. Official SDKs

| Language | Package |
|---|---|
| PHP | `tebex/tebex-sdk-php` (Packagist) |
| Node.js | `@tebexio/tebex-sdk-nodejs` (npm) |
| C# | `github.com/tebexio/Tebex-CSharp` |

Cover Headless API, Checkout API and Webhooks. Do **not** cover Game Server or Affiliate API.

---

## 8. Admin dashboard implications (this project)

Goal: an admin dashboard on the shop website, Discord login, own Discord-ID team/permission
system, managing Tebex without the Tebex panel.

### What is buildable

Operational cockpit via the **Plugin API** (server-side proxy, secret key never client-side,
gated per Discord ID like the msk_garage admin):

- **Payments:** list/inspect, create manual payment, **give a package for free** (`POST /payments`, `price: 0`), set status refund/chargeback/complete, add notes
- **Gift cards:** full CRUD (create, top up, void)
- **Coupons:** create / list / delete (no edit)
- **Bans:** create / list (no unban)
- **Packages:** edit name / price / visibility only
- **Lookups:** player profile, ban count, chargeback rate, purchase history / ownership check
- **Webhooks:** react live to purchases/refunds (two-stage HMAC, IP allowlist)
- **Discord login + Discord-ID role/permission system:** built entirely on our side (Tebex
  knows nothing about it)

### What is NOT buildable via API (stays in the Creator Panel)

- Create/delete packages, any category management, store design, settings, gateways
- Create sales (read-only via API)
- Real Tebex team accounts (email invite only, no Discord ID)
- Edit coupons, unban players

### Security notes

- Every Tebex key (Plugin secret, Headless/Checkout private key) grants **full access, no
  scoping**. All calls must go through server-side routes; enforce our own per-Discord-ID
  permission gate on every action, or anyone with dashboard access can issue free packages /
  refunds.
- Follow the existing pattern: read-only calls can use the public token client-flow, all
  mutations proxied server-side (see `/api/basket/*`).
- Checkout API needs compliance approval and is restricted for FiveM/RedM UGC — verify with
  Tebex before depending on it.

---

*Compiled from the official Tebex documentation (docs.tebex.io). Verify request/response
shapes against the live docs before implementation; field lists reflect the docs at compile
time and may change.*
