# Graph Report - msk-shop  (2026-08-22)

## Corpus Check
- 281 files · ~181,731 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1629 nodes · 3396 edges · 119 communities (103 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41c09098`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AdminClient.tsx
- giveawaySession.ts
- getClientIp
- devDependencies
- CouponsTab.tsx
- dependencies
- Design System: MSK Scripts Shop
- fivestats.ts
- TypeScript Configuration
- stripe/route.ts
- i18n.ts
- CI/CD Workflows
- jsonLd.ts
- Admin Business Logic
- sitemap.ts
- adminAuth.ts
- ticketbot/stats/page.tsx
- HeaderInner
- Bot Proxy Routes
- markdown.ts
- ticketbot/verify/VerifyClient.tsx
- giveaway/dashboard/DashboardClient.tsx
- Custom Package Listings
- adminTeamRoute.test.ts
- ticketbot/stats/StatsClient.tsx
- query
- app/page.tsx
- url/route.ts
- PaymentMarks.tsx
- packages/[id]/page.tsx
- lib/tebex.ts
- upload/route.ts
- useCartStore
- Catalog.tsx
- ticketbot/dashboard/DashboardClient.tsx
- Hero.tsx
- adminApi.ts
- Privacy Policy (EN)
- Hosted Bot Management Service
- Brand Identity Assets
- Stripe Reconciliation Script
- ticketbot-copy.ts
- Terms & Conditions (EN)
- categories/[id]/page.tsx
- Giveaway Bot Marketing
- Server Cleanup Script
- PackagesBrowser.tsx
- admin/coupons/route.ts
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
- Core Framework Marketing
- Engine Toggle Marketing
- Garage Script Marketing
- Giveaway Bot Features
- Give Vehicle Marketing
- Documentation Brand
- Health Check API
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
- Lang
- Tebex Stats Aggregator
- TicketBotLanding.tsx
- JsonLd.tsx
- Automated Release Workflow
- Project Branding Assets
- API Route Guards
- GiveawayLanding.tsx
- ResourcesClient.tsx
- Database Schema
- cn
- botSeo.ts
- sitemap.xsl/route.ts
- layout.tsx
- Rate Limiting Proxy
- Data Collected by the Transcript Service
- MSK Ticket Bot Transcript Service

## God Nodes (most connected - your core abstractions)
1. `cn()` - 56 edges
2. `query()` - 44 edges
3. `Button` - 40 edges
4. `Lang` - 35 edges
5. `Card` - 34 edges
6. `useLang()` - 31 edges
7. `queryOne()` - 29 edges
8. `getClientIp()` - 28 edges
9. `rateLimit()` - 28 edges
10. `writeAudit()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `GET` --calls--> `getPackages()`  [EXTRACTED]
  app/api/admin/packages/route.ts → lib/tebex.ts
- `PATCH` --indirect_call--> `isAdminPermission()`  [INFERRED]
  app/api/admin/team/[discordUserId]/route.ts → lib/adminPerms.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/stats/StatsClient.tsx → lib/utils.ts
- `StepIndicator()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/verify/VerifyClient.tsx → lib/utils.ts

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

## Communities (119 total, 16 thin omitted)

### Community 0 - "AdminClient.tsx"
Cohesion: 0.16
Nodes (15): ALL_TABS, TabDef, AuditEntry, AuditTab(), Member, TeamTab(), dynamic, GET (+7 more)

### Community 1 - "giveawaySession.ts"
Cohesion: 0.05
Nodes (49): ACTION_PATH, OWNER_ACTIONS, POST(), ADMINISTRATOR, GET(), isAdmin(), ALLOWED, GET() (+41 more)

### Community 2 - "getClientIp"
Cohesion: 0.09
Nodes (44): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+36 more)

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+38 more)

### Community 4 - "CouponsTab.tsx"
Cohesion: 0.09
Nodes (28): ApiKey, ApiKeysTab(), maskKey(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass(), BanEntry (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.05
Nodes (39): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, js-cookie, lucide-react, mysql2, next-themes, dependencies (+31 more)

### Community 6 - "Design System: MSK Scripts Shop"
Cohesion: 0.07
Nodes (27): Badges, Buttons, Cards, Colors, Components, Design System: MSK Scripts Shop, Do:, Do's and Don'ts (+19 more)

### Community 7 - "fivestats.ts"
Cohesion: 0.15
Nodes (17): dynamic, GET(), ResourcesPage(), RESOURCE_STATS, RESOURCE_STATS_GAME, RESOURCE_STATS_HEADLINE, RESOURCE_STATS_PERIOD_HOURS, ResourceStatEntry (+9 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "stripe/route.ts"
Cohesion: 0.14
Nodes (25): CustomerRow, POST(), POST(), applySubscription(), downgradeGuild(), GuildIdRow, POST(), resolveInvoiceSubscriptionId() (+17 more)

### Community 10 - "i18n.ts"
Cohesion: 0.09
Nodes (24): CheckoutContent(), Guild, VerifyClient(), STEP_ICONS, LangContext, useLang(), LanguageDropdown(), languages (+16 more)

### Community 11 - "CI/CD Workflows"
Cohesion: 0.11
Nodes (24): CI Job: Audit (production tree), CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck (+16 more)

### Community 12 - "jsonLd.ts"
Cohesion: 0.28
Nodes (10): robots(), breadcrumbJsonLd(), Crumb, JsonLdValue, organizationJsonLd(), productJsonLd(), SoftwareApplicationInput, softwareApplicationJsonLd() (+2 more)

### Community 13 - "Admin Business Logic"
Cohesion: 0.11
Nodes (24): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+16 more)

### Community 14 - "sitemap.ts"
Cohesion: 0.12
Nodes (20): dynamic, GET, generateStaticParams(), generateStaticParams(), GET(), revalidate, Props, SearchDialog() (+12 more)

### Community 15 - "adminAuth.ts"
Cohesion: 0.14
Nodes (19): AdminClient(), AdminPage(), dynamic, ERROR_MESSAGES, metadata, dynamic, GET(), AdminAuthResult (+11 more)

### Community 16 - "ticketbot/stats/page.tsx"
Cohesion: 0.11
Nodes (19): AvgRow, CountRow, dynamic, GET(), MaxRow, SumRow, TierRow, AvgRow (+11 more)

### Community 17 - "HeaderInner"
Cohesion: 0.20
Nodes (6): HeaderInner(), NewsPopup(), getServerSnapshot(), getSnapshot(), subscribe(), useHydrated()

### Community 18 - "Bot Proxy Routes"
Cohesion: 0.10
Nodes (33): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+25 more)

### Community 19 - "markdown.ts"
Cohesion: 0.21
Nodes (15): ImprintPage(), metadata, metadata, TermsPage(), metadata, PrivacyPage(), LegalContent(), Props (+7 more)

### Community 20 - "ticketbot/verify/VerifyClient.tsx"
Cohesion: 0.22
Nodes (6): Props, StepIndicator(), TIER_LABELS, VerifyClient(), translations, VerifySession

### Community 21 - "giveaway/dashboard/DashboardClient.tsx"
Cohesion: 0.07
Nodes (44): BonusRoleEditor(), Channel, clampBonus(), CouponFields(), couponPayload(), CreateForm(), Ctx, Dict (+36 more)

### Community 22 - "Custom Package Listings"
Cohesion: 0.21
Nodes (9): CustomPackageCard(), resolveImageSrc(), CustomPackages(), HOMEPAGE_TOOL_IDS, FIVEM_SCRIPT_IDS, FreeScripts(), CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE (+1 more)

### Community 23 - "adminTeamRoute.test.ts"
Cohesion: 0.33
Nodes (6): POST, TEAM_MANAGE, adminReq(), DbMember, serveAdminTeam(), staticCtx

### Community 24 - "ticketbot/stats/StatsClient.tsx"
Cohesion: 0.36
Nodes (7): formatBytes(), formatNum(), StatCard(), Stats, StatsClient(), TierBreakdown(), statsTranslations

### Community 25 - "query"
Cohesion: 0.11
Nodes (22): dynamic, PATCH, VALID_TIERS, dynamic, GET, GuildRow, AuditRow, dynamic (+14 more)

### Community 26 - "app/page.tsx"
Cohesion: 0.21
Nodes (9): HomePage(), metadata, Bots, Catalog(), Hero(), HowItWorks(), WhyMSK(), HOME_FEATURE_ICONS (+1 more)

### Community 27 - "url/route.ts"
Cohesion: 0.40
Nodes (5): dynamic, extractApiKey(), GET(), GuildRow, UrlRow

### Community 29 - "packages/[id]/page.tsx"
Cohesion: 0.26
Nodes (12): generateMetadata(), PackageDetailPage(), revalidate, metadata, decodeEntities(), DEFAULT_OG_IMAGE, HTML_ENTITIES, openGraphFor() (+4 more)

### Community 30 - "lib/tebex.ts"
Cohesion: 0.16
Nodes (18): AddToCartButton(), readStoredDiscordId(), withName(), addGiftToBasket(), addToBasket(), applyCoupon(), createBasket(), getAllAuthUrls() (+10 more)

### Community 31 - "upload/route.ts"
Cohesion: 0.05
Nodes (56): dynamic, GET(), ADMINISTRATOR, GET(), isAdmin(), GET(), AttachmentInput, checkRateLimit() (+48 more)

### Community 32 - "useCartStore"
Cohesion: 0.15
Nodes (12): CartPage(), CartDrawer(), PackagePrice(), Props, SalePriceFetcher(), Badge, DisplayPrice, resolveDisplayPrice() (+4 more)

### Community 33 - "Catalog.tsx"
Cohesion: 0.12
Nodes (17): price(), Variant(), BadgeProps, BadgeVariant, variantClasses, BadgeVariant, CATEGORY_SEO, CATEGORY_VARIANT (+9 more)

### Community 34 - "ticketbot/dashboard/DashboardClient.tsx"
Cohesion: 0.09
Nodes (20): BotConfigEditor, BotDashboardLauncher(), GuildPanel(), Props, safeDomainHref(), T, TabKey, TIER_COLORS (+12 more)

### Community 35 - "Hero.tsx"
Cohesion: 0.15
Nodes (13): CTASection(), Entry, ProofLine(), ReleaseFeed(), GithubMark(), SITE_CONFIG, HeadlineStat, homeTranslations (+5 more)

### Community 36 - "adminApi.ts"
Cohesion: 0.08
Nodes (40): dynamic, GET, POST, DELETE, dynamic, DELETE, dynamic, PUT (+32 more)

### Community 37 - "Privacy Policy (EN)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

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
Cohesion: 0.15
Nodes (14): CommandRow, de, en, GIVEAWAY_COPY, GiveawayCopy, de, en, LabelledText (+6 more)

### Community 43 - "Terms & Conditions (EN)"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "categories/[id]/page.tsx"
Cohesion: 0.20
Nodes (14): CategoryPage(), generateMetadata(), revalidate, PackageCard(), resolveVariant(), categoriesTranslations, convertPipeTables(), EMOJI (+6 more)

### Community 45 - "Giveaway Bot Marketing"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "Server Cleanup Script"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "PackagesBrowser.tsx"
Cohesion: 0.25
Nodes (13): FacetGroup(), PackagesBrowser(), priceOf(), tagsOf(), bucketLabel(), countBy(), countPriceBuckets(), Facet (+5 more)

### Community 49 - "admin/coupons/route.ts"
Cohesion: 0.27
Nodes (11): dynamic, GET, countCouponStates(), CouponExpiry, CouponLike, couponState, isCouponActive(), isTrue() (+3 more)

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

### Community 103 - "Lang"
Cohesion: 0.28
Nodes (11): Props, Row, LangContextValue, Props, PackageGallery(), PackageGalleryProps, resolveImages(), Badge (+3 more)

### Community 104 - "Tebex Stats Aggregator"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "TicketBotLanding.tsx"
Cohesion: 0.17
Nodes (12): DASHBOARD_ICONS, FEATURE_ICONS, HOSTED_ICONS, HUB_HREFS, HUB_ICONS, HUB_VARIANTS, mb(), TicketBotLanding() (+4 more)

### Community 106 - "JsonLd.tsx"
Cohesion: 0.29
Nodes (8): metadata, TicketBotPageDe(), metadata, TicketBotPage(), JsonLd(), serialize(), ticketBotAppJsonLd(), JsonLdObject

### Community 112 - "API Route Guards"
Cohesion: 0.25
Nodes (6): API_DIR, DB_ROUTES, GUARDS, key(), PUBLIC_BY_DESIGN, ROUTES

### Community 113 - "GiveawayLanding.tsx"
Cohesion: 0.20
Nodes (9): BotCrossLink(), COMMAND_NAMES, COUPON_ICONS, FEATURE_ICONS, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, SETTINGS_ICONS, STEP_ICONS (+1 more)

### Community 115 - "ResourcesClient.tsx"
Cohesion: 0.15
Nodes (12): dynamic, metadata, formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge(), HistoryPoint (+4 more)

### Community 116 - "Database Schema"
Cohesion: 0.24
Nodes (9): giveaway_results, msk_admin_audit, msk_admin_team, msk_shop_stats, ticketbot_attachments, ticketbot_customers, ticketbot_guilds, ticketbot_rate_limits (+1 more)

### Community 118 - "cn"
Cohesion: 0.11
Nodes (21): LookupPayment, LookupResult, LookupTab(), StatusBadge(), Breakdown(), BreakdownItem, formatNum(), StatCard() (+13 more)

### Community 119 - "botSeo.ts"
Cohesion: 0.18
Nodes (15): GiveawayBotPageDe(), metadata, GiveawayBotPage(), metadata, GiveawayLanding(), appJsonLdFor(), BotDefinition, BotSeo (+7 more)

### Community 121 - "layout.tsx"
Cohesion: 0.11
Nodes (24): AccountPage(), dynamic, GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, metadata (+16 more)

### Community 123 - "Rate Limiting Proxy"
Cohesion: 0.19
Nodes (12): BODY_LIMIT_PREFIXES, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited(), proxy() (+4 more)

### Community 125 - "Data Collected by the Transcript Service"
Cohesion: 0.33
Nodes (6): Discord OAuth Verification and Guild Record, Ticket Bot Session Cookies, Stripe Payments Europe, Ltd., Stripe Subscription Webhook, Third Country Transfers (UK Adequacy, SCCs), Data Collected by the Transcript Service

### Community 126 - "MSK Ticket Bot Transcript Service"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

## Knowledge Gaps
- **465 isolated node(s):** `ALL_TABS`, `Tier`, `ApiKey`, `TIER_LABELS`, `TIER_ORDER` (+460 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `AdminClient.tsx`, `giveawaySession.ts`, `ticketbot/dashboard/DashboardClient.tsx`, `Catalog.tsx`, `CouponsTab.tsx`, `useCartStore`, `Lang`, `i18n.ts`, `adminAuth.ts`, `PackagesBrowser.tsx`, `HeaderInner`, `ResourcesClient.tsx`, `ticketbot/verify/VerifyClient.tsx`, `giveaway/dashboard/DashboardClient.tsx`, `ticketbot/stats/StatsClient.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Tier` connect `upload/route.ts` to `ticketbot/dashboard/DashboardClient.tsx`, `getClientIp`, `stripe/route.ts`, `TicketBotLanding.tsx`, `ticketbot/verify/VerifyClient.tsx`, `query`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Card` connect `cn` to `AdminClient.tsx`, `Catalog.tsx`, `ticketbot/dashboard/DashboardClient.tsx`, `CouponsTab.tsx`, `Lang`, `TicketBotLanding.tsx`, `i18n.ts`, `adminAuth.ts`, `GiveawayLanding.tsx`, `ResourcesClient.tsx`, `ticketbot/verify/VerifyClient.tsx`, `giveaway/dashboard/DashboardClient.tsx`, `ticketbot/stats/StatsClient.tsx`, `layout.tsx`, `packages/[id]/page.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `ALL_TABS`, `Tier`, `ApiKey` to the rest of the system?**
  _465 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `giveawaySession.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052884615384615384 - nodes in this community are weakly interconnected._
- **Should `getClientIp` be split into smaller, more focused modules?**
  _Cohesion score 0.08593396653098145 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._