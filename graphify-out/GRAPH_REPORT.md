# Graph Report - C:\Users\morit\OneDrive\GitHub Repositories\FiveM Shop\msk-shop  (2026-08-01)

## Corpus Check
- 276 files · ~146,183 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1287 nodes · 2642 edges · 112 communities (91 shown, 21 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Schreibende API-Routen (Upload, Stripe, Domain)
- Lesende API- und Guild-Routen
- Tebex-Basket-Proxy
- Dev-Dependencies und Lint-Setup
- Admin-Dashboard: API-Keys und Tabs
- Runtime-Dependencies
- Admin-CRUD-Routen
- Resource-Stats (fivestats)
- TypeScript-Konfiguration
- Konto-, Cart- und Checkout-Seiten
- Sprachumschaltung und Footer
- CI-Pipeline und Audit-Gate
- Root-Layout, robots und JSON-LD
- Rechtsträger und Admin-Konzept
- Paket- und Kategorieseiten, Sitemap
- Admin-Auth und Login
- Ticketbot-Statistiken
- Startseite und Hero-Sektionen
- Bot-Dashboard-Proxy
- Rechtstext-Seiten
- Ticketbot-Verify-UI
- Giveaway-Dashboard-UI
- Custom Packages und Badges
- Admin-Mutationen und Team-Tests
- Galerie und Suchdialog
- Tier-Override und Giveaway-Ergebnisse
- Giveaway-Verify und Bot-Config-Editor
- Admin-Rechte und Team-Verwaltung
- Verify-, Audit- und Transcript-Abfragen
- SEO-Metadata und Paketdetail
- Warenkorb und Tebex-Client
- Öffentliche Giveaway-Ergebnisseite
- Preisanzeige und Sale-Logik
- Middleware, CSP und Rate-Limits
- Ticketbot-Dashboard-UI
- Admin-Audit, Lookup und Discord-Callback
- Ticketbot-Landingpage
- Datenschutzerklärung
- Giveaway-Landingpage
- Hosting- und Aufbewahrungsregeln
- MSK Social-Banner
- Stripe-Reconcile-Cron
- Transcript-AGB und Haftung
- AGB und Lizenzbedingungen
- Tebex-HTML-Sanitizing
- Giveaway-Bot Marketing-Assets
- Cleanup-Cron
- Giveaway-Stats-Client
- Transcript-Karte im Dashboard
- Ticketbot-Stats-Client
- Abo, Trial und Custom Domain (AGB)
- Shop-Daten und Tebex-Rolle
- Ticket-Bot Marketing-Assets
- Kanbanly Marketing-Assets
- Kanbanly Markenassets
- MSK Forms Assets
- msk_fuel Marketing-Assets
- msk_handcuffs Marketing-Assets
- Ticketbot Banner-Assets
- msk_vehiclekeys Marketing-Assets
- Transcript-Bilder-Reparatur
- Giveaway-Datenschutz
- Verify- und Stripe-Datenschutz
- msk_core Marketing-Assets
- msk_enginetoggle Assets
- msk_garage Marketing-Assets
- Giveaway-Bot Bannerstil
- msk_givevehicle Assets
- Doku-Portal-Assets
- Discord-Health-Route
- Sprach-Context (LangProvider)
- Codeberg-Mirror-Workflow
- Kanbanly OG-Banner
- MSK-Logo und Favicon
- MSK Paste Assets
- Giveaway-Nutzungsbedingungen
- MSK Source Available License
- MSK Shortener Assets
- Community-Richtlinien
- Coverage-Workflow
- Auth-URL-Helfer
- Deploy-Skript
- vhost-Erstellung
- Externe Live-Zahlen
- ESLint-Flat-Config
- Dependabot und Dependency Review
- Issue-Vorlagen
- CodeQL-Workflow
- Deploy-Workflow
- Next-Konfiguration
- vhost-Entfernung
- Tailwind-Konfiguration
- HTTP-Stub (DELETE)
- HTTP-Stub (GET)
- HTTP-Stub (HEAD)
- HTTP-Stub (OPTIONS)
- HTTP-Stub (PATCH)
- HTTP-Stub (POST)
- HTTP-Stub (PUT)
- Release-Workflow
- MSKanban Banner

## God Nodes (most connected - your core abstractions)
1. `cn()` - 43 edges
2. `query()` - 40 edges
3. `Button` - 39 edges
4. `Card` - 33 edges
5. `queryOne()` - 28 edges
6. `getClientIp()` - 28 edges
7. `rateLimit()` - 28 edges
8. `useLang()` - 25 edges
9. `authorizeGuild()` - 23 edges
10. `Tier` - 21 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/giveaway/stats/StatsClient.tsx → lib/utils.ts
- `ResourcesClient()` --calls--> `useLang()`  [EXTRACTED]
  app/resources/ResourcesClient.tsx → components/i18n/LangProvider.tsx
- `DashboardClient()` --calls--> `useLang()`  [EXTRACTED]
  app/ticketbot/dashboard/DashboardClient.tsx → components/i18n/LangProvider.tsx
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/stats/StatsClient.tsx → lib/utils.ts

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

## Communities (112 total, 21 thin omitted)

### Community 0 - "Schreibende API-Routen (Upload, Stripe, Domain)"
Cohesion: 0.05
Nodes (65): authorized(), POST(), CustomerRow, POST(), AttachmentInput, checkRateLimit(), GuildRow, isValidGuild() (+57 more)

### Community 1 - "Lesende API- und Guild-Routen"
Cohesion: 0.06
Nodes (49): GET(), ADMINISTRATOR, GET(), isAdmin(), GET(), ACTION_PATH, POST(), ADMINISTRATOR (+41 more)

### Community 2 - "Tebex-Basket-Proxy"
Cohesion: 0.08
Nodes (43): getBasketCreateAuth(), getTebexAuth, TEBEX_HEADERS, GET(), DELETE(), POST(), POST(), POST() (+35 more)

### Community 3 - "Dev-Dependencies und Lint-Setup"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+38 more)

### Community 4 - "Admin-Dashboard: API-Keys und Tabs"
Cohesion: 0.10
Nodes (27): ALL_TABS, ApiKey, ApiKeysTab(), maskKey(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass() (+19 more)

### Community 5 - "Runtime-Dependencies"
Cohesion: 0.05
Nodes (39): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, js-cookie, lucide-react, mysql2, next, next-themes (+31 more)

### Community 6 - "Admin-CRUD-Routen"
Cohesion: 0.11
Nodes (24): GET, POST, DELETE, GET, POST, DELETE, PUT, GET (+16 more)

### Community 7 - "Resource-Stats (fivestats)"
Cohesion: 0.09
Nodes (25): GET(), metadata, ResourcesPage(), formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge() (+17 more)

### Community 8 - "TypeScript-Konfiguration"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 9 - "Konto-, Cart- und Checkout-Seiten"
Cohesion: 0.13
Nodes (10): CartPage(), CheckoutContent(), CartDrawer(), Button, ButtonProps, ButtonSize, ButtonVariant, sizeClasses (+2 more)

### Community 10 - "Sprachumschaltung und Footer"
Cohesion: 0.15
Nodes (17): DashboardClient(), useLang(), LanguageDropdown(), languages, ECOSYSTEM_LINKS, Footer(), Header(), HeaderInner() (+9 more)

### Community 11 - "CI-Pipeline und Audit-Gate"
Cohesion: 0.11
Nodes (24): CI Job: Audit (production tree), CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck (+16 more)

### Community 12 - "Root-Layout, robots und JSON-LD"
Cohesion: 0.16
Nodes (16): metadata, RootLayout(), viewport, robots(), JsonLd(), serialize(), NextThemesProviderProps, Props (+8 more)

### Community 13 - "Rechtsträger und Admin-Konzept"
Cohesion: 0.11
Nodes (24): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+16 more)

### Community 14 - "Paket- und Kategorieseiten, Sitemap"
Cohesion: 0.17
Nodes (18): CategoryPage(), generateStaticParams(), generateStaticParams(), metadata, PackagesPage(), Entry, sitemap(), STATIC_ROUTES (+10 more)

### Community 15 - "Admin-Auth und Login"
Cohesion: 0.19
Nodes (14): AdminPage(), ERROR_MESSAGES, metadata, GET(), AdminAuthResult, AdminTeamRow, authorizeAdmin(), loadAdminMember() (+6 more)

### Community 16 - "Ticketbot-Statistiken"
Cohesion: 0.12
Nodes (18): AvgRow, CountRow, GET(), MaxRow, SumRow, TierRow, AvgRow, CountRow (+10 more)

### Community 17 - "Startseite und Hero-Sektionen"
Cohesion: 0.16
Nodes (14): HomePage(), metadata, CTASection(), Hero(), HowItWorks(), STEP_ICONS, Kpi, TrustBar() (+6 more)

### Community 18 - "Bot-Dashboard-Proxy"
Cohesion: 0.21
Nodes (18): GET(), bounce(), handle(), HOP_BY_HOP, RFC-7230, makeToken(), PROXY_HOST, PROXY_SESSION_MAX_AGE_S (+10 more)

### Community 19 - "Rechtstext-Seiten"
Cohesion: 0.20
Nodes (16): ImprintPage(), metadata, metadata, TermsPage(), metadata, PrivacyPage(), LegalContent(), Props (+8 more)

### Community 20 - "Ticketbot-Verify-UI"
Cohesion: 0.15
Nodes (11): StatusBadge(), Props, StepIndicator(), TIER_LABELS, VerifyClient(), Container, ContainerProps, NewsPopup() (+3 more)

### Community 21 - "Giveaway-Dashboard-UI"
Cohesion: 0.16
Nodes (17): Channel, CreateForm(), Ctx, Dict, EditButton(), ExtendButton(), Giveaway, GiveawaysTab() (+9 more)

### Community 22 - "Custom Packages und Badges"
Cohesion: 0.18
Nodes (14): CustomPackages(), resolveImageSrc(), Badge, BadgeProps, BadgeVariant, variantClasses, CardContent, CardDescription (+6 more)

### Community 23 - "Admin-Mutationen und Team-Tests"
Cohesion: 0.18
Nodes (10): PATCH, PaymentStatus, VALID_STATUS, DELETE, PATCH, TEAM_MANAGE, adminReq(), DbMember (+2 more)

### Community 24 - "Galerie und Suchdialog"
Cohesion: 0.16
Nodes (13): Props, PackageGallery(), PackageGalleryProps, resolveImages(), Props, SearchDialog(), Badge, CartStore (+5 more)

### Community 25 - "Tier-Override und Giveaway-Ergebnisse"
Cohesion: 0.18
Nodes (11): PATCH, VALID_TIERS, authorized(), POST(), ResultRow, WinnerIn, extractApiKey(), GET() (+3 more)

### Community 26 - "Giveaway-Verify und Bot-Config-Editor"
Cohesion: 0.16
Nodes (10): Guild, VerifyClient(), BotConfigEditor(), BotStatus, logLineClass(), Msg, dashboardTranslations, giveawayDashboardTranslations (+2 more)

### Community 27 - "Admin-Rechte und Team-Verwaltung"
Cohesion: 0.23
Nodes (10): AdminClient(), TabDef, Member, GET, POST, TeamRow, AdminPermission, isAdminPermission() (+2 more)

### Community 28 - "Verify-, Audit- und Transcript-Abfragen"
Cohesion: 0.20
Nodes (9): GET, GuildRow, AuditRow, GET, GET, GET, AdminCtx, adminRoute() (+1 more)

### Community 29 - "SEO-Metadata und Paketdetail"
Cohesion: 0.33
Nodes (11): generateMetadata(), generateMetadata(), PackageDetailPage(), productJsonLd(), decodeEntities(), HTML_ENTITIES, openGraphFor(), packageImage() (+3 more)

### Community 30 - "Warenkorb und Tebex-Client"
Cohesion: 0.32
Nodes (12): AddToCartButton(), readStoredDiscordId(), addGiftToBasket(), addToBasket(), applyCoupon(), createBasket(), getAllAuthUrls(), getBasket() (+4 more)

### Community 31 - "Öffentliche Giveaway-Ergebnisseite"
Cohesion: 0.24
Nodes (10): GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, giveawayResultTranslations, isSupportedLang(), parseAcceptLanguage() (+2 more)

### Community 32 - "Preisanzeige und Sale-Logik"
Cohesion: 0.28
Nodes (8): PackagePrice(), Props, SalePriceFetcher(), DisplayPrice, resolveDisplayPrice(), SaleData, SalePricesStore, useSalePricesStore

### Community 33 - "Middleware, CSP und Rate-Limits"
Cohesion: 0.22
Nodes (12): BODY_LIMIT_PREFIXES, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited(), middleware() (+4 more)

### Community 34 - "Ticketbot-Dashboard-UI"
Cohesion: 0.18
Nodes (9): BotConfigEditor, DashboardClient(), GuildPanel(), Props, safeDomainHref(), T, TabKey, TIER_COLORS (+1 more)

### Community 35 - "Admin-Audit, Lookup und Discord-Callback"
Cohesion: 0.18
Nodes (5): AuditEntry, AuditTab(), LookupPayment, LookupResult, Card

### Community 36 - "Ticketbot-Landingpage"
Cohesion: 0.22
Nodes (10): FEATURES, HIGHLIGHTS, HUB_CARDS, HubCard, mb(), metadata, TicketBotPage(), TIER_CARDS (+2 more)

### Community 37 - "Datenschutzerklärung"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

### Community 38 - "Giveaway-Landingpage"
Cohesion: 0.22
Nodes (7): CommandRow, COMMANDS, FEATURES, HIGHLIGHTS, metadata, SETTINGS, STEPS

### Community 39 - "Hosting- und Aufbewahrungsregeln"
Cohesion: 0.25
Nodes (9): Attachment Storage (Premium and Premium+), Hosted Bot Management Data and Access Control, Storage Period Table, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials, Hosted Bot Customer Responsibilities, Hosted Bot Management Service, Hosting Termination and 14-Day Deletion (+1 more)

### Community 40 - "MSK Social-Banner"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "Stripe-Reconcile-Cron"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "Transcript-AGB und Haftung"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 43 - "AGB und Lizenzbedingungen"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "Tebex-HTML-Sanitizing"
Cohesion: 0.39
Nodes (6): convertPipeTables(), EMOJI, OPTIONS, replaceEmojiShortcodes(), sanitizeTebexHtml(), splitPipeRow()

### Community 45 - "Giveaway-Bot Marketing-Assets"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "Cleanup-Cron"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "Giveaway-Stats-Client"
Cohesion: 0.38
Nodes (6): Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), giveawayStatsTranslations

### Community 48 - "Transcript-Karte im Dashboard"
Cohesion: 0.38
Nodes (6): EMPTY_QUERY, formatBytes(), Query, safeUrl(), TranscriptItem, TranscriptsCard()

### Community 49 - "Ticketbot-Stats-Client"
Cohesion: 0.43
Nodes (6): formatBytes(), formatNum(), StatCard(), StatsClient(), TierBreakdown(), statsTranslations

### Community 50 - "Abo, Trial und Custom Domain (AGB)"
Cohesion: 0.33
Nodes (7): Custom Domain: Certbot and Certificate Transparency, Cancellation and Downgrade, Custom Domain for Transcript Delivery, Abonnement und Zahlung (Stripe, Testphase), 14-Day Free Trial, Let's Encrypt SSL Certificate, Stripe Subscription Billing

### Community 51 - "Shop-Daten und Tebex-Rolle"
Cohesion: 0.29
Nodes (7): Basket localStorage and sessionStorage, Data Collected by the Shop, Tebex Payment Processing (Shop), Discord ID and Membership Requirement, MSK Scripts Shop, Returns & Refunds (Digital Goods), Tebex Limited (Merchant of Record)

### Community 52 - "Ticket-Bot Marketing-Assets"
Cohesion: 0.52
Nodes (7): Discord Ticket Bot Marketing Banner, Create Ticket Panel / Open Ticket Button, Ticket Status Workflow (In Progress / Resolved), Ticket Transcript / Support Ticket Card, Discord Ticket Bot (Product), MSK Dark Theme with Green Accent Visual Style, Tagline: Advanced, modular & open source

### Community 53 - "Kanbanly Marketing-Assets"
Cohesion: 0.43
Nodes (7): Workspaces, Boards and Cards with Labels, Due Dates and Assignments, Custom Package Banner Asset (public/), Dark Navy Background with Purple Accent Branding, Zum Dashboard Call-to-Action, Drag & Drop with Live Saving, Kanbanly Hero Banner, Kanbanly Project Management Tool

### Community 54 - "Kanbanly Markenassets"
Cohesion: 0.33
Nodes (7): Kanbanly (Brand), Custom Package Brand Asset in public/, Indigo/Periwinkle Brand Color with White Tint Steps, Kanban Board Concept (3-Column Task Cards), Kanbanly Logo (Horizontal Lockup), Rounded-Square Kanban Grid Icon, Lowercase Bold Sans Wordmark 'kanbanly'

### Community 55 - "MSK Forms Assets"
Cohesion: 0.48
Nodes (7): Application Forms Product, MSK Dark Theme with Green Accent, Open Dashboard / Demo Form CTAs, Discord Bot Invite Integration, MSK Forms Hero Screenshot, Live Status Loop (Submitted / Picked up by a reviewer / Decision), Submission Status Card with Reviewer Note

### Community 56 - "msk_fuel Marketing-Assets"
Cohesion: 0.52
Nodes (7): msk_fuel Marketing Banner, ESX Framework Support, Realistic Fuel Consumption, Refueling & Station Logic, MSK Scripts Brand Identity (green M monogram, dark theme), MSK.FUEL (msk_fuel), QBCore Framework Support, Vehicle System Category

### Community 57 - "msk_handcuffs Marketing-Assets"
Cohesion: 0.48
Nodes (7): msk_handcuffs Marketing Banner, ESX Framework Support Badge, MSK Scripts Brand Identity (green M logo, dark green gradient, mono type), msk_handcuffs (FiveM Roleplay Restraint Script), QBCore Framework Support Badge, Realistic Restraints, Escort & Struggle Mechanics, Roleplay System (eyebrow claim)

### Community 58 - "Ticketbot Banner-Assets"
Cohesion: 0.52
Nodes (7): MSK Ticket Bot Marketing Banner, MSK Scripts Green M Logo / Brand Style, HTML Transcripts, Multi-Category Support Tickets, MSK.TICKETBOT (Discord Ticket Bot), Discord.js v14, SQLite

### Community 59 - "msk_vehiclekeys Marketing-Assets"
Cohesion: 0.52
Nodes (7): msk_vehiclekeys Marketing Banner, ESX Framework Support, MSK Scripts Brand Identity (M Logo, Dark Green Palette), MSK.VEHICLEKEYS (msk_vehiclekeys), QBCore Framework Support, Secure Key Ownership: Lock, Share and Hotwire Vehicles, Vehicle System Category

### Community 60 - "Transcript-Bilder-Reparatur"
Cohesion: 0.38
Nodes (6): filenameFromUrl(), main(), mysql, parseArgs(), path, { readFile, writeFile }

### Community 61 - "Giveaway-Datenschutz"
Cohesion: 0.40
Nodes (6): Giveaway Bot: Detaillierte Verarbeitung, Data Collected by the Giveaway Bot, Giveaway Data Retention (Deleted on Bot Removal), Giveaway Dashboard Session Cookies, Anonymous Public Statistics Page, Giveaway Web Dashboard (Discord OAuth)

### Community 62 - "Verify- und Stripe-Datenschutz"
Cohesion: 0.33
Nodes (6): Discord OAuth Verification and Guild Record, Ticket Bot Session Cookies, Stripe Payments Europe, Ltd., Stripe Subscription Webhook, Third Country Transfers (UK Adequacy, SCCs), Data Collected by the Transcript Service

### Community 63 - "msk_core Marketing-Assets"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, Core Framework / Core Library Claim, ESX Framework Support, MSK Scripts Brand Identity (green M mark, dark theme), MSK.CORE (msk_core), QBCore Framework Support

### Community 64 - "msk_enginetoggle Assets"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, ESX Framework Support, Manual Engine Control for Vehicle Roleplay, MSK Scripts Brand Identity (Green M Logo, Dark Theme), msk_enginetoggle (Vehicle System Script), QBCore Framework Support

### Community 65 - "msk_garage Marketing-Assets"
Cohesion: 0.60
Nodes (6): msk_garage Marketing Banner, ESX Framework Support, Full Garage Management, MSK Scripts Brand Identity (M logo, dark green), MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage

### Community 66 - "Giveaway-Bot Bannerstil"
Cohesion: 0.40
Nodes (6): Discord Giveaway Bot Marketing Banner, discord.js v14 (Tech Stack Claim), Multilingual Support Claim, Per-Guild Configurable Claim, Discord Giveaway Bot (Product), MSK Dark Theme with Green Accent Visual Style

### Community 67 - "msk_givevehicle Assets"
Cohesion: 0.53
Nodes (6): msk_givevehicle Marketing Banner, MSK Scripts Brand Identity (M logo, green-on-dark), ESX Framework Support Badge, msk_givevehicle (FiveM Admin Tool), QBCore Framework Support Badge, Claim: Spawn & gift any vehicle to players in seconds

### Community 68 - "Doku-Portal-Assets"
Cohesion: 0.60
Nodes (6): API Reference, MSK.DOCS Official Documentation Banner, Dark Green Tech Visual Style (monospace uppercase, accent green), MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs

### Community 69 - "Discord-Health-Route"
Cohesion: 0.40
Nodes (3): IncidentsResponse, SEVERITY, StatusResponse

### Community 70 - "Sprach-Context (LangProvider)"
Cohesion: 0.50
Nodes (4): LangContext, LangContextValue, LangProvider(), setLangCookie()

### Community 71 - "Codeberg-Mirror-Workflow"
Cohesion: 0.40
Nodes (5): Codeberg Mirror Secrets, Mirror Runs Only on Main and Tags, Mirror to Codeberg Workflow, Prune-Based Exact Mirror, Push to Codeberg Job

### Community 72 - "Kanbanly OG-Banner"
Cohesion: 0.70
Nodes (5): Kanbanly Marketing Banner (dark, 1200x630 OG-style), Kanban board glyph logo (indigo rounded tile, 3x4 card grid), Claim: Minimalistisches Kanban-Tool, DSGVO-konform, Kostenlos, Kanbanly (minimalist Kanban tool), Tagline: "Flow first. Build fast."

### Community 73 - "MSK-Logo und Favicon"
Cohesion: 0.60
Nodes (5): Angular Geometric Monogram Style, MSK Green Accent Color Palette, MSK Scripts Brand Identity, MSK Scripts Logo (green M mark), Site Branding Asset (favicon, header, metadata)

### Community 74 - "MSK Paste Assets"
Cohesion: 0.60
Nodes (5): Paste Creation Form (Title + Content, 1 MB limit), MSK Dark Theme with Green Accent, MSK Paste (Self-hosted Pastebin), MSK Paste Screenshot, Syntax Highlighting

### Community 75 - "Giveaway-Nutzungsbedingungen"
Cohesion: 0.50
Nodes (4): Giveaway Bot Acceptable Use, MSK Giveaway Bot, Scope of Services, Server Operator Responsibility for Giveaways

### Community 76 - "MSK Source Available License"
Cohesion: 0.50
Nodes (4): Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version), MSK Source Available License (MSK-SAL v1.0), Protected Components (Verify System, Dashboard, Shop/Website Design)

### Community 77 - "MSK Shortener Assets"
Cohesion: 0.67
Nodes (4): Dark Theme with MSK Green Accent Headline, MSK Shortener Hero Screenshot, Long URL Input Form Card, MSK URL Shortener (privacy-friendly, no signup)

### Community 78 - "Community-Richtlinien"
Cohesion: 0.67
Nodes (3): Code of Conduct (Contributor Covenant), Contributing Guide, Pull Request Template

### Community 79 - "Coverage-Workflow"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

## Knowledge Gaps
- **353 isolated node(s):** `ALL_TABS`, `Tier`, `ApiKey`, `TIER_LABELS`, `TIER_ORDER` (+348 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Ticketbot-Verify-UI` to `Ticketbot-Dashboard-UI`, `Admin-Dashboard: API-Keys und Tabs`, `Resource-Stats (fivestats)`, `Konto-, Cart- und Checkout-Seiten`, `Sprachumschaltung und Footer`, `Giveaway-Stats-Client`, `Ticketbot-Stats-Client`, `Giveaway-Dashboard-UI`, `Custom Packages und Badges`, `Galerie und Suchdialog`, `Giveaway-Verify und Bot-Config-Editor`, `Admin-Rechte und Team-Verwaltung`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Card` connect `Admin-Audit, Lookup und Discord-Callback` to `Ticketbot-Dashboard-UI`, `Admin-Dashboard: API-Keys und Tabs`, `Ticketbot-Landingpage`, `Giveaway-Landingpage`, `Resource-Stats (fivestats)`, `Konto-, Cart- und Checkout-Seiten`, `Admin-Auth und Login`, `Giveaway-Stats-Client`, `Transcript-Karte im Dashboard`, `Ticketbot-Stats-Client`, `Startseite und Hero-Sektionen`, `Ticketbot-Verify-UI`, `Giveaway-Dashboard-UI`, `Custom Packages und Badges`, `Giveaway-Verify und Bot-Config-Editor`, `SEO-Metadata und Paketdetail`, `Öffentliche Giveaway-Ergebnisseite`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Button` connect `Konto-, Cart- und Checkout-Seiten` to `Ticketbot-Dashboard-UI`, `Admin-Audit, Lookup und Discord-Callback`, `Admin-Dashboard: API-Keys und Tabs`, `Ticketbot-Landingpage`, `Giveaway-Landingpage`, `Resource-Stats (fivestats)`, `Sprachumschaltung und Footer`, `Paket- und Kategorieseiten, Sitemap`, `Admin-Auth und Login`, `Transcript-Karte im Dashboard`, `Startseite und Hero-Sektionen`, `Ticketbot-Verify-UI`, `Giveaway-Dashboard-UI`, `Custom Packages und Badges`, `Giveaway-Verify und Bot-Config-Editor`, `SEO-Metadata und Paketdetail`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `ALL_TABS`, `Tier`, `ApiKey` to the rest of the system?**
  _353 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Schreibende API-Routen (Upload, Stripe, Domain)` be split into smaller, more focused modules?**
  _Cohesion score 0.05132317562149158 - nodes in this community are weakly interconnected._
- **Should `Lesende API- und Guild-Routen` be split into smaller, more focused modules?**
  _Cohesion score 0.056189640035118525 - nodes in this community are weakly interconnected._
- **Should `Tebex-Basket-Proxy` be split into smaller, more focused modules?**
  _Cohesion score 0.08322026232473993 - nodes in this community are weakly interconnected._