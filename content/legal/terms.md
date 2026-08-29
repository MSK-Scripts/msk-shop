# Terms & Conditions

*Last updated: August 2026*

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
- Attempt to circumvent the Asset Escrow system
- Reverse engineer or decompile the resource, except where mandatory law allows it (in particular §§ 69d(2), 69d(3) and 69e UrhG, which cannot be excluded by contract)
- Share or publish the Source version of any resource

---

## 4. Shop: Returns & Refunds

As these are digital products, the statutory right of withdrawal does not apply once the product has been delivered, provided you explicitly agreed at checkout that delivery begins before the withdrawal period expires.

In the event of technical issues attributable to our side, we offer support and may provide refunds on a case-by-case basis. Contact us at: [info@msk-scripts.de](mailto:info@msk-scripts.de)

This section covers **shop purchases**. For the paid Premium and Premium+ subscriptions a statutory right of withdrawal applies, see section 7.9.

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

| Tier | Price | Storage | Max Transcript | Attachments | Custom Domain | Remove branding |
|---|---|---|---|---|---|---|
| **Basic** | Free | 30 days | 10 MB | No | No | No |
| **Premium** | €3.99/month | 180 days | 50 MB | Yes (100 MB/ticket) | Yes | Yes |
| **Premium+** | €6.99/month | 365 days | 100 MB | Yes (200 MB/ticket) | Yes | Yes |
| **Business** | €9.99/month | 10 years | 200 MB | Yes (500 MB/ticket) | Yes | Yes |

**Remove branding:** The MSK Ticket Bot is licensed under AGPL-3.0 with an additional term under section 7(b) requiring that the notice identifying MSK Scripts stays visible to the people using the bot. For servers with an active Premium or Premium+ subscription we waive that term, so the notice may be removed there. The waiver is tied to the subscription and ends with it.

### 7.2 Subscription and Payment

Premium and Premium+ subscriptions are billed via **Stripe** (Stripe Payments Europe, Ltd.). Stripe processes all payments; we never receive or store your card details. By subscribing, you also agree to Stripe's terms.

Subscription fees are billed monthly. Your tier is activated automatically once the subscription is confirmed and remains active for as long as payment succeeds.

**14-day free trial:** New customers receive a 14-day free trial. **No payment method is required** to start it. If you do not add a payment method before the trial ends, the subscription ends automatically and your tier returns to Basic; nothing is charged and no cancellation is needed. If you do add a payment method, the subscription converts to a paid monthly plan at the end of the trial and the first monthly fee is charged, unless you cancel before then. The trial is available once per customer.

### 7.3 Cancellation and Downgrade

You may cancel your subscription at any time via the **"Manage subscription"** button in your dashboard (Stripe customer portal). Upon cancellation:
- Your tier is downgraded to **Basic** at the end of the current billing period (or immediately if you cancel during the free trial, no charge is made)
- Existing transcripts remain accessible until their individual expiry date
- Custom domains are deactivated at the time of downgrade
- No partial refunds are provided for unused subscription time. This does **not** affect your statutory right of withdrawal under section 7.9

### 7.4 API Key

Upon successful registration via **www.msk-scripts.de/ticketbot/verify**, you receive a personal API key.

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

### 7.7 Custom Domain (Premium and Premium+)

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

### 7.9 Right of Withdrawal (consumers)

**Draft, not yet reviewed by a lawyer.** This section follows the statutory model instruction (Annex 1 to Art. 246a § 1(2) sentence 2 EGBGB), adapted for a digital service. Please have it checked before you rely on it.

This right of withdrawal applies to the **paid Premium and Premium+ subscriptions**, for which MSK Scripts is your contractual partner (Stripe only processes the payment). It does not apply to shop purchases, where Tebex Limited is the merchant of record and provides its own withdrawal terms.

**Right of withdrawal**

You have the right to withdraw from this contract within fourteen days without giving any reason. The withdrawal period is fourteen days from the day of the conclusion of the contract.

To exercise your right of withdrawal you must inform us

**Moritz Kohm**, c/o Impressumservice Dein-Impressum, Stettiner Str. 41, 35410 Hungen, Germany, [info@msk-scripts.de](mailto:info@msk-scripts.de)

of your decision to withdraw from this contract by a clear statement (for example a letter sent by post or an email). You may use the model withdrawal form below, but it is not obligatory. To meet the withdrawal deadline it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.

**Effects of withdrawal**

If you withdraw from this contract, we shall reimburse to you all payments received from you without undue delay and in any event not later than fourteen days from the day on which we are informed about your decision to withdraw. We will carry out such reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise; in any event you will not incur any fees as a result of such reimbursement.

If you requested that the service begin during the withdrawal period, you shall pay us an amount which is in proportion to what has been provided until you have communicated your withdrawal, in comparison with the full coverage of the contract. During the free trial no payment is made, so no such amount arises.

**Model withdrawal form**

(Complete and return this form only if you wish to withdraw from the contract.)

- To Moritz Kohm, c/o Impressumservice Dein-Impressum, Stettiner Str. 41, 35410 Hungen, Germany, info@msk-scripts.de:
- I/We hereby give notice that I/We withdraw from my/our contract for the provision of the following service: MSK Ticket Bot Transcript Service (Premium / Premium+)
- Ordered on
- Name of consumer(s)
- Address of consumer(s)
- Signature of consumer(s) (only if this form is notified on paper)
- Date

Please delete whichever does not apply.

---

## 8. Hosted Bot Management Service

### 8.1 Service Description

The Hosted Bot Management Service allows Premium and Premium+ customers to have their MSK Ticket Bot instance fully hosted and operated on MSK Scripts' servers. The service is only available by individual arrangement via our [Discord server](https://discord.gg/5hHSBRHvJE) and is not activated automatically by a Premium or Premium+ subscription.

The service includes:
- Hosting of the bot process on MSK Scripts' servers (managed via PM2)
- Access to a web-based management panel at **www.msk-scripts.de/ticketbot/dashboard** for editing configuration files (`config.jsonc`, `snippets.jsonc`, `.env`, and the active language file `locales/<lang>.json`), controlling the bot (start / stop / restart / update), and viewing live log output

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

We are liable without limitation for damages arising from injury to life, body or health, for intent and gross negligence, and under the German Product Liability Act.

For slight negligence we are liable only where we breach a material contractual obligation, meaning an obligation whose fulfilment makes the proper performance of the contract possible in the first place and on whose observance you may regularly rely. In that case liability is limited to the damage that is foreseeable and typical for this kind of contract.

Any further liability is excluded. Within these limits we accept no liability in particular for:
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

We may amend these Terms where there is a valid reason, for example a change in the law, in case law, or in the services described here, and where the amendment does not shift the balance of the contract to your disadvantage.

**For paid subscriptions** we will notify you of any amendment in text form at least 30 days before it takes effect, and the notification will state the deadline, your right to object and the consequences of not objecting. If you object within that period, we may terminate the subscription at the end of the current billing period. If you do not object, the amendment takes effect.

**For services provided free of charge** (the Basic tier and the Giveaway Bot), amendments take effect when they are published on this page with an updated date.

---

## 13. Governing Law

These Terms are governed by the laws of the **Federal Republic of Germany**, excluding the UN Convention on Contracts for the International Sale of Goods.

If you are a consumer with your habitual residence in another EU member state, this choice of law does **not** deprive you of the protection afforded by those provisions of the law of your country of residence that cannot be derogated from by agreement (Art. 6(2) Rome I Regulation).

If you are a merchant, a legal person under public law or a special fund under public law, the exclusive place of jurisdiction is the licensor's place of business. **For consumers the statutory places of jurisdiction apply**; a consumer can only be sued at the court of their own domicile.
