# Security Policy

## Reporting a Vulnerability

The preferred way to report a vulnerability is the **"Report a vulnerability"**
button under the **Security** tab of this GitHub repository. This opens a private
channel between you and the maintainers.

If you are unable to use GitHub's private reporting, email **info@msk-scripts.de**.
Please do **not** open a public issue for security problems.

We aim to acknowledge reports within a few days and to keep you updated through
remediation.

## Supported Versions

Only the latest version (deployed at <https://www.msk-scripts.de>) receives
security updates. There are no maintained older release branches.

| Version          | Supported |
|------------------|-----------|
| Latest (`main`)  | ✅        |
| Older            | ❌        |

## Implemented Security Measures

| Area | Implementation |
|---|---|
| Secrets | `TEBEX_PRIVATE_KEY`, DB / OAuth / webhook secrets are **server-only** (never shipped to the client). All Tebex basket mutations go through internal `/api/basket/*` routes. |
| Session cookies | Signed with HMAC-SHA256 (`SESSION_SECRET`), `HttpOnly` + `Secure` + `SameSite=Lax`. Signature verification is constant-time (`crypto.timingSafeEqual`) in `lib/session.ts` + `lib/dashboardSession.ts`. |
| CSRF | OAuth flows use a random `state` token; redirect URLs are always constructed server-side from `NEXT_PUBLIC_BASE_URL`. |
| Rate limiting | In-memory per-IP limiter (`lib/rateLimit.ts`) for basket / API-key endpoints, plus DB-side per-API-key limits (`ticketbot_rate_limits`). |
| Content Security Policy | Per-request cryptographic **nonce** + `'strict-dynamic'`; no `'unsafe-inline'`/`'unsafe-eval'` in `script-src` or `style-src`; `default-src 'none'` (deny by default). Set centrally in `middleware.ts` (Edge runtime). |
| HTTP headers | HSTS (2 years, `includeSubDomains; preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy: same-origin`. The HTTP/CSP hardening targets an **A+** rating on Mozilla Observatory. |
| Input / path traversal | Allowlist-based file reads for the legal markdown content; no user input in file paths. |
| API authentication | Transcript uploads require an API key; the `guild_id` is always resolved from the DB, never taken from the request body. |
| File uploads (transcripts) | Strict **extension allowlist** (no `html` / `svg` / `php`); files are written as `<uuid>.<ext>`, so attacker-controlled names, multi-extensions and path traversal cannot reach the web root. **Image attachments are decoded and re-encoded via `sharp`** (strips polyglots / payloads / metadata and rejects non-images). Per-tier size limits. |
| Static file serving | Custom-domain transcript vhosts are locked down: `Options -Indexes`, `Require all denied` by default, a `FilesMatch` extension allowlist, no PHP handler. |
| Deployment | Server-side git deploy driven by an SSH key pinned with `ForceCommand` (can only run `deploy.sh`) and strict known-hosts checking. Operational scripts stay `root:root` (not writable by the app user), so the app user's `sudo` rights cannot be abused for privilege escalation. |
| Debug endpoint | `/api/debug` returns `404` in production. |
| Webhooks | The GitHub Sponsors webhook is verified via HMAC-SHA256. |

## Known, Accepted Findings

- **CodeQL `js/http-to-file-access` on the transcript upload route.** Persisting
  uploaded bytes is the purpose of the attachment-hosting feature, so the
  "network data written to file" data flow is intrinsic and cannot be removed
  without dropping the feature. The exploitable vectors are mitigated in depth
  (API-key auth with the `guild_id` from the DB, server-controlled `<uuid>.<ext>`
  paths, extension allowlist, `sharp` re-encoding of images, per-tier size
  limits, and locked-down Apache serving). Dismissed as **"won't fix"** with a
  documented justification.
