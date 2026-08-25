# Graph Report - msk-shop  (2026-08-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1656 nodes · 3614 edges · 131 communities (109 shown, 22 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.88)
- Token cost: 5,525 input · 1,490 output

## Graph Freshness
- Built from commit: `587cdd9c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Admin Team Management
- Admin Action Routes
- Authentication and Rate Limiting
- Development Dependencies
- Admin Dashboard Tabs
- Core Application Dependencies
- Design System Documentation
- Resource Statistics Page
- TypeScript Configuration
- SEO and Root Configuration
- Localization and Header
- CI/CD Workflows
- JSON-LD Metadata Utilities
- Legal and Admin Strategy
- Sitemap Generation
- Admin Session Management
- Ticket Bot Statistics
- Checkout and Cart Logic
- Bot Proxy Middleware
- Package Detail Pages
- UI Status Components
- Giveaway Dashboard Editor
- Custom Package Components
- Admin Team API
- Legal and Privacy Pages
- Guild Configuration API
- Giveaway Verification Landing
- Catalog and Package Search
- Rate Limit Proxy
- Project Package Manifest
- Tebex Integration Library
- Admin API Endpoints
- NPM Scripts
- Product Catalog Components
- Ticket Bot Dashboard
- Page Layouts and Metadata
- E-commerce Management API
- GDPR Privacy Policy
- Admin Authorization Logic
- Data Storage Policies
- Brand Identity Assets
- Stripe Reconciliation Script
- Bot Copy Translations
- Licensing and Returns Policy
- News and Config Constants
- Giveaway Bot Marketing
- File Cleanup Script
- Package Browser Filtering
- Content Sanitization Utilities
- Coupon Status Utilities
- Subscription and SSL Terms
- Payment Data Processing
- Ticket Bot Marketing
- Kanbanly Project Management
- Kanbanly Brand Identity
- Application Forms Product
- Fuel System Script
- Handcuffs Script
- Ticket Bot Features
- Vehicle Keys Script
- Transcript Image Repair
- Giveaway Bot Privacy
- Admin Discord Verification
- Core Framework Script
- Engine Toggle Script
- Garage System Script
- Giveaway Bot Features
- Vehicle Admin Tool
- Documentation Branding
- Health Check API
- Cart and Navigation UI
- Codeberg Mirror Workflow
- Kanbanly Marketing
- Visual Brand Identity
- Pastebin Service
- Giveaway Bot Terms
- Software Licensing Terms
- URL Shortener Marketing
- Contribution Guidelines
- Code Coverage CI
- Auth URL Utilities
- Server Deployment Script
- VHost Creation Scripts
- Discord Statistics Integration
- ESLint Configuration
- Dependency Management Workflows
- GitHub Issue Templates
- CodeQL Security Analysis
- Deployment Workflows
- Next.js Configuration
- VHost Deletion Scripts
- Tailwind CSS Configuration
- Color Contrast Testing
- Localization Route Testing
- Bot Marketing Components
- Tebex Statistics Script
- Coupon Management UI
- Package Gallery UI
- Cookie Management Library
- Automated Release Workflow
- Documentation Assets
- Route Guard Testing
- API Key Management UI
- Lucide Icon Library
- Next.js Framework
- Database Schema
- Global Layout and Footer
- Giveaway Results Page
- Bot Landing Pages
- Sitemap Route
- URL Shortener API
- Radix UI Dropdown
- React Library
- Add to Cart Logic
- Transcript Service Terms
- SWR Data Fetching
- Button UI Component
- Header Interaction Logic
- Homepage Data Loading

## God Nodes (most connected - your core abstractions)
1. `cn()` - 56 edges
2. `getRequestLang()` - 46 edges
3. `query()` - 44 edges
4. `Button` - 40 edges
5. `Lang` - 39 edges
6. `Card` - 35 edges
7. `useLang()` - 34 edges
8. `queryOne()` - 29 edges
9. `getClientIp()` - 28 edges
10. `rateLimit()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `DELETE` --calls--> `writeAudit()`  [EXTRACTED]
  app/api/admin/coupons/[id]/route.ts → lib/adminAudit.ts
- `TabDef` --references--> `AdminPermission`  [EXTRACTED]
  app/admin/AdminClient.tsx → lib/adminPerms.ts
- `Member` --references--> `AdminPermission`  [EXTRACTED]
  app/admin/TeamTab.tsx → lib/adminPerms.ts
- `LangContextValue` --references--> `Lang`  [EXTRACTED]
  components/i18n/LangProvider.tsx → lib/i18n.ts

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

## Communities (131 total, 22 thin omitted)

### Community 0 - "Admin Team Management"
Cohesion: 0.17
Nodes (13): AdminClient(), ALL_TABS, TabDef, AuditEntry, AuditTab(), LookupTab(), Member, AdminCtx (+5 more)

### Community 1 - "Admin Action Routes"
Cohesion: 0.06
Nodes (47): ACTION_PATH, OWNER_ACTIONS, POST(), ADMINISTRATOR, GET(), isAdmin(), ALLOWED, GET() (+39 more)

### Community 2 - "Authentication and Rate Limiting"
Cohesion: 0.05
Nodes (69): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+61 more)

### Community 3 - "Development Dependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+19 more)

### Community 4 - "Admin Dashboard Tabs"
Cohesion: 0.15
Nodes (18): BanEntry, BansTab(), ErrorCard(), GiftCard, GiftCardsTab(), LookupPayment, LookupResult, Package (+10 more)

### Community 5 - "Core Application Dependencies"
Cohesion: 0.07
Nodes (27): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, mysql2, next-themes, dependencies, clsx, @fontsource-variable/inter (+19 more)

### Community 6 - "Design System Documentation"
Cohesion: 0.07
Nodes (27): Badges, Buttons, Cards, Colors, Components, Design System: MSK Scripts Shop, Do:, Do's and Don'ts (+19 more)

### Community 7 - "Resource Statistics Page"
Cohesion: 0.06
Nodes (40): dynamic, GET(), ResourcesPage(), formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge() (+32 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "SEO and Root Configuration"
Cohesion: 0.20
Nodes (15): RootLayout(), GESPERRT, robots(), LangProvider(), alternatePaths(), DEFAULT_LANG, EINMALIG_EXAKT, EINMALIG_PRAEFIXE (+7 more)

### Community 10 - "Localization and Header"
Cohesion: 0.16
Nodes (14): FALLBACK, LangContext, useLang(), LanguageDropdown(), languages, Header(), NAV_ITEMS, NavItem (+6 more)

### Community 11 - "CI/CD Workflows"
Cohesion: 0.11
Nodes (24): CI Job: Audit (production tree), CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck (+16 more)

### Community 12 - "JSON-LD Metadata Utilities"
Cohesion: 0.33
Nodes (8): breadcrumbJsonLd(), Crumb, JsonLdValue, organizationJsonLd(), SoftwareApplicationInput, softwareApplicationJsonLd(), absoluteUrl(), siteUrl()

### Community 13 - "Legal and Admin Strategy"
Cohesion: 0.11
Nodes (24): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+16 more)

### Community 14 - "Sitemap Generation"
Cohesion: 0.22
Nodes (11): GET(), revalidate, bothLanguages(), buildSitemapEntries(), escapeXml(), newest(), parseTimestamp(), renderSitemapXml() (+3 more)

### Community 15 - "Admin Session Management"
Cohesion: 0.22
Nodes (9): dynamic, GET(), ADMIN_SESSION_COOKIE, AdminSession, getSecret(), parseAdminSession(), signAdminSession(), SignedPayload (+1 more)

### Community 16 - "Ticket Bot Statistics"
Cohesion: 0.19
Nodes (11): AvgRow, CountRow, dynamic, EMPTY_STATS, loadStats(), MaxRow, StatsPage(), SumRow (+3 more)

### Community 17 - "Checkout and Cart Logic"
Cohesion: 0.23
Nodes (7): CheckoutContent(), CartDrawer(), SalePriceFetcher(), cartTranslations, CartStore, useCartStore, TebexBasket

### Community 18 - "Bot Proxy Middleware"
Cohesion: 0.10
Nodes (33): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+25 more)

### Community 19 - "Package Detail Pages"
Cohesion: 0.18
Nodes (20): generateMetadata(), revalidate, generateMetadata(), PackageDetailPage(), revalidate, PackagesPage(), PACKAGE_BADGES, PACKAGE_DESCRIPTIONS (+12 more)

### Community 20 - "UI Status Components"
Cohesion: 0.08
Nodes (28): StatusBadge(), Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), formatBytes(), formatNum() (+20 more)

### Community 21 - "Giveaway Dashboard Editor"
Cohesion: 0.07
Nodes (44): BonusRoleEditor(), Channel, clampBonus(), CouponFields(), couponPayload(), CreateForm(), Ctx, Dict (+36 more)

### Community 22 - "Custom Package Components"
Cohesion: 0.21
Nodes (9): CustomPackageCard(), resolveImageSrc(), CustomPackages(), HOMEPAGE_TOOL_IDS, FIVEM_SCRIPT_IDS, FreeScripts(), CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE (+1 more)

### Community 23 - "Admin Team API"
Cohesion: 0.17
Nodes (14): POST, DELETE, dynamic, ownerFlag(), PATCH, dynamic, POST, TeamRow (+6 more)

### Community 24 - "Legal and Privacy Pages"
Cohesion: 0.26
Nodes (12): ImprintPage(), TermsPage(), PrivacyPage(), LegalContent(), Props, ALLOWED_SLUGS, getLegalContent(), inline() (+4 more)

### Community 25 - "Guild Configuration API"
Cohesion: 0.13
Nodes (21): dynamic, PATCH, VALID_TIERS, authorized(), POST(), authorized(), POST(), ResultRow (+13 more)

### Community 26 - "Giveaway Verification Landing"
Cohesion: 0.12
Nodes (16): Guild, VerifyClient(), CTASection(), Hero(), HowItWorks(), STEP_ICONS, ReleaseFeed(), WhyMSK() (+8 more)

### Community 27 - "Catalog and Package Search"
Cohesion: 0.18
Nodes (11): dynamic, GET, dynamic, GET, generateStaticParams(), generateStaticParams(), Catalog(), SearchDialog() (+3 more)

### Community 28 - "Rate Limit Proxy"
Cohesion: 0.19
Nodes (12): BODY_LIMIT_PREFIXES, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited(), proxy() (+4 more)

### Community 29 - "Project Package Manifest"
Cohesion: 0.18
Nodes (10): engines, node, name, overrides, eslint, js-yaml, postcss, sharp (+2 more)

### Community 30 - "Tebex Integration Library"
Cohesion: 0.41
Nodes (10): addGiftToBasket(), addToBasket(), applyCoupon(), createBasket(), getAllAuthUrls(), getBasket(), H, removeCoupon() (+2 more)

### Community 31 - "Admin API Endpoints"
Cohesion: 0.16
Nodes (11): dynamic, GET, GuildRow, AuditRow, dynamic, GET, DELETE, dynamic (+3 more)

### Community 32 - "NPM Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:coverage, test:watch (+1 more)

### Community 33 - "Product Catalog Components"
Cohesion: 0.16
Nodes (19): price(), Row, Variant(), PackageCard(), PackagePrice(), Props, Badge, BadgeProps (+11 more)

### Community 34 - "Ticket Bot Dashboard"
Cohesion: 0.09
Nodes (20): BotConfigEditor, BotDashboardLauncher(), GuildPanel(), Props, safeDomainHref(), T, TabKey, TIER_COLORS (+12 more)

### Community 35 - "Page Layouts and Metadata"
Cohesion: 0.16
Nodes (21): AccountPage(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), dynamic, generateMetadata(), generateMetadata() (+13 more)

### Community 36 - "E-commerce Management API"
Cohesion: 0.09
Nodes (31): dynamic, GET, POST, DELETE, dynamic, PUT, dynamic, GET (+23 more)

### Community 37 - "GDPR Privacy Policy"
Cohesion: 0.20
Nodes (12): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+4 more)

### Community 38 - "Admin Authorization Logic"
Cohesion: 0.23
Nodes (10): AdminPage(), dynamic, ERROR_MESSAGES, metadata, GET, AdminAuthResult, AdminTeamRow, authorizeAdmin() (+2 more)

### Community 39 - "Data Storage Policies"
Cohesion: 0.20
Nodes (12): Attachment Storage (Premium and Premium+), Discord OAuth Verification and Guild Record, Hosted Bot Management Data and Access Control, Ticket Bot Session Cookies, Storage Period Table, Data Collected by the Transcript Service, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials (+4 more)

### Community 40 - "Brand Identity Assets"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "Stripe Reconciliation Script"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "Bot Copy Translations"
Cohesion: 0.14
Nodes (15): CommandRow, de, en, GIVEAWAY_COPY, GiveawayCopy, de, en, LabelledText (+7 more)

### Community 43 - "Licensing and Returns Policy"
Cohesion: 0.29
Nodes (7): CFX.re Account Requirement, Lizenzbedingungen (Einzelserver-Lizenz), Discord ID and Membership Requirement, FiveM Asset Escrow System, Single-Server License Terms, MSK Scripts Shop, Returns & Refunds (Digital Goods)

### Community 44 - "News and Config Constants"
Cohesion: 0.13
Nodes (12): NewsPopup(), BadgeVariant, CATEGORY_SEO, CATEGORY_VARIANT, FEATURED_PACKAGE_IDS, NEWS_POPUP, PACKAGE_SEO, PackageVariant (+4 more)

### Community 45 - "Giveaway Bot Marketing"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "File Cleanup Script"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "Package Browser Filtering"
Cohesion: 0.25
Nodes (13): FacetGroup(), PackagesBrowser(), priceOf(), tagsOf(), bucketLabel(), countBy(), countPriceBuckets(), Facet (+5 more)

### Community 48 - "Content Sanitization Utilities"
Cohesion: 0.33
Nodes (8): CategoryPage(), convertPipeTables(), EMOJI, OPTIONS, pickLanguageBlock(), replaceEmojiShortcodes(), sanitizeTebexHtml(), splitPipeRow()

### Community 49 - "Coupon Status Utilities"
Cohesion: 0.27
Nodes (11): dynamic, GET, countCouponStates(), CouponExpiry, CouponLike, couponState, isCouponActive(), isTrue() (+3 more)

### Community 50 - "Subscription and SSL Terms"
Cohesion: 0.33
Nodes (7): Custom Domain: Certbot and Certificate Transparency, Cancellation and Downgrade, Custom Domain for Transcript Delivery, Abonnement und Zahlung (Stripe, Testphase), 14-Day Free Trial, Let's Encrypt SSL Certificate, Stripe Subscription Billing

### Community 51 - "Payment Data Processing"
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

### Community 55 - "Application Forms Product"
Cohesion: 0.48
Nodes (7): Application Forms Product, MSK Dark Theme with Green Accent, Open Dashboard / Demo Form CTAs, Discord Bot Invite Integration, MSK Forms Hero Screenshot, Live Status Loop (Submitted / Picked up by a reviewer / Decision), Submission Status Card with Reviewer Note

### Community 56 - "Fuel System Script"
Cohesion: 0.52
Nodes (7): msk_fuel Marketing Banner, ESX Framework Support, Realistic Fuel Consumption, Refueling & Station Logic, MSK Scripts Brand Identity (green M monogram, dark theme), MSK.FUEL (msk_fuel), QBCore Framework Support, Vehicle System Category

### Community 57 - "Handcuffs Script"
Cohesion: 0.48
Nodes (7): msk_handcuffs Marketing Banner, ESX Framework Support Badge, MSK Scripts Brand Identity (green M logo, dark green gradient, mono type), msk_handcuffs (FiveM Roleplay Restraint Script), QBCore Framework Support Badge, Realistic Restraints, Escort & Struggle Mechanics, Roleplay System (eyebrow claim)

### Community 58 - "Ticket Bot Features"
Cohesion: 0.52
Nodes (7): MSK Ticket Bot Marketing Banner, MSK Scripts Green M Logo / Brand Style, HTML Transcripts, Multi-Category Support Tickets, MSK.TICKETBOT (Discord Ticket Bot), Discord.js v14, SQLite

### Community 59 - "Vehicle Keys Script"
Cohesion: 0.52
Nodes (7): msk_vehiclekeys Marketing Banner, ESX Framework Support, MSK Scripts Brand Identity (M Logo, Dark Green Palette), MSK.VEHICLEKEYS (msk_vehiclekeys), QBCore Framework Support, Secure Key Ownership: Lock, Share and Hotwire Vehicles, Vehicle System Category

### Community 60 - "Transcript Image Repair"
Cohesion: 0.38
Nodes (6): filenameFromUrl(), main(), mysql, parseArgs(), path, { readFile, writeFile }

### Community 61 - "Giveaway Bot Privacy"
Cohesion: 0.40
Nodes (6): Giveaway Bot: Detaillierte Verarbeitung, Data Collected by the Giveaway Bot, Giveaway Data Retention (Deleted on Bot Removal), Giveaway Dashboard Session Cookies, Anonymous Public Statistics Page, Giveaway Web Dashboard (Discord OAuth)

### Community 62 - "Admin Discord Verification"
Cohesion: 0.05
Nodes (54): dynamic, GET(), ADMINISTRATOR, GET(), isAdmin(), GET(), AttachmentInput, checkRateLimit() (+46 more)

### Community 63 - "Core Framework Script"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, Core Framework / Core Library Claim, ESX Framework Support, MSK Scripts Brand Identity (green M mark, dark theme), MSK.CORE (msk_core), QBCore Framework Support

### Community 64 - "Engine Toggle Script"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, ESX Framework Support, Manual Engine Control for Vehicle Roleplay, MSK Scripts Brand Identity (Green M Logo, Dark Theme), msk_enginetoggle (Vehicle System Script), QBCore Framework Support

### Community 65 - "Garage System Script"
Cohesion: 0.60
Nodes (6): msk_garage Marketing Banner, ESX Framework Support, Full Garage Management, MSK Scripts Brand Identity (M logo, dark green), MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage

### Community 66 - "Giveaway Bot Features"
Cohesion: 0.40
Nodes (6): Discord Giveaway Bot Marketing Banner, discord.js v14 (Tech Stack Claim), Multilingual Support Claim, Per-Guild Configurable Claim, Discord Giveaway Bot (Product), MSK Dark Theme with Green Accent Visual Style

### Community 67 - "Vehicle Admin Tool"
Cohesion: 0.53
Nodes (6): msk_givevehicle Marketing Banner, MSK Scripts Brand Identity (M logo, green-on-dark), ESX Framework Support Badge, msk_givevehicle (FiveM Admin Tool), QBCore Framework Support Badge, Claim: Spawn & gift any vehicle to players in seconds

### Community 68 - "Documentation Branding"
Cohesion: 0.60
Nodes (6): API Reference, MSK.DOCS Official Documentation Banner, Dark Green Tech Visual Style (monospace uppercase, accent green), MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs

### Community 69 - "Health Check API"
Cohesion: 0.33
Nodes (4): dynamic, IncidentsResponse, SEVERITY, StatusResponse

### Community 70 - "Cart and Navigation UI"
Cohesion: 0.24
Nodes (5): CartPage(), Bots, istSprachlos(), LocaleLink(), Props

### Community 71 - "Codeberg Mirror Workflow"
Cohesion: 0.40
Nodes (5): Codeberg Mirror Secrets, Mirror Runs Only on Main and Tags, Mirror to Codeberg Workflow, Prune-Based Exact Mirror, Push to Codeberg Job

### Community 72 - "Kanbanly Marketing"
Cohesion: 0.70
Nodes (5): Kanbanly Marketing Banner (dark, 1200x630 OG-style), Kanban board glyph logo (indigo rounded tile, 3x4 card grid), Claim: Minimalistisches Kanban-Tool, DSGVO-konform, Kostenlos, Kanbanly (minimalist Kanban tool), Tagline: "Flow first. Build fast."

### Community 73 - "Visual Brand Identity"
Cohesion: 0.60
Nodes (5): Angular Geometric Monogram Style, MSK Green Accent Color Palette, MSK Scripts Brand Identity, MSK Scripts Logo (green M mark), Site Branding Asset (favicon, header, metadata)

### Community 74 - "Pastebin Service"
Cohesion: 0.60
Nodes (5): Paste Creation Form (Title + Content, 1 MB limit), MSK Dark Theme with Green Accent, MSK Paste (Self-hosted Pastebin), MSK Paste Screenshot, Syntax Highlighting

### Community 75 - "Giveaway Bot Terms"
Cohesion: 0.29
Nodes (7): Anwendbares Recht (Bundesrepublik Deutschland), Giveaway Bot Acceptable Use, Governing Law (Federal Republic of Germany), MSK Giveaway Bot, Scope of Services, Server Operator Responsibility for Giveaways, Terms & Conditions (EN)

### Community 76 - "Software Licensing Terms"
Cohesion: 0.50
Nodes (4): Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version), MSK Source Available License (MSK-SAL v1.0), Protected Components (Verify System, Dashboard, Shop/Website Design)

### Community 77 - "URL Shortener Marketing"
Cohesion: 0.67
Nodes (4): Dark Theme with MSK Green Accent Headline, MSK Shortener Hero Screenshot, Long URL Input Form Card, MSK URL Shortener (privacy-friendly, no signup)

### Community 78 - "Contribution Guidelines"
Cohesion: 0.67
Nodes (3): Code of Conduct (Contributor Covenant), Contributing Guide, Pull Request Template

### Community 79 - "Code Coverage CI"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 101 - "Color Contrast Testing"
Cohesion: 0.29
Nodes (8): channels(), contrast(), CSS, dark, light, linear(), luminance(), mix()

### Community 102 - "Localization Route Testing"
Cohesion: 0.50
Nodes (4): ALLE, DARF_NEXT_LINK, dateien(), WURZELN

### Community 103 - "Bot Marketing Components"
Cohesion: 0.10
Nodes (20): BotCrossLink(), COMMAND_NAMES, COUPON_ICONS, FEATURE_ICONS, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, SETTINGS_ICONS, STEP_ICONS (+12 more)

### Community 104 - "Tebex Statistics Script"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "Coupon Management UI"
Cohesion: 0.22
Nodes (8): CatalogItem, Coupon, CouponPayload, CouponsTab(), CouponState, formatDate(), STATE_LABEL, selectClass

### Community 106 - "Package Gallery UI"
Cohesion: 0.36
Nodes (8): Props, LangContextValue, Props, PackageGallery(), PackageGalleryProps, resolveImages(), Lang, TebexPackage

### Community 112 - "Route Guard Testing"
Cohesion: 0.25
Nodes (6): API_DIR, DB_ROUTES, GUARDS, key(), PUBLIC_BY_DESIGN, ROUTES

### Community 113 - "API Key Management UI"
Cohesion: 0.32
Nodes (7): ApiKey, ApiKeysTab(), maskKey(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass()

### Community 116 - "Database Schema"
Cohesion: 0.24
Nodes (9): giveaway_results, msk_admin_audit, msk_admin_team, msk_shop_stats, ticketbot_attachments, ticketbot_customers, ticketbot_guilds, ticketbot_rate_limits (+1 more)

### Community 117 - "Global Layout and Footer"
Cohesion: 0.14
Nodes (9): metadata, viewport, ECOSYSTEM_LINKS, Footer(), PaymentMarks(), NextThemesProviderProps, Props, ThemeProvider() (+1 more)

### Community 118 - "Giveaway Results Page"
Cohesion: 0.29
Nodes (7): dynamic, GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, giveawayResultTranslations

### Community 119 - "Bot Landing Pages"
Cohesion: 0.15
Nodes (19): generateMetadata(), GiveawayPage(), generateMetadata(), TicketBotPage(), GiveawayLanding(), JsonLd(), serialize(), appJsonLdFor() (+11 more)

### Community 121 - "URL Shortener API"
Cohesion: 0.40
Nodes (5): dynamic, extractApiKey(), GET(), GuildRow, UrlRow

### Community 125 - "Add to Cart Logic"
Cohesion: 0.22
Nodes (6): AddToCartButton(), readStoredDiscordId(), withName(), TebexBasketPackage, TebexCategory, TebexCoupon

### Community 126 - "Transcript Service Terms"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 128 - "Button UI Component"
Cohesion: 0.33
Nodes (5): ButtonProps, ButtonSize, ButtonVariant, sizeClasses, variantClasses

### Community 130 - "Homepage Data Loading"
Cohesion: 0.83
Nodes (3): HomePage(), loadHeadlineStat(), loadShopStats()

## Knowledge Gaps
- **460 isolated node(s):** `AdminAuthResult`, `AdminTeamRow`, `GwListItem`, `BotGuild`, `ControlResult` (+455 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `queryOne()` connect `Guild Configuration API` to `Authentication and Rate Limiting`, `Admin Authorization Logic`, `Resource Statistics Page`, `Admin Session Management`, `Ticket Bot Statistics`, `Giveaway Results Page`, `Admin Team API`, `URL Shortener API`, `Admin Discord Verification`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `Tier` connect `Admin Discord Verification` to `Authentication and Rate Limiting`, `Ticket Bot Dashboard`, `Bot Marketing Components`, `UI Status Components`, `Guild Configuration API`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `query()` connect `Guild Configuration API` to `Admin Action Routes`, `Authentication and Rate Limiting`, `E-commerce Management API`, `Admin Session Management`, `Ticket Bot Statistics`, `Admin Team API`, `Admin Discord Verification`, `Admin API Endpoints`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `AdminAuthResult`, `AdminTeamRow`, `GwListItem` to the rest of the system?**
  _460 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Action Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.05552617662612375 - nodes in this community are weakly interconnected._
- **Should `Authentication and Rate Limiting` be split into smaller, more focused modules?**
  _Cohesion score 0.05485148514851485 - nodes in this community are weakly interconnected._
- **Should `Development Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._