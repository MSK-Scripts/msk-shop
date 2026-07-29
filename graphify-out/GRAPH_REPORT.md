# Graph Report - .  (2026-07-29)

## Corpus Check
- 72 files · ~144,860 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1256 nodes · 2063 edges · 133 communities (99 shown, 34 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.86)
- Token cost: 2,795,000 input · 62,000 output

## Community Hubs (Navigation)
- Package Catalog UI
- Page Metadata & Routing
- Homepage & Resource Stats
- Build Tooling Config
- Admin API Routes
- Runtime Dependencies
- Ticketbot Verify Flow
- Basket & Coupon Routes
- Legal, Ownership & Admin Model
- TypeScript Config
- Ticketbot Dashboard
- Admin Tebex Tabs
- Transcripts & Home Sections
- Bot Dashboard Proxy
- Account & Admin Panels
- Admin Auth
- Cart & Checkout Pages
- Giveaway Dashboard
- Hosted Bot Control
- Transcript Upload
- Admin Team Management
- Admin Shell & API Keys
- API Key Issuing & Sessions
- Audit Log & DB Pool
- Discord Health & Sessions
- Transcript Query & Guild Auth
- page cluster
- terms cluster
- middleware cluster
- rateLimit cluster
- route cluster
- page cluster
- route cluster
- route cluster
- route cluster
- ci.yml cluster
- msk_garage-banner cluster
- route cluster
- page cluster
- privacy cluster
- page cluster
- privacy cluster
- markdown cluster
- msk-scripts-server-banner cluster
- stripe-reconcile cluster
- StatsClient cluster
- StatsClient cluster
- privacy cluster
- privacy cluster
- sanitize cluster
- msk-giveaway-bot-banner cluster
- cleanup cluster
- route cluster
- stripe cluster
- discord_ticketbot_banner cluster
- kanbanly cluster
- kanbanly-logo cluster
- msk_forms cluster
- msk_fuel-banner cluster
- msk_handcuffs-banner cluster
- msk-ticket-bot-banner cluster
- msk_vehiclekeys-banner cluster
- repair-transcript-images cluster
- auth cluster
- privacy cluster
- msk_core-banner cluster
- msk_enginetoggle-banner cluster
- msk_giveawaybot_banner cluster
- msk-scripts-docs-banner cluster
- route cluster
- eslint.config.mjs cluster
- mirror.yml cluster
- kanbanly-banner cluster
- logo cluster
- msk_paste cluster
- route cluster
- route cluster
- page cluster
- ThemeProvider cluster
- LICENSE cluster
- msk_shortener cluster
- route cluster
- route cluster
- route cluster
- route cluster
- page cluster
- page cluster
- page cluster
- page cluster
- page cluster
- page cluster
- CODE_OF_CONDUCT cluster
- terms cluster
- auth cluster
- deploy cluster
- vhost-create cluster
- privacy cluster
- dependabot.yml cluster
- bug_report cluster
- deploy.yml cluster
- next.config cluster
- vhost-delete cluster
- tailwind.config cluster
- auth cluster
- route cluster
- route cluster
- route cluster
- route cluster
- route cluster
- route cluster
- route cluster
- terms cluster
- release.yml cluster
- mskanban cluster

## God Nodes (most connected - your core abstractions)
1. `cn()` - 33 edges
2. `Button` - 25 edges
3. `Card` - 25 edges
4. `query()` - 22 edges
5. `useLang()` - 19 edges
6. `adminRoute()` - 17 edges
7. `queryOne()` - 17 edges
8. `Lang` - 17 edges
9. `useCart()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `parseSession()`  [EXTRACTED]
  app/api/verify/check-guild/route.ts → lib/session.ts
- `GuildRow` --references--> `Tier`  [EXTRACTED]
  app/api/verify/complete/route.ts → lib/tiers.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/giveaway/stats/StatsClient.tsx → lib/utils.ts
- `ResourcesClient()` --calls--> `useLang()`  [EXTRACTED]
  app/resources/ResourcesClient.tsx → components/i18n/LangProvider.tsx
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/stats/StatsClient.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Transcript Service Subscription Lifecycle (Stripe, Tiers, Retention, Domain)** — content_legal_terms_subscription_and_payment, content_legal_terms_subscription_tiers, content_legal_terms_cancellation_and_downgrade, content_legal_privacy_stripe_subscription_webhook, content_legal_privacy_custom_domain, content_legal_privacy_transcript_storage [INFERRED 0.85]
- **Verification to Transcript Upload Flow** — content_legal_privacy_discord_oauth_verification, content_legal_privacy_session_cookies, content_legal_privacy_api_key, content_legal_privacy_transcript_storage, content_legal_privacy_attachment_storage [INFERRED 0.85]
- **Giveaway Bot Public Surface and Data Minimisation** — content_legal_privacy_giveaway_bot, content_legal_privacy_public_results_pages, content_legal_privacy_public_statistics_page, content_legal_privacy_giveaway_dashboard, content_legal_privacy_giveaway_data_retention, content_legal_terms_server_operator_responsibility [INFERRED 0.85]
- **Main/PR Quality-Gate Workflows** — github_workflows_ci_ci, github_workflows_code_coverage_code_coverage, github_workflows_codeql_codeql_advanced [INFERRED 0.75]
- **CI/CD Pipeline (CI gates Deploy)** — github_workflows_deploy, github_workflows_dependency_review [INFERRED 0.75]
- **Contribution Governance Docs** — contributing, code_of_conduct, github_pull_request_template, github_issue_template_bug_report, github_issue_template_feature_request [INFERRED 0.75]
- **Tebex admin dashboard: Plugin API behind own Discord-ID permission gate + audit** — docs_admin_dashboard_plan, docs_admin_dashboard_permissions, docs_admin_dashboard_schema, docs_tebex_api_reference_plugin_api [EXTRACTED 0.90]
- **CI-gated server-side git deploy via ForceCommand-pinned key** — readme_ci_cd_deploy, docs_deployment_deploy_sh, docs_deployment_forcecommand_key [EXTRACTED 0.90]
- **Payment providers: Tebex (shop MoR) + Stripe (Ticket Bot subscriptions)** — content_legal_entity_tebex, content_legal_entity_stripe, content_legal_imprint [EXTRACTED 0.85]

## Communities (133 total, 34 thin omitted)

### Community 0 - "Package Catalog UI"
Cohesion: 0.06
Nodes (48): GET, FeaturedPackages(), PackageCard(), Props, PackagePrice(), Props, SalePriceFetcher(), Props (+40 more)

### Community 1 - "Page Metadata & Routing"
Cohesion: 0.07
Nodes (37): CategoryPage(), generateMetadata(), metadata, RootLayout(), viewport, generateMetadata(), PackageDetailPage(), metadata (+29 more)

### Community 2 - "Homepage & Resource Stats"
Cohesion: 0.07
Nodes (35): GET(), HomePage(), metadata, metadata, ResourcesPage(), formatNum(), formatSigned(), ResourceCard() (+27 more)

### Community 3 - "Build Tooling Config"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+38 more)

### Community 4 - "Admin API Routes"
Cohesion: 0.09
Nodes (31): ACTION_PATH, POST(), ADMINISTRATOR, GET(), isAdmin(), ALLOWED, GET(), GwListItem (+23 more)

### Community 5 - "Runtime Dependencies"
Cohesion: 0.05
Nodes (39): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, js-cookie, lucide-react, mysql2, next, next-themes (+31 more)

### Community 6 - "Ticketbot Verify Flow"
Cohesion: 0.10
Nodes (24): DashboardClient(), Guild, VerifyClient(), Props, StepIndicator(), TIER_LABELS, VerifyClient(), LangContext (+16 more)

### Community 7 - "Basket & Coupon Routes"
Cohesion: 0.11
Nodes (23): GET, POST, DELETE, GET, POST, DELETE, PUT, GET (+15 more)

### Community 8 - "Legal, Ownership & Admin Model"
Cohesion: 0.10
Nodes (28): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+20 more)

### Community 9 - "TypeScript Config"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 10 - "Ticketbot Dashboard"
Cohesion: 0.09
Nodes (16): BotConfigEditor, Guild, GuildPanel(), Props, safeDomainHref(), T, TabKey, TIER_COLORS (+8 more)

### Community 11 - "Admin Tebex Tabs"
Cohesion: 0.12
Nodes (11): BanEntry, CatalogItem, Coupon, LookupPayment, LookupResult, Package, CatalogPackage, PAGE_SIZES (+3 more)

### Community 12 - "Transcripts & Home Sections"
Cohesion: 0.12
Nodes (11): formatBytes(), safeUrl(), TranscriptItem, TranscriptsCard(), Kpi, ECOSYSTEM_LINKS, HOME_FEATURE_ICONS, homeTranslations (+3 more)

### Community 13 - "Bot Dashboard Proxy"
Cohesion: 0.21
Nodes (18): GET(), bounce(), handle(), HOP_BY_HOP, RFC-7230, makeToken(), PROXY_HOST, PROXY_SESSION_MAX_AGE_S (+10 more)

### Community 14 - "Account & Admin Panels"
Cohesion: 0.13
Nodes (6): AuditEntry, GiftCard, Card, CardFooter, CardHeader, CardProps

### Community 15 - "Admin Auth"
Cohesion: 0.21
Nodes (12): GET(), AdminAuthResult, AdminTeamRow, authorizeAdmin(), loadAdminMember(), memberHasPermission(), AdminSession, getSecret() (+4 more)

### Community 16 - "Cart & Checkout Pages"
Cohesion: 0.18
Nodes (10): CartPage(), CheckoutContent(), CartDrawer(), Button, ButtonProps, ButtonSize, ButtonVariant, sizeClasses (+2 more)

### Community 17 - "Giveaway Dashboard"
Cohesion: 0.16
Nodes (17): Channel, CreateForm(), Ctx, Dict, EditButton(), ExtendButton(), Giveaway, GiveawaysTab() (+9 more)

### Community 18 - "Hosted Bot Control"
Cohesion: 0.20
Nodes (13): ALLOWED_ACTIONS, authHosted(), botDir(), execAsync, GET(), POST(), authHosted(), GET() (+5 more)

### Community 19 - "Transcript Upload"
Cohesion: 0.23
Nodes (15): AttachmentInput, checkRateLimit(), GuildRow, isValidGuild(), POST(), RateLimitRow, reencodeImage(), RequestBody (+7 more)

### Community 20 - "Admin Team Management"
Cohesion: 0.19
Nodes (8): Member, DELETE, PATCH, ADMIN_PERMISSIONS, AdminPermission, isAdminPermission(), parseAdminPermissions(), PERMISSION_LABELS

### Community 21 - "Admin Shell & API Keys"
Cohesion: 0.14
Nodes (11): ALL_TABS, TabDef, ApiKey, ApiKeysTab(), maskKey(), Tier, TIER_LABELS, TIER_ORDER (+3 more)

### Community 22 - "API Key Issuing & Sessions"
Cohesion: 0.25
Nodes (11): generateApiKey(), GuildRow, POST(), GuildRow, POST(), DashboardSession, getSecret(), parseDashboardSession() (+3 more)

### Community 23 - "Audit Log & DB Pool"
Cohesion: 0.24
Nodes (10): AuditRow, GET, authorized(), POST(), getPool(), query(), withTransaction(), archiveHostedBot() (+2 more)

### Community 24 - "Discord Health & Sessions"
Cohesion: 0.27
Nodes (9): GET(), ADMINISTRATOR, GET(), isAdmin(), GET(), DiscordGuild, generateState(), getSecret() (+1 more)

### Community 25 - "Transcript Query & Guild Auth"
Cohesion: 0.26
Nodes (10): POST(), GET(), parseDate(), parsePositiveInt(), TranscriptRow, authorizeGuild(), DashboardGuild, getDashboardUserId() (+2 more)

### Community 26 - "page cluster"
Cohesion: 0.24
Nodes (10): GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, giveawayResultTranslations, isSupportedLang(), parseAcceptLanguage() (+2 more)

### Community 27 - "terms cluster"
Cohesion: 0.18
Nodes (13): Datenschutzerklärung (DE), .env Credential Storage on MSK Servers, Hosted Bot Management, Privacy Policy (EN), Access to Configuration Data and Credentials, Customer Responsibilities (Discord ToS Compliance), Nutzungsbedingungen (DE), Giveaway Bot Acceptable Use (+5 more)

### Community 28 - "middleware cluster"
Cohesion: 0.22
Nodes (12): BODY_LIMIT_PREFIXES, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited(), middleware() (+4 more)

### Community 29 - "rateLimit cluster"
Cohesion: 0.29
Nodes (8): GET, AdminCtx, adminRoute(), AdminTeamMember, getClientIp(), rateLimit(), RateLimitOptions, requests

### Community 30 - "route cluster"
Cohesion: 0.26
Nodes (7): GuildRow, POST(), GuildRow, getExpiresAt(), Tier, TIER_CONFIG, TierConfig

### Community 31 - "page cluster"
Cohesion: 0.20
Nodes (11): FEATURES, HIGHLIGHTS, HUB_CARDS, HubCard, mb(), metadata, TicketBotPage(), TIER_CARDS (+3 more)

### Community 32 - "route cluster"
Cohesion: 0.25
Nodes (8): PUT, PATCH, PaymentStatus, VALID_STATUS, adminReq(), DbMember, serveAdminTeam(), staticCtx

### Community 33 - "route cluster"
Cohesion: 0.22
Nodes (9): authorized(), POST(), ResultRow, WinnerIn, extractApiKey(), GET(), GuildRow, UrlRow (+1 more)

### Community 34 - "route cluster"
Cohesion: 0.24
Nodes (8): AvgRow, CountRow, GET(), MaxRow, SumRow, TierRow, getIgnoredApiKeys(), STATS_IGNORED_API_KEYS

### Community 35 - "ci.yml cluster"
Cohesion: 0.18
Nodes (11): CI Build Job, CI Workflow, Dependabot Secret Fallback in CI Build, CI Lint Job, CI Test Job, CI Typecheck Job, Code Coverage Workflow, Coverage Job (+3 more)

### Community 36 - "msk_garage-banner cluster"
Cohesion: 0.31
Nodes (11): msk_garage Marketing Banner, ESX Framework Support, Full Garage Management, MSK Scripts Brand Identity (M logo, dark green), MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage, msk_givevehicle Marketing Banner, ESX Framework Support Badge (+3 more)

### Community 37 - "route cluster"
Cohesion: 0.40
Nodes (8): applySubscription(), downgradeGuild(), GuildIdRow, POST(), resolveInvoiceSubscriptionId(), upsertCustomer(), execFileAsync, teardownCustomDomain()

### Community 38 - "page cluster"
Cohesion: 0.22
Nodes (9): AvgRow, CountRow, EMPTY_STATS, loadStats(), MaxRow, metadata, StatsPage(), SumRow (+1 more)

### Community 39 - "privacy cluster"
Cohesion: 0.20
Nodes (10): Giveaway Data Retention (Delete on Bot Removal), Public Giveaway Results Pages, Abuse Prevention / Rate Limiting, Storage Period Overview, Transcript Storage, Hosting Termination and 14-Day Deletion, Limitation of Liability, Public Transcript URLs (Random UUID, Unlisted) (+2 more)

### Community 40 - "page cluster"
Cohesion: 0.22
Nodes (7): CommandRow, COMMANDS, FEATURES, HIGHLIGHTS, metadata, SETTINGS, STEPS

### Community 41 - "privacy cluster"
Cohesion: 0.22
Nodes (9): CFX.re / FiveM Authentication (Shop), MSK Scripts Shop, Stripe Payments Europe (Subscription Payments), Stripe Subscription Webhook, Tebex Limited (Merchant of Record), Data Transfer to Third Countries, 14-Day Free Trial (Once Per Customer), Shop Payment Processing via Tebex (+1 more)

### Community 42 - "markdown cluster"
Cohesion: 0.33
Nodes (8): ALLOWED_SLUGS, getLegalContent(), inline(), LEGAL_DIR, LegalSlug, renderMarkdown(), renderTable(), row()

### Community 43 - "msk-scripts-server-banner cluster"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 44 - "stripe-reconcile cluster"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 45 - "StatsClient cluster"
Cohesion: 0.32
Nodes (7): Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), GiveawayStats, giveawayStatsTranslations

### Community 46 - "StatsClient cluster"
Cohesion: 0.36
Nodes (7): formatBytes(), formatNum(), StatCard(), Stats, StatsClient(), TierBreakdown(), statsTranslations

### Community 47 - "privacy cluster"
Cohesion: 0.25
Nodes (8): Transcript Service API Key, Discord OAuth Verification Flow, Giveaway Web Dashboard, Language Preference Cookie (msk_lang), No Tracking, No Cookie Consent Banner, httpOnly Session Cookies, MSK Ticket Bot Transcript Service, API Key Terms (One Key Per Discord Server)

### Community 48 - "privacy cluster"
Cohesion: 0.29
Nodes (8): Data Subject Rights Under the GDPR, fivestats.io Resource Statistics, GDPR / DSGVO, MSK Giveaway Bot, Legal Bases for Processing, Public Anonymous Giveaway Statistics Page, Responsible Party (Moritz Kohm), Governing Law (Federal Republic of Germany)

### Community 49 - "sanitize cluster"
Cohesion: 0.39
Nodes (6): convertPipeTables(), EMOJI, OPTIONS, replaceEmojiShortcodes(), sanitizeTebexHtml(), splitPipeRow()

### Community 50 - "msk-giveaway-bot-banner cluster"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 51 - "cleanup cluster"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 52 - "route cluster"
Cohesion: 0.33
Nodes (4): GET, POST, TeamRow, TEAM_MANAGE

### Community 53 - "stripe cluster"
Cohesion: 0.52
Nodes (5): isActiveSubStatus(), periodEndFromSubscription(), priceIdForTier(), priceIdFromSubscription(), resolveTierFromPrice()

### Community 54 - "discord_ticketbot_banner cluster"
Cohesion: 0.52
Nodes (7): Discord Ticket Bot Marketing Banner, Create Ticket Panel / Open Ticket Button, Ticket Status Workflow (In Progress / Resolved), Ticket Transcript / Support Ticket Card, Discord Ticket Bot (Product), MSK Dark Theme with Green Accent Visual Style, Tagline: Advanced, modular & open source

### Community 55 - "kanbanly cluster"
Cohesion: 0.43
Nodes (7): Workspaces, Boards and Cards with Labels, Due Dates and Assignments, Custom Package Banner Asset (public/), Dark Navy Background with Purple Accent Branding, Zum Dashboard Call-to-Action, Drag & Drop with Live Saving, Kanbanly Hero Banner, Kanbanly Project Management Tool

### Community 56 - "kanbanly-logo cluster"
Cohesion: 0.33
Nodes (7): Kanbanly (Brand), Custom Package Brand Asset in public/, Indigo/Periwinkle Brand Color with White Tint Steps, Kanban Board Concept (3-Column Task Cards), Kanbanly Logo (Horizontal Lockup), Rounded-Square Kanban Grid Icon, Lowercase Bold Sans Wordmark 'kanbanly'

### Community 57 - "msk_forms cluster"
Cohesion: 0.48
Nodes (7): Application Forms Product, MSK Dark Theme with Green Accent, Open Dashboard / Demo Form CTAs, Discord Bot Invite Integration, MSK Forms Hero Screenshot, Live Status Loop (Submitted / Picked up by a reviewer / Decision), Submission Status Card with Reviewer Note

### Community 58 - "msk_fuel-banner cluster"
Cohesion: 0.52
Nodes (7): msk_fuel Marketing Banner, ESX Framework Support, Realistic Fuel Consumption, Refueling & Station Logic, MSK Scripts Brand Identity (green M monogram, dark theme), MSK.FUEL (msk_fuel), QBCore Framework Support, Vehicle System Category

### Community 59 - "msk_handcuffs-banner cluster"
Cohesion: 0.48
Nodes (7): msk_handcuffs Marketing Banner, ESX Framework Support Badge, MSK Scripts Brand Identity (green M logo, dark green gradient, mono type), msk_handcuffs (FiveM Roleplay Restraint Script), QBCore Framework Support Badge, Realistic Restraints, Escort & Struggle Mechanics, Roleplay System (eyebrow claim)

### Community 60 - "msk-ticket-bot-banner cluster"
Cohesion: 0.52
Nodes (7): MSK Ticket Bot Marketing Banner, MSK Scripts Green M Logo / Brand Style, HTML Transcripts, Multi-Category Support Tickets, MSK.TICKETBOT (Discord Ticket Bot), Discord.js v14, SQLite

### Community 61 - "msk_vehiclekeys-banner cluster"
Cohesion: 0.52
Nodes (7): msk_vehiclekeys Marketing Banner, ESX Framework Support, MSK Scripts Brand Identity (M Logo, Dark Green Palette), MSK.VEHICLEKEYS (msk_vehiclekeys), QBCore Framework Support, Secure Key Ownership: Lock, Share and Hotwire Vehicles, Vehicle System Category

### Community 62 - "repair-transcript-images cluster"
Cohesion: 0.38
Nodes (6): filenameFromUrl(), main(), mysql, parseArgs(), path, { readFile, writeFile }

### Community 64 - "privacy cluster"
Cohesion: 0.33
Nodes (6): Attachment Storage (Premium and Premium+), Certificate Transparency Log Disclosure, Custom Domain (Apache2 vhost + Let's Encrypt), Cancellation and Downgrade, Custom Domain Terms (Premium), Subscription Tiers (Basic / Premium / Premium+)

### Community 65 - "msk_core-banner cluster"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, Core Framework / Core Library Claim, ESX Framework Support, MSK Scripts Brand Identity (green M mark, dark theme), MSK.CORE (msk_core), QBCore Framework Support

### Community 66 - "msk_enginetoggle-banner cluster"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, ESX Framework Support, Manual Engine Control for Vehicle Roleplay, MSK Scripts Brand Identity (Green M Logo, Dark Theme), msk_enginetoggle (Vehicle System Script), QBCore Framework Support

### Community 67 - "msk_giveawaybot_banner cluster"
Cohesion: 0.40
Nodes (6): Discord Giveaway Bot Marketing Banner, discord.js v14 (Tech Stack Claim), Multilingual Support Claim, Per-Guild Configurable Claim, Discord Giveaway Bot (Product), MSK Dark Theme with Green Accent Visual Style

### Community 68 - "msk-scripts-docs-banner cluster"
Cohesion: 0.60
Nodes (6): API Reference, MSK.DOCS Official Documentation Banner, Dark Green Tech Visual Style (monospace uppercase, accent green), MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs

### Community 69 - "route cluster"
Cohesion: 0.40
Nodes (3): IncidentsResponse, SEVERITY, StatusResponse

### Community 70 - "eslint.config.mjs cluster"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 71 - "mirror.yml cluster"
Cohesion: 0.40
Nodes (5): Codeberg Mirror Secrets, Mirror Runs Only on Main and Tags, Mirror to Codeberg Workflow, Prune-Based Exact Mirror, Push to Codeberg Job

### Community 72 - "kanbanly-banner cluster"
Cohesion: 0.70
Nodes (5): Kanbanly Marketing Banner (dark, 1200x630 OG-style), Kanban board glyph logo (indigo rounded tile, 3x4 card grid), Claim: Minimalistisches Kanban-Tool, DSGVO-konform, Kostenlos, Kanbanly (minimalist Kanban tool), Tagline: "Flow first. Build fast."

### Community 73 - "logo cluster"
Cohesion: 0.60
Nodes (5): Angular Geometric Monogram Style, MSK Green Accent Color Palette, MSK Scripts Brand Identity, MSK Scripts Logo (green M mark), Site Branding Asset (favicon, header, metadata)

### Community 74 - "msk_paste cluster"
Cohesion: 0.60
Nodes (5): Paste Creation Form (Title + Content, 1 MB limit), MSK Dark Theme with Green Accent, MSK Paste (Self-hosted Pastebin), MSK Paste Screenshot, Syntax Highlighting

### Community 75 - "route cluster"
Cohesion: 0.83
Nodes (3): checkDns(), execFileAsync, POST()

### Community 76 - "route cluster"
Cohesion: 0.83
Nodes (3): checkDns(), execFileAsync, POST()

### Community 79 - "LICENSE cluster"
Cohesion: 0.50
Nodes (4): Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version), MSK Source Available License (MSK-SAL v1.0), Protected Components (Verify System, Dashboard, Shop/Website Design)

### Community 80 - "msk_shortener cluster"
Cohesion: 0.67
Nodes (4): Dark Theme with MSK Green Accent Headline, MSK Shortener Hero Screenshot, Long URL Input Form Card, MSK URL Shortener (privacy-friendly, no signup)

### Community 91 - "CODE_OF_CONDUCT cluster"
Cohesion: 0.67
Nodes (3): Code of Conduct (Contributor Covenant), Contributing Guide, Pull Request Template

### Community 92 - "terms cluster"
Cohesion: 0.67
Nodes (3): FiveM Asset Escrow System, Single-Server License Terms, Returns & Refunds (Digital Goods Withdrawal)

## Knowledge Gaps
- **355 isolated node(s):** `AuditEntry`, `BanEntry`, `Coupon`, `CatalogItem`, `GiftCard` (+350 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `queryOne()` connect `route cluster` to `route cluster`, `Admin Auth`, `Admin Team Management`, `API Key Issuing & Sessions`, `Audit Log & DB Pool`, `Transcript Query & Guild Auth`, `page cluster`, `route cluster`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Card` connect `Account & Admin Panels` to `Package Catalog UI`, `Homepage & Resource Stats`, `Ticketbot Verify Flow`, `Admin Tebex Tabs`, `Transcripts & Home Sections`, `StatsClient cluster`, `StatsClient cluster`, `Cart & Checkout Pages`, `Giveaway Dashboard`, `Admin Team Management`, `page cluster`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `cn()` connect `Ticketbot Verify Flow` to `Package Catalog UI`, `Homepage & Resource Stats`, `Admin Tebex Tabs`, `StatsClient cluster`, `StatsClient cluster`, `Account & Admin Panels`, `Cart & Checkout Pages`, `Giveaway Dashboard`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `AuditEntry`, `BanEntry`, `Coupon` to the rest of the system?**
  _355 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Catalog UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06057692307692308 - nodes in this community are weakly interconnected._
- **Should `Page Metadata & Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.07017543859649122 - nodes in this community are weakly interconnected._
- **Should `Homepage & Resource Stats` be split into smaller, more focused modules?**
  _Cohesion score 0.0653061224489796 - nodes in this community are weakly interconnected._