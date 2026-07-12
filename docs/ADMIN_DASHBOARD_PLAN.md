# Admin Dashboard — Implementation Plan

> Self-hosted Tebex admin dashboard on the shop website. Discord login + own
> Discord-ID team/permission system, managing the Tebex store via the Plugin API
> without logging into the Tebex control panel.
>
> API capabilities and hard limits: see [TEBEX_API_REFERENCE.md](./TEBEX_API_REFERENCE.md).

## Decisions (locked)

- **Login:** dedicated Discord admin OAuth app (`DISCORD_ADMIN_CLIENT_ID` /
  `DISCORD_ADMIN_CLIENT_SECRET`, scope `identify`, redirect `/api/admin/auth/callback`).
  Separate from the customer verify flow.
- **Permissions:** full 8-permission list, set per member, plus an `is_owner`
  allow-everything flag.

## Architecture

```
Discord login ──> signed admin session (msk_admin_session cookie)
      │
      ▼
Discord-ID allowlist + permissions (our MariaDB)   ← OUR team system
      │
      ▼ (server-side only, permission-gated per action, audited)
Plugin API (plugin.tebex.io, X-Tebex-Secret)       ← Tebex actions
```

The Plugin secret grants full, unscoped access, so it lives server-side only and every
mutation is gated by our own per-Discord-ID permission check and written to an audit log.

## Permissions

| Permission | Allows |
|---|---|
| `payments.view` | View payments + player/purchase lookups |
| `payments.create` | Give a free package (`POST /payments`, `price:0`) |
| `payments.refund` | Refund / chargeback (`PUT /payments/{txn}`) |
| `coupons.manage` | Create / delete coupons |
| `giftcards.manage` | Gift cards CRUD |
| `bans.manage` | Create / list bans |
| `packages.edit` | Edit package name / price / disabled |
| `team.manage` | Manage team members + permissions (owner-level) |

`is_owner = 1` implies all permissions and cannot be stripped by others.

## Data model (`database/schema.sql`)

- `msk_admin_team` — `discord_user_id` PK, `display_name`, `is_owner`, `permissions` (JSON
  array of the strings above), `active`, `created_at`, `created_by`.
- `msk_admin_audit` — append-only log of every write action (`discord_user_id`, `action`,
  `target`, `detail` JSON, `created_at`).

Owner is seeded once from `ADMIN_OWNER_DISCORD_ID`.

## Files

**Foundation (Phase 1 — done):**
- `lib/adminSession.ts` — signed `AdminSession { discordUserId }`, cookie `msk_admin_session`
- `lib/adminPerms.ts` — permission constants, labels, `AdminTeamMember`, `memberHasPermission`
- `lib/adminAuth.ts` — `loadAdminMember()` (DB, live), `authorizeAdmin(token, perm)` → 200/401/403
- `lib/adminAudit.ts` — `writeAudit()`
- `lib/tebexPlugin.ts` — server-only Plugin API client (payments, coupons, giftCards, bans, packages, lookup)
- `database/schema.sql` — the two tables + indexes + owner-seed comment
- `.env.example` — `TEBEX_PLUGIN_SECRET`, `DISCORD_ADMIN_*`, `ADMIN_OWNER_DISCORD_ID`

**Auth (Phase 2):**
- `app/api/admin/auth/route.ts` — start Discord OAuth (state cookie via `generateState()`)
- `app/api/admin/auth/callback/route.ts` — exchange code, check allowlist, set session
- `app/api/admin/logout/route.ts`
- `app/admin/page.tsx` (force-dynamic) + `AdminClient.tsx` shell with login gate

**Features (Phase 3 read-only, Phase 4 writes):**
```
app/api/admin/
├── payments/route.ts            GET list · POST createManual (price 0 = free)
├── payments/[txn]/route.ts      GET · PATCH status (refund/chargeback) · POST note
├── coupons/route.ts             GET · POST
├── coupons/[id]/route.ts        DELETE
├── giftcards/route.ts           GET · POST
├── giftcards/[id]/route.ts      PUT topup · DELETE void
├── bans/route.ts                GET · POST
├── packages/[id]/route.ts       PUT (name/price/disabled)
├── lookup/route.ts              GET user + purchases
└── team/route.ts                GET/POST/PATCH/DELETE (team.manage)
```
Every write route: `authorizeAdmin` → rate limit (`lib/rateLimit.ts` + `getClientIp`) →
Plugin call → `writeAudit`.

**UI (Phase 5):** `AdminClient.tsx` tab layout (same hand-rolled tabs as the ticketbot
dashboard). Tabs shown per permission. Audit-log tab read-only.

## Route auth pattern

```ts
const token  = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
const auth   = await authorizeAdmin(token, 'coupons.manage');
if (!auth.ok) return NextResponse.json({ error: '...' }, { status: auth.status });
// ... auth.member is the AdminTeamMember
await writeAudit(auth.member.discordUserId, 'coupon.create', code, { ... });
```

## Security checklist

- Plugin secret only in `lib/tebexPlugin.ts`, never client-side
- Every write route: session + permission + rate limit + audit
- Permissions read live from DB (revocation is instant, nothing baked into the session)
- `/admin` + `/api/admin/*` force-dynamic (no router-cache of auth decisions)
- Owner cannot remove their own owner flag / lock themselves out (guard in team route)
- OAuth `state` cookie cleared on all callback error paths

## Manual prerequisites before go-live

1. Create the Discord admin OAuth app; set `DISCORD_ADMIN_*` in `/opt/msk-shop/.env.local`;
   add redirect `https://www.msk-scripts.de/api/admin/auth/callback`.
2. Get the Plugin secret from `creator.tebex.io/game-servers` → `TEBEX_PLUGIN_SECRET`.
3. Set `ADMIN_OWNER_DISCORD_ID` and run the schema migration (creates tables + seeds owner).
4. Confirm whether the manual-payment endpoint needs Tebex support enablement (test call).

## Phases

1. Foundation (libs + schema + env) — testable as pure code
2. Discord admin login + `/admin` shell
3. Read-only features (payments/lookups) — validates the Plugin key at low risk
4. Write features (free package, refund, coupons, gift cards, bans, package edit)
5. Team management + audit-log UI
6. `tsc --noEmit` + prod build + live test against the real Plugin API
