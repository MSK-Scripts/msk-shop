# Graph Report - msk-shop  (2026-08-22)

## Corpus Check
- 283 files · ~184,546 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1638 nodes · 3548 edges · 131 communities (114 shown, 17 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3d492856`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AdminClient.tsx
- data/route.ts
- getClientIp
- devDependencies
- Card
- dependencies
- Design System: MSK Scripts Shop
- ResourcesClient.tsx
- TypeScript Configuration
- stripe/route.ts
- Header.tsx
- CI/CD Workflows
- jsonLd.ts
- Admin Business Logic
- lang.ts
- adminAuth.ts
- ticketbot/stats/page.tsx
- HeaderInner
- Bot Proxy Routes
- imprint/page.tsx
- ticketbot/verify/VerifyClient.tsx
- giveaway/dashboard/DashboardClient.tsx
- Card.tsx
- adminTeamRoute.test.ts
- giveawayStats.ts
- query
- i18n.ts
- adminApi.ts
- writeAudit
- PackageCard.tsx
- lib/tebex.ts
- dashboardAuth.ts
- authorizeGuild
- packages/[id]/page.tsx
- ticketbot/dashboard/DashboardClient.tsx
- getRequestLang
- tebexPlugin.ts
- Privacy Policy (EN)
- [token]/page.tsx
- Data Collected by the Transcript Service
- Brand Identity Assets
- Stripe Reconciliation Script
- ticketbot-copy.ts
- MSK Scripts Shop
- categories/[id]/page.tsx
- Giveaway Bot Marketing
- Server Cleanup Script
- PackagesBrowser.tsx
- bot-control/route.ts
- admin/coupons/route.ts
- Subscription and Domains
- Data Collected by the Shop
- Ticket Bot Marketing
- Kanbanly Project Management
- Kanbanly Brand Identity
- Forms Product Marketing
- Fuel Script Marketing
- Handcuffs Script Marketing
- Ticket Bot Features
- Vehicle Keys Marketing
- Transcript Image Repair
- Data Collected by the Giveaway Bot
- upload/route.ts
- Core Framework Marketing
- Engine Toggle Marketing
- Garage Script Marketing
- Giveaway Bot Features
- Give Vehicle Marketing
- Documentation Brand
- Health Check API
- useLang
- Codeberg Mirror Workflow
- Kanbanly Marketing
- MSK Brand Assets
- Paste Service Marketing
- MSK Giveaway Bot
- Software License Terms
- URL Shortener UI
- Project Contribution Guidelines
- Code Coverage Workflow
- Authentication Utilities
- Application Deployment Scripts
- Virtual Host Creation
- Discord and Resource Stats
- ESLint Configuration
- Dependency Management Workflow
- Issue Templates
- CodeQL Security Analysis
- Server Deployment Workflow
- Next.js Configuration
- Virtual Host Deletion
- Tailwind CSS Configuration
- Design System Tokens
- CreateForm
- TicketBotLanding.tsx
- Tebex Stats Aggregator
- CouponsTab.tsx
- giveawaySession.ts
- session.ts
- Automated Release Workflow
- Project Branding Assets
- API Route Guards
- GiveawayLanding.tsx
- seo.ts
- tiers.ts
- Database Schema
- Footer.tsx
- cn
- botSeo.ts
- sitemap.xsl/route.ts
- layout.tsx
- StoreTab
- ApiKeysTab.tsx
- Lang
- MSK Ticket Bot Transcript Service
- url/route.ts
- giveaway/stats/StatsClient.tsx
- giveaway/verify/VerifyClient.tsx
- DashboardClient

## God Nodes (most connected - your core abstractions)
1. `cn()` - 56 edges
2. `query()` - 44 edges
3. `Button` - 40 edges
4. `Lang` - 39 edges
5. `getRequestLang()` - 38 edges
6. `Card` - 35 edges
7. `useLang()` - 34 edges
8. `queryOne()` - 29 edges
9. `getClientIp()` - 28 edges
10. `rateLimit()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `POST` --calls--> `writeAudit()`  [EXTRACTED]
  app/api/admin/bans/route.ts → lib/adminAudit.ts
- `POST` --calls--> `writeAudit()`  [EXTRACTED]
  app/api/admin/giftcards/route.ts → lib/adminAudit.ts
- `GET` --calls--> `getPackages()`  [EXTRACTED]
  app/api/admin/packages/route.ts → lib/tebex.ts
- `GuildRow` --references--> `Tier`  [EXTRACTED]
  app/api/verify/check-guild/route.ts → lib/tiers.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Payment providers: Tebex (shop MoR) + Stripe (Ticket Bot subscriptions)** — content_legal_entity_tebex, content_legal_entity_stripe, content_legal_imprint [EXTRACTED 0.85]
- **Tebex admin dashboard: Plugin API behind own Discord-ID permission gate + audit** — docs_admin_dashboard_plan, docs_admin_dashboard_permissions, docs_admin_dashboard_schema, docs_tebex_api_reference_plugin_api [EXTRACTED 0.90]
- **CI-Gate vor dem Deploy (fünf Jobs müssen grün sein)** — _github_workflows_ci_lint_job, _github_workflows_ci_typecheck_job, _github_workflows_ci_test_job, _github_workflows_ci_audit_job, _github_workflows_ci_build_job, docs_deployment_deploy_workflow [EXTRACTED 1.00]
- **Sicherheitsmodell der Deploy-Kette (Keys, ForceCommand, root-owned scripts)** — docs_deployment_forcecommand_action_key, docs_deployment_readonly_deploy_key_isolation, docs_deployment_permitrootlogin_warning, docs_deployment_vhost_scripts_root_ownership [EXTRACTED 1.00]
- **Umgang mit der dev-only brace-expansion-Advisory** — docs_deployment_npm_no_audit_rationale, docs_deployment_brace_expansion_advisory, docs_deployment_minimatch3_pin, docs_deployment_override_antipattern, _github_workflows_ci_production_tree_audit_gate [EXTRACTED 1.00]
- **Giveaway Bot data flow: collection, dashboard, public pages, retention** — content_legal_privacy_giveaway_bot_data, content_legal_privacy_giveaway_web_dashboard, content_legal_privacy_giveaway_public_results_page, content_legal_privacy_giveaway_stats_page, content_legal_privacy_giveaway_retention, content_legal_terms_server_operator_responsibility [EXTRACTED 1.00]
- **Hosted bot credential custody and deletion obligations** — content_legal_terms_hosted_bot_management, content_legal_terms_hosted_bot_credentials_access, content_legal_terms_hosting_termination, content_legal_privacy_hosted_bot_data [EXTRACTED 1.00]
- **Transcript Service subscription lifecycle (tier, Stripe, trial, downgrade, domain)** — content_legal_terms_subscription_tiers, content_legal_terms_stripe_billing, content_legal_terms_free_trial, content_legal_terms_cancellation_and_downgrade, content_legal_terms_custom_domain, content_legal_privacy_stripe_subscription_webhook [EXTRACTED 1.00]
- **CI/CD Pipeline (CI gates Deploy)** — github_workflows_deploy, github_workflows_dependency_review [INFERRED 0.75]
- **Contribution Governance Docs** — contributing, code_of_conduct, github_pull_request_template, github_issue_template_bug_report, github_issue_template_feature_request [INFERRED 0.75]

## Communities (131 total, 17 thin omitted)

### Community 0 - "AdminClient.tsx"
Cohesion: 0.15
Nodes (15): AdminClient(), ALL_TABS, TabDef, AuditTab(), BansTab(), LookupPayment, LookupResult, LookupTab() (+7 more)

### Community 1 - "data/route.ts"
Cohesion: 0.13
Nodes (17): ACTION_PATH, OWNER_ACTIONS, POST(), ALLOWED, GET(), GwListItem, KIND_PATH, OWNER_KINDS (+9 more)

### Community 2 - "getClientIp"
Cohesion: 0.22
Nodes (15): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+7 more)

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+38 more)

### Community 4 - "Card"
Cohesion: 0.18
Nodes (15): AuditEntry, BanEntry, ErrorCard(), GiftCard, GiftCardsTab(), Package, PackagesTab(), CatalogPackage (+7 more)

### Community 5 - "dependencies"
Cohesion: 0.05
Nodes (39): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, js-cookie, lucide-react, mysql2, next-themes, dependencies (+31 more)

### Community 6 - "Design System: MSK Scripts Shop"
Cohesion: 0.07
Nodes (27): Badges, Buttons, Cards, Colors, Components, Design System: MSK Scripts Shop, Do:, Do's and Don'ts (+19 more)

### Community 7 - "ResourcesClient.tsx"
Cohesion: 0.06
Nodes (41): dynamic, GET(), ResourcesPage(), formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge() (+33 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "stripe/route.ts"
Cohesion: 0.20
Nodes (17): applySubscription(), downgradeGuild(), GuildIdRow, POST(), resolveInvoiceSubscriptionId(), upsertCustomer(), withTransaction(), ScopedGuildId (+9 more)

### Community 10 - "Header.tsx"
Cohesion: 0.18
Nodes (8): LanguageDropdown(), languages, Header(), NAV_ITEMS, NavItem, SearchDialog(), run(), layoutTranslations

### Community 11 - "CI/CD Workflows"
Cohesion: 0.11
Nodes (24): CI Job: Audit (production tree), CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck (+16 more)

### Community 12 - "jsonLd.ts"
Cohesion: 0.25
Nodes (11): RootLayout(), robots(), breadcrumbJsonLd(), Crumb, JsonLdValue, organizationJsonLd(), productJsonLd(), SoftwareApplicationInput (+3 more)

### Community 13 - "Admin Business Logic"
Cohesion: 0.11
Nodes (24): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+16 more)

### Community 14 - "lang.ts"
Cohesion: 0.07
Nodes (36): dynamic, GET, generateStaticParams(), GET(), revalidate, alternatePaths(), DEFAULT_LANG, isLang() (+28 more)

### Community 15 - "adminAuth.ts"
Cohesion: 0.14
Nodes (18): AdminPage(), dynamic, ERROR_MESSAGES, metadata, dynamic, GET(), GET, AdminAuthResult (+10 more)

### Community 16 - "ticketbot/stats/page.tsx"
Cohesion: 0.12
Nodes (18): AvgRow, CountRow, dynamic, GET(), MaxRow, SumRow, TierRow, AvgRow (+10 more)

### Community 18 - "Bot Proxy Routes"
Cohesion: 0.10
Nodes (33): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+25 more)

### Community 19 - "imprint/page.tsx"
Cohesion: 0.26
Nodes (12): ImprintPage(), TermsPage(), PrivacyPage(), LegalContent(), ALLOWED_SLUGS, getLegalContent(), inline(), LEGAL_DIR (+4 more)

### Community 20 - "ticketbot/verify/VerifyClient.tsx"
Cohesion: 0.16
Nodes (9): dynamic, metadata, VerifyPage(), Props, StepIndicator(), TIER_LABELS, VerifyClient(), translations (+1 more)

### Community 21 - "giveaway/dashboard/DashboardClient.tsx"
Cohesion: 0.09
Nodes (26): BonusRoleEditor(), Channel, CouponFields(), Ctx, Dict, EligibilityFields(), ExtendButton(), Giveaway (+18 more)

### Community 22 - "Card.tsx"
Cohesion: 0.13
Nodes (15): CustomPackageCard(), resolveImageSrc(), CustomPackages(), HOMEPAGE_TOOL_IDS, FIVEM_SCRIPT_IDS, FreeScripts(), CardContent, CardDescription (+7 more)

### Community 23 - "adminTeamRoute.test.ts"
Cohesion: 0.20
Nodes (10): POST, dynamic, PATCH, PaymentStatus, VALID_STATUS, TEAM_MANAGE, adminReq(), DbMember (+2 more)

### Community 24 - "giveawayStats.ts"
Cohesion: 0.15
Nodes (15): dynamic, GET(), GiveawayStatsPage(), BotGuild, dynamic, GiveawayVerifyPage(), metadata, getGiveawayPool() (+7 more)

### Community 25 - "query"
Cohesion: 0.11
Nodes (28): DELETE, dynamic, ownerFlag(), PATCH, dynamic, POST, TeamRow, authorized() (+20 more)

### Community 26 - "i18n.ts"
Cohesion: 0.14
Nodes (16): CTASection(), Hero(), STEP_ICONS, ReleaseFeed(), GithubMark(), Button, ButtonProps, ButtonSize (+8 more)

### Community 27 - "adminApi.ts"
Cohesion: 0.14
Nodes (13): dynamic, GET, GuildRow, AuditRow, dynamic, GET, dynamic, GET (+5 more)

### Community 28 - "writeAudit"
Cohesion: 0.20
Nodes (11): dynamic, PATCH, VALID_TIERS, DELETE, dynamic, DELETE, dynamic, PUT (+3 more)

### Community 29 - "PackageCard.tsx"
Cohesion: 0.26
Nodes (9): Row, PackageCard(), Props, SalePriceFetcher(), Badge, SaleData, SalePricesStore, useSalePricesStore (+1 more)

### Community 30 - "lib/tebex.ts"
Cohesion: 0.16
Nodes (18): AddToCartButton(), readStoredDiscordId(), withName(), addGiftToBasket(), addToBasket(), applyCoupon(), createBasket(), getAllAuthUrls() (+10 more)

### Community 31 - "dashboardAuth.ts"
Cohesion: 0.14
Nodes (16): GuildRow, GuildRow, DashboardClient(), Guild, DashboardGuild, DashboardPage(), dynamic, metadata (+8 more)

### Community 32 - "authorizeGuild"
Cohesion: 0.18
Nodes (14): execFileAsync, POST(), CustomerRow, POST(), POST(), dynamic, GET(), parseDate() (+6 more)

### Community 33 - "packages/[id]/page.tsx"
Cohesion: 0.10
Nodes (27): generateStaticParams(), PackageDetailPage(), revalidate, Catalog(), price(), Variant(), PackagePrice(), Props (+19 more)

### Community 34 - "ticketbot/dashboard/DashboardClient.tsx"
Cohesion: 0.09
Nodes (20): BotConfigEditor, BotDashboardLauncher(), GuildPanel(), Props, safeDomainHref(), T, TabKey, TIER_COLORS (+12 more)

### Community 35 - "getRequestLang"
Cohesion: 0.18
Nodes (20): AccountPage(), dynamic, generateMetadata(), LoginPage(), generateMetadata(), PackagesPage(), generateMetadata(), HomePage() (+12 more)

### Community 36 - "tebexPlugin.ts"
Cohesion: 0.11
Nodes (21): dynamic, GET, POST, dynamic, GET, POST, dynamic, GET (+13 more)

### Community 37 - "Privacy Policy (EN)"
Cohesion: 0.20
Nodes (12): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+4 more)

### Community 38 - "[token]/page.tsx"
Cohesion: 0.29
Nodes (7): dynamic, GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, giveawayResultTranslations

### Community 39 - "Data Collected by the Transcript Service"
Cohesion: 0.20
Nodes (12): Attachment Storage (Premium and Premium+), Discord OAuth Verification and Guild Record, Hosted Bot Management Data and Access Control, Ticket Bot Session Cookies, Storage Period Table, Data Collected by the Transcript Service, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials (+4 more)

### Community 40 - "Brand Identity Assets"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "Stripe Reconciliation Script"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "ticketbot-copy.ts"
Cohesion: 0.14
Nodes (15): CommandRow, de, en, GIVEAWAY_COPY, GiveawayCopy, de, en, LabelledText (+7 more)

### Community 43 - "MSK Scripts Shop"
Cohesion: 0.29
Nodes (7): CFX.re Account Requirement, Lizenzbedingungen (Einzelserver-Lizenz), Discord ID and Membership Requirement, FiveM Asset Escrow System, Single-Server License Terms, MSK Scripts Shop, Returns & Refunds (Digital Goods)

### Community 44 - "categories/[id]/page.tsx"
Cohesion: 0.18
Nodes (15): CategoryPage(), generateMetadata(), revalidate, CATEGORY_SEO, resolveVariant(), categoriesTranslations, packagesTranslations, convertPipeTables() (+7 more)

### Community 45 - "Giveaway Bot Marketing"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "Server Cleanup Script"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "PackagesBrowser.tsx"
Cohesion: 0.25
Nodes (13): FacetGroup(), PackagesBrowser(), priceOf(), tagsOf(), bucketLabel(), countBy(), countPriceBuckets(), Facet (+5 more)

### Community 48 - "bot-control/route.ts"
Cohesion: 0.20
Nodes (13): ALLOWED_ACTIONS, authHosted(), botDir(), execAsync, GET(), POST(), authHosted(), GET() (+5 more)

### Community 49 - "admin/coupons/route.ts"
Cohesion: 0.27
Nodes (11): dynamic, GET, countCouponStates(), CouponExpiry, CouponLike, couponState, isCouponActive(), isTrue() (+3 more)

### Community 50 - "Subscription and Domains"
Cohesion: 0.33
Nodes (7): Custom Domain: Certbot and Certificate Transparency, Cancellation and Downgrade, Custom Domain for Transcript Delivery, Abonnement und Zahlung (Stripe, Testphase), 14-Day Free Trial, Let's Encrypt SSL Certificate, Stripe Subscription Billing

### Community 51 - "Data Collected by the Shop"
Cohesion: 0.29
Nodes (7): Basket localStorage and sessionStorage, Data Collected by the Shop, Stripe Payments Europe, Ltd., Stripe Subscription Webhook, Tebex Payment Processing (Shop), Third Country Transfers (UK Adequacy, SCCs), Tebex Limited (Merchant of Record)

### Community 52 - "Ticket Bot Marketing"
Cohesion: 0.52
Nodes (7): Discord Ticket Bot Marketing Banner, Create Ticket Panel / Open Ticket Button, Ticket Status Workflow (In Progress / Resolved), Ticket Transcript / Support Ticket Card, Discord Ticket Bot (Product), MSK Dark Theme with Green Accent Visual Style, Tagline: Advanced, modular & open source

### Community 53 - "Kanbanly Project Management"
Cohesion: 0.43
Nodes (7): Workspaces, Boards and Cards with Labels, Due Dates and Assignments, Custom Package Banner Asset (public/), Dark Navy Background with Purple Accent Branding, Zum Dashboard Call-to-Action, Drag & Drop with Live Saving, Kanbanly Hero Banner, Kanbanly Project Management Tool

### Community 54 - "Kanbanly Brand Identity"
Cohesion: 0.33
Nodes (7): Kanbanly (Brand), Custom Package Brand Asset in public/, Indigo/Periwinkle Brand Color with White Tint Steps, Kanban Board Concept (3-Column Task Cards), Kanbanly Logo (Horizontal Lockup), Rounded-Square Kanban Grid Icon, Lowercase Bold Sans Wordmark 'kanbanly'

### Community 55 - "Forms Product Marketing"
Cohesion: 0.48
Nodes (7): Application Forms Product, MSK Dark Theme with Green Accent, Open Dashboard / Demo Form CTAs, Discord Bot Invite Integration, MSK Forms Hero Screenshot, Live Status Loop (Submitted / Picked up by a reviewer / Decision), Submission Status Card with Reviewer Note

### Community 56 - "Fuel Script Marketing"
Cohesion: 0.52
Nodes (7): msk_fuel Marketing Banner, ESX Framework Support, Realistic Fuel Consumption, Refueling & Station Logic, MSK Scripts Brand Identity (green M monogram, dark theme), MSK.FUEL (msk_fuel), QBCore Framework Support, Vehicle System Category

### Community 57 - "Handcuffs Script Marketing"
Cohesion: 0.48
Nodes (7): msk_handcuffs Marketing Banner, ESX Framework Support Badge, MSK Scripts Brand Identity (green M logo, dark green gradient, mono type), msk_handcuffs (FiveM Roleplay Restraint Script), QBCore Framework Support Badge, Realistic Restraints, Escort & Struggle Mechanics, Roleplay System (eyebrow claim)

### Community 58 - "Ticket Bot Features"
Cohesion: 0.52
Nodes (7): MSK Ticket Bot Marketing Banner, MSK Scripts Green M Logo / Brand Style, HTML Transcripts, Multi-Category Support Tickets, MSK.TICKETBOT (Discord Ticket Bot), Discord.js v14, SQLite

### Community 59 - "Vehicle Keys Marketing"
Cohesion: 0.52
Nodes (7): msk_vehiclekeys Marketing Banner, ESX Framework Support, MSK Scripts Brand Identity (M Logo, Dark Green Palette), MSK.VEHICLEKEYS (msk_vehiclekeys), QBCore Framework Support, Secure Key Ownership: Lock, Share and Hotwire Vehicles, Vehicle System Category

### Community 60 - "Transcript Image Repair"
Cohesion: 0.38
Nodes (6): filenameFromUrl(), main(), mysql, parseArgs(), path, { readFile, writeFile }

### Community 61 - "Data Collected by the Giveaway Bot"
Cohesion: 0.40
Nodes (6): Giveaway Bot: Detaillierte Verarbeitung, Data Collected by the Giveaway Bot, Giveaway Data Retention (Deleted on Bot Removal), Giveaway Dashboard Session Cookies, Anonymous Public Statistics Page, Giveaway Web Dashboard (Discord OAuth)

### Community 62 - "upload/route.ts"
Cohesion: 0.21
Nodes (17): AttachmentInput, checkRateLimit(), isValidGuild(), POST(), RateLimitRow, reencodeImage(), RequestBody, transcriptBasePath() (+9 more)

### Community 63 - "Core Framework Marketing"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, Core Framework / Core Library Claim, ESX Framework Support, MSK Scripts Brand Identity (green M mark, dark theme), MSK.CORE (msk_core), QBCore Framework Support

### Community 64 - "Engine Toggle Marketing"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, ESX Framework Support, Manual Engine Control for Vehicle Roleplay, MSK Scripts Brand Identity (Green M Logo, Dark Theme), msk_enginetoggle (Vehicle System Script), QBCore Framework Support

### Community 65 - "Garage Script Marketing"
Cohesion: 0.60
Nodes (6): msk_garage Marketing Banner, ESX Framework Support, Full Garage Management, MSK Scripts Brand Identity (M logo, dark green), MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage

### Community 66 - "Giveaway Bot Features"
Cohesion: 0.40
Nodes (6): Discord Giveaway Bot Marketing Banner, discord.js v14 (Tech Stack Claim), Multilingual Support Claim, Per-Guild Configurable Claim, Discord Giveaway Bot (Product), MSK Dark Theme with Green Accent Visual Style

### Community 67 - "Give Vehicle Marketing"
Cohesion: 0.53
Nodes (6): msk_givevehicle Marketing Banner, MSK Scripts Brand Identity (M logo, green-on-dark), ESX Framework Support Badge, msk_givevehicle (FiveM Admin Tool), QBCore Framework Support Badge, Claim: Spawn & gift any vehicle to players in seconds

### Community 68 - "Documentation Brand"
Cohesion: 0.60
Nodes (6): API Reference, MSK.DOCS Official Documentation Banner, Dark Green Tech Visual Style (monospace uppercase, accent green), MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs

### Community 69 - "Health Check API"
Cohesion: 0.33
Nodes (4): dynamic, IncidentsResponse, SEVERITY, StatusResponse

### Community 70 - "useLang"
Cohesion: 0.15
Nodes (12): CartPage(), CheckoutContent(), CartDrawer(), FALLBACK, LangContext, LangProvider(), useLang(), istSprachlos() (+4 more)

### Community 71 - "Codeberg Mirror Workflow"
Cohesion: 0.40
Nodes (5): Codeberg Mirror Secrets, Mirror Runs Only on Main and Tags, Mirror to Codeberg Workflow, Prune-Based Exact Mirror, Push to Codeberg Job

### Community 72 - "Kanbanly Marketing"
Cohesion: 0.70
Nodes (5): Kanbanly Marketing Banner (dark, 1200x630 OG-style), Kanban board glyph logo (indigo rounded tile, 3x4 card grid), Claim: Minimalistisches Kanban-Tool, DSGVO-konform, Kostenlos, Kanbanly (minimalist Kanban tool), Tagline: "Flow first. Build fast."

### Community 73 - "MSK Brand Assets"
Cohesion: 0.60
Nodes (5): Angular Geometric Monogram Style, MSK Green Accent Color Palette, MSK Scripts Brand Identity, MSK Scripts Logo (green M mark), Site Branding Asset (favicon, header, metadata)

### Community 74 - "Paste Service Marketing"
Cohesion: 0.60
Nodes (5): Paste Creation Form (Title + Content, 1 MB limit), MSK Dark Theme with Green Accent, MSK Paste (Self-hosted Pastebin), MSK Paste Screenshot, Syntax Highlighting

### Community 75 - "MSK Giveaway Bot"
Cohesion: 0.29
Nodes (7): Anwendbares Recht (Bundesrepublik Deutschland), Giveaway Bot Acceptable Use, Governing Law (Federal Republic of Germany), MSK Giveaway Bot, Scope of Services, Server Operator Responsibility for Giveaways, Terms & Conditions (EN)

### Community 76 - "Software License Terms"
Cohesion: 0.50
Nodes (4): Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version), MSK Source Available License (MSK-SAL v1.0), Protected Components (Verify System, Dashboard, Shop/Website Design)

### Community 77 - "URL Shortener UI"
Cohesion: 0.67
Nodes (4): Dark Theme with MSK Green Accent Headline, MSK Shortener Hero Screenshot, Long URL Input Form Card, MSK URL Shortener (privacy-friendly, no signup)

### Community 78 - "Project Contribution Guidelines"
Cohesion: 0.67
Nodes (3): Code of Conduct (Contributor Covenant), Contributing Guide, Pull Request Template

### Community 79 - "Code Coverage Workflow"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 101 - "Design System Tokens"
Cohesion: 0.29
Nodes (8): channels(), contrast(), CSS, dark, light, linear(), luminance(), mix()

### Community 102 - "CreateForm"
Cohesion: 0.24
Nodes (9): clampBonus(), couponPayload(), CreateForm(), EditButton(), eligibilityPayload(), PrizeFields(), prizePayload(), splitPrizes() (+1 more)

### Community 103 - "TicketBotLanding.tsx"
Cohesion: 0.18
Nodes (11): DASHBOARD_ICONS, FEATURE_ICONS, HOSTED_ICONS, HUB_HREFS, HUB_ICONS, HUB_VARIANTS, mb(), TicketBotLanding() (+3 more)

### Community 104 - "Tebex Stats Aggregator"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "CouponsTab.tsx"
Cohesion: 0.22
Nodes (8): CatalogItem, Coupon, CouponPayload, CouponsTab(), CouponState, formatDate(), STATE_LABEL, selectClass

### Community 106 - "giveawaySession.ts"
Cohesion: 0.22
Nodes (14): ADMINISTRATOR, GET(), isAdmin(), POST(), Envelope, getSecret(), GiveawayGuild, GiveawaySession (+6 more)

### Community 107 - "session.ts"
Cohesion: 0.24
Nodes (10): dynamic, GET(), ADMINISTRATOR, GET(), isAdmin(), GET(), DiscordGuild, generateState() (+2 more)

### Community 112 - "API Route Guards"
Cohesion: 0.25
Nodes (6): API_DIR, DB_ROUTES, GUARDS, key(), PUBLIC_BY_DESIGN, ROUTES

### Community 113 - "GiveawayLanding.tsx"
Cohesion: 0.20
Nodes (9): BotCrossLink(), COMMAND_NAMES, COUPON_ICONS, FEATURE_ICONS, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, SETTINGS_ICONS, STEP_ICONS (+1 more)

### Community 114 - "seo.ts"
Cohesion: 0.38
Nodes (8): generateMetadata(), decodeEntities(), DEFAULT_OG_IMAGE, HTML_ENTITIES, openGraphFor(), packageImage(), plainExcerpt(), stripTags()

### Community 115 - "tiers.ts"
Cohesion: 0.24
Nodes (9): checkDns(), execFileAsync, POST(), checkDns(), execFileAsync, POST(), getExpiresAt(), TIER_CONFIG (+1 more)

### Community 116 - "Database Schema"
Cohesion: 0.24
Nodes (9): giveaway_results, msk_admin_audit, msk_admin_team, msk_shop_stats, ticketbot_attachments, ticketbot_customers, ticketbot_guilds, ticketbot_rate_limits (+1 more)

### Community 117 - "Footer.tsx"
Cohesion: 0.22
Nodes (3): ECOSYSTEM_LINKS, Footer(), PaymentMarks()

### Community 118 - "cn"
Cohesion: 0.17
Nodes (15): StatusBadge(), formatBytes(), formatNum(), StatCard(), Stats, StatsClient(), TierBreakdown(), PackageGallery() (+7 more)

### Community 119 - "botSeo.ts"
Cohesion: 0.16
Nodes (18): generateMetadata(), GiveawayPage(), generateMetadata(), TicketBotPage(), GiveawayLanding(), JsonLd(), serialize(), appJsonLdFor() (+10 more)

### Community 121 - "layout.tsx"
Cohesion: 0.14
Nodes (12): metadata, viewport, NextThemesProviderProps, Props, ThemeProvider(), ThemeToggle(), NewsPopup(), NEWS_POPUP (+4 more)

### Community 123 - "StoreTab"
Cohesion: 0.36
Nodes (9): StoreTab(), act(), clear(), reveal(), saveSecret(), saveStore(), TemplatesTab(), act() (+1 more)

### Community 124 - "ApiKeysTab.tsx"
Cohesion: 0.32
Nodes (7): ApiKey, ApiKeysTab(), maskKey(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass()

### Community 125 - "Lang"
Cohesion: 0.29
Nodes (6): Props, WhyMSK(), LangContextValue, HOME_FEATURE_ICONS, BotDefinition, Lang

### Community 126 - "MSK Ticket Bot Transcript Service"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 127 - "url/route.ts"
Cohesion: 0.40
Nodes (5): dynamic, extractApiKey(), GET(), GuildRow, UrlRow

### Community 128 - "giveaway/stats/StatsClient.tsx"
Cohesion: 0.38
Nodes (6): Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), giveawayStatsTranslations

### Community 129 - "giveaway/verify/VerifyClient.tsx"
Cohesion: 0.40
Nodes (3): Guild, VerifyClient(), giveawayDashboardTranslations

## Knowledge Gaps
- **456 isolated node(s):** `ALL_TABS`, `Tier`, `ApiKey`, `TIER_LABELS`, `TIER_ORDER` (+451 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `authorizeGuild`, `data/route.ts`, `stripe/route.ts`, `adminAuth.ts`, `ticketbot/stats/page.tsx`, `tiers.ts`, `adminTeamRoute.test.ts`, `adminApi.ts`, `writeAudit`, `upload/route.ts`, `dashboardAuth.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `AdminClient.tsx`, `giveaway/stats/StatsClient.tsx`, `DashboardClient`, `giveaway/verify/VerifyClient.tsx`, `ticketbot/dashboard/DashboardClient.tsx`, `packages/[id]/page.tsx`, `Card`, `ResourcesClient.tsx`, `Header.tsx`, `PackagesBrowser.tsx`, `HeaderInner`, `ticketbot/verify/VerifyClient.tsx`, `giveaway/dashboard/DashboardClient.tsx`, `Card.tsx`, `layout.tsx`, `i18n.ts`, `ApiKeysTab.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `Tier` connect `dashboardAuth.ts` to `ticketbot/dashboard/DashboardClient.tsx`, `TicketBotLanding.tsx`, `stripe/route.ts`, `tiers.ts`, `ticketbot/verify/VerifyClient.tsx`, `query`, `writeAudit`, `upload/route.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `ALL_TABS`, `Tier`, `ApiKey` to the rest of the system?**
  _456 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `data/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13438735177865613 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._