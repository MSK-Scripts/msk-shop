# Pricing migration, 2026-09-19

The ticket bot tier ladder changed. This file is the runbook for the parts that
are **not** in the repository: Stripe, the `.env.local` on the server, and one
database check that has to happen **before** the deploy.

## What changed in the code

| Tier (DB value) | Shown as | Was | Now | Bot hosting |
|---|---|---|---|---|
| `basic` | Basic | free | free | no |
| `premium` | Premium | 3.99 €/month | **4.99 €/month** | **no** (was yes) |
| `premium_plus` | **Hosted** (was "Premium+") | 6.99 €/month | **9.99 €/month** | yes |
| `business` | Business | 9.99 €/month | **19.99 €/month** | yes |

Yearly billing is new: **49 € / 99 € / 199 €**, two months free against the
monthly price.

**The database values did not change.** `premium_plus` is still `premium_plus`
in `ticketbot_guilds.tier`; only the label a human reads became "Hosted". No
migration is needed for that, and renaming it would have been one.

The reason hosting moved up a tier is arithmetic, not taste: of a 3.99 € plan
3.68 € survive the Stripe fee, while ten minutes of support cost 6.67 € at a
40 €/h rate. Hosting is the feature that produces support contacts. The full
note is in the comment on `botHosting` in `lib/tiers.ts`.

## 1. Before anything else: find guilds that would lose hosting

`premium` no longer grants bot hosting. Any guild sitting on `premium` **and**
running a hosted bot loses access to its own bot management the moment this
deploys.

```sql
SELECT guild_id, guild_name, tier, is_hosted, stripe_subscription_id
FROM ticketbot_guilds
WHERE is_hosted = 1;
```

Every row that comes back with `tier = 'premium'` has to move up, otherwise a
paying customer is locked out of a bot we are still running for them:

```sql
UPDATE ticketbot_guilds
SET tier = 'premium_plus'
WHERE is_hosted = 1 AND tier = 'premium';
```

Do this **before** the deploy, not after. Afterwards the dashboard hides the
hosting tab for them and the support ticket arrives before the fix does.

## 2. Stripe: create six prices

I have no write access to Stripe, and this is a live billing account, so these
steps are yours. Everything happens under **Products** in the Stripe dashboard.

For each of the three products (Premium, Hosted, Business), add prices:

| Product | Price | Billing period | Currency |
|---|---|---|---|
| Premium | 4.99 | monthly | EUR |
| Premium | 49.00 | yearly | EUR |
| Hosted (the product currently named Premium+) | 9.99 | monthly | EUR |
| Hosted | 99.00 | yearly | EUR |
| Business | 19.99 | monthly | EUR |
| Business | 199.00 | yearly | EUR |

Three things to get right:

1. **Add prices, do not edit the existing ones.** A Stripe price is immutable
   once it has been used; the dashboard offers to "update" a price by creating a
   new one and archiving the old. Let it, but **do not archive the old price**
   by hand, see grandfathering below.
2. **Tax behaviour stays `unspecified`.** Stripe Tax is off and must stay off,
   otherwise Stripe starts extracting 19 % out of the gross amount and the
   4.99 € become 4.19 €. Checked and written down on 2026-09-04.
3. Rename the product **Premium+** to **Hosted** while you are there, so the
   Stripe receipt says the same thing the dashboard and the AGB say.

## 3. Grandfathering: do nothing, deliberately

A running Stripe subscription keeps the price it was created with. Existing
subscribers stay on 3.99 € / 6.99 € / 9.99 € for as long as they do not cancel,
without any code, any coupon and any manual work.

So: **do not archive the old prices and do not migrate anybody.** Archiving them
would not move existing subscriptions either, but it takes away the option of
putting somebody back on the old price by hand.

`resolveTierFromPrice` in `lib/stripe.ts` only knows the ids in the env vars.
An old price id that is no longer in the env resolves to `basic`, and the
nightly `stripe-reconcile.js` would then **downgrade a paying customer**. If you
ever repoint `STRIPE_PRICE_*` at the new ids while old subscriptions are still
running, the old ids have to stay reachable too. Today that question does not
arise, because there are no active subscriptions.

## 4. Server: `.env.local`

Six variables, three of them new:

```
STRIPE_PRICE_PREMIUM=price_…
STRIPE_PRICE_PREMIUM_PLUS=price_…
STRIPE_PRICE_BUSINESS=price_…
STRIPE_PRICE_PREMIUM_YEARLY=price_…
STRIPE_PRICE_PREMIUM_PLUS_YEARLY=price_…
STRIPE_PRICE_BUSINESS_YEARLY=price_…
```

Back the file up first (`cp /opt/msk-shop/.env.local /root/env.local.bak-$(date +%Y%m%d)`).

**Quote nothing that contains `<` or `>`.** The crons source this file with
`sh`, which reads those as redirections; that is how three crons died silently
for four days at the end of August 2026.

Without the `*_YEARLY` ids a yearly checkout answers "billing is not
configured" with a 500 and logs the tier. It never falls back to the monthly
price, which is the one failure mode worth avoiding here.

## 5. Deploy and check

The deploy itself is the usual one, and **no database migration is involved**.

Afterwards, on the live site:

- `/ticketbot` and `/de/ticketbot` show 4.99 / 9.99 / 19.99, the yearly line
  under each, and a struck-through "bot management" row on the Premium card.
- `/terms` § 5 shows the same numbers. If the page and the AGB disagree, the
  AGB is the one that matters legally, so fix it first.
- In the dashboard, open the order summary for a tier and switch between
  monthly and yearly: price and term have to change together. That block is
  § 312j (2) BGB, it is the one place where a wrong number is a legal problem
  rather than a cosmetic one.
- A test checkout in Stripe test mode, once per interval, is worth the ten
  minutes.

## What is NOT in this change

**Multi-guild Business.** The plan was to let one Business subscription cover up
to three guilds. That is a schema change, not a price change:
`ticketbot_guilds.stripe_subscription_id` is `UNIQUE`, so one subscription can
reference exactly one guild today. Doing it properly means dropping that
constraint, deciding which guild a webhook event applies to, adding an
assign/unassign flow to the dashboard and enforcing the cap in the checkout.

It was left out rather than half-built, and the marketing copy does not promise
it. Business currently covers one guild like every other tier.
