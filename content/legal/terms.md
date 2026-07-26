# Terms & Conditions

*Last updated: June 2026*

## 1. Scope

These Terms & Conditions apply to all use of the MSK Scripts services available at **www.msk-scripts.de**, including:

- **MSK Scripts Shop**: purchase of digital products (FiveM resources and Discord bots) via Tebex
- **MSK Ticket Bot Transcript Service**: an optional subscription-based hosted service for users who self-host the MSK Ticket Bot
- **Hosted Bot Management**: an optional fully managed hosting service for the MSK Ticket Bot, available to Premium and Premium+ customers by individual arrangement
- **MSK Giveaway Bot**: a free Discord bot, operated as an official public instance, that you can add to your own Discord server to run giveaways

By completing a purchase, registering for any of these services, or inviting the Giveaway Bot to your Discord server, you agree to these terms.

---

## 2. Shop: Payment Processing (Tebex)

All shop purchases are processed by **Tebex Limited** (formerly Buycraft), acting as payment service provider and merchant of record. By purchasing, you also agree to Tebex's own terms:

- [Tebex Terms & Conditions](https://checkout.tebex.io/terms)
- [Tebex Privacy Policy](https://checkout.tebex.io/privacy)
- [Tebex Impressum](https://checkout.tebex.io/impressum)

---

## 3. Shop: License Terms

Purchasing an MSK Scripts resource grants you a **non-transferable, non-exclusive single-server license** to use the resource on one (1) FiveM server at a time.

The licensor (MSK Scripts) retains all rights to the software, including all intellectual property rights (copyright, trademark, and related rights).

**You may not:**
- Use the resource on more than one FiveM server simultaneously
- Resell, redistribute, sublicense, or publicly share the resource
- Reverse engineer, decompile, or attempt to circumvent the Asset Escrow system
- Share or publish source code versions (-S) of any resource

---

## 4. Shop: Returns & Refunds

As these are digital products, the statutory right of withdrawal does not apply once the product has been delivered, provided you explicitly agreed at checkout that delivery begins before the withdrawal period expires.

In the event of technical issues attributable to our side, we offer support and may provide refunds on a case-by-case basis. Contact us at: [info@msk-scripts.de](mailto:info@msk-scripts.de)

---

## 5. Shop: FiveM Asset Escrow

Many resources use the [FiveM Asset Escrow System](https://forum.cfx.re/t/introducing-asset-escrow-for-your-resources/4777151). Usage requires an active CFX.re account. Offline use is not supported.

---

## 6. Shop: Discord Requirements

Packages with Discord integration require a valid Discord ID. You must be a member of the MSK Scripts Discord server to receive Discord roles and other Discord-based deliverables.

---

## 7. Ticket Bot Transcript Service

### 7.1 Service Description

The MSK Ticket Bot Transcript Service allows users who self-host the MSK Ticket Bot to upload ticket transcripts to our servers and retrieve them via a public link. The service is provided in three tiers:

| Tier | Price | Storage | Max Transcript | Attachments | Custom Domain |
|---|---|---|---|---|---|
| **Basic** | Free | 30 days | 10 MB | No | No |
| **Premium** | €3.99/month | 180 days | 100 MB | Yes (150 MB/ticket) | Yes |
| **Premium+** | €6.99/month | 365 days | 250 MB | Yes (500 MB/ticket) | Yes |

### 7.2 Subscription and Payment

Premium and Premium+ subscriptions are billed via **Stripe** (Stripe Payments Europe, Ltd.). Stripe processes all payments; we never receive or store your card details. By subscribing, you also agree to Stripe's terms.

Subscription fees are billed monthly. Your tier is activated automatically once the subscription is confirmed and remains active for as long as payment succeeds.

**14-day free trial:** New customers receive a 14-day free trial. If you do not cancel before the trial ends, the subscription automatically converts to a paid monthly plan and the first monthly fee is charged. The trial is available once per customer.

### 7.3 Cancellation and Downgrade

You may cancel your subscription at any time via the **"Manage subscription"** button in your dashboard (Stripe customer portal). Upon cancellation:
- Your tier is downgraded to **Basic** at the end of the current billing period (or immediately if you cancel during the free trial, no charge is made)
- Existing transcripts remain accessible until their individual expiry date
- Custom domains are deactivated at the time of downgrade
- No partial refunds are provided for unused subscription time

### 7.4 API Key

Upon successful registration via **www.msk-scripts.de/verify**, you receive a personal API key.

- The API key is **linked to one Discord server** and must be kept confidential
- **Do not share your API key** with anyone: it grants the ability to upload transcripts on behalf of your server
- If you re-verify for the same server, a new API key is generated and the previous one is **immediately invalidated**; you must update the key in your bot's configuration
- We reserve the right to revoke API keys in cases of abuse or violation of these terms

### 7.5 Transcript Content and Responsibility

The transcript content is generated entirely by your self-hosted bot instance and uploaded to our servers. You are solely responsible for the content of transcripts and attachments stored on our servers.

**You must not upload transcripts containing:**
- Illegal content of any kind
- Content that violates the rights of third parties
- Malware, scripts, or executable code intended to harm

We reserve the right to delete content that violates these terms without prior notice and to terminate access to the service.

### 7.6 Transcript Availability and Public URLs

Transcripts are accessible via a URL containing a randomly generated UUID (e.g. `https://www.msk-scripts.de/transcripts/.../...`). These URLs are not listed, indexed, or linked. Anyone who knows the URL can access the transcript, so it is your responsibility to handle these links appropriately.

We do not guarantee permanent availability of transcripts beyond the stated retention period for your tier.

### 7.7 Custom Domain (Premium)

Premium and Premium+ users may configure a custom domain for transcript delivery.

- You must **own and control** the domain you configure
- You must set the required DNS A-record pointing to our server before activating the domain
- An SSL certificate is automatically obtained via Let's Encrypt at no additional cost
- We reserve the right to remove custom domains that are misconfigured, cause conflicts, or violate applicable law
- Upon subscription cancellation or downgrade to Basic, the custom domain is deactivated

### 7.8 Service Availability

We strive to maintain high availability of the Transcript Service but do not provide a guaranteed uptime or SLA. Scheduled maintenance or unforeseen outages may temporarily interrupt the service.

If the service is unavailable at the time a transcript is uploaded by the bot, the bot will fall back to sending the transcript as a file attachment via DM.

---

## 8. Hosted Bot Management Service

### 8.1 Service Description

The Hosted Bot Management Service allows Premium and Premium+ customers to have their MSK Ticket Bot instance fully hosted and operated on MSK Scripts' servers. The service is only available by individual arrangement via our [Discord server](https://discord.gg/5hHSBRHvJE) and is not activated automatically by a Premium or Premium+ subscription.

The service includes:
- Hosting of the bot process on MSK Scripts' servers (managed via PM2)
- Access to a web-based management panel at **www.msk-scripts.de/dashboard** for editing configuration files (`config.jsonc`, `snippets.jsonc`, `.env`, and the active language file `locales/<lang>.json`), controlling the bot (start / stop / restart / update), and viewing live log output

### 8.2 Access to Configuration Data and Credentials

By using the Hosted Bot Management Service, you acknowledge and agree that:

- Your bot's configuration files, including `config.jsonc`, `snippets.jsonc`, and the **`.env` file containing sensitive credentials** (such as your Discord bot token and API keys), are stored on MSK Scripts' servers in a directory accessible to the service operator
- MSK Scripts personnel may access these files for support, maintenance, and security purposes
- You are solely responsible for any credentials stored in the `.env` file and for ensuring that the bot token and other secrets have not been compromised
- You must **immediately regenerate** any compromised credentials (e.g. Discord bot token) and notify us so we can update the configuration

### 8.3 Customer Responsibilities

You are solely responsible for:
- Ensuring that your bot's configuration and usage comply with **Discord's Terms of Service** and Community Guidelines
- The content processed by the hosted bot (messages, transcripts, user data)
- Informing your Discord server members that a third-party service (MSK Scripts) operates the bot infrastructure on your behalf
- Any legal obligations arising from the collection and storage of user data by the bot within your Discord server

### 8.4 Bot Usage Compliance

The hosted bot must not be configured or used to:
- Collect or store data in violation of applicable law or Discord's Terms of Service
- Send spam, unsolicited messages, or engage in any abusive behaviour
- Perform actions that could harm Discord's infrastructure or other users

We reserve the right to immediately suspend the hosted bot if it is used in violation of these terms, Discord's policies, or applicable law.

### 8.5 Service Availability and Termination

We do not guarantee a specific uptime for the Hosted Bot Management Service. The service may be interrupted for maintenance, updates, or other operational reasons.

Either party may terminate the hosting arrangement at any time with reasonable notice. Upon termination:
- We will provide you with your configuration files (`config.jsonc`, `snippets.jsonc`, `.env`) so you can migrate to self-hosting
- Bot data, logs, and configuration files will be deleted from our servers within 14 days of termination

---

## 9. Discord Giveaway Bot

### 9.1 Service Description

The MSK Giveaway Bot is a **free** Discord bot operated by MSK Scripts as an official public instance. You add it to your own Discord server via the official invite link and use it to create and run giveaways. There is no subscription, payment, or account required to use it.

Server administrators may optionally manage their giveaways through a free web dashboard at **www.msk-scripts.de/giveaway/dashboard** (Discord login). When a giveaway ends, a public results page (showing the winners and the number of participants, but not the participant list) is hosted under **www.msk-scripts.de/giveaway/g/…** and linked from Discord. These features are part of the same free service and processed as described in our [Privacy Policy](/terms/privacy).

Self-hosting of the bot is neither required nor supported; the published source code is provided for transparency only.

### 9.2 Acceptable Use

When using the Giveaway Bot, you agree that you will not use it to:
- Run giveaways that violate **Discord's Terms of Service** or Community Guidelines
- Conduct unlawful lotteries, gambling, or promotions where these are prohibited or require a licence you do not hold
- Send spam or otherwise abuse Discord's infrastructure
- Distribute illegal content, or prizes that are illegal or infringe third-party rights

### 9.3 Your Responsibility as a Server Operator

You are solely responsible for the giveaways you run on your server, including:
- The **legality** of each giveaway (prizes, eligibility conditions, and any applicable promotion, sweepstakes, or consumer-protection law)
- Delivering any prizes you offer. MSK Scripts is not a party to your giveaways and provides no prizes
- Informing your server members that a third-party service (MSK Scripts) operates the bot and processes Discord identifiers as described in our [Privacy Policy](/terms/privacy)

### 9.4 Service Availability and Changes

The Giveaway Bot is provided free of charge and **without any guaranteed uptime or SLA**. We may modify, suspend, or discontinue the bot, or remove it from individual servers in cases of abuse, at any time and without notice. We accept no liability for giveaways that are interrupted, delayed, or lost due to downtime, maintenance, or discontinuation of the service.

---

## 10. Limitation of Liability

MSK Scripts accepts no liability for damages arising from the use of our products or services, unless caused by gross negligence or willful misconduct.

In particular, we accept no liability for:
- Changes to the FiveM platform or CFX.re affecting the functionality of purchased resources
- Temporary unavailability of the Transcript Service
- Loss of transcript data beyond the stated retention period
- Consequences arising from sharing transcript URLs with third parties
- Domain-related issues arising from DNS misconfiguration by the user

---

## 11. Support

Support for shop products and the Transcript Service is provided via our Discord server. We aim to respond promptly but cannot guarantee specific response times.

---

## 12. Changes to Terms

We reserve the right to update these Terms & Conditions at any time. Changes will be published on this page with an updated date. Continued use of our services after changes are published constitutes acceptance of the updated terms.

For material changes to the Transcript Service subscription terms, we will make reasonable efforts to notify affected users in advance.

---

## 13. Governing Law

These Terms are governed by the laws of the **Federal Republic of Germany**. To the extent permitted by law, the exclusive place of jurisdiction for all disputes arising from or in connection with these Terms is the licensor's place of business.
