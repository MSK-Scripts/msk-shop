# Graph Report - C:\Users\morit\OneDrive\GitHub Repositories\FiveM Shop\msk-shop  (2026-08-02)

## Corpus Check
- 291 files · ~156,402 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1422 nodes · 2940 edges · 114 communities (98 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 92 edges (avg confidence: 0.86)
- Token cost: 4,085,884 input · 201,392 output

## Community Hubs (Navigation)
- UI-Bausteine und Giveaway-Landingpage
- Admin-Dashboard: Tabs und Hooks
- Admin-Rechte und Team-Verwaltung
- Header, Sprachumschaltung, Utilities
- Admin-Login und Session
- Datenbankhelfer und Audit-Log
- Admin-Route-Wrapper und CRUD-Routen
- Verify-Session und Discord-OAuth
- Admin-CRUD ueber die Tebex Plugin API
- Route-Integrationstests
- DB-Zugriff, Rate-Limits und Guild-Guards
- Bot-Dashboard-Reverse-Proxy
- Discord-Health-Route
- Giveaway-Statistiken
- Giveaway-Dashboard und Steuerkanal
- Giveaway-Verify und Session
- Resource-Stats (fivestats)
- Ticketbot-Statistiken
- Transkript-Upload und Guards
- Tier-Vergabe beim Verify
- Ticketbot-Dashboard-Session
- Warenkorb und Tebex-Client
- Kategorie-/Paketlisten und SEO-Metadaten
- Tebex-Katalog und Sitemap
- Giveaway-Dashboard
- Sprachaufloesung und Ergebnisseite
- Root-Layout und JSON-LD
- Katalog, Paketliste und Shop-Config
- Tebex-Typen, Galerie und Suche
- Paketdetail, Karten und Preise
- Startseite und Belegzeile
- Resourcen-Statistikseite
- Rechtstexte und Markdown-Renderer
- Ticketbot-Dashboard
- Dashboard-Texte, Transkripte, Bot-Steuerung
- Ticketbot-Landingpage
- Ticketbot-Verify-Flow
- Uebersetzungen und Hero-Sektionen
- Gratis-Scripts und Web-Tools
- Footer und Zahlungsmarken
- In-den-Warenkorb-Button
- ESLint-Konfiguration
- Basket-Auth-URLs
- Release-Protokoll aus VERSIONS
- HTML-Sanitizing der Tebex-Texte
- Middleware: CSP und Rate-Limits
- Next.js-Konfiguration
- Dev-Dependencies und Build-Setup
- Runtime-Dependencies
- Cleanup-Cron
- Deploy-Skript
- Transkript-Bilder-Reparatur
- Stripe-Abgleich-Cron
- Tebex-Kennzahlen-Cron
- vhost-create
- vhost-delete
- Tailwind-Konfiguration
- Kontrast-Tests der Farbtokens
- Route-Wachen-Test
- Shop-Kennzahlen-Test
- TypeScript-Konfiguration
- Issue-Vorlagen
- Contributing und Code of Conduct
- Dependabot und Dependency-Review
- CI-Pipeline und Deploy-Gate
- Coverage-Workflow
- CodeQL-Workflow
- Deploy-Workflow
- Codeberg-Mirror-Workflow
- Auto-Release-Workflow
- MSK Source Available License
- Projektdoku und Tebex-API-Referenz
- Datenschutzerklaerung (EN/DE)
- Giveaway-Bot-Datenverarbeitung
- Shop-Datenverarbeitung (Tebex)
- Transkript-Dienst-Datenverarbeitung
- Hosted-Bot-Verwaltung (AGB)
- Stripe-Abrechnung und Custom Domain
- Transkript-Dienst (Rechtstext)
- Externe Live-Zahlen
- AGB und Lizenzbedingungen
- Leistungsumfang Giveaway-Bot
- Ticketbot-Marketingbanner
- Kanbanly-Marketingbanner
- Kanbanly-Logo
- Kanbanly-Hero
- MSK-Scripts-Logo
- Giveaway-Bot-Banner
- Dokumentations-Banner
- Social-Banner der Marke
- MSK-Ticketbot-Banner
- msk_core-Banner
- msk_enginetoggle-Banner
- MSK-Forms-Screenshot
- msk_fuel-Banner
- msk_garage-Banner
- Giveaway-Bot (Produkt)
- msk_givevehicle-Banner
- msk_handcuffs-Banner
- MSK Paste
- MSK Shortener
- msk_vehiclekeys-Banner
- MSKanban-Banner

## God Nodes (most connected - your core abstractions)
1. `cn()` - 43 edges
2. `query()` - 40 edges
3. `Button` - 39 edges
4. `Card` - 33 edges
5. `queryOne()` - 29 edges
6. `getClientIp()` - 28 edges
7. `rateLimit()` - 28 edges
8. `useLang()` - 25 edges
9. `authorizeGuild()` - 24 edges
10. `Lang` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Production-Tree-Only Audit Gate` --semantically_similar_to--> `npm ci --no-audit im Deploy`  [INFERRED] [semantically similar]
  .github/workflows/ci.yml → docs/DEPLOYMENT.md
- `ResourcesPage()` --calls--> `loadResourceStats()`  [EXTRACTED]
  app/resources/page.tsx → lib/fivestats.ts
- `DashboardGuild` --references--> `Tier`  [EXTRACTED]
  app/ticketbot/dashboard/page.tsx → lib/tiers.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/stats/StatsClient.tsx → lib/utils.ts
- `StepIndicator()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/verify/VerifyClient.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (114 total, 16 thin omitted)

### Community 38 - "UI-Bausteine und Giveaway-Landingpage"
Cohesion: 0.07
Nodes (23): AuditEntry, AuditTab(), LookupPayment, LookupResult, LookupTab(), CheckoutContent(), metadata, HIGHLIGHTS (+15 more)

### Community 4 - "Admin-Dashboard: Tabs und Hooks"
Cohesion: 0.10
Nodes (29): ALL_TABS, AdminClient(), Tier, ApiKey, TIER_LABELS, TIER_ORDER, tierBadgeClass(), maskKey() (+21 more)

### Community 27 - "Admin-Rechte und Team-Verwaltung"
Cohesion: 0.18
Nodes (12): TabDef, Member, dynamic, PATCH, DELETE, dynamic, TeamRow, GET (+4 more)

### Community 10 - "Header, Sprachumschaltung, Utilities"
Cohesion: 0.10
Nodes (31): StatusBadge(), formatNum(), StatCard(), BreakdownItem, Breakdown(), StatsClient(), Guild, VerifyClient() (+23 more)

### Community 15 - "Admin-Login und Session"
Cohesion: 0.16
Nodes (17): dynamic, metadata, ERROR_MESSAGES, AdminPage(), dynamic, GET(), AdminTeamRow, loadAdminMember() (+9 more)

### Community 25 - "Datenbankhelfer und Audit-Log"
Cohesion: 0.10
Nodes (19): dynamic, VALID_TIERS, PATCH, dynamic, DELETE, dynamic, PUT, DELETE (+11 more)

### Community 9 - "Admin-Route-Wrapper und CRUD-Routen"
Cohesion: 0.12
Nodes (15): dynamic, GuildRow, GET, dynamic, AuditRow, GET, dynamic, GET (+7 more)

### Community 48 - "Verify-Session und Discord-OAuth"
Cohesion: 0.22
Nodes (11): dynamic, GET(), ADMINISTRATOR, isAdmin(), GET(), GET(), POST(), getSecret() (+3 more)

### Community 6 - "Admin-CRUD ueber die Tebex Plugin API"
Cohesion: 0.11
Nodes (22): dynamic, GET, POST, dynamic, GET, POST, dynamic, GET (+14 more)

### Community 23 - "Route-Integrationstests"
Cohesion: 0.16
Nodes (12): dynamic, PUT, dynamic, VALID_STATUS, PaymentStatus, PATCH, POST, TEAM_MANAGE (+4 more)

### Community 2 - "DB-Zugriff, Rate-Limits und Guild-Guards"
Cohesion: 0.05
Nodes (75): GET(), DELETE(), POST(), POST(), POST(), GET(), getBasketCreateAuth(), TEBEX_BASE (+67 more)

### Community 18 - "Bot-Dashboard-Reverse-Proxy"
Cohesion: 0.10
Nodes (33): runtime, dynamic, GET(), runtime, dynamic, HOP_BY_HOP, bounce(), handle() (+25 more)

### Community 69 - "Discord-Health-Route"
Cohesion: 0.33
Nodes (4): dynamic, StatusResponse, IncidentsResponse, SEVERITY

### Community 49 - "Giveaway-Statistiken"
Cohesion: 0.18
Nodes (13): dynamic, GET(), dynamic, metadata, GiveawayStatsPage(), getGiveawayPool(), giveawayQuery(), giveawayQueryOne() (+5 more)

### Community 28 - "Giveaway-Dashboard und Steuerkanal"
Cohesion: 0.16
Nodes (15): ACTION_PATH, POST(), ALLOWED, GwListItem, GET(), DashboardClient(), dynamic, metadata (+7 more)

### Community 1 - "Giveaway-Verify und Session"
Cohesion: 0.16
Nodes (18): ADMINISTRATOR, isAdmin(), GET(), POST(), dynamic, metadata, BotGuild, GiveawayVerifyPage() (+10 more)

### Community 7 - "Resource-Stats (fivestats)"
Cohesion: 0.17
Nodes (14): dynamic, GET(), RESOURCE_STATS_GAME, RESOURCE_STATS_PERIOD_HOURS, RESOURCE_STATS_HEADLINE, ResourceStatEntry, RESOURCE_STATS, FivestatsCurrent (+6 more)

### Community 16 - "Ticketbot-Statistiken"
Cohesion: 0.09
Nodes (26): dynamic, CountRow, AvgRow, SumRow, MaxRow, TierRow, GET(), Stats (+18 more)

### Community 0 - "Transkript-Upload und Guards"
Cohesion: 0.23
Nodes (16): RateLimitRow, RequestBody, AttachmentInput, isValidGuild(), transcriptBasePath(), transcriptUrlPrefix(), checkRateLimit(), reencodeImage() (+8 more)

### Community 105 - "Tier-Vergabe beim Verify"
Cohesion: 0.19
Nodes (10): GuildRow, GuildRow, GuildRow, generateApiKey(), POST(), GuildRow, Guild, TierCard (+2 more)

### Community 103 - "Ticketbot-Dashboard-Session"
Cohesion: 0.20
Nodes (12): GuildRow, POST(), DashboardClient(), dynamic, metadata, DashboardGuild, DashboardPage(), getSecret() (+4 more)

### Community 30 - "Warenkorb und Tebex-Client"
Cohesion: 0.25
Nodes (15): CartPage(), CartDrawer(), H, createBasket(), getBasket(), getAllAuthUrls(), addToBasket(), addGiftToBasket() (+7 more)

### Community 29 - "Kategorie-/Paketlisten und SEO-Metadaten"
Cohesion: 0.24
Nodes (13): revalidate, generateMetadata(), CategoryPage(), generateMetadata(), metadata, DEFAULT_OG_IMAGE, openGraphFor(), HTML_ENTITIES (+5 more)

### Community 14 - "Tebex-Katalog und Sitemap"
Cohesion: 0.24
Nodes (9): generateStaticParams(), generateStaticParams(), revalidate, Entry, STATIC_ROUTES, sitemap(), Catalog(), getCategories() (+1 more)

### Community 21 - "Giveaway-Dashboard"
Cohesion: 0.16
Nodes (17): Dict, Ctx, useCtx(), Role, Channel, Giveaway, Settings, STATUS_STYLE (+9 more)

### Community 31 - "Sprachaufloesung und Ergebnisseite"
Cohesion: 0.18
Nodes (14): dynamic, ResultRow, Winner, parseWinners(), metadata, GiveawayResultPage(), PackagesPage(), giveawayResultTranslations (+6 more)

### Community 12 - "Root-Layout und JSON-LD"
Cohesion: 0.15
Nodes (17): viewport, metadata, RootLayout(), robots(), JsonLd(), serialize(), NextThemesProviderProps, Props (+9 more)

### Community 47 - "Katalog, Paketliste und Shop-Config"
Cohesion: 0.15
Nodes (16): Facet, PRICE_STEPS, priceBucket(), bucketLabel(), tagsOf(), countBy(), PackagesBrowser(), price() (+8 more)

### Community 24 - "Tebex-Typen, Galerie und Suche"
Cohesion: 0.17
Nodes (13): Props, Row, Props, PackageGalleryProps, resolveImages(), PackageGallery(), Props, SearchDialog() (+5 more)

### Community 32 - "Paketdetail, Karten und Preise"
Cohesion: 0.14
Nodes (21): revalidate, PackageDetailPage(), SalePriceFetcher(), resolveImageSrc(), CustomPackageCard(), PackageCard(), Props, PackagePrice() (+13 more)

### Community 35 - "Startseite und Belegzeile"
Cohesion: 0.21
Nodes (12): metadata, HomePage(), CTASection(), Entry, ProofLine(), num(), HeadlineStat, loadHeadlineStat() (+4 more)

### Community 36 - "Resourcen-Statistikseite"
Cohesion: 0.14
Nodes (13): formatNum(), formatSigned(), TrendBadge(), ResourceCard(), ResourcesClient(), dynamic, metadata, ResourcesPage() (+5 more)

### Community 19 - "Rechtstexte und Markdown-Renderer"
Cohesion: 0.20
Nodes (16): metadata, ImprintPage(), metadata, TermsPage(), metadata, PrivacyPage(), Props, LegalContent() (+8 more)

### Community 34 - "Ticketbot-Dashboard"
Cohesion: 0.20
Nodes (8): BotConfigEditor, TranscriptsCard, safeDomainHref(), Props, T, TIER_COLORS, TabKey, GuildPanel()

### Community 26 - "Dashboard-Texte, Transkripte, Bot-Steuerung"
Cohesion: 0.14
Nodes (13): TranscriptItem, Query, EMPTY_QUERY, formatBytes(), safeUrl(), TranscriptsCard(), BotStatus, Msg (+5 more)

### Community 107 - "Ticketbot-Landingpage"
Cohesion: 0.22
Nodes (10): metadata, HIGHLIGHTS, HubCard, HUB_CARDS, FEATURES, VERIFY_STEPS, mb(), TIER_CARDS (+2 more)

### Community 20 - "Ticketbot-Verify-Flow"
Cohesion: 0.16
Nodes (9): StepIndicator(), Props, TIER_LABELS, VerifyClient(), dynamic, metadata, VerifyPage(), translations (+1 more)

### Community 17 - "Uebersetzungen und Hero-Sektionen"
Cohesion: 0.18
Nodes (12): Bots, Hero(), STEP_ICONS, HowItWorks(), ReleaseFeed(), WhyMSK(), LangContextValue, HOME_FEATURE_ICONS (+4 more)

### Community 22 - "Gratis-Scripts und Web-Tools"
Cohesion: 0.29
Nodes (7): HOMEPAGE_TOOL_IDS, CustomPackages(), FIVEM_SCRIPT_IDS, FreeScripts(), CustomPackage, CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE

### Community 70 - "Footer und Zahlungsmarken"
Cohesion: 0.22
Nodes (3): ECOSYSTEM_LINKS, Footer(), PaymentMarks()

### Community 102 - "Release-Protokoll aus VERSIONS"
Cohesion: 0.47
Nodes (7): VersionsFileEntry, summarize(), newestVersion(), fetchJson(), lastCommitDate(), loadOne(), loadReleases()

### Community 44 - "HTML-Sanitizing der Tebex-Texte"
Cohesion: 0.39
Nodes (6): OPTIONS, EMOJI, replaceEmojiShortcodes(), splitPipeRow(), convertPipeTables(), sanitizeTebexHtml()

### Community 33 - "Middleware: CSP und Rate-Limits"
Cohesion: 0.22
Nodes (12): RateRule, RATE_RULES, BODY_LIMIT_PREFIXES, Bucket, buckets, clientIp(), isRateLimited(), sweep() (+4 more)

### Community 3 - "Dev-Dependencies und Build-Setup"
Cohesion: 0.04
Nodes (46): name, version, private, scripts, dev, build, start, lint (+38 more)

### Community 5 - "Runtime-Dependencies"
Cohesion: 0.05
Nodes (39): dependencies, @fontsource-variable/inter, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, @fontsource-variable/jetbrains-mono, @radix-ui/react-dialog, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu (+31 more)

### Community 46 - "Cleanup-Cron"
Cohesion: 0.29
Nodes (7): { rm, readdir, stat }, { execFile }, { promisify }, path, mysql, execFileAsync, main()

### Community 60 - "Transkript-Bilder-Reparatur"
Cohesion: 0.38
Nodes (6): { readFile, writeFile }, path, mysql, parseArgs(), filenameFromUrl(), main()

### Community 41 - "Stripe-Abgleich-Cron"
Cohesion: 0.31
Nodes (8): mysql, { execFile }, { promisify }, execFileAsync, DRY_RUN, resolveTierFromPrice(), isActiveStatus(), main()

### Community 104 - "Tebex-Kennzahlen-Cron"
Cohesion: 0.43
Nodes (6): mysql, DRY_RUN, log(), fetchAllPayments(), aggregate(), main()

### Community 101 - "Kontrast-Tests der Farbtokens"
Cohesion: 0.31
Nodes (9): CSS, readTokens(), channels(), linear(), luminance(), contrast(), mix(), light (+1 more)

### Community 112 - "Route-Wachen-Test"
Cohesion: 0.22
Nodes (5): API_DIR, GUARDS, PUBLIC_BY_DESIGN, ROUTES, DB_ROUTES

### Community 8 - "TypeScript-Konfiguration"
Cohesion: 0.07
Nodes (26): compilerOptions, lib, dom, dom.iterable, esnext, allowJs, skipLibCheck, strict (+18 more)

### Community 78 - "Contributing und Code of Conduct"
Cohesion: 0.67
Nodes (3): Pull Request Template, Code of Conduct (Contributor Covenant), Contributing Guide

### Community 11 - "CI-Pipeline und Deploy-Gate"
Cohesion: 0.11
Nodes (24): CI Workflow (msk-shop), CI Job: Lint, CI Job: Typecheck, CI Job: Test, CI Job: Audit (production tree), CI Job: Build, Dependabot Secret Fallback Placeholders, Production-Tree-Only Audit Gate (+16 more)

### Community 79 - "Coverage-Workflow"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 71 - "Codeberg-Mirror-Workflow"
Cohesion: 0.40
Nodes (5): Mirror to Codeberg Workflow, Push to Codeberg Job, Mirror Runs Only on Main and Tags, Prune-Based Exact Mirror, Codeberg Mirror Secrets

### Community 76 - "MSK Source Available License"
Cohesion: 0.50
Nodes (4): MSK Source Available License (MSK-SAL v1.0), Protected Components (Verify System, Dashboard, Shop/Website Design), Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version)

### Community 13 - "Projektdoku und Tebex-API-Referenz"
Cohesion: 0.11
Nodes (24): MSK Scripts Shop (headless storefront), Ticket Bot Tiers (basic/premium/premium_plus), Server-side git deploy (CI-gated), README Security Summary, Security Policy (SECURITY.md), Accepted finding: CodeQL js/http-to-file-access, Transcript upload hardening, Impressum (DE) (+16 more)

### Community 37 - "Datenschutzerklaerung (EN/DE)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), Ihre Rechte nach der DSGVO, Privacy Policy (EN), Responsible Party (Moritz Kohm), netcup GmbH Hosting and DPA, GDPR Data Subject Rights (Art. 15-21), Legal Bases for Processing (Art. 6 GDPR) (+3 more)

### Community 61 - "Giveaway-Bot-Datenverarbeitung"
Cohesion: 0.40
Nodes (6): Giveaway Bot: Detaillierte Verarbeitung, Data Collected by the Giveaway Bot, Giveaway Data Retention (Deleted on Bot Removal), Anonymous Public Statistics Page, Giveaway Web Dashboard (Discord OAuth), Giveaway Dashboard Session Cookies

### Community 51 - "Shop-Datenverarbeitung (Tebex)"
Cohesion: 0.29
Nodes (7): Data Collected by the Shop, Tebex Payment Processing (Shop), Basket localStorage and sessionStorage, MSK Scripts Shop, Tebex Limited (Merchant of Record), Returns & Refunds (Digital Goods), Discord ID and Membership Requirement

### Community 62 - "Transkript-Dienst-Datenverarbeitung"
Cohesion: 0.33
Nodes (6): Data Collected by the Transcript Service, Discord OAuth Verification and Guild Record, Stripe Subscription Webhook, Stripe Payments Europe, Ltd., Ticket Bot Session Cookies, Third Country Transfers (UK Adequacy, SCCs)

### Community 39 - "Hosted-Bot-Verwaltung (AGB)"
Cohesion: 0.25
Nodes (9): Transcript Storage and Tier Retention, Attachment Storage (Premium and Premium+), Hosted Bot Management Data and Access Control, Storage Period Table, Hosted Bot Management Service, Subscription Tiers (Basic / Premium / Premium+), Operator Access to Hosted Bot Credentials, Hosted Bot Customer Responsibilities (+1 more)

### Community 50 - "Stripe-Abrechnung und Custom Domain"
Cohesion: 0.33
Nodes (7): Custom Domain: Certbot and Certificate Transparency, Abonnement und Zahlung (Stripe, Testphase), Stripe Subscription Billing, 14-Day Free Trial, Cancellation and Downgrade, Custom Domain for Transcript Delivery, Let's Encrypt SSL Certificate

### Community 42 - "Transkript-Dienst (Rechtstext)"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, MSK Ticket Bot Transcript Service, Transcript Service API Key, Transcript Content and Responsibility, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, Limitation of Liability

### Community 43 - "AGB und Lizenzbedingungen"
Cohesion: 0.25
Nodes (8): Nutzungsbedingungen (DE), Lizenzbedingungen (Einzelserver-Lizenz), Anwendbares Recht (Bundesrepublik Deutschland), Terms & Conditions (EN), Single-Server License Terms, FiveM Asset Escrow System, CFX.re Account Requirement, Governing Law (Federal Republic of Germany)

### Community 75 - "Leistungsumfang Giveaway-Bot"
Cohesion: 0.50
Nodes (4): Scope of Services, MSK Giveaway Bot, Giveaway Bot Acceptable Use, Server Operator Responsibility for Giveaways

### Community 52 - "Ticketbot-Marketingbanner"
Cohesion: 0.52
Nodes (7): Discord Ticket Bot Marketing Banner, Discord Ticket Bot (Product), Tagline: Advanced, modular & open source, Create Ticket Panel / Open Ticket Button, Ticket Status Workflow (In Progress / Resolved), Ticket Transcript / Support Ticket Card, MSK Dark Theme with Green Accent Visual Style

### Community 72 - "Kanbanly-Marketingbanner"
Cohesion: 0.70
Nodes (5): Kanbanly Marketing Banner (dark, 1200x630 OG-style), Kanbanly (minimalist Kanban tool), Tagline: "Flow first. Build fast.", Claim: Minimalistisches Kanban-Tool, DSGVO-konform, Kostenlos, Kanban board glyph logo (indigo rounded tile, 3x4 card grid)

### Community 54 - "Kanbanly-Logo"
Cohesion: 0.33
Nodes (7): Kanbanly Logo (Horizontal Lockup), Kanbanly (Brand), Rounded-Square Kanban Grid Icon, Lowercase Bold Sans Wordmark 'kanbanly', Kanban Board Concept (3-Column Task Cards), Indigo/Periwinkle Brand Color with White Tint Steps, Custom Package Brand Asset in public/

### Community 53 - "Kanbanly-Hero"
Cohesion: 0.43
Nodes (7): Kanbanly Hero Banner, Kanbanly Project Management Tool, Workspaces, Boards and Cards with Labels, Due Dates and Assignments, Drag & Drop with Live Saving, Zum Dashboard Call-to-Action, Dark Navy Background with Purple Accent Branding, Custom Package Banner Asset (public/)

### Community 73 - "MSK-Scripts-Logo"
Cohesion: 0.60
Nodes (5): MSK Scripts Logo (green M mark), MSK Scripts Brand Identity, MSK Green Accent Color Palette, Angular Geometric Monogram Style, Site Branding Asset (favicon, header, metadata)

### Community 45 - "Giveaway-Bot-Banner"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, MSK.GiveawayBot (Discord Giveaway Bot), MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Slash Commands and Modals Feature, Discord.js v14 Tech Badge, Prisma Tech Badge, Dark Green Tech Banner Visual Style

### Community 68 - "Dokumentations-Banner"
Cohesion: 0.60
Nodes (6): MSK.DOCS Official Documentation Banner, MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs, API Reference, Dark Green Tech Visual Style (monospace uppercase, accent green)

### Community 40 - "Social-Banner der Marke"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, MSK.SCRIPTS Wordmark and M Logo, Tagline: Scripts, Tools & Discord bots for servers that want more., FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Discord Bots Offering (+1 more)

### Community 58 - "MSK-Ticketbot-Banner"
Cohesion: 0.52
Nodes (7): MSK Ticket Bot Marketing Banner, MSK.TICKETBOT (Discord Ticket Bot), Multi-Category Support Tickets, HTML Transcripts, Discord.js v14, SQLite, MSK Scripts Green M Logo / Brand Style

### Community 63 - "msk_core-Banner"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, MSK.CORE (msk_core), Core Framework / Core Library Claim, ESX Framework Support, QBCore Framework Support, MSK Scripts Brand Identity (green M mark, dark theme)

### Community 64 - "msk_enginetoggle-Banner"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, msk_enginetoggle (Vehicle System Script), Manual Engine Control for Vehicle Roleplay, ESX Framework Support, QBCore Framework Support, MSK Scripts Brand Identity (Green M Logo, Dark Theme)

### Community 55 - "MSK-Forms-Screenshot"
Cohesion: 0.48
Nodes (7): MSK Forms Hero Screenshot, Application Forms Product, Live Status Loop (Submitted / Picked up by a reviewer / Decision), Submission Status Card with Reviewer Note, Discord Bot Invite Integration, Open Dashboard / Demo Form CTAs, MSK Dark Theme with Green Accent

### Community 56 - "msk_fuel-Banner"
Cohesion: 0.52
Nodes (7): msk_fuel Marketing Banner, MSK.FUEL (msk_fuel), Vehicle System Category, Realistic Fuel Consumption, Refueling & Station Logic, ESX Framework Support, QBCore Framework Support, MSK Scripts Brand Identity (green M monogram, dark theme)

### Community 65 - "msk_garage-Banner"
Cohesion: 0.60
Nodes (6): msk_garage Marketing Banner, MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage, Full Garage Management, ESX Framework Support, MSK Scripts Brand Identity (M logo, dark green)

### Community 66 - "Giveaway-Bot (Produkt)"
Cohesion: 0.40
Nodes (6): Discord Giveaway Bot Marketing Banner, Discord Giveaway Bot (Product), Multilingual Support Claim, Per-Guild Configurable Claim, discord.js v14 (Tech Stack Claim), MSK Dark Theme with Green Accent Visual Style

### Community 67 - "msk_givevehicle-Banner"
Cohesion: 0.53
Nodes (6): msk_givevehicle Marketing Banner, msk_givevehicle (FiveM Admin Tool), Claim: Spawn & gift any vehicle to players in seconds, ESX Framework Support Badge, QBCore Framework Support Badge, MSK Scripts Brand Identity (M logo, green-on-dark)

### Community 57 - "msk_handcuffs-Banner"
Cohesion: 0.48
Nodes (7): msk_handcuffs Marketing Banner, msk_handcuffs (FiveM Roleplay Restraint Script), Roleplay System (eyebrow claim), Realistic Restraints, Escort & Struggle Mechanics, ESX Framework Support Badge, QBCore Framework Support Badge, MSK Scripts Brand Identity (green M logo, dark green gradient, mono type)

### Community 74 - "MSK Paste"
Cohesion: 0.60
Nodes (5): MSK Paste Screenshot, MSK Paste (Self-hosted Pastebin), Syntax Highlighting, Paste Creation Form (Title + Content, 1 MB limit), MSK Dark Theme with Green Accent

### Community 77 - "MSK Shortener"
Cohesion: 0.67
Nodes (4): MSK Shortener Hero Screenshot, MSK URL Shortener (privacy-friendly, no signup), Long URL Input Form Card, Dark Theme with MSK Green Accent Headline

### Community 59 - "msk_vehiclekeys-Banner"
Cohesion: 0.52
Nodes (7): msk_vehiclekeys Marketing Banner, MSK.VEHICLEKEYS (msk_vehiclekeys), Vehicle System Category, Secure Key Ownership: Lock, Share and Hotwire Vehicles, ESX Framework Support, QBCore Framework Support, MSK Scripts Brand Identity (M Logo, Dark Green Palette)

## Knowledge Gaps
- **409 isolated node(s):** `ALL_TABS`, `Tier`, `ApiKey`, `TIER_LABELS`, `TIER_ORDER` (+404 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `DB-Zugriff, Rate-Limits und Guild-Guards` to `Transkript-Upload und Guards`, `Ticketbot-Dashboard-Session`, `Admin-Route-Wrapper und CRUD-Routen`, `Tier-Vergabe beim Verify`, `Admin-Login und Session`, `Ticketbot-Statistiken`, `Route-Integrationstests`, `Datenbankhelfer und Audit-Log`, `Admin-Rechte und Team-Verwaltung`, `Giveaway-Dashboard und Steuerkanal`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `queryOne()` connect `Datenbankhelfer und Audit-Log` to `Transkript-Upload und Guards`, `DB-Zugriff, Rate-Limits und Guild-Guards`, `Startseite und Belegzeile`, `Ticketbot-Dashboard-Session`, `Tier-Vergabe beim Verify`, `Admin-Login und Session`, `Ticketbot-Statistiken`, `Verify-Session und Discord-OAuth`, `Route-Integrationstests`, `Admin-Rechte und Team-Verwaltung`, `Sprachaufloesung und Ergebnisseite`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Button` connect `UI-Bausteine und Giveaway-Landingpage` to `Paketdetail, Karten und Preise`, `Ticketbot-Dashboard`, `Startseite und Belegzeile`, `Admin-Dashboard: Tabs und Hooks`, `Resourcen-Statistikseite`, `Footer und Zahlungsmarken`, `Header, Sprachumschaltung, Utilities`, `Ticketbot-Landingpage`, `Admin-Login und Session`, `Uebersetzungen und Hero-Sektionen`, `In-den-Warenkorb-Button`, `Ticketbot-Verify-Flow`, `Giveaway-Dashboard`, `Dashboard-Texte, Transkripte, Bot-Steuerung`, `Kategorie-/Paketlisten und SEO-Metadaten`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `ALL_TABS`, `Tier`, `ApiKey` to the rest of the system?**
  _409 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI-Bausteine und Giveaway-Landingpage` be split into smaller, more focused modules?**
  _Cohesion score 0.0708245243128964 - nodes in this community are weakly interconnected._
- **Should `Admin-Dashboard: Tabs und Hooks` be split into smaller, more focused modules?**
  _Cohesion score 0.09966777408637874 - nodes in this community are weakly interconnected._
- **Should `Header, Sprachumschaltung, Utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.1014799154334038 - nodes in this community are weakly interconnected._