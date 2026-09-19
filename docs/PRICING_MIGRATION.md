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

## Status

- **Database:** done on 2026-09-19. Guilds with a hosted bot were moved up a
  tier before the code change, see section 1.
- **Stripe:** done on 2026-09-19. Six prices created, the product renamed, the
  default prices repointed, see section 2.
- **Open:** the six `STRIPE_PRICE_*` in `/opt/msk-shop/.env.local` and the
  deploy, see sections 4 and 5. **The deploy must not go live before the env
  vars are in place**, see the warning at the top of section 5.

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

## 2. Stripe: six prices, created 2026-09-19

Live account `acct_1TlYFFHzrOblnPeT`. The account held three products and three
monthly prices (3.99 / 6.99 / 9.99) and, importantly, **zero subscriptions**.
That is what made this safe to do without a migration plan for existing
customers: there are none.

Created:

| Product | Nickname | Amount | Interval | Price id |
|---|---|---|---|---|
| Ticketbot Premium | Premium monthly | 4.99 € | month | `price_1UHQDjHzrOblnPeTt8Es1LI8` |
| Ticketbot Premium | Premium yearly | 49.00 € | year | `price_1UHQDrHzrOblnPeTk6VnKSlu` |
| Ticketbot Hosted | Hosted monthly | 9.99 € | month | `price_1UHQDuHzrOblnPeT9DsY3Q0q` |
| Ticketbot Hosted | Hosted yearly | 99.00 € | year | `price_1UHQDxHzrOblnPeTOporOXrb` |
| Ticketbot Business | Business monthly | 19.99 € | month | `price_1UHQDzHzrOblnPeTwsENcbzE` |
| Ticketbot Business | Business yearly | 199.00 € | year | `price_1UHQE2HzrOblnPeTPICKwm68` |

Also done:

- Product `prod_Ul4d0SjoQOST9w` renamed from **Ticketbot Premium+** to
  **Ticketbot Hosted**, so the Stripe receipt says what the dashboard and the
  AGB say.
- `default_price` of all three products repointed at the new monthly price. The
  checkout passes an explicit price id and never reads `default_price`, so this
  is tidiness rather than function, but a dashboard that still offers 3.99 € is
  how a wrong price gets sent by hand one day.
- Every new price carries `tax_behavior: unspecified`, like the old ones.
  **Stripe Tax stays off**; `/v1/tax/registrations` is empty, checked after the
  change. With Stripe Tax on, Stripe would extract 19 % out of the gross amount
  and 4.99 € would become 4.19 €.

## 3. The three old prices are still active

`price_1TlYSrHzrOblnPeTMrVLNWJJ` (3.99), `price_1TlYUJHzrOblnPeT8RB7MutR`
(6.99) and `price_1U9n1ZHzrOblnPeTZPSwb8R8` (9.99) were deliberately left
active. Nothing references them once the env vars below are in place.

They could be archived in the dashboard without any functional effect, since no
subscription uses them. Left alone because archiving buys nothing and takes away
the option of putting somebody back on an old price by hand.

**The rule that matters if a subscription ever does exist:**
`resolveTierFromPrice` in `lib/stripe.ts` only knows the ids in the env vars. A
price id that is not in the env resolves to `basic`, and the nightly
`stripe-reconcile.js` would then **downgrade a paying customer**. A running
Stripe subscription keeps its original price forever, so repointing
`STRIPE_PRICE_*` while old subscriptions run means the old ids have to stay
reachable too. That is grandfathering, and it costs no code.

## 4. Server: `.env.local`

Six variables, three of them new, three repointed. Copy them as they stand:

```
STRIPE_PRICE_PREMIUM=price_1UHQDjHzrOblnPeTt8Es1LI8
STRIPE_PRICE_PREMIUM_PLUS=price_1UHQDuHzrOblnPeT9DsY3Q0q
STRIPE_PRICE_BUSINESS=price_1UHQDzHzrOblnPeTwsENcbzE
STRIPE_PRICE_PREMIUM_YEARLY=price_1UHQDrHzrOblnPeTk6VnKSlu
STRIPE_PRICE_PREMIUM_PLUS_YEARLY=price_1UHQDxHzrOblnPeTOporOXrb
STRIPE_PRICE_BUSINESS_YEARLY=price_1UHQE2HzrOblnPeTPICKwm68
```

`STRIPE_PRICE_PREMIUM_PLUS` keeps its name and now points at the Hosted price.
The env var is named after the internal tier, not after the label.

Back the file up first (`cp /opt/msk-shop/.env.local /root/env.local.bak-$(date +%Y%m%d)`).

**Quote nothing that contains `<` or `>`.** The crons source this file with
`sh`, which reads those as redirections; that is how three crons died silently
for four days at the end of August 2026.

Without the `*_YEARLY` ids a yearly checkout answers "billing is not
configured" with a 500 and logs the tier. It never falls back to the monthly
price, which is the one failure mode worth avoiding here.

## 5. Deploy and check

**Order matters here.** The env vars have to be in place **before** the new code
serves a page. In between, the site would show 4.99 € while the checkout still
charges the old 3.99 € price, and § 312j (2) BGB wants the price shown before
the order button to be the price actually charged.

So: edit `.env.local` first, then deploy. The deploy restarts the service and
picks the new values up.

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
- One real checkout per interval is worth the ten minutes and costs nothing:
  a new customer gets the 14-day trial without a card, so the amount due today
  is 0. Check in Stripe that the subscription carries the intended price id,
  then cancel it. Do not use the live test for the paid path, and note that the
  test-mode account has no prices of its own; these six were created in
  livemode.

## What is NOT in this change

**Multi-guild Business.** The plan was to let one Business subscription cover up
to three guilds. That is a schema change, not a price change:
`ticketbot_guilds.stripe_subscription_id` is `UNIQUE`, so one subscription can
reference exactly one guild today. Doing it properly means dropping that
constraint, deciding which guild a webhook event applies to, adding an
assign/unassign flow to the dashboard and enforcing the cap in the checkout.

It was left out rather than half-built, and the marketing copy does not promise
it. Business currently covers one guild like every other tier.
