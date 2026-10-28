# Admin dashboard

How each area of `/admin` works and what it cannot do. Every area links here from its
"Admin guide" link; the notes that used to stand above the tabs live here since Phase 10 of
the redesign. Back to [features](features.md).

The admin is English only for now (decision E3 of the redesign plan). Every string sits in
`adminTranslations` in `lib/i18n.ts`, so German is one more entry there.

## Access and permissions

- Sign-in through a Discord OAuth app of its own, allowlist in `msk_admin_team`, permissions
  read from the database on every request (`lib/adminAuth.ts`, `lib/adminApi.ts`).
- The sidebar lists every area. An area the person may not open stays in the list with a
  lock and the permission it needs, in words; its page shows that note and loads nothing.
  The routes behind it refuse on their own, exactly as before (`adminRoute`).
- Every write action and every reveal lands in the audit log (`msk_admin_audit`).

## Personal data: masking and reveal

Email and IP addresses leave the server masked (data minimisation and data protection by
design, Art. 5 (1) c and Art. 25 GDPR). Masking in the browser would not be masking: the full
value would still sit in the JSON and the network panel.

| Value | Masked form | Kept |
|---|---|---|
| Email | `m***@g***.com #3f9a` | first letter of name and domain, top-level domain |
| IPv4 | `192.168.x.x #3f9a` | first two octets |
| IPv6 | `2001:db8:x:x #3f9a` | first two groups |
| Ticket bot API key | `mskt_liv…2345` | first eight and last four characters |

`#3f9a` is the start of an HMAC of the whole value, keyed from `SESSION_SECRET`. The same
address keeps the same tag across rows, so an admin sees that two payments came from one
buyer; a list of known addresses cannot be checked against it offline. Fields named like an
address (`email`, `payment_email`, `ip`, …) are masked whatever they hold, and addresses inside
free text (a ban reason, a note, the detail of an audit entry) are found by pattern and checked
with `isIP`, so times and dates stay as they are. Code: `lib/adminMask.ts`.

Masked in: payments, bans, player lookup, gift cards, coupons, uploads, the image inventory and
the audit log. The overview sends only counts.

**Reveal.** A masked field in a row has a "Reveal" button. It calls `POST /api/admin/reveal`
with `{ kind, id, field }`:

| kind | field | permission (any of) |
|---|---|---|
| `payment` | `email` | `payments.view` |
| `ban` | `ip`, `email` | `bans.manage` |
| `apikey` | `apiKey` | `api_key.view`, `api_key.change` |

The route runs through `adminRoute` (session, membership, Origin check, the general limit of
30 requests per minute and IP), then a limit of its own of 20 reveals per admin in 10 minutes,
then kind, field and id against the allow-list in `lib/adminReveal.ts`, then the permission of
the area. An unknown record answers `403 Forbidden`, exactly like a missing permission. The
audit entry (`data.reveal`, target `kind:id`, detail `{ field }`, never the value) is written
before the value is sent; if it cannot be written, nothing is revealed. The value lives in the
state of its row only and is gone after "Hide", a reload or leaving the area.

Free text has no reveal: the record the address belongs to has its own field for that.

<a id="overview"></a>

## Overview

Revenue, payments and refunds of the last 30 days, new ticket bot API keys, and a list of what
needs a look (uploads waiting, images without a label, chargebacks), each only when it is not
zero and only for someone with the permission of its area. The Plugin API lists the latest 100
payments; when they reach back less than 30 days the revenue tile says so, and a trend is shown
only when the list reaches back 60 days. Route: `GET /api/admin/overview`.

<a id="payments"></a>

## Payments

The latest 100 payments, filtered by kind (paid, free, refunded, charged back) and period, with
the sum of the paid ones. "Give package" creates a manual payment in Tebex; price 0 gives it for
free. A refund exists only in the detail of a paid payment: the button names the amount, and the
confirmation asks for the transaction id. The Plugin API delivers no `tbx-…` id, only a numeric
one, and whether `PUT /payments/{id}` accepts it is unverified, because a refund cannot be undone.

<a id="lookup"></a>

## Player lookup

A player by CFX.re name or UUID: purchases, ban count and chargeback rate as Tebex reports them.

<a id="coupons"></a>

## Coupons

Tebex keeps every coupon ever issued (860 in August 2026, four of them usable), so the list shows
the usable ones unless asked for all. `GET /coupons` pages at 25 in no usable order, so the route
reads every page. A new coupon never expires and has no limit on uses; Tebex cannot edit a coupon,
only delete it. Rules: `lib/couponStatus.ts`.

<a id="giftcards"></a>

## Gift cards

Create, top up and void. Voiding cannot be undone in Tebex.

<a id="packages"></a>

## Packages

Only name, price and visibility can be changed through the Plugin API. Encrypted and Source of one
script stand in one row, grouped like the catalog (`groupProducts` in `lib/products.ts`). Only
changed fields are sent, because the Plugin API stores the price as an integer. Hidden packages
are not listed; show them again in the Tebex panel.

<a id="bans"></a>

## Bans

The Plugin API can create and list bans but cannot lift them; lift a ban in the Tebex panel. That
is why creating a ban asks first.

<a id="apikeys"></a>

## API keys

Every registered ticket bot server with its key, tier, statistics classification and custom
domain. A tier change is a manual override: Stripe billing and the daily cleanup in `cleanup.js`
still apply and can reset it. Exclusion from the public statistics and the origin are ours alone
(`lib/keyClassification.ts`).

<a id="images"></a>

## Images

The image CDN inventory behind `cdn.msk-scripts.de`. New image data only comes from
`scripts/image-ingest.js` or an approved upload. Moving and deleting act on files that already
exist: both change or remove the public address, so a link someone wrote down elsewhere breaks.
Deleting removes the row and three files and asks for the image name first. The filesystem check
compares the CDN directory with the database on request; the size comparison stays in
`scripts/image-sync-check.js`, because it needs one stat call per row.

<a id="uploads"></a>

## Uploads

Images submitted through `/images/upload`. A pending file waits in quarantine outside any web
root and was re-encoded by `sharp` on arrival, so the preview is our own PNG. Approving is the one
action that puts a file into the public CDN; the category the submitter picked is a suggestion.
Rejecting needs a reason, deletes the quarantine file and asks first.

<a id="newspopup"></a>

## News popup

The announcement shown on every page, once per browser session, stored in `msk_site_settings`.
Saving takes effect within 30 seconds, no deploy needed. A link must start with `/` or `https://`;
anything else would be dropped by the route, so the form names it at the field.

<a id="team"></a>

## Team

Who may sign in and what each person may do, the permissions grouped like the sidebar. Role
templates (Support, Moderation, Shop manager, Everything) only set the boxes; nothing is saved
until "Save permissions". The owner cannot be changed here, nobody can remove themselves, take
away their own "Manage team" or grant themselves more.

<a id="audit"></a>

## Audit log

The latest 100 actions as sentences with the admin's name, filterable by person, action and
period. The details as recorded open on request, with every address in them masked.
