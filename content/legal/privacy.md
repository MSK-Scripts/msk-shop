# Privacy Policy

Last updated: September 2026

This is a translation for your convenience. The German version at www.msk-scripts.de/de/terms/privacy is authoritative.

This privacy policy applies to www.msk-scripts.de and the subdomains docu., discord., paste. and s.msk-scripts.de as well as to the Discord bots operated by MSK Scripts. A separate privacy policy applies to **MSK Forms** (forms.msk-scripts.de); MSK Paste and MSK Shortener additionally carry short notices on their own pages.

## 1. Controller

**Moritz Kohm** (MSK Scripts)
c/o Impressumservice Dein-Impressum, Stettiner Str. 41, 35410 Hungen, Germany
Email: info@msk-scripts.de

A data protection officer is not legally required and has not been appointed.

## 2. Roles: who is responsible for what?

- For the website, the shop integration, accounts, subscriptions and technical operation, **we** are the controller.
- For the **content of ticket transcripts** and for the data processed by a Ticket Bot hosted by you or hosted by us on your behalf, the **operator of the respective Discord server** is the controller. We store and deliver this data on their behalf (processing on behalf of a controller, Art. 28 GDPR) – the corresponding agreement is available at https://www.msk-scripts.de/terms/avv.
- For the **Giveaway Bot** we are the controller for the Discord IDs stored in our database; the server administrator is responsible for the lawfulness of their giveaways.
- For **payments in the shop**, Tebex Limited is an independent controller; for **Stripe payments**, Stripe is an independent controller.

## 3. Hosting and server log files

All services are hosted with **netcup GmbH**, Daimlerstraße 25, 76185 Karlsruhe (processor, data processing agreement under Art. 28 GDPR; server location EU). On every request the web server logs the IP address, date/time, requested URL, HTTP status, amount of data transferred, referrer, browser and operating system. Purpose: operation, security, error analysis. Legal basis: Art. 6 (1) (f) GDPR. Deletion after **14 days**, in the event of security incidents until the matter is resolved.

## 4. Cookies and local storage (§ 25 TDDDG)

We only use technically necessary cookies and storage objects that are strictly required for functions you have requested (§ 25 (2) no. 2 TDDDG). There is no tracking and therefore no cookie banner.

**Cookies (all HttpOnly, Secure, SameSite=Lax):**

| Name | Service | Purpose | Duration |
|---|---|---|---|
| `msk_oauth_state` | Ticket Bot verify | CSRF protection during the Discord login | 10 min. |
| `msk_verify_session` | Ticket Bot verify | verified Discord ID and server list during the selection | 1 hour |
| `msk_dashboard_session` | Ticket Bot dashboard | sign-in to the dashboard | 30 days |
| `msk_gw_oauth_state` | Giveaway dashboard | CSRF protection during the Discord login | 10 min. |
| `msk_gw_verify` | Giveaway dashboard | Discord ID and administrable servers during the selection | 1 hour |
| `msk_giveaway_session` | Giveaway dashboard | sign-in for the selected server | 30 days |
| `msk_upload_oauth_state` | Image gallery | CSRF protection during the Discord login | 10 min. |
| `msk_upload_session` | Image gallery | sign-in for submitting images | 7 days |
| `msk_admin_oauth_state` | Admin area | CSRF protection during the Discord login | 10 min. |
| `msk_admin_session` | Admin area | sign-in to the internal admin area | 1 hour |
| `NEXT_LOCALE` | Paste, Shortener | language selection | 12 months |

**localStorage (shop, not sent to our server):**
`msk-cart` (basket ID, your CFX.re name, basket contents, and for gifts the name and Discord ID of the recipient) and `discordId` (your Discord ID) – until you sign out. Only enter recipient data with their consent.

**sessionStorage (shop):** `discordReturnPath`, `wantDiscordAuth`, `pendingBasketIdent`, `pendingPackageId`, `pendingPackageType` – these remember the purchase in progress while you go through the CFX.re/Discord login; deleted when the tab is closed.

Legal basis: Art. 6 (1) (b) GDPR (login, basket) and Art. 6 (1) (f) GDPR (language). The language of the main site is contained in the URL (`/de/`); no cookie is set for it.

## 5. Shop (Tebex, CFX.re, Discord)

When buying a FiveM resource you sign in with your **CFX.re account** via the Tebex identity service; for packages with a Discord role additionally with **Discord**. Processed data: CFX.re username and ID (for the assignment in the Keymaster/Asset Escrow), Discord ID (only for Discord roles), IP address (fraud prevention when creating the basket, transmitted to Tebex), basket contents. Payment, invoicing and the handling of withdrawals are carried out by **Tebex Limited**, 201 Haverstock Hill, London NW3 4QG, UK, as the seller. We do not receive payment data. We receive the order data from Tebex (product, time, CFX.re/Discord ID, transaction ID) in order to provide support and assign licences; we store this for 3 years after the purchase, and accounting data for 10 years (§ 147 AO).

Legal basis: Art. 6 (1) (b) GDPR; IP transmission Art. 6 (1) (f) GDPR. Third country: the United Kingdom has an adequacy decision from the EU Commission. Tebex privacy policy: https://checkout.tebex.io/privacy

## 6. Ticket Bot transcript service

### 6.1 Registration (verify)
During the Discord login (scopes `identify`, `guilds`) we receive your Discord ID and the servers on which you are an administrator. Stored data: Discord ID, ID and name of the selected server, a random API key, subscription tier, Stripe customer/subscription ID and status, the time of the trial reminder, and where applicable a custom domain and its status. Servers not selected and server icons are not stored. Legal basis: Art. 6 (1) (b) GDPR. Stored until the account is deleted.

### 6.2 Transcripts and attachments
When a ticket is closed, your bot uploads an HTML file which may contain names, avatars, messages and timestamps of the people involved in the ticket (Premium/Premium+/Business additionally file attachments that we retrieve from the Discord CDN). We store the file, upload time, size, expiry date and server assignment. Transcripts are accessible via a random, unlinked and non-indexed URL; anyone who knows the URL can open it. Deletion after **30 / 180 / 365 days / 10 years** depending on the tier. We process this content as a **processor** on behalf of the bot operator (Art. 28 GDPR).

### 6.3 Subscriptions (Stripe)
You enter your name, billing address, email address and payment data directly with **Stripe Payments Europe, Ltd.**, Dublin. We only store the customer/subscription ID, status, tier and end of term, which Stripe reports to us via webhook. The free trial period ends automatically without a payment method; three days beforehand we send **one** reminder email to the address stored with Stripe (delivery via **IONOS SE**, Montabaur, as a processor, processing within the EU). We do not store the address, only the time of sending. Legal basis: Art. 6 (1) (b) GDPR. We retain accounting records for 10 years (§ 147 AO, Art. 6 (1) (c) GDPR). Stripe may transfer data to Stripe, Inc. (USA); the basis for this is the EU-US Data Privacy Framework and standard contractual clauses.

### 6.4 Custom domain
The domain is stored, an Apache virtual host is set up and a Let's Encrypt certificate is issued (our admin address is stored with Let's Encrypt/ISRG). Domain names appear in public Certificate Transparency logs.

### 6.5 Hosted Bot Management (Premium, Premium+, Business)
In a directory assigned to your server we store: `config.jsonc`, `snippets.jsonc`, the `.env` file with your credentials (bot token, OAuth secret, API keys), your bot's database (tickets, messages, Discord IDs of your team) and a volatile log buffer. A DNS record is created with **IONOS SE** for the public address. We can access these files for maintenance and support purposes. After termination the installation is archived and finally deleted after **14 days**. Legal basis: Art. 6 (1) (b) GDPR; for the content of the bot database we are a processor.

## 7. Giveaway Bot

The bot stores per server: server, channel, message and role IDs, settings, the Discord ID of the creator, Discord IDs of the participants (deleted immediately if they leave before the end) and of the winners, title/description/duration. After it ends, a public result page is published at `/giveaway/g/{token}` showing the **usernames of the winners** and the anonymous number of participants. The statistics page `/giveaway/stats` contains aggregated figures only. **If the bot is removed from a server, all data of that server is deleted immediately.** The dashboard uses the Discord login (scopes `identify`, `guilds`). Legal basis: Art. 6 (1) (f) GDPR (provision of the requested function) and Art. 6 (1) (b) GDPR (dashboard).

## 8. Image gallery

To submit an image you sign in with Discord (scope `identify`). Stored data: Discord ID and display name, category, name, optional details, original file name, technical image data, your confirmation of rights with a timestamp, and the review decision. The file is re-encoded and stored under a random name in a non-public directory until it is reviewed. If approved, the image is published; if rejected, it is deleted. Rejected submissions remain stored as a record for 1 year, published ones for as long as the image is online. Legal basis: Art. 6 (1) (b) and (f) GDPR.

## 9. Discord login (all services)

Signing in with Discord takes place via **Discord Inc.**, 444 De Haro Street, San Francisco, USA (or Discord Netherlands B.V.). In doing so, Discord learns that you are signing in with us. The transfer to the USA is based on the EU-US Data Privacy Framework and standard contractual clauses. We only request the scopes named in each case. Discord privacy policy: https://discord.com/privacy

## 10. Other processing

- **Discord member count:** Our home page shows the online count of our Discord server; the request is made server-side and cached for 60 seconds. No data about you is transmitted to Discord.
- **Resource statistics (fivestats.io):** The page `/resources` shows server counts for our resources. Our server queries fivestats.io server-side; your browser does not connect to fivestats.io and no data about you is transmitted. Legal basis: Art. 6 (1) (f) GDPR.
- **Rate limiting:** Public endpoints (giveaway result pages, dashboard login, transcript upload) count requests per IP address in memory for a short time; nothing is stored in databases. Legal basis: Art. 6 (1) (f) GDPR.
- **MSK Paste** (paste.msk-scripts.de): Stores the text entered, title, language, expiry date, an optional password (hashed) and a deletion token; pastes are deleted after the selected expiry. IP addresses only in the server logs.
- **MSK Shortener** (s.msk-scripts.de): Stores the target URL, short code, an optional password (bcrypt) and an expiry date; on creation and on every click it stores an IP value hashed with a secret salt (pseudonymised), device type, browser, operating system and referrer domain for abuse protection and click statistics. Legal basis: Art. 6 (1) (b) and (f) GDPR.
- **Documentation** (docu.msk-scripts.de): static pages, only server logs as described in section 3.
- **Withdrawal and cancellation function:** If you use "Withdraw from contract" or "Cancel contracts here", we process your name, contract details, email address and the time, and send you an acknowledgement of receipt. Legal basis: Art. 6 (1) (b) and (c) GDPR; retention 3 years to the end of the year.
- **Email and Discord support:** We store enquiries in order to handle them and delete them 12 months after they are closed, unless a retention obligation applies.

## 11. Recipients

| Recipient | Purpose | Role | Location |
|---|---|---|---|
| netcup GmbH | Hosting | Processor | DE |
| IONOS SE | Email delivery, DNS | Processor | DE |
| Tebex Limited | Shop sale and payment | Independent controller | UK (adequacy decision) |
| Stripe Payments Europe, Ltd. | Subscription payments | Independent controller | IE / USA (DPF, SCC) |
| Discord Inc. | OAuth login, bot API | Independent controller | USA (DPF, SCC) |
| Cfx.re (Tebex identity service) | CFX.re login | Independent controller | – |
| Internet Security Research Group (Let's Encrypt) | TLS certificates for custom domains | Independent controller | USA |
| fivestats.io | Resource statistics (no user data) | – | – |

## 12. Retention periods (overview)

| Data | Duration |
|---|---|
| Server logs | 14 days |
| Shop order data from Tebex | 3 years; accounting 10 years |
| Ticket Bot account, Stripe references | until the account is deleted |
| Transcripts and attachments | 30 / 180 / 365 days / 10 years depending on tier |
| Hosted bot files and database | until termination + 14 days |
| Giveaway data | until the bot is removed from the server |
| Gallery submissions | as long as published; rejected 1 year |
| Pastes | selected expiry date (10 min. to 1 year) |
| Short links | until deletion/expiry; click statistics pseudonymised indefinitely |
| Withdrawal/cancellation declarations | 3 years to the end of the year |
| Support enquiries | 12 months after closure |

## 13. Your rights

Access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20), withdrawal of consent (Art. 7 (3)).

> **Right to object (Art. 21 GDPR):** You may object at any time, on grounds relating to your particular situation, to processing based on Art. 6 (1) (f) GDPR. We will then no longer process the data unless we can demonstrate compelling legitimate grounds which override your interests.

Requests to info@msk-scripts.de; we respond within one month. For data contained in transcripts or bot databases, the respective server operator is the first point of contact; we will help you get in touch.

**Right to lodge a complaint (Art. 77 GDPR)** – competent supervisory authority:
Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart, tel. +49 711 615541-0, poststelle@lfdi.bwl.de, https://www.baden-wuerttemberg.datenschutz.de

## 14. No automated decision-making, security, changes

There is no automated decision-making within the meaning of Art. 22 GDPR. All connections are TLS-encrypted; passwords and secrets are stored hashed or encrypted; only the controller has access to customer data. This policy is updated when the services or the legal situation change.
