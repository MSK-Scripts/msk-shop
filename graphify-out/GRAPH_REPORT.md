# Graph Report - msk-shop  (2026-08-16)

## Corpus Check
- 273 files · ~168,824 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1517 nodes · 3132 edges · 127 communities (106 shown, 21 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 92 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd0ae023`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- upload/route.ts
- giveawaySession.ts
- getClientIp
- devDependencies
- AdminClient.tsx
- dependencies
- adminApi.ts
- fivestats.ts
- TypeScript-Konfiguration
- stripe/route.ts
- cn
- CI-Pipeline und Deploy-Gate
- layout.tsx
- Projektdoku und Tebex-API-Referenz
- sitemap.ts
- queryOne
- ticketbot/stats/page.tsx
- i18n.ts
- Bot-Dashboard-Reverse-Proxy
- Rechtstexte und Markdown-Renderer
- ticketbot/verify/VerifyClient.tsx
- giveaway/dashboard/DashboardClient.tsx
- CustomPackages.tsx
- [discordUserId]/route.ts
- types/tebex.ts
- query
- BotConfigEditor.tsx
- team/route.ts
- Card.tsx
- packages/[id]/page.tsx
- lib/tebex.ts
- Sprachaufloesung und Ergebnisseite
- resolveDisplayPrice
- Middleware: CSP und Rate-Limits
- Ticketbot-Dashboard
- app/page.tsx
- ResourcesClient.tsx
- Datenschutzerklaerung (EN/DE)
- Button.tsx
- Hosted-Bot-Verwaltung (AGB)
- Social-Banner der Marke
- Stripe-Abgleich-Cron
- Transkript-Dienst (Rechtstext)
- AGB und Lizenzbedingungen
- HTML-Sanitizing der Tebex-Texte
- Giveaway-Bot-Banner
- Cleanup-Cron
- PackagesBrowser.tsx
- ticketbot-copy.ts
- admin/coupons/route.ts
- Stripe-Abrechnung und Custom Domain
- Shop-Datenverarbeitung (Tebex)
- Ticketbot-Marketingbanner
- Kanbanly-Hero
- Kanbanly-Logo
- MSK-Forms-Screenshot
- msk_fuel-Banner
- msk_handcuffs-Banner
- MSK-Ticketbot-Banner
- msk_vehiclekeys-Banner
- Transkript-Bilder-Reparatur
- Giveaway-Bot-Datenverarbeitung
- Transkript-Dienst-Datenverarbeitung
- msk_core-Banner
- msk_enginetoggle-Banner
- msk_garage-Banner
- Giveaway-Bot (Produkt)
- msk_givevehicle-Banner
- Dokumentations-Banner
- Discord-Health-Route
- Footer und Zahlungsmarken
- Codeberg-Mirror-Workflow
- Kanbanly-Marketingbanner
- MSK-Scripts-Logo
- MSK Paste
- Leistungsumfang Giveaway-Bot
- MSK Source Available License
- MSK Shortener
- Contributing und Code of Conduct
- Coverage-Workflow
- Basket-Auth-URLs
- Deploy-Skript
- vhost-create
- Externe Live-Zahlen
- ESLint-Konfiguration
- Dependabot und Dependency-Review
- Issue-Vorlagen
- CodeQL-Workflow
- Deploy-Workflow
- Next.js-Konfiguration
- vhost-delete
- Tailwind-Konfiguration
- Kontrast-Tests der Farbtokens
- Release-Protokoll aus VERSIONS
- JsonLd.tsx
- Tebex-Kennzahlen-Cron
- CouponsTab.tsx
- Shop-Kennzahlen-Test
- botSeo.ts
- Auto-Release-Workflow
- MSKanban-Banner
- Route-Wachen-Test
- GiveawayLanding.tsx
- package.json
- TicketBotLanding.tsx
- schema.sql
- scripts
- ApiKeysTab.tsx
- TranscriptsCard.tsx
- url/route.ts
- @fontsource-variable/inter
- js-cookie
- mysql2
- react
- stripe
- zustand

## God Nodes (most connected - your core abstractions)
1. `cn()` - 44 edges
2. `query()` - 40 edges
3. `Button` - 39 edges
4. `Card` - 33 edges
5. `queryOne()` - 29 edges
6. `Lang` - 29 edges
7. `getClientIp()` - 28 edges
8. `rateLimit()` - 28 edges
9. `useLang()` - 25 edges
10. `authorizeGuild()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/giveaway/stats/StatsClient.tsx → lib/utils.ts
- `StepIndicator()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/verify/VerifyClient.tsx → lib/utils.ts
- `LangContextValue` --references--> `Lang`  [EXTRACTED]
  components/i18n/LangProvider.tsx → lib/i18n.ts
- `TabDef` --references--> `AdminPermission`  [EXTRACTED]
  app/admin/AdminClient.tsx → lib/adminPerms.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI-Gate vor dem Deploy (fünf Jobs müssen grün sein)** — _github_workflows_ci_lint_job, _github_workflows_ci_typecheck_job, _github_workflows_ci_test_job, _github_workflows_ci_audit_job, _github_workflows_ci_build_job, docs_deployment_deploy_workflow [EXTRACTED 1.00]
- **CI/CD Pipeline (CI gates Deploy)** — github_workflows_deploy, github_workflows_dependency_review [INFERRED 0.75]
- **Contribution Governance Docs** — contributing, code_of_conduct, github_pull_request_template, github_issue_template_bug_report, github_issue_template_feature_request [INFERRED 0.75]
- **Payment providers: Tebex (shop MoR) + Stripe (Ticket Bot subscriptions)** — content_legal_entity_tebex, content_legal_entity_stripe, content_legal_imprint [EXTRACTED 0.85]
- **Giveaway Bot data flow: collection, dashboard, public pages, retention** — content_legal_privacy_giveaway_bot_data, content_legal_privacy_giveaway_web_dashboard, content_legal_privacy_giveaway_public_results_page, content_legal_privacy_giveaway_stats_page, content_legal_privacy_giveaway_retention, content_legal_terms_server_operator_responsibility [EXTRACTED 1.00]
- **Transcript Service subscription lifecycle (tier, Stripe, trial, downgrade, domain)** — content_legal_terms_subscription_tiers, content_legal_terms_stripe_billing, content_legal_terms_free_trial, content_legal_terms_cancellation_and_downgrade, content_legal_terms_custom_domain, content_legal_privacy_stripe_subscription_webhook [EXTRACTED 1.00]
- **Hosted bot credential custody and deletion obligations** — content_legal_terms_hosted_bot_management, content_legal_terms_hosted_bot_credentials_access, content_legal_terms_hosting_termination, content_legal_privacy_hosted_bot_data [EXTRACTED 1.00]
- **Tebex admin dashboard: Plugin API behind own Discord-ID permission gate + audit** — docs_admin_dashboard_plan, docs_admin_dashboard_permissions, docs_admin_dashboard_schema, docs_tebex_api_reference_plugin_api [EXTRACTED 0.90]
- **Sicherheitsmodell der Deploy-Kette (Keys, ForceCommand, root-owned scripts)** — docs_deployment_forcecommand_action_key, docs_deployment_readonly_deploy_key_isolation, docs_deployment_permitrootlogin_warning, docs_deployment_vhost_scripts_root_ownership [EXTRACTED 1.00]
- **Umgang mit der dev-only brace-expansion-Advisory** — docs_deployment_npm_no_audit_rationale, docs_deployment_brace_expansion_advisory, docs_deployment_minimatch3_pin, docs_deployment_override_antipattern, _github_workflows_ci_production_tree_audit_gate [EXTRACTED 1.00]

## Communities (127 total, 21 thin omitted)

### Community 0 - "upload/route.ts"
Cohesion: 0.06
Nodes (54): dynamic, GET(), ADMINISTRATOR, GET(), isAdmin(), GET(), AttachmentInput, checkRateLimit() (+46 more)

### Community 1 - "giveawaySession.ts"
Cohesion: 0.05
Nodes (54): ACTION_PATH, OWNER_ACTIONS, POST(), ADMINISTRATOR, GET(), isAdmin(), ALLOWED, GET() (+46 more)

### Community 2 - "getClientIp"
Cohesion: 0.08
Nodes (45): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+37 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+19 more)

### Community 4 - "AdminClient.tsx"
Cohesion: 0.10
Nodes (25): AdminClient(), ALL_TABS, AuditEntry, AuditTab(), BanEntry, BansTab(), GiftCard, GiftCardsTab() (+17 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (27): clsx, @fontsource-variable/jetbrains-mono, lucide-react, next, next-themes, dependencies, clsx, @fontsource-variable/jetbrains-mono (+19 more)

### Community 6 - "adminApi.ts"
Cohesion: 0.08
Nodes (36): dynamic, GET, POST, DELETE, dynamic, DELETE, dynamic, PUT (+28 more)

### Community 7 - "fivestats.ts"
Cohesion: 0.15
Nodes (18): dynamic, GET(), dynamic, metadata, ResourcesPage(), ResourcesClient(), RESOURCE_STATS, RESOURCE_STATS_GAME (+10 more)

### Community 8 - "TypeScript-Konfiguration"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 9 - "stripe/route.ts"
Cohesion: 0.14
Nodes (25): CustomerRow, POST(), applySubscription(), downgradeGuild(), GuildIdRow, POST(), resolveInvoiceSubscriptionId(), upsertCustomer() (+17 more)

### Community 10 - "cn"
Cohesion: 0.10
Nodes (32): StatusBadge(), DashboardClient(), Guild, VerifyClient(), formatBytes(), formatNum(), StatCard(), StatsClient() (+24 more)

### Community 11 - "CI-Pipeline und Deploy-Gate"
Cohesion: 0.11
Nodes (24): CI Job: Audit (production tree), CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck (+16 more)

### Community 12 - "layout.tsx"
Cohesion: 0.19
Nodes (12): metadata, RootLayout(), viewport, robots(), NextThemesProviderProps, Props, ThemeProvider(), Crumb (+4 more)

### Community 13 - "Projektdoku und Tebex-API-Referenz"
Cohesion: 0.11
Nodes (24): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+16 more)

### Community 14 - "sitemap.ts"
Cohesion: 0.19
Nodes (13): dynamic, GET, generateStaticParams(), generateStaticParams(), botLandingEntries(), Entry, revalidate, sitemap() (+5 more)

### Community 15 - "queryOne"
Cohesion: 0.16
Nodes (18): AdminPage(), dynamic, ERROR_MESSAGES, metadata, dynamic, GET(), AdminAuthResult, AdminTeamRow (+10 more)

### Community 16 - "ticketbot/stats/page.tsx"
Cohesion: 0.11
Nodes (20): AvgRow, CountRow, dynamic, GET(), MaxRow, SumRow, TierRow, AvgRow (+12 more)

### Community 17 - "i18n.ts"
Cohesion: 0.26
Nodes (9): STEP_ICONS, ReleaseFeed(), WhyMSK(), HOME_FEATURE_ICONS, SITE_CONFIG, homeTranslations, Lang, TranslationKey (+1 more)

### Community 18 - "Bot-Dashboard-Reverse-Proxy"
Cohesion: 0.10
Nodes (33): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+25 more)

### Community 19 - "Rechtstexte und Markdown-Renderer"
Cohesion: 0.20
Nodes (16): ImprintPage(), metadata, metadata, TermsPage(), metadata, PrivacyPage(), LegalContent(), Props (+8 more)

### Community 20 - "ticketbot/verify/VerifyClient.tsx"
Cohesion: 0.22
Nodes (6): Props, StepIndicator(), TIER_LABELS, VerifyClient(), translations, VerifySession

### Community 21 - "giveaway/dashboard/DashboardClient.tsx"
Cohesion: 0.11
Nodes (30): Channel, CouponFields(), couponPayload(), CreateForm(), Ctx, Dict, EditButton(), ExtendButton() (+22 more)

### Community 22 - "CustomPackages.tsx"
Cohesion: 0.24
Nodes (9): CustomPackageCard(), resolveImageSrc(), CustomPackages(), HOMEPAGE_TOOL_IDS, FIVEM_SCRIPT_IDS, FreeScripts(), CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE (+1 more)

### Community 23 - "[discordUserId]/route.ts"
Cohesion: 0.18
Nodes (11): PUT, POST, DELETE, dynamic, PATCH, POST, TEAM_MANAGE, adminReq() (+3 more)

### Community 24 - "types/tebex.ts"
Cohesion: 0.15
Nodes (13): Props, Row, Props, PackageGallery(), PackageGalleryProps, resolveImages(), Props, SearchDialog() (+5 more)

### Community 25 - "query"
Cohesion: 0.11
Nodes (19): dynamic, PATCH, VALID_TIERS, dynamic, GET, GuildRow, AuditRow, dynamic (+11 more)

### Community 26 - "BotConfigEditor.tsx"
Cohesion: 0.29
Nodes (5): BotConfigEditor(), BotStatus, logLineClass(), Msg, dashboardTranslations

### Community 27 - "team/route.ts"
Cohesion: 0.22
Nodes (11): TabDef, Member, dynamic, GET, TeamRow, AdminCtx, AdminPermission, AdminTeamMember (+3 more)

### Community 28 - "Card.tsx"
Cohesion: 0.16
Nodes (13): price(), Variant(), Badge, BadgeProps, BadgeVariant, variantClasses, Card, CardContent (+5 more)

### Community 29 - "packages/[id]/page.tsx"
Cohesion: 0.22
Nodes (17): CategoryPage(), generateMetadata(), revalidate, generateMetadata(), PackageDetailPage(), revalidate, breadcrumbJsonLd(), productJsonLd() (+9 more)

### Community 30 - "lib/tebex.ts"
Cohesion: 0.20
Nodes (16): CartPage(), CheckoutContent(), CartDrawer(), addGiftToBasket(), addToBasket(), applyCoupon(), createBasket(), getAllAuthUrls() (+8 more)

### Community 31 - "Sprachaufloesung und Ergebnisseite"
Cohesion: 0.18
Nodes (14): dynamic, GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, PackagesPage(), giveawayResultTranslations (+6 more)

### Community 32 - "resolveDisplayPrice"
Cohesion: 0.26
Nodes (9): PackageCard(), PackagePrice(), Props, SalePriceFetcher(), DisplayPrice, resolveDisplayPrice(), SaleData, SalePricesStore (+1 more)

### Community 33 - "Middleware: CSP und Rate-Limits"
Cohesion: 0.22
Nodes (12): BODY_LIMIT_PREFIXES, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited(), middleware() (+4 more)

### Community 34 - "Ticketbot-Dashboard"
Cohesion: 0.20
Nodes (8): BotConfigEditor, GuildPanel(), Props, safeDomainHref(), T, TabKey, TIER_COLORS, TranscriptsCard

### Community 35 - "app/page.tsx"
Cohesion: 0.14
Nodes (15): HomePage(), metadata, Bots, CTASection(), Hero(), HowItWorks(), Entry, ProofLine() (+7 more)

### Community 36 - "ResourcesClient.tsx"
Cohesion: 0.19
Nodes (9): formatNum(), formatSigned(), ResourceCard(), TrendBadge(), HistoryPoint, ResourceLink, ResourceStat, ResourceStatsResult (+1 more)

### Community 37 - "Datenschutzerklaerung (EN/DE)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

### Community 38 - "Button.tsx"
Cohesion: 0.19
Nodes (6): Button, ButtonProps, ButtonSize, ButtonVariant, sizeClasses, variantClasses

### Community 39 - "Hosted-Bot-Verwaltung (AGB)"
Cohesion: 0.25
Nodes (9): Attachment Storage (Premium and Premium+), Hosted Bot Management Data and Access Control, Storage Period Table, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials, Hosted Bot Customer Responsibilities, Hosted Bot Management Service, Hosting Termination and 14-Day Deletion (+1 more)

### Community 40 - "Social-Banner der Marke"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "Stripe-Abgleich-Cron"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "Transkript-Dienst (Rechtstext)"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 43 - "AGB und Lizenzbedingungen"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "HTML-Sanitizing der Tebex-Texte"
Cohesion: 0.39
Nodes (6): convertPipeTables(), EMOJI, OPTIONS, replaceEmojiShortcodes(), sanitizeTebexHtml(), splitPipeRow()

### Community 45 - "Giveaway-Bot-Banner"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "Cleanup-Cron"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "PackagesBrowser.tsx"
Cohesion: 0.15
Nodes (16): bucketLabel(), countBy(), Facet, PackagesBrowser(), PRICE_STEPS, priceBucket(), tagsOf(), metadata (+8 more)

### Community 48 - "ticketbot-copy.ts"
Cohesion: 0.14
Nodes (15): CommandRow, de, en, GIVEAWAY_COPY, GiveawayCopy, de, en, LabelledText (+7 more)

### Community 49 - "admin/coupons/route.ts"
Cohesion: 0.24
Nodes (11): dynamic, GET, POST, countCouponStates(), CouponExpiry, CouponLike, couponState, isCouponActive() (+3 more)

### Community 50 - "Stripe-Abrechnung und Custom Domain"
Cohesion: 0.33
Nodes (7): Custom Domain: Certbot and Certificate Transparency, Cancellation and Downgrade, Custom Domain for Transcript Delivery, Abonnement und Zahlung (Stripe, Testphase), 14-Day Free Trial, Let's Encrypt SSL Certificate, Stripe Subscription Billing

### Community 51 - "Shop-Datenverarbeitung (Tebex)"
Cohesion: 0.29
Nodes (7): Basket localStorage and sessionStorage, Data Collected by the Shop, Tebex Payment Processing (Shop), Discord ID and Membership Requirement, MSK Scripts Shop, Returns & Refunds (Digital Goods), Tebex Limited (Merchant of Record)

### Community 52 - "Ticketbot-Marketingbanner"
Cohesion: 0.52
Nodes (7): Discord Ticket Bot Marketing Banner, Create Ticket Panel / Open Ticket Button, Ticket Status Workflow (In Progress / Resolved), Ticket Transcript / Support Ticket Card, Discord Ticket Bot (Product), MSK Dark Theme with Green Accent Visual Style, Tagline: Advanced, modular & open source

### Community 53 - "Kanbanly-Hero"
Cohesion: 0.43
Nodes (7): Workspaces, Boards and Cards with Labels, Due Dates and Assignments, Custom Package Banner Asset (public/), Dark Navy Background with Purple Accent Branding, Zum Dashboard Call-to-Action, Drag & Drop with Live Saving, Kanbanly Hero Banner, Kanbanly Project Management Tool

### Community 54 - "Kanbanly-Logo"
Cohesion: 0.33
Nodes (7): Kanbanly (Brand), Custom Package Brand Asset in public/, Indigo/Periwinkle Brand Color with White Tint Steps, Kanban Board Concept (3-Column Task Cards), Kanbanly Logo (Horizontal Lockup), Rounded-Square Kanban Grid Icon, Lowercase Bold Sans Wordmark 'kanbanly'

### Community 55 - "MSK-Forms-Screenshot"
Cohesion: 0.48
Nodes (7): Application Forms Product, MSK Dark Theme with Green Accent, Open Dashboard / Demo Form CTAs, Discord Bot Invite Integration, MSK Forms Hero Screenshot, Live Status Loop (Submitted / Picked up by a reviewer / Decision), Submission Status Card with Reviewer Note

### Community 56 - "msk_fuel-Banner"
Cohesion: 0.52
Nodes (7): msk_fuel Marketing Banner, ESX Framework Support, Realistic Fuel Consumption, Refueling & Station Logic, MSK Scripts Brand Identity (green M monogram, dark theme), MSK.FUEL (msk_fuel), QBCore Framework Support, Vehicle System Category

### Community 57 - "msk_handcuffs-Banner"
Cohesion: 0.48
Nodes (7): msk_handcuffs Marketing Banner, ESX Framework Support Badge, MSK Scripts Brand Identity (green M logo, dark green gradient, mono type), msk_handcuffs (FiveM Roleplay Restraint Script), QBCore Framework Support Badge, Realistic Restraints, Escort & Struggle Mechanics, Roleplay System (eyebrow claim)

### Community 58 - "MSK-Ticketbot-Banner"
Cohesion: 0.52
Nodes (7): MSK Ticket Bot Marketing Banner, MSK Scripts Green M Logo / Brand Style, HTML Transcripts, Multi-Category Support Tickets, MSK.TICKETBOT (Discord Ticket Bot), Discord.js v14, SQLite

### Community 59 - "msk_vehiclekeys-Banner"
Cohesion: 0.52
Nodes (7): msk_vehiclekeys Marketing Banner, ESX Framework Support, MSK Scripts Brand Identity (M Logo, Dark Green Palette), MSK.VEHICLEKEYS (msk_vehiclekeys), QBCore Framework Support, Secure Key Ownership: Lock, Share and Hotwire Vehicles, Vehicle System Category

### Community 60 - "Transkript-Bilder-Reparatur"
Cohesion: 0.38
Nodes (6): filenameFromUrl(), main(), mysql, parseArgs(), path, { readFile, writeFile }

### Community 61 - "Giveaway-Bot-Datenverarbeitung"
Cohesion: 0.40
Nodes (6): Giveaway Bot: Detaillierte Verarbeitung, Data Collected by the Giveaway Bot, Giveaway Data Retention (Deleted on Bot Removal), Giveaway Dashboard Session Cookies, Anonymous Public Statistics Page, Giveaway Web Dashboard (Discord OAuth)

### Community 62 - "Transkript-Dienst-Datenverarbeitung"
Cohesion: 0.33
Nodes (6): Discord OAuth Verification and Guild Record, Ticket Bot Session Cookies, Stripe Payments Europe, Ltd., Stripe Subscription Webhook, Third Country Transfers (UK Adequacy, SCCs), Data Collected by the Transcript Service

### Community 63 - "msk_core-Banner"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, Core Framework / Core Library Claim, ESX Framework Support, MSK Scripts Brand Identity (green M mark, dark theme), MSK.CORE (msk_core), QBCore Framework Support

### Community 64 - "msk_enginetoggle-Banner"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, ESX Framework Support, Manual Engine Control for Vehicle Roleplay, MSK Scripts Brand Identity (Green M Logo, Dark Theme), msk_enginetoggle (Vehicle System Script), QBCore Framework Support

### Community 65 - "msk_garage-Banner"
Cohesion: 0.60
Nodes (6): msk_garage Marketing Banner, ESX Framework Support, Full Garage Management, MSK Scripts Brand Identity (M logo, dark green), MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage

### Community 66 - "Giveaway-Bot (Produkt)"
Cohesion: 0.40
Nodes (6): Discord Giveaway Bot Marketing Banner, discord.js v14 (Tech Stack Claim), Multilingual Support Claim, Per-Guild Configurable Claim, Discord Giveaway Bot (Product), MSK Dark Theme with Green Accent Visual Style

### Community 67 - "msk_givevehicle-Banner"
Cohesion: 0.53
Nodes (6): msk_givevehicle Marketing Banner, MSK Scripts Brand Identity (M logo, green-on-dark), ESX Framework Support Badge, msk_givevehicle (FiveM Admin Tool), QBCore Framework Support Badge, Claim: Spawn & gift any vehicle to players in seconds

### Community 68 - "Dokumentations-Banner"
Cohesion: 0.60
Nodes (6): API Reference, MSK.DOCS Official Documentation Banner, Dark Green Tech Visual Style (monospace uppercase, accent green), MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs

### Community 69 - "Discord-Health-Route"
Cohesion: 0.33
Nodes (4): dynamic, IncidentsResponse, SEVERITY, StatusResponse

### Community 70 - "Footer und Zahlungsmarken"
Cohesion: 0.22
Nodes (3): ECOSYSTEM_LINKS, Footer(), PaymentMarks()

### Community 71 - "Codeberg-Mirror-Workflow"
Cohesion: 0.40
Nodes (5): Codeberg Mirror Secrets, Mirror Runs Only on Main and Tags, Mirror to Codeberg Workflow, Prune-Based Exact Mirror, Push to Codeberg Job

### Community 72 - "Kanbanly-Marketingbanner"
Cohesion: 0.70
Nodes (5): Kanbanly Marketing Banner (dark, 1200x630 OG-style), Kanban board glyph logo (indigo rounded tile, 3x4 card grid), Claim: Minimalistisches Kanban-Tool, DSGVO-konform, Kostenlos, Kanbanly (minimalist Kanban tool), Tagline: "Flow first. Build fast."

### Community 73 - "MSK-Scripts-Logo"
Cohesion: 0.60
Nodes (5): Angular Geometric Monogram Style, MSK Green Accent Color Palette, MSK Scripts Brand Identity, MSK Scripts Logo (green M mark), Site Branding Asset (favicon, header, metadata)

### Community 74 - "MSK Paste"
Cohesion: 0.60
Nodes (5): Paste Creation Form (Title + Content, 1 MB limit), MSK Dark Theme with Green Accent, MSK Paste (Self-hosted Pastebin), MSK Paste Screenshot, Syntax Highlighting

### Community 75 - "Leistungsumfang Giveaway-Bot"
Cohesion: 0.50
Nodes (4): Giveaway Bot Acceptable Use, MSK Giveaway Bot, Scope of Services, Server Operator Responsibility for Giveaways

### Community 76 - "MSK Source Available License"
Cohesion: 0.50
Nodes (4): Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version), MSK Source Available License (MSK-SAL v1.0), Protected Components (Verify System, Dashboard, Shop/Website Design)

### Community 77 - "MSK Shortener"
Cohesion: 0.67
Nodes (4): Dark Theme with MSK Green Accent Headline, MSK Shortener Hero Screenshot, Long URL Input Form Card, MSK URL Shortener (privacy-friendly, no signup)

### Community 78 - "Contributing und Code of Conduct"
Cohesion: 0.67
Nodes (3): Code of Conduct (Contributor Covenant), Contributing Guide, Pull Request Template

### Community 79 - "Coverage-Workflow"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 101 - "Kontrast-Tests der Farbtokens"
Cohesion: 0.31
Nodes (9): channels(), contrast(), CSS, dark, light, linear(), luminance(), mix() (+1 more)

### Community 102 - "Release-Protokoll aus VERSIONS"
Cohesion: 0.47
Nodes (7): fetchJson(), lastCommitDate(), loadOne(), loadReleases(), newestVersion(), summarize(), VersionsFileEntry

### Community 103 - "JsonLd.tsx"
Cohesion: 0.27
Nodes (9): GiveawayBotPageDe(), metadata, GiveawayBotPage(), metadata, GiveawayLanding(), JsonLd(), serialize(), giveawayAppJsonLd() (+1 more)

### Community 104 - "Tebex-Kennzahlen-Cron"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "CouponsTab.tsx"
Cohesion: 0.22
Nodes (8): CatalogItem, Coupon, CouponPayload, CouponsTab(), CouponState, formatDate(), STATE_LABEL, selectClass

### Community 107 - "botSeo.ts"
Cohesion: 0.17
Nodes (16): metadata, TicketBotPageDe(), metadata, TicketBotPage(), TicketBotLanding(), appJsonLdFor(), BotDefinition, BotSeo (+8 more)

### Community 112 - "Route-Wachen-Test"
Cohesion: 0.22
Nodes (5): API_DIR, DB_ROUTES, GUARDS, PUBLIC_BY_DESIGN, ROUTES

### Community 113 - "GiveawayLanding.tsx"
Cohesion: 0.20
Nodes (9): BotCrossLink(), COMMAND_NAMES, COUPON_ICONS, FEATURE_ICONS, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, SETTINGS_ICONS, STEP_ICONS (+1 more)

### Community 114 - "package.json"
Cohesion: 0.18
Nodes (10): engines, node, name, overrides, eslint, js-yaml, postcss, sharp (+2 more)

### Community 115 - "TicketBotLanding.tsx"
Cohesion: 0.20
Nodes (8): DASHBOARD_ICONS, FEATURE_ICONS, HOSTED_ICONS, HUB_HREFS, HUB_ICONS, HUB_VARIANTS, TIER_KEYS, VERIFY_ICONS

### Community 116 - "schema.sql"
Cohesion: 0.24
Nodes (9): giveaway_results, msk_admin_audit, msk_admin_team, msk_shop_stats, ticketbot_attachments, ticketbot_customers, ticketbot_guilds, ticketbot_rate_limits (+1 more)

### Community 117 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:coverage, test:watch (+1 more)

### Community 118 - "ApiKeysTab.tsx"
Cohesion: 0.32
Nodes (7): ApiKey, ApiKeysTab(), maskKey(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass()

### Community 119 - "TranscriptsCard.tsx"
Cohesion: 0.38
Nodes (6): EMPTY_QUERY, formatBytes(), Query, safeUrl(), TranscriptItem, TranscriptsCard()

### Community 120 - "url/route.ts"
Cohesion: 0.40
Nodes (5): dynamic, extractApiKey(), GET(), GuildRow, UrlRow

## Knowledge Gaps
- **448 isolated node(s):** `ALL_TABS`, `Tier`, `ApiKey`, `TIER_LABELS`, `TIER_ORDER` (+443 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tier` connect `upload/route.ts` to `Ticketbot-Dashboard`, `getClientIp`, `stripe/route.ts`, `TicketBotLanding.tsx`, `ticketbot/verify/VerifyClient.tsx`, `query`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `Button` connect `Button.tsx` to `Ticketbot-Dashboard`, `app/page.tsx`, `AdminClient.tsx`, `ResourcesClient.tsx`, `Footer und Zahlungsmarken`, `CouponsTab.tsx`, `cn`, `queryOne`, `GiveawayLanding.tsx`, `i18n.ts`, `TicketBotLanding.tsx`, `ticketbot/verify/VerifyClient.tsx`, `giveaway/dashboard/DashboardClient.tsx`, `ApiKeysTab.tsx`, `TranscriptsCard.tsx`, `Card.tsx`, `packages/[id]/page.tsx`, `lib/tebex.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Card` connect `Card.tsx` to `giveawaySession.ts`, `Ticketbot-Dashboard`, `AdminClient.tsx`, `ResourcesClient.tsx`, `Button.tsx`, `CouponsTab.tsx`, `cn`, `queryOne`, `GiveawayLanding.tsx`, `TicketBotLanding.tsx`, `ticketbot/verify/VerifyClient.tsx`, `giveaway/dashboard/DashboardClient.tsx`, `ApiKeysTab.tsx`, `TranscriptsCard.tsx`, `packages/[id]/page.tsx`, `lib/tebex.ts`, `Sprachaufloesung und Ergebnisseite`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `ALL_TABS`, `Tier`, `ApiKey` to the rest of the system?**
  _448 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `upload/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05517503805175038 - nodes in this community are weakly interconnected._
- **Should `giveawaySession.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05200341005967604 - nodes in this community are weakly interconnected._
- **Should `getClientIp` be split into smaller, more focused modules?**
  _Cohesion score 0.08312020460358056 - nodes in this community are weakly interconnected._