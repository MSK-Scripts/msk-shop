# Graph Report - msk-shop  (2026-08-22)

## Corpus Check
- 281 files · ~179,975 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1626 nodes · 3349 edges · 127 communities (112 shown, 15 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac2ad35b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dashboardAuth.ts
- Giveaway Management API
- getClientIp
- Development Dependencies
- AdminClient.tsx
- dependencies
- Design System: MSK Scripts Shop
- Resource Statistics API
- TypeScript Configuration
- stripe/route.ts
- cn
- CI/CD Workflows
- layout.tsx
- Admin Business Logic
- Giveaway Data Queries
- admin/page.tsx
- ticketbot/stats/page.tsx
- Hero.tsx
- Bot Proxy Routes
- markdown.ts
- Ticket Verification Client
- giveaway/dashboard/DashboardClient.tsx
- Custom Package Listings
- [discordUserId]/route.ts
- bot-control/route.ts
- query
- app/page.tsx
- adminApi.ts
- authorizeGuild
- packages/[id]/page.tsx
- lib/tebex.ts
- Discord Auth Session
- resolveDisplayPrice
- Catalog.tsx
- ticketbot/dashboard/DashboardClient.tsx
- ProofLine.tsx
- writeAudit
- Privacy Policy (EN)
- Button.tsx
- Hosted Bot Management Service
- Brand Identity Assets
- Stripe Reconciliation Script
- ticketbot-copy.ts
- Terms & Conditions (EN)
- sanitize.ts
- Giveaway Bot Marketing
- Server Cleanup Script
- PackagesBrowser.tsx
- Giveaway Session Auth
- couponStatus.ts
- Subscription and Domains
- MSK Scripts Shop
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
- Giveaway Verification Route
- Core Framework Marketing
- Engine Toggle Marketing
- Garage Script Marketing
- Giveaway Bot Features
- Give Vehicle Marketing
- Documentation Brand
- Health Check API
- i18n.ts
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
- Release Versioning Logic
- types/tebex.ts
- Tebex Stats Aggregator
- TicketBotLanding.tsx
- JsonLd.tsx
- botSeo.ts
- Automated Release Workflow
- Project Branding Assets
- API Route Guards
- Lang
- tiers.ts
- ResourcesClient.tsx
- Database Schema
- Transcript Upload Service
- API Key Management
- de/giveaway/page.tsx
- sitemap.xsl/route.ts
- lang.ts
- Rate Limiting Proxy
- audit/route.ts
- Data Collected by the Transcript Service
- MSK Ticket Bot Transcript Service

## God Nodes (most connected - your core abstractions)
1. `cn()` - 56 edges
2. `query()` - 44 edges
3. `Button` - 40 edges
4. `Card` - 34 edges
5. `Lang` - 32 edges
6. `queryOne()` - 29 edges
7. `getClientIp()` - 28 edges
8. `rateLimit()` - 28 edges
9. `writeAudit()` - 26 edges
10. `useLang()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `TabDef` --references--> `AdminPermission`  [EXTRACTED]
  app/admin/AdminClient.tsx → lib/adminPerms.ts
- `Member` --references--> `AdminPermission`  [EXTRACTED]
  app/admin/TeamTab.tsx → lib/adminPerms.ts
- `PATCH` --indirect_call--> `isAdminPermission()`  [INFERRED]
  app/api/admin/team/[discordUserId]/route.ts → lib/adminPerms.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/giveaway/stats/StatsClient.tsx → lib/utils.ts

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

## Communities (127 total, 15 thin omitted)

### Community 0 - "dashboardAuth.ts"
Cohesion: 0.13
Nodes (18): GuildRow, GuildRow, GuildRow, GuildRow, DashboardClient(), Guild, DashboardGuild, DashboardPage() (+10 more)

### Community 1 - "Giveaway Management API"
Cohesion: 0.13
Nodes (17): ACTION_PATH, OWNER_ACTIONS, POST(), ALLOWED, GET(), GwListItem, KIND_PATH, OWNER_KINDS (+9 more)

### Community 2 - "getClientIp"
Cohesion: 0.20
Nodes (17): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+9 more)

### Community 3 - "Development Dependencies"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+38 more)

### Community 4 - "AdminClient.tsx"
Cohesion: 0.06
Nodes (39): ALL_TABS, TabDef, AuditEntry, AuditTab(), BanEntry, BansTab(), CatalogItem, Coupon (+31 more)

### Community 5 - "dependencies"
Cohesion: 0.05
Nodes (39): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, js-cookie, lucide-react, mysql2, next-themes, dependencies (+31 more)

### Community 6 - "Design System: MSK Scripts Shop"
Cohesion: 0.07
Nodes (27): Badges, Buttons, Cards, Colors, Components, Design System: MSK Scripts Shop, Do:, Do's and Don'ts (+19 more)

### Community 7 - "Resource Statistics API"
Cohesion: 0.15
Nodes (18): dynamic, GET(), dynamic, metadata, ResourcesPage(), ResourcesClient(), RESOURCE_STATS, RESOURCE_STATS_GAME (+10 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "stripe/route.ts"
Cohesion: 0.15
Nodes (24): CustomerRow, POST(), applySubscription(), downgradeGuild(), GuildIdRow, POST(), resolveInvoiceSubscriptionId(), upsertCustomer() (+16 more)

### Community 10 - "cn"
Cohesion: 0.11
Nodes (18): LanguageDropdown(), languages, Header(), NAV_ITEMS, NavItem, ThemeToggle(), CardFooter, CardHeader (+10 more)

### Community 11 - "CI/CD Workflows"
Cohesion: 0.11
Nodes (24): CI Job: Audit (production tree), CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck (+16 more)

### Community 12 - "layout.tsx"
Cohesion: 0.17
Nodes (15): metadata, RootLayout(), viewport, robots(), NextThemesProviderProps, Props, ThemeProvider(), breadcrumbJsonLd() (+7 more)

### Community 13 - "Admin Business Logic"
Cohesion: 0.11
Nodes (24): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+16 more)

### Community 14 - "Giveaway Data Queries"
Cohesion: 0.18
Nodes (13): dynamic, GET(), dynamic, GiveawayStatsPage(), metadata, getGiveawayPool(), giveawayQuery(), giveawayQueryOne() (+5 more)

### Community 15 - "admin/page.tsx"
Cohesion: 0.15
Nodes (14): AdminClient(), AdminPage(), dynamic, ERROR_MESSAGES, metadata, dynamic, GET(), ADMIN_SESSION_COOKIE (+6 more)

### Community 16 - "ticketbot/stats/page.tsx"
Cohesion: 0.11
Nodes (20): AvgRow, CountRow, dynamic, GET(), MaxRow, SumRow, TierRow, AvgRow (+12 more)

### Community 17 - "Hero.tsx"
Cohesion: 0.21
Nodes (9): CTASection(), Hero(), HowItWorks(), STEP_ICONS, ReleaseFeed(), GithubMark(), SITE_CONFIG, homeTranslations (+1 more)

### Community 18 - "Bot Proxy Routes"
Cohesion: 0.10
Nodes (33): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+25 more)

### Community 19 - "markdown.ts"
Cohesion: 0.21
Nodes (15): ImprintPage(), metadata, metadata, TermsPage(), metadata, PrivacyPage(), LegalContent(), Props (+7 more)

### Community 20 - "Ticket Verification Client"
Cohesion: 0.16
Nodes (9): dynamic, metadata, VerifyPage(), Props, StepIndicator(), TIER_LABELS, VerifyClient(), translations (+1 more)

### Community 21 - "giveaway/dashboard/DashboardClient.tsx"
Cohesion: 0.06
Nodes (46): BonusRoleEditor(), Channel, clampBonus(), CouponFields(), couponPayload(), CreateForm(), Ctx, DashboardClient() (+38 more)

### Community 22 - "Custom Package Listings"
Cohesion: 0.21
Nodes (9): CustomPackageCard(), resolveImageSrc(), CustomPackages(), HOMEPAGE_TOOL_IDS, FIVEM_SCRIPT_IDS, FreeScripts(), CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE (+1 more)

### Community 23 - "[discordUserId]/route.ts"
Cohesion: 0.23
Nodes (10): POST, DELETE, dynamic, ownerFlag(), PATCH, TEAM_MANAGE, adminReq(), DbMember (+2 more)

### Community 24 - "bot-control/route.ts"
Cohesion: 0.20
Nodes (13): ALLOWED_ACTIONS, authHosted(), botDir(), execAsync, GET(), POST(), authHosted(), GET() (+5 more)

### Community 25 - "query"
Cohesion: 0.10
Nodes (27): dynamic, PATCH, VALID_TIERS, dynamic, GET, GuildRow, authorized(), POST() (+19 more)

### Community 26 - "app/page.tsx"
Cohesion: 0.20
Nodes (8): HomePage(), metadata, Bots, Catalog(), WhyMSK(), HOME_FEATURE_ICONS, loadHeadlineStat(), loadShopStats()

### Community 27 - "adminApi.ts"
Cohesion: 0.23
Nodes (14): dynamic, GET, POST, TeamRow, AdminCtx, AdminAuthResult, AdminTeamRow, authorizeAdmin() (+6 more)

### Community 28 - "authorizeGuild"
Cohesion: 0.24
Nodes (10): checkDns(), execFileAsync, POST(), POST(), dynamic, GET(), parseDate(), parsePositiveInt() (+2 more)

### Community 29 - "packages/[id]/page.tsx"
Cohesion: 0.22
Nodes (16): generateMetadata(), revalidate, generateMetadata(), PackageDetailPage(), revalidate, categoriesTranslations, productJsonLd(), decodeEntities() (+8 more)

### Community 30 - "lib/tebex.ts"
Cohesion: 0.06
Nodes (40): dynamic, GET, dynamic, GET, CartPage(), generateStaticParams(), generateStaticParams(), GET() (+32 more)

### Community 31 - "Discord Auth Session"
Cohesion: 0.24
Nodes (10): dynamic, GET(), ADMINISTRATOR, GET(), isAdmin(), GET(), DiscordGuild, generateState() (+2 more)

### Community 32 - "resolveDisplayPrice"
Cohesion: 0.20
Nodes (10): PackageCard(), PackagePrice(), Props, SalePriceFetcher(), resolveVariant(), DisplayPrice, resolveDisplayPrice(), SaleData (+2 more)

### Community 33 - "Catalog.tsx"
Cohesion: 0.12
Nodes (18): price(), Variant(), Badge, BadgeProps, BadgeVariant, variantClasses, BadgeVariant, CATEGORY_SEO (+10 more)

### Community 34 - "ticketbot/dashboard/DashboardClient.tsx"
Cohesion: 0.11
Nodes (14): BotConfigEditor, BotDashboardLauncher(), GuildPanel(), Props, safeDomainHref(), T, TabKey, TIER_COLORS (+6 more)

### Community 35 - "ProofLine.tsx"
Cohesion: 0.21
Nodes (8): Entry, ProofLine(), HeadlineStat, num(), formatReversalRate(), Row, ShopStats, queryOne

### Community 36 - "writeAudit"
Cohesion: 0.08
Nodes (37): dynamic, GET, POST, DELETE, dynamic, dynamic, POST, DELETE (+29 more)

### Community 37 - "Privacy Policy (EN)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

### Community 38 - "Button.tsx"
Cohesion: 0.12
Nodes (13): CheckoutContent(), Guild, Button, ButtonProps, ButtonSize, ButtonVariant, sizeClasses, variantClasses (+5 more)

### Community 39 - "Hosted Bot Management Service"
Cohesion: 0.25
Nodes (9): Attachment Storage (Premium and Premium+), Hosted Bot Management Data and Access Control, Storage Period Table, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials, Hosted Bot Customer Responsibilities, Hosted Bot Management Service, Hosting Termination and 14-Day Deletion (+1 more)

### Community 40 - "Brand Identity Assets"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "Stripe Reconciliation Script"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "ticketbot-copy.ts"
Cohesion: 0.19
Nodes (11): CommandRow, de, en, GIVEAWAY_COPY, GiveawayCopy, de, en, LabelledText (+3 more)

### Community 43 - "Terms & Conditions (EN)"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "sanitize.ts"
Cohesion: 0.33
Nodes (8): CategoryPage(), convertPipeTables(), EMOJI, OPTIONS, pickLanguageBlock(), replaceEmojiShortcodes(), sanitizeTebexHtml(), splitPipeRow()

### Community 45 - "Giveaway Bot Marketing"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "Server Cleanup Script"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "PackagesBrowser.tsx"
Cohesion: 0.26
Nodes (11): PackagesBrowser(), priceOf(), tagsOf(), bucketLabel(), countBy(), countPriceBuckets(), Facet, PRICE_BUCKETS (+3 more)

### Community 48 - "Giveaway Session Auth"
Cohesion: 0.24
Nodes (11): ADMINISTRATOR, GET(), isAdmin(), Envelope, getSecret(), GiveawayGuild, GiveawaySession, GiveawayVerifyData (+3 more)

### Community 49 - "couponStatus.ts"
Cohesion: 0.29
Nodes (10): GET, countCouponStates(), CouponExpiry, CouponLike, couponState, isCouponActive(), isTrue(), timestamp() (+2 more)

### Community 50 - "Subscription and Domains"
Cohesion: 0.33
Nodes (7): Custom Domain: Certbot and Certificate Transparency, Cancellation and Downgrade, Custom Domain for Transcript Delivery, Abonnement und Zahlung (Stripe, Testphase), 14-Day Free Trial, Let's Encrypt SSL Certificate, Stripe Subscription Billing

### Community 51 - "MSK Scripts Shop"
Cohesion: 0.29
Nodes (7): Basket localStorage and sessionStorage, Data Collected by the Shop, Tebex Payment Processing (Shop), Discord ID and Membership Requirement, MSK Scripts Shop, Returns & Refunds (Digital Goods), Tebex Limited (Merchant of Record)

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

### Community 62 - "Giveaway Verification Route"
Cohesion: 0.31
Nodes (7): POST(), BotGuild, dynamic, GiveawayVerifyPage(), metadata, parseGiveawayVerify(), signGiveawaySession()

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

### Community 70 - "i18n.ts"
Cohesion: 0.10
Nodes (20): Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), VerifyClient(), formatBytes(), formatNum() (+12 more)

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
Cohesion: 0.50
Nodes (4): Giveaway Bot Acceptable Use, MSK Giveaway Bot, Scope of Services, Server Operator Responsibility for Giveaways

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

### Community 102 - "Release Versioning Logic"
Cohesion: 0.47
Nodes (7): fetchJson(), lastCommitDate(), loadOne(), loadReleases(), newestVersion(), summarize(), VersionsFileEntry

### Community 103 - "types/tebex.ts"
Cohesion: 0.21
Nodes (11): Props, Row, Props, PackageGallery(), PackageGalleryProps, resolveImages(), Badge, TebexBasketPackage (+3 more)

### Community 104 - "Tebex Stats Aggregator"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "TicketBotLanding.tsx"
Cohesion: 0.18
Nodes (11): DASHBOARD_ICONS, FEATURE_ICONS, HOSTED_ICONS, HUB_HREFS, HUB_ICONS, HUB_VARIANTS, mb(), TicketBotLanding() (+3 more)

### Community 106 - "JsonLd.tsx"
Cohesion: 0.33
Nodes (7): metadata, TicketBotPageDe(), metadata, TicketBotPage(), JsonLd(), serialize(), ticketBotAppJsonLd()

### Community 107 - "botSeo.ts"
Cohesion: 0.18
Nodes (12): TICKETBOT_COPY, BOT_LANDING_PATHS, BotSeo, GIVEAWAY, giveawayMetadata(), LOCALE, metadataFor(), TICKETBOT (+4 more)

### Community 112 - "API Route Guards"
Cohesion: 0.25
Nodes (6): API_DIR, DB_ROUTES, GUARDS, key(), PUBLIC_BY_DESIGN, ROUTES

### Community 113 - "Lang"
Cohesion: 0.16
Nodes (12): BotCrossLink(), COMMAND_NAMES, COUPON_ICONS, FEATURE_ICONS, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, SETTINGS_ICONS, STEP_ICONS (+4 more)

### Community 114 - "tiers.ts"
Cohesion: 0.33
Nodes (6): checkDns(), execFileAsync, POST(), getExpiresAt(), TIER_CONFIG, TierConfig

### Community 115 - "ResourcesClient.tsx"
Cohesion: 0.21
Nodes (8): formatNum(), formatSigned(), ResourceCard(), TrendBadge(), HistoryPoint, ResourceLink, ResourceStat, ResourceStatsResult

### Community 116 - "Database Schema"
Cohesion: 0.24
Nodes (9): giveaway_results, msk_admin_audit, msk_admin_team, msk_shop_stats, ticketbot_attachments, ticketbot_customers, ticketbot_guilds, ticketbot_rate_limits (+1 more)

### Community 117 - "Transcript Upload Service"
Cohesion: 0.21
Nodes (17): AttachmentInput, checkRateLimit(), isValidGuild(), POST(), RateLimitRow, reencodeImage(), RequestBody, transcriptBasePath() (+9 more)

### Community 118 - "API Key Management"
Cohesion: 0.32
Nodes (7): ApiKey, ApiKeysTab(), maskKey(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass()

### Community 119 - "de/giveaway/page.tsx"
Cohesion: 0.31
Nodes (7): GiveawayBotPageDe(), metadata, GiveawayBotPage(), metadata, GiveawayLanding(), appJsonLdFor(), giveawayAppJsonLd()

### Community 121 - "lang.ts"
Cohesion: 0.14
Nodes (18): dynamic, GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, metadata, PackagesPage() (+10 more)

### Community 123 - "Rate Limiting Proxy"
Cohesion: 0.19
Nodes (12): BODY_LIMIT_PREFIXES, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited(), proxy() (+4 more)

### Community 124 - "audit/route.ts"
Cohesion: 0.50
Nodes (3): AuditRow, dynamic, GET

### Community 125 - "Data Collected by the Transcript Service"
Cohesion: 0.33
Nodes (6): Discord OAuth Verification and Guild Record, Ticket Bot Session Cookies, Stripe Payments Europe, Ltd., Stripe Subscription Webhook, Third Country Transfers (UK Adequacy, SCCs), Data Collected by the Transcript Service

### Community 126 - "MSK Ticket Bot Transcript Service"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

## Knowledge Gaps
- **465 isolated node(s):** `ALL_TABS`, `Tier`, `ApiKey`, `TIER_LABELS`, `TIER_ORDER` (+460 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `Catalog.tsx`, `ticketbot/dashboard/DashboardClient.tsx`, `AdminClient.tsx`, `i18n.ts`, `Button.tsx`, `types/tebex.ts`, `admin/page.tsx`, `PackagesBrowser.tsx`, `ResourcesClient.tsx`, `Ticket Verification Client`, `giveaway/dashboard/DashboardClient.tsx`, `API Key Management`, `lib/tebex.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `Tier` connect `dashboardAuth.ts` to `ticketbot/dashboard/DashboardClient.tsx`, `stripe/route.ts`, `TicketBotLanding.tsx`, `tiers.ts`, `Ticket Verification Client`, `Transcript Upload Service`, `query`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Card` connect `Button.tsx` to `Catalog.tsx`, `ticketbot/dashboard/DashboardClient.tsx`, `AdminClient.tsx`, `i18n.ts`, `TicketBotLanding.tsx`, `cn`, `admin/page.tsx`, `Lang`, `ResourcesClient.tsx`, `Ticket Verification Client`, `giveaway/dashboard/DashboardClient.tsx`, `API Key Management`, `lang.ts`, `packages/[id]/page.tsx`, `lib/tebex.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `ALL_TABS`, `Tier`, `ApiKey` to the rest of the system?**
  _465 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboardAuth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._
- **Should `Giveaway Management API` be split into smaller, more focused modules?**
  _Cohesion score 0.13438735177865613 - nodes in this community are weakly interconnected._
- **Should `Development Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._