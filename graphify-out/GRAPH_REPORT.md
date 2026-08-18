# Graph Report - .  (2026-08-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1527 nodes · 3160 edges · 129 communities (114 shown, 15 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 92 edges (avg confidence: 0.86)
- Token cost: 6,003 input · 1,457 output

## Graph Freshness
- Built from commit: `11c7daed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Guild Dashboard API
- Giveaway Management API
- Authentication and Rate Limiting
- Development Dependencies
- Admin Management Tabs
- Core Dependencies
- Admin Audit Logging
- Resource Usage Stats
- TypeScript Configuration
- Stripe Subscription Management
- Navigation and UI
- CI/CD Workflows
- SEO and Sitemap
- Admin Business Logic
- Giveaway Data Queries
- Admin Session Management
- Ticket Bot Statistics
- Home Page Features
- Bot Proxy Routes
- Legal and Privacy Pages
- Ticket Verification Client
- Giveaway Dashboard Components
- Custom Package Listings
- Team Management Tests
- UI Utility Components
- Transcript and Winner API
- Bot Configuration UI
- Admin Team Management
- User Account Components
- Product Catalog Pages
- Shopping Cart Logic
- Discord Auth Session
- Package Pricing Logic
- Catalog Configuration
- Ticket Dashboard Client
- Homepage Marketing
- Tebex Integration API
- GDPR Privacy Policy
- Admin Error Handling
- Data Retention Policy
- Brand Visual Identity
- Stripe Reconciliation Script
- Transcript Service Terms
- FiveM Licensing Terms
- HTML Sanitization Utilities
- Giveaway Bot Marketing
- Server Cleanup Scripts
- Package Browser Filtering
- Giveaway Session Auth
- Coupon Status Logic
- Subscription and Domains
- Shop Terms and Data
- Ticket Bot Marketing
- Kanbanly Project Management
- Kanbanly Brand Assets
- Forms Product Marketing
- Fuel Script Marketing
- Handcuffs Script Marketing
- Ticket Bot Features
- Vehicle Keys Marketing
- Transcript Image Repair
- Giveaway Bot Privacy
- Ticket Bot Privacy
- Core Framework Marketing
- Engine Toggle Marketing
- Garage Script Marketing
- Giveaway Bot Features
- Givevehicle Script Marketing
- Documentation Branding
- System Health API
- Footer and Payments
- Codeberg Mirror Workflow
- Kanbanly Marketing Banner
- MSK Brand Identity
- Paste Service UI
- Giveaway Use Policy
- Software Licensing (CLA)
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
- Release Version Tracking
- Tebex Type Definitions
- Tebex Stats Aggregator
- Coupon Management UI
- Shop Statistics Tests
- Bot Landing Pages
- Automated Release Workflow
- Project Branding Assets
- API Route Guards
- Bot Marketing Components
- Guild Tier Configuration
- Resource Stats UI
- Database Schema
- Transcript Upload Service
- API Key Management
- Transcript List UI
- API Key Validation
- Giveaway Results Layout
- Giveaway Stats Client
- Rate Limiting Proxy
- Admin Audit Routes
- Giveaway Verification API
- Language Context Provider
- Hosted Bot Management
- Ticket Stats Client

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
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/stats/StatsClient.tsx → lib/utils.ts
- `StepIndicator()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/verify/VerifyClient.tsx → lib/utils.ts
- `VerifyPage()` --calls--> `parseSession()`  [EXTRACTED]
  app/ticketbot/verify/page.tsx → lib/session.ts

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

## Communities (129 total, 15 thin omitted)

### Community 0 - "Guild Dashboard API"
Cohesion: 0.11
Nodes (24): GuildRow, GuildRow, POST(), generateApiKey(), GuildRow, POST(), GuildRow, POST() (+16 more)

### Community 1 - "Giveaway Management API"
Cohesion: 0.15
Nodes (17): ACTION_PATH, OWNER_ACTIONS, POST(), ALLOWED, GET(), GwListItem, KIND_PATH, OWNER_KINDS (+9 more)

### Community 2 - "Authentication and Rate Limiting"
Cohesion: 0.11
Nodes (34): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+26 more)

### Community 3 - "Development Dependencies"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+38 more)

### Community 4 - "Admin Management Tabs"
Cohesion: 0.14
Nodes (20): ALL_TABS, BanEntry, BansTab(), GiftCard, GiftCardsTab(), LookupPayment, LookupResult, LookupTab() (+12 more)

### Community 5 - "Core Dependencies"
Cohesion: 0.05
Nodes (39): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, js-cookie, lucide-react, mysql2, next, next-themes (+31 more)

### Community 6 - "Admin Audit Logging"
Cohesion: 0.15
Nodes (12): DELETE, dynamic, DELETE, dynamic, PUT, dynamic, PUT, dynamic (+4 more)

### Community 7 - "Resource Usage Stats"
Cohesion: 0.15
Nodes (18): dynamic, GET(), dynamic, metadata, ResourcesPage(), ResourcesClient(), RESOURCE_STATS, RESOURCE_STATS_GAME (+10 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "Stripe Subscription Management"
Cohesion: 0.21
Nodes (18): CustomerRow, POST(), POST(), applySubscription(), downgradeGuild(), GuildIdRow, POST(), resolveInvoiceSubscriptionId() (+10 more)

### Community 10 - "Navigation and UI"
Cohesion: 0.18
Nodes (14): LanguageDropdown(), languages, Header(), HeaderInner(), NAV_ITEMS, NavItem, ThemeToggle(), NewsPopup() (+6 more)

### Community 11 - "CI/CD Workflows"
Cohesion: 0.11
Nodes (24): CI Job: Audit (production tree), CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck (+16 more)

### Community 12 - "SEO and Sitemap"
Cohesion: 0.26
Nodes (10): generateStaticParams(), robots(), botLandingEntries(), Entry, revalidate, sitemap(), STATIC_ROUTES, absoluteUrl() (+2 more)

### Community 13 - "Admin Business Logic"
Cohesion: 0.11
Nodes (24): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+16 more)

### Community 14 - "Giveaway Data Queries"
Cohesion: 0.18
Nodes (13): dynamic, GET(), dynamic, GiveawayStatsPage(), metadata, getGiveawayPool(), giveawayQuery(), giveawayQueryOne() (+5 more)

### Community 15 - "Admin Session Management"
Cohesion: 0.22
Nodes (10): AdminPage(), dynamic, GET(), ADMIN_SESSION_COOKIE, AdminSession, getSecret(), parseAdminSession(), signAdminSession() (+2 more)

### Community 16 - "Ticket Bot Statistics"
Cohesion: 0.11
Nodes (21): AvgRow, CountRow, dynamic, GET(), MaxRow, SumRow, TierRow, AvgRow (+13 more)

### Community 17 - "Home Page Features"
Cohesion: 0.22
Nodes (11): STEP_ICONS, ReleaseFeed(), WhyMSK(), LangContextValue, HOME_FEATURE_ICONS, SITE_CONFIG, homeTranslations, Lang (+3 more)

### Community 18 - "Bot Proxy Routes"
Cohesion: 0.10
Nodes (33): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+25 more)

### Community 19 - "Legal and Privacy Pages"
Cohesion: 0.20
Nodes (16): ImprintPage(), metadata, metadata, TermsPage(), metadata, PrivacyPage(), LegalContent(), Props (+8 more)

### Community 20 - "Ticket Verification Client"
Cohesion: 0.16
Nodes (9): dynamic, metadata, VerifyPage(), Props, StepIndicator(), TIER_LABELS, VerifyClient(), translations (+1 more)

### Community 21 - "Giveaway Dashboard Components"
Cohesion: 0.09
Nodes (37): BonusRoleEditor(), Channel, clampBonus(), CouponFields(), couponPayload(), CreateForm(), Ctx, Dict (+29 more)

### Community 22 - "Custom Package Listings"
Cohesion: 0.24
Nodes (9): CustomPackageCard(), resolveImageSrc(), CustomPackages(), HOMEPAGE_TOOL_IDS, FIVEM_SCRIPT_IDS, FreeScripts(), CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE (+1 more)

### Community 23 - "Team Management Tests"
Cohesion: 0.21
Nodes (9): POST, DELETE, dynamic, PATCH, TEAM_MANAGE, adminReq(), DbMember, serveAdminTeam() (+1 more)

### Community 24 - "UI Utility Components"
Cohesion: 0.29
Nodes (7): StatusBadge(), PackageGallery(), resolveImages(), Container, ContainerProps, Skeleton(), cn()

### Community 25 - "Transcript and Winner API"
Cohesion: 0.17
Nodes (15): authorized(), POST(), authorized(), POST(), ResultRow, WinnerIn, dynamic, GET() (+7 more)

### Community 26 - "Bot Configuration UI"
Cohesion: 0.29
Nodes (5): BotConfigEditor(), BotStatus, logLineClass(), Msg, dashboardTranslations

### Community 27 - "Admin Team Management"
Cohesion: 0.19
Nodes (16): TabDef, Member, dynamic, GET, POST, TeamRow, AdminCtx, AdminAuthResult (+8 more)

### Community 28 - "User Account Components"
Cohesion: 0.15
Nodes (13): AuditEntry, AuditTab(), Badge, BadgeProps, BadgeVariant, variantClasses, Card, CardContent (+5 more)

### Community 29 - "Product Catalog Pages"
Cohesion: 0.17
Nodes (23): CategoryPage(), generateMetadata(), revalidate, generateMetadata(), PackageDetailPage(), revalidate, JsonLd(), serialize() (+15 more)

### Community 30 - "Shopping Cart Logic"
Cohesion: 0.22
Nodes (17): CartPage(), CartDrawer(), AddToCartButton(), readStoredDiscordId(), addGiftToBasket(), addToBasket(), applyCoupon(), createBasket() (+9 more)

### Community 31 - "Discord Auth Session"
Cohesion: 0.24
Nodes (10): dynamic, GET(), ADMINISTRATOR, GET(), isAdmin(), GET(), DiscordGuild, generateState() (+2 more)

### Community 32 - "Package Pricing Logic"
Cohesion: 0.26
Nodes (9): PackageCard(), PackagePrice(), Props, SalePriceFetcher(), DisplayPrice, resolveDisplayPrice(), SaleData, SalePricesStore (+1 more)

### Community 33 - "Catalog Configuration"
Cohesion: 0.22
Nodes (11): price(), Row, Variant(), Props, Badge, BadgeVariant, FEATURED_PACKAGE_IDS, PACKAGE_BADGES (+3 more)

### Community 34 - "Ticket Dashboard Client"
Cohesion: 0.18
Nodes (9): BotConfigEditor, DashboardClient(), GuildPanel(), Props, safeDomainHref(), T, TabKey, TIER_COLORS (+1 more)

### Community 35 - "Homepage Marketing"
Cohesion: 0.16
Nodes (14): HomePage(), metadata, Bots, Hero(), HowItWorks(), Entry, ProofLine(), HeadlineStat (+6 more)

### Community 36 - "Tebex Integration API"
Cohesion: 0.09
Nodes (23): dynamic, GET, POST, dynamic, GET, POST, dynamic, GET (+15 more)

### Community 37 - "GDPR Privacy Policy"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

### Community 38 - "Admin Error Handling"
Cohesion: 0.12
Nodes (11): AdminClient(), dynamic, ERROR_MESSAGES, metadata, CheckoutContent(), Button, ButtonProps, ButtonSize (+3 more)

### Community 39 - "Data Retention Policy"
Cohesion: 0.25
Nodes (9): Attachment Storage (Premium and Premium+), Hosted Bot Management Data and Access Control, Storage Period Table, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials, Hosted Bot Customer Responsibilities, Hosted Bot Management Service, Hosting Termination and 14-Day Deletion (+1 more)

### Community 40 - "Brand Visual Identity"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "Stripe Reconciliation Script"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "Transcript Service Terms"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 43 - "FiveM Licensing Terms"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "HTML Sanitization Utilities"
Cohesion: 0.39
Nodes (6): convertPipeTables(), EMOJI, OPTIONS, replaceEmojiShortcodes(), sanitizeTebexHtml(), splitPipeRow()

### Community 45 - "Giveaway Bot Marketing"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "Server Cleanup Scripts"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "Package Browser Filtering"
Cohesion: 0.18
Nodes (13): generateStaticParams(), bucketLabel(), countBy(), Facet, PackagesBrowser(), PRICE_STEPS, priceBucket(), tagsOf() (+5 more)

### Community 48 - "Giveaway Session Auth"
Cohesion: 0.24
Nodes (11): ADMINISTRATOR, GET(), isAdmin(), Envelope, getSecret(), GiveawayGuild, GiveawaySession, GiveawayVerifyData (+3 more)

### Community 49 - "Coupon Status Logic"
Cohesion: 0.27
Nodes (10): dynamic, GET, countCouponStates(), CouponExpiry, CouponLike, couponState, isCouponActive(), isTrue() (+2 more)

### Community 50 - "Subscription and Domains"
Cohesion: 0.33
Nodes (7): Custom Domain: Certbot and Certificate Transparency, Cancellation and Downgrade, Custom Domain for Transcript Delivery, Abonnement und Zahlung (Stripe, Testphase), 14-Day Free Trial, Let's Encrypt SSL Certificate, Stripe Subscription Billing

### Community 51 - "Shop Terms and Data"
Cohesion: 0.29
Nodes (7): Basket localStorage and sessionStorage, Data Collected by the Shop, Tebex Payment Processing (Shop), Discord ID and Membership Requirement, MSK Scripts Shop, Returns & Refunds (Digital Goods), Tebex Limited (Merchant of Record)

### Community 52 - "Ticket Bot Marketing"
Cohesion: 0.52
Nodes (7): Discord Ticket Bot Marketing Banner, Create Ticket Panel / Open Ticket Button, Ticket Status Workflow (In Progress / Resolved), Ticket Transcript / Support Ticket Card, Discord Ticket Bot (Product), MSK Dark Theme with Green Accent Visual Style, Tagline: Advanced, modular & open source

### Community 53 - "Kanbanly Project Management"
Cohesion: 0.43
Nodes (7): Workspaces, Boards and Cards with Labels, Due Dates and Assignments, Custom Package Banner Asset (public/), Dark Navy Background with Purple Accent Branding, Zum Dashboard Call-to-Action, Drag & Drop with Live Saving, Kanbanly Hero Banner, Kanbanly Project Management Tool

### Community 54 - "Kanbanly Brand Assets"
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

### Community 61 - "Giveaway Bot Privacy"
Cohesion: 0.40
Nodes (6): Giveaway Bot: Detaillierte Verarbeitung, Data Collected by the Giveaway Bot, Giveaway Data Retention (Deleted on Bot Removal), Giveaway Dashboard Session Cookies, Anonymous Public Statistics Page, Giveaway Web Dashboard (Discord OAuth)

### Community 62 - "Ticket Bot Privacy"
Cohesion: 0.33
Nodes (6): Discord OAuth Verification and Guild Record, Ticket Bot Session Cookies, Stripe Payments Europe, Ltd., Stripe Subscription Webhook, Third Country Transfers (UK Adequacy, SCCs), Data Collected by the Transcript Service

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

### Community 67 - "Givevehicle Script Marketing"
Cohesion: 0.53
Nodes (6): msk_givevehicle Marketing Banner, MSK Scripts Brand Identity (M logo, green-on-dark), ESX Framework Support Badge, msk_givevehicle (FiveM Admin Tool), QBCore Framework Support Badge, Claim: Spawn & gift any vehicle to players in seconds

### Community 68 - "Documentation Branding"
Cohesion: 0.60
Nodes (6): API Reference, MSK.DOCS Official Documentation Banner, Dark Green Tech Visual Style (monospace uppercase, accent green), MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs

### Community 69 - "System Health API"
Cohesion: 0.33
Nodes (4): dynamic, IncidentsResponse, SEVERITY, StatusResponse

### Community 70 - "Footer and Payments"
Cohesion: 0.22
Nodes (3): ECOSYSTEM_LINKS, Footer(), PaymentMarks()

### Community 71 - "Codeberg Mirror Workflow"
Cohesion: 0.40
Nodes (5): Codeberg Mirror Secrets, Mirror Runs Only on Main and Tags, Mirror to Codeberg Workflow, Prune-Based Exact Mirror, Push to Codeberg Job

### Community 72 - "Kanbanly Marketing Banner"
Cohesion: 0.70
Nodes (5): Kanbanly Marketing Banner (dark, 1200x630 OG-style), Kanban board glyph logo (indigo rounded tile, 3x4 card grid), Claim: Minimalistisches Kanban-Tool, DSGVO-konform, Kostenlos, Kanbanly (minimalist Kanban tool), Tagline: "Flow first. Build fast."

### Community 73 - "MSK Brand Identity"
Cohesion: 0.60
Nodes (5): Angular Geometric Monogram Style, MSK Green Accent Color Palette, MSK Scripts Brand Identity, MSK Scripts Logo (green M mark), Site Branding Asset (favicon, header, metadata)

### Community 74 - "Paste Service UI"
Cohesion: 0.60
Nodes (5): Paste Creation Form (Title + Content, 1 MB limit), MSK Dark Theme with Green Accent, MSK Paste (Self-hosted Pastebin), MSK Paste Screenshot, Syntax Highlighting

### Community 75 - "Giveaway Use Policy"
Cohesion: 0.50
Nodes (4): Giveaway Bot Acceptable Use, MSK Giveaway Bot, Scope of Services, Server Operator Responsibility for Giveaways

### Community 76 - "Software Licensing (CLA)"
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
Cohesion: 0.31
Nodes (9): channels(), contrast(), CSS, dark, light, linear(), luminance(), mix() (+1 more)

### Community 102 - "Release Version Tracking"
Cohesion: 0.47
Nodes (7): fetchJson(), lastCommitDate(), loadOne(), loadReleases(), newestVersion(), summarize(), VersionsFileEntry

### Community 103 - "Tebex Type Definitions"
Cohesion: 0.18
Nodes (9): Props, PackageGalleryProps, Props, SearchDialog(), softwareApplicationJsonLd(), TebexBasketPackage, TebexCategory, TebexCoupon (+1 more)

### Community 104 - "Tebex Stats Aggregator"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "Coupon Management UI"
Cohesion: 0.22
Nodes (8): CatalogItem, Coupon, CouponPayload, CouponsTab(), CouponState, formatDate(), STATE_LABEL, selectClass

### Community 107 - "Bot Landing Pages"
Cohesion: 0.06
Nodes (44): GiveawayBotPageDe(), metadata, metadata, TicketBotPageDe(), GiveawayBotPage(), metadata, metadata, TicketBotPage() (+36 more)

### Community 112 - "API Route Guards"
Cohesion: 0.22
Nodes (5): API_DIR, DB_ROUTES, GUARDS, PUBLIC_BY_DESIGN, ROUTES

### Community 113 - "Bot Marketing Components"
Cohesion: 0.15
Nodes (11): BotCrossLink(), COMMAND_NAMES, COUPON_ICONS, FEATURE_ICONS, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, SETTINGS_ICONS, STEP_ICONS (+3 more)

### Community 114 - "Guild Tier Configuration"
Cohesion: 0.22
Nodes (9): dynamic, PATCH, VALID_TIERS, checkDns(), execFileAsync, POST(), getExpiresAt(), TIER_CONFIG (+1 more)

### Community 115 - "Resource Stats UI"
Cohesion: 0.19
Nodes (9): formatNum(), formatSigned(), ResourceCard(), TrendBadge(), HistoryPoint, ResourceLink, ResourceStat, ResourceStatsResult (+1 more)

### Community 116 - "Database Schema"
Cohesion: 0.24
Nodes (9): giveaway_results, msk_admin_audit, msk_admin_team, msk_shop_stats, ticketbot_attachments, ticketbot_customers, ticketbot_guilds, ticketbot_rate_limits (+1 more)

### Community 117 - "Transcript Upload Service"
Cohesion: 0.23
Nodes (17): AttachmentInput, checkRateLimit(), isValidGuild(), POST(), RateLimitRow, reencodeImage(), RequestBody, transcriptBasePath() (+9 more)

### Community 118 - "API Key Management"
Cohesion: 0.32
Nodes (7): ApiKey, ApiKeysTab(), maskKey(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass()

### Community 119 - "Transcript List UI"
Cohesion: 0.38
Nodes (6): EMPTY_QUERY, formatBytes(), Query, safeUrl(), TranscriptItem, TranscriptsCard()

### Community 120 - "API Key Validation"
Cohesion: 0.40
Nodes (5): dynamic, extractApiKey(), GET(), GuildRow, UrlRow

### Community 121 - "Giveaway Results Layout"
Cohesion: 0.13
Nodes (20): dynamic, GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, metadata, RootLayout() (+12 more)

### Community 122 - "Giveaway Stats Client"
Cohesion: 0.38
Nodes (6): Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), giveawayStatsTranslations

### Community 123 - "Rate Limiting Proxy"
Cohesion: 0.22
Nodes (12): BODY_LIMIT_PREFIXES, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited(), proxy() (+4 more)

### Community 124 - "Admin Audit Routes"
Cohesion: 0.13
Nodes (11): dynamic, GET, GuildRow, AuditRow, dynamic, GET, dynamic, GET (+3 more)

### Community 125 - "Giveaway Verification API"
Cohesion: 0.31
Nodes (7): POST(), BotGuild, dynamic, GiveawayVerifyPage(), metadata, parseGiveawayVerify(), signGiveawaySession()

### Community 126 - "Language Context Provider"
Cohesion: 0.31
Nodes (7): DashboardClient(), Guild, VerifyClient(), LangContext, LangProvider(), useLang(), setLangCookie()

### Community 127 - "Hosted Bot Management"
Cohesion: 0.31
Nodes (6): ScopedGuildId, trustedGuildId(), TrustedGuildSource, archiveHostedBot(), execAsync, HostedRow

### Community 128 - "Ticket Stats Client"
Cohesion: 0.53
Nodes (5): formatBytes(), formatNum(), StatCard(), StatsClient(), TierBreakdown()

## Knowledge Gaps
- **450 isolated node(s):** `ALL_TABS`, `Tier`, `ApiKey`, `TIER_LABELS`, `TIER_ORDER` (+445 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Card` connect `User Account Components` to `Ticket Stats Client`, `Catalog Configuration`, `Ticket Dashboard Client`, `Language Context Provider`, `Admin Management Tabs`, `Admin Error Handling`, `Coupon Management UI`, `Bot Landing Pages`, `Bot Marketing Components`, `Resource Stats UI`, `Ticket Verification Client`, `Giveaway Dashboard Components`, `API Key Management`, `Transcript List UI`, `Giveaway Results Layout`, `Giveaway Stats Client`, `Product Catalog Pages`, `Shopping Cart Logic`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Tier` connect `Guild Dashboard API` to `Ticket Dashboard Client`, `Stripe Subscription Management`, `Bot Landing Pages`, `Guild Tier Configuration`, `Ticket Verification Client`, `Transcript Upload Service`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Button` connect `Admin Error Handling` to `Ticket Dashboard Client`, `Admin Management Tabs`, `Footer and Payments`, `Coupon Management UI`, `Navigation and UI`, `Bot Landing Pages`, `Bot Marketing Components`, `Home Page Features`, `Resource Stats UI`, `Ticket Verification Client`, `Giveaway Dashboard Components`, `API Key Management`, `Transcript List UI`, `Language Context Provider`, `User Account Components`, `Product Catalog Pages`, `Shopping Cart Logic`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `ALL_TABS`, `Tier`, `ApiKey` to the rest of the system?**
  _450 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Guild Dashboard API` be split into smaller, more focused modules?**
  _Cohesion score 0.10984848484848485 - nodes in this community are weakly interconnected._
- **Should `Giveaway Management API` be split into smaller, more focused modules?**
  _Cohesion score 0.14624505928853754 - nodes in this community are weakly interconnected._
- **Should `Authentication and Rate Limiting` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._