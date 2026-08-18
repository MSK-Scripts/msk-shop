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
| Secrets | `TEBEX_PRIVATE_KEY` and the database, OAuth and webhook secrets are server-only and never shipped to the client. Every Tebex basket mutation runs through the internal `/api/basket/*` routes. |
| Session cookies | Signed with HMAC-SHA256 (`SESSION_SECRET`), `HttpOnly`, `Secure` and `SameSite=Lax`. Signature checks are constant-time (`crypto.timingSafeEqual`) in `lib/session.ts` and `lib/dashboardSession.ts`. |
| CSRF | OAuth flows use a random `state` token, and redirect URLs are always built server-side from `NEXT_PUBLIC_BASE_URL`. |
| Rate limiting | An in-memory per-IP limiter (`lib/rateLimit.ts`) on the basket and API-key endpoints, plus a database-side per-API-key limit (`ticketbot_rate_limits`). |
| Content Security Policy | A fresh cryptographic nonce per request plus `'strict-dynamic'`, no `'unsafe-inline'` or `'unsafe-eval'` in `script-src` or `style-src`, and `default-src 'none'` (deny by default). All of it is set in one place, in `proxy.ts` (Edge runtime, called `middleware.ts` before Next 16 renamed the convention). |
| HTTP headers | HSTS (2 years, `includeSubDomains; preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy`, and `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy: same-origin`. The whole setup targets an A+ rating on Mozilla Observatory. |
| Input / path traversal | The legal Markdown content is read through an allowlist, and no user input ever ends up in a file path. |
| API authentication | Transcript uploads need an API key, and the `guild_id` is always resolved from the database, never taken from the request body. |
| Dashboard authorization | The dashboard session is account-scoped (signed, Discord user id only). Every guild-scoped route (`bot-*`, `domain/*`, `transcripts`, `stripe/*`) re-checks ownership with `WHERE guild_id = ? AND discord_user_id = ?` (`lib/dashboardAuth.ts`) before doing anything, so one account can't read or change another account's guild. |
| Payments (Stripe) | No card data is ever received or stored. Checkout and billing happen on Stripe's hosted pages, and we only keep the Stripe customer and subscription IDs. Checkout and portal sessions are created server-side and bound to a guild the account actually owns. |
| File uploads (transcripts) | A strict extension allowlist (no `html`, `svg` or `php`). Files are written as `<uuid>.<ext>`, so attacker-controlled names, double extensions and path traversal can't reach the web root. Image attachments are decoded and re-encoded through `sharp`, which strips polyglots, payloads and metadata and rejects anything that isn't an image. Size limits are per tier. |
| Static file serving | The custom-domain transcript vhosts are locked down: `Options -Indexes`, `Require all denied` by default, a `FilesMatch` extension allowlist, and no PHP handler. |
| Deployment | Server-side git deploy driven by an SSH key pinned with `ForceCommand`, so it can only ever run `deploy.sh`, with strict known-hosts checking. The operational scripts stay `root:root` and are not writable by the app user, so the app user's `sudo` rights can't be turned into a privilege escalation. |
| Debug endpoint | `/api/debug` returns `404` in production. |
| Webhooks | The Stripe webhook is verified with the Stripe signature (`constructEvent` over the raw body), and the handlers are idempotent ("set state to X", never "add to X"). |

## Known, Accepted Findings

- **CodeQL `js/http-to-file-access` on the transcript upload route.** Writing uploaded bytes to disk is the whole point of the attachment-hosting feature, so the "network data written to file" data flow is baked in and can't be removed without dropping the feature. The vectors that would actually be dangerous are mitigated in depth: API-key auth with the `guild_id` coming from the database, server-controlled `<uuid>.<ext>` paths, an extension allowlist, `sharp` re-encoding of images, per-tier size limits, and locked-down Apache serving. Dismissed as "won't fix" with that justification on record.
