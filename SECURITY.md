# Security Policy

## Reporting a Vulnerability

If you find a security problem, the best way to tell us is the **"Report a vulnerability"** button under the **Security** tab of this GitHub repository. That opens a private channel between you and the maintainers.

If GitHub's private reporting doesn't work for you, send an email to **info@msk-scripts.de** instead. Please don't open a public issue for anything security-related.

We try to get back to you within a few days and keep you posted while we work on a fix.

## Supported Versions

Only the current version, the one running at <https://www.msk-scripts.de>, gets security updates. There are no older release branches to maintain.

| Version          | Supported |
|------------------|-----------|
| Latest (`main`)  | yes       |
| Older            | no        |

## What's Already in Place

| Area | Implementation |
|---|---|
| Secrets | `TEBEX_PRIVATE_KEY`, `TEBEX_PLUGIN_SECRET` and the database, OAuth, Stripe, SMTP and webhook secrets are server-only and never shipped to the client. Every Tebex basket mutation runs through the internal `/api/basket/*` routes. On the server `.env.local` is `chmod 600`, enforced on every deploy. |
| Session cookies | Signed with HMAC-SHA256 (`SESSION_SECRET`), `HttpOnly`, `Secure` and `SameSite=Lax`. The dashboard, giveaway, admin, upload and bot-dashboard proxy sessions also carry a server-side expiry inside the signed payload, so an old cookie stops working even if a browser keeps it. Signature checks are constant-time (`crypto.timingSafeEqual`) in `lib/session.ts`, `lib/dashboardSession.ts`, `lib/giveawaySession.ts`, `lib/adminSession.ts`, `lib/uploadSession.ts` and `lib/botDashboardProxy.ts`. There is no fallback secret: a missing `SESSION_SECRET` fails at runtime instead of signing with a known value. |
| CSRF | OAuth flows use a random `state` token, and redirect URLs are always built server-side from `NEXT_PUBLIC_BASE_URL`. Admin mutations additionally require a matching `Origin`. |
| Rate limiting | An in-memory per-IP limiter (`lib/rateLimit.ts`, keyed on the rightmost `X-Forwarded-For` entry, which only Apache sets) on basket, domain, bot control, log and admin routes, plus a database-side per-API-key limit (`ticketbot_rate_limits`) and a daily per-account limit on gallery submissions. Expensive operations such as certificate issuance are limited separately from cheap checks. |
| Content Security Policy | A fresh cryptographic nonce per request plus `'strict-dynamic'`, no `'unsafe-inline'` or `'unsafe-eval'` in `script-src` or `style-src`, and `default-src 'none'` (deny by default). All of it is set in one place, in `proxy.ts` (called `middleware.ts` before Next 16 renamed the convention). |
| HTTP headers | HSTS (2 years, `includeSubDomains; preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy`, and `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy: same-origin`. The whole setup targets an A+ rating on Mozilla Observatory. The image CDN is a separate vhost that deliberately sends `Cross-Origin-Resource-Policy: cross-origin`, because its images are meant to be embedded elsewhere. |
| Input / path traversal | The legal Markdown content is read through an allowlist. Where a path is built from an identifier (guild directories, upload files), the identifier is validated first (Discord snowflakes against `^\d{17,20}$`, file names generated server-side as UUIDs). |
| HTML from Tebex | Package and category descriptions are passed through `sanitize-html` (`lib/sanitize.ts`) before rendering, as a second layer beneath the CSP. |
| API authentication | Transcript uploads need an API key, and the `guild_id` is always resolved from the database, never taken from the request body. |
| Dashboard authorization | The dashboard session is account-scoped (signed, Discord user id only). Every guild-scoped route (`bot-*`, `bot-hosting/*`, `domain/*`, `transcripts`, `stripe/*`) re-checks ownership with `WHERE guild_id = ? AND discord_user_id = ?` (`lib/dashboardAuth.ts`) before doing anything, so one account can't read or change another account's guild. Ownership is also re-checked against Discord: when the owner loses Administrator or Manage Server, access ends after a 14-day grace period. A guild is only marked as lost from a Discord guild list that was provably complete. |
| Admin dashboard | Every `/api/admin/*` route runs through `adminRoute()` (`lib/adminApi.ts`): valid admin session, the required permission loaded live from the database on each request (revocation is immediate), rate limit, `Origin` check on mutations, and an entry in `msk_admin_audit` for every write. The owner cannot be removed, and members cannot grant themselves new rights. |
| Payments (Stripe) | No card data is ever received or stored. Checkout and billing happen on Stripe's hosted pages, and we only keep the Stripe customer and subscription IDs. Checkout and portal sessions are created server-side and bound to a guild the account actually owns, with at most one live subscription per guild. |
| File uploads (transcripts) | A strict extension allowlist (no `html`, `svg` or `php`). Files are written as `<uuid>.<ext>`, so attacker-controlled names, double extensions and path traversal can't reach the web root. Image attachments are decoded and re-encoded through `sharp`, which strips polyglots, payloads and metadata and rejects anything that isn't an image. Size limits are per tier, and the request size is capped before the body is parsed. |
| File uploads (image gallery) | Submissions need a Discord login and an explicit rights declaration. `sharp` re-encodes every file on arrival (with an input pixel limit), so the quarantine only ever holds bytes we produced, never the submitted ones. The quarantine lives outside every web root (`UPLOAD_INBOX_PATH`, `chmod 700`), files are named by UUID, and nothing is published until a moderator with `images.moderate` approves it. |
| Hosted bots | A hosted bot's dashboard is never exposed directly: it listens on loopback only and is reached through its own vhost or through our authenticated proxy. The bot trusts only an identity passed with a shared secret and still resolves permissions from its own database. DNS writes through the IONOS API are restricted to one zone. |
| Static file serving | The custom-domain transcript vhosts are locked down: `Options -Indexes`, `Require all denied` by default, a `FilesMatch` extension allowlist, and no PHP handler. |
| Deployment | Server-side git deploy driven by an SSH key pinned with `ForceCommand`, so it can only ever run `deploy.sh`, with strict known-hosts checking. The operational scripts stay `root:root` and are not writable by the app user, so the app user's `sudo` rights can't be turned into a privilege escalation. Database migrations run as root over the local socket, so no database password is stored in the script, and migration file names must match a fixed pattern before they reach a query. |
| Dependencies | CI fails on any high-severity advisory in the production dependency tree (`npm audit --omit=dev --audit-level=high`). Dependabot opens weekly update PRs, and installation scripts of dependencies are not run unless explicitly allowed. |
| Debug endpoint | `/api/debug` returns `404` in production. |
| Webhooks | The Stripe webhook is verified with the Stripe signature (`constructEvent` over the raw body), and the handlers are idempotent ("set state to X", never "add to X"). |

## Known, Accepted Findings

These CodeQL alerts are dismissed with a justification on record. Each one describes a data flow that is the purpose of the feature, with the dangerous variants mitigated.

- **`js/http-to-file-access` on the transcript upload route.** Writing uploaded bytes to disk is the whole point of the attachment-hosting feature. Mitigated by API-key auth with the `guild_id` coming from the database, server-controlled `<uuid>.<ext>` paths, an extension allowlist, `sharp` re-encoding of images, per-tier size limits, and locked-down Apache serving. Dismissed as "won't fix".
- **`js/http-to-file-access` in `lib/botProvision.ts`.** Writing a hosted bot's `.env` from the setup form is intended. The guild id is validated as a snowflake before the path is built, values are quoted so a newline cannot inject a second key, the route requires session, ownership, tier and rate limit, and the file is `0600` in a `0700` directory.
- **`js/file-access-to-http` in `lib/botProvision.ts`.** The bot token is sent to the fixed host `discord.com` on purpose, that request is the membership check. Hardened anyway: an id that is not a snowflake skips the request, and the id is URL-encoded.
- **`js/xss-through-dom` in `app/images/upload/UploadClient.tsx`.** The preview is a browser-generated `blob:` URL from `URL.createObjectURL`, used as an `img` `src` that React escapes. Neither the file name nor its content reaches the value.
