# Graph Report - msk-shop  (2026-09-13)

## Corpus Check
- 402 files · ~284,677 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2413 nodes · 5647 edges · 168 communities (130 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 106 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4cadfb2d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- legalForms.ts
- data/route.ts
- getClientIp
- devDependencies
- Card
- dependencies
- Design System: MSK Scripts Shop
- ResourcesClient.tsx
- TypeScript Configuration
- lang.ts
- i18n.ts
- scripts/deploy.sh (Server Deploy Script)
- imageUploads.ts
- Tebex API Reference (5 HTTP APIs)
- sitemap.ts
- adminApi.ts
- ticketbot/stats/page.tsx
- adminImages.ts
- botproxy/route.ts
- packages/[id]/page.tsx
- cn
- giveaway/dashboard/DashboardClient.tsx
- Custom Package Components
- botProvision.ts
- renderMarkdown
- query
- app/page.tsx
- domain/route.ts
- images.ts
- package.json
- lib/tebex.ts
- adminImageStats.test.ts
- NPM Scripts
- resolveDisplayPrice
- Button
- getRequestLang
- adminRoute
- Privacy Policy (EN)
- HostingSetup.tsx
- Hosted Bot Management Service
- Brand Identity Assets
- Stripe Reconciliation Script
- Bot Copy Translations
- Terms & Conditions (EN)
- categories/[id]/page.tsx
- Giveaway Bot Marketing
- File Cleanup Script
- Package Browser Filtering
- bot-provision.js
- couponStatus.ts
- Subscription and SSL Terms
- MSK Scripts Shop
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
- transcript/upload/route.ts
- Core Framework Script
- Engine Toggle Script
- Garage System Script
- giveawayStats.ts
- Vehicle Admin Tool
- Documentation Branding
- Health Check API
- publicImageApi.test.ts
- Codeberg Mirror Workflow
- Kanbanly Marketing
- Visual Brand Identity
- Pastebin Service
- MSK Giveaway Bot
- MSK Scripts Shop (headless storefront)
- URL Shortener Marketing
- discord-verify/callback/route.ts
- Code Coverage CI
- Auth URL Utilities
- deploy.sh
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
- Button.tsx
- Tebex Statistics Script
- authorizeGuild
- Lang
- ticketbot/dashboard/page.tsx
- stripe/route.ts
- Documentation Assets
- Route Guard Testing
- tiers.ts
- Lucide Icon Library
- Next.js Framework
- schema.sql
- PaymentMarks.tsx
- Giveaway Results Page
- botSeo.ts
- Sitemap Route
- URL Shortener API
- ionosDns.ts
- image-ingest.js
- giveawaySession.ts
- Transcript Service Terms
- SWR Data Fetching
- session.ts
- NewsPopup.tsx
- bot-control/route.ts
- api/verify/complete/route.ts
- env/route.ts
- uploadSession.ts
- images/upload/route.ts
- stripe.ts
- Data Processing Agreement (AVV)
- Vereinbarung zur Auftragsverarbeitung (AVV)
- hostedBot.ts
- api/stats/route.ts
- sendMail
- peds.js
- imageSyncCheck.ts
- ticketbot/verify/VerifyClient.tsx
- trialEnding.ts
- image-pedshot-prepare.js
- adminImageFiles.test.ts
- brace-expansion Advisory GHSA-mh99-v99m-4gvg (dev-only)
- Components
- image-sync-check.js
- items.js
- Data Collected by the Transcript Service
- Withdrawal Instructions
- Widerrufsbelehrung
- vehicles.js
- ticketbot/verify/page.tsx
- image-label-import.js
- Label-Generatoren
- BotDashboardAddress
- Imprint (EN)
- bot-vhost-create.sh
- msk-cron.sh
- @radix-ui/react-slot
- react-dom
- stripe
- tailwind-merge
- bot-vhost-delete.sh

## God Nodes (most connected - your core abstractions)
1. `query()` - 83 edges
2. `getRequestLang()` - 73 edges
3. `cn()` - 64 edges
4. `Button` - 55 edges
5. `useLang()` - 52 edges
6. `Lang` - 49 edges
7. `Card` - 46 edges
8. `queryOne()` - 43 edges
9. `pageSeo` - 41 edges
10. `getClientIp()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `POST` --calls--> `writeAudit()`  [EXTRACTED]
  app/api/admin/bans/route.ts → lib/adminAudit.ts
- `DELETE` --calls--> `writeAudit()`  [EXTRACTED]
  app/api/admin/coupons/[id]/route.ts → lib/adminAudit.ts
- `POST` --calls--> `writeAudit()`  [EXTRACTED]
  app/api/admin/giftcards/route.ts → lib/adminAudit.ts
- `StatusBadge()` --calls--> `cn()`  [EXTRACTED]
  app/images/upload/UploadClient.tsx → lib/utils.ts

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

## Communities (168 total, 25 thin omitted)

### Community 0 - "legalForms.ts"
Cohesion: 0.09
Nodes (53): dynamic, POST(), dynamic, POST(), badRequest(), clientIpOrNull(), deliverReceipts(), mailLangFrom() (+45 more)

### Community 1 - "data/route.ts"
Cohesion: 0.13
Nodes (17): ACTION_PATH, OWNER_ACTIONS, POST(), ALLOWED, GET(), GwListItem, KIND_PATH, OWNER_KINDS (+9 more)

### Community 2 - "getClientIp"
Cohesion: 0.17
Nodes (19): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+11 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+21 more)

### Community 4 - "Card"
Cohesion: 0.06
Nodes (58): ApiKey, ApiKeysTab(), formatRegistered(), maskKey(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass() (+50 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (27): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, js-cookie, mysql2, next-themes, nodemailer, dependencies (+19 more)

### Community 6 - "Design System: MSK Scripts Shop"
Cohesion: 0.10
Nodes (20): Colors, Design System: MSK Scripts Shop, Do:, Do's and Don'ts, Don't:, Elevation & Depth, Functional, Hierarchy (+12 more)

### Community 7 - "ResourcesClient.tsx"
Cohesion: 0.06
Nodes (38): dynamic, GET(), ResourcesPage(), formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge() (+30 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "lang.ts"
Cohesion: 0.13
Nodes (23): GESPERRT, robots(), alternatePaths(), EINMALIG_EXAKT, EINMALIG_PRAEFIXE, istEinmaligeAdresse(), LANG_HEADER, LANGS (+15 more)

### Community 10 - "i18n.ts"
Cohesion: 0.07
Nodes (40): CartPage(), CheckoutContent(), metadata, viewport, Done, ReportClient(), CancellationClient(), Done (+32 more)

### Community 11 - "scripts/deploy.sh (Server Deploy Script)"
Cohesion: 0.14
Nodes (17): CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Test, CI Job: Typecheck, cleanup.js Cron auf /opt/msk-shop/scripts/, scripts/deploy.sh (Server Deploy Script), Deploy Workflow (workflow_run nach grünem CI) (+9 more)

### Community 12 - "imageUploads.ts"
Cohesion: 0.07
Nodes (51): dynamic, GET, dynamic, failureResponse(), POST, dynamic, GET, STATUSES (+43 more)

### Community 13 - "Tebex API Reference (5 HTTP APIs)"
Cohesion: 0.22
Nodes (13): Tebex Limited (payment MoR, UK), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit), msk_admin_team + msk_admin_audit tables, Tebex API Reference (5 HTTP APIs), Admin dashboard implications, Affiliate API (affiliate.tebex.io) (+5 more)

### Community 14 - "sitemap.ts"
Cohesion: 0.16
Nodes (15): dynamic, GET, generateStaticParams(), GET(), revalidate, bothLanguages(), buildSitemapEntries(), escapeXml() (+7 more)

### Community 15 - "adminApi.ts"
Cohesion: 0.10
Nodes (31): AdminClient(), AdminPage(), dynamic, ERROR_MESSAGES, metadata, Member, dynamic, GET() (+23 more)

### Community 16 - "ticketbot/stats/page.tsx"
Cohesion: 0.20
Nodes (11): AvgRow, CountRow, dynamic, EMPTY_STATS, generateMetadata(), loadStats(), MaxRow, StatsPage() (+3 more)

### Community 17 - "adminImages.ts"
Cohesion: 0.10
Nodes (33): DELETE, dynamic, moveFailure(), PATCH, dynamic, GET, ADMIN_IMAGE_FILTERS, AdminImage (+25 more)

### Community 18 - "botproxy/route.ts"
Cohesion: 0.10
Nodes (32): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+24 more)

### Community 19 - "packages/[id]/page.tsx"
Cohesion: 0.12
Nodes (26): dynamic, GET, generateMetadata(), generateStaticParams(), PackageDetailPage(), revalidate, PackagesPage(), Catalog() (+18 more)

### Community 20 - "cn"
Cohesion: 0.08
Nodes (32): StatusBadge(), Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), Guild, VerifyClient() (+24 more)

### Community 21 - "giveaway/dashboard/DashboardClient.tsx"
Cohesion: 0.06
Nodes (48): BonusRoleEditor(), Channel, clampBonus(), CouponFields(), couponPayload(), CreateForm(), Ctx, Dict (+40 more)

### Community 22 - "Custom Package Components"
Cohesion: 0.21
Nodes (9): CustomPackageCard(), resolveImageSrc(), CustomPackages(), HOMEPAGE_TOOL_IDS, FIVEM_SCRIPT_IDS, FreeScripts(), CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE (+1 more)

### Community 23 - "botProvision.ts"
Cohesion: 0.12
Nodes (36): POST(), dynamic, POST(), runtime, proxySecret(), botDir(), allocateBotPort(), archiveName() (+28 more)

### Community 24 - "renderMarkdown"
Cohesion: 0.16
Nodes (20): DpaPage(), generateMetadata(), generateMetadata(), ImprintPage(), generateMetadata(), TermsPage(), generateMetadata(), PrivacyPage() (+12 more)

### Community 25 - "query"
Cohesion: 0.11
Nodes (29): dynamic, PATCH, VALID_TIERS, AuditRow, dynamic, GET, DELETE, dynamic (+21 more)

### Community 26 - "app/page.tsx"
Cohesion: 0.21
Nodes (9): HomePage(), Bots, WhyMSK(), HOME_FEATURE_ICONS, countUrls(), loadDocPageCount(), NOTE: server module. No secret behind it, the sitemap is public -- but, loadHeadlineStat() (+1 more)

### Community 27 - "domain/route.ts"
Cohesion: 0.15
Nodes (28): dynamic, execAsync, POST(), runtime, activate(), DELETE(), dynamic, execAsync (+20 more)

### Community 28 - "images.ts"
Cohesion: 0.12
Nodes (25): formatBytes(), ImageDetailPage(), formatCount(), ImagesPage(), revalidate, escapeXml(), GET(), revalidate (+17 more)

### Community 29 - "package.json"
Cohesion: 0.17
Nodes (11): engines, node, license, name, overrides, eslint, js-yaml, postcss (+3 more)

### Community 30 - "lib/tebex.ts"
Cohesion: 0.11
Nodes (27): Props, Row, AddToCartButton(), readStoredDiscordId(), withName(), Props, PackageGallery(), PackageGalleryProps (+19 more)

### Community 31 - "adminImageStats.test.ts"
Cohesion: 0.16
Nodes (13): dynamic, GET, dynamic, GET, adminImageStats(), countPendingUploads(), keys(), mQuery (+5 more)

### Community 32 - "NPM Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:coverage, test:watch (+1 more)

### Community 33 - "resolveDisplayPrice"
Cohesion: 0.30
Nodes (8): PackageCard(), PackagePrice(), Props, DisplayPrice, resolveDisplayPrice(), SaleData, SalePricesStore, useSalePricesStore

### Community 34 - "Button"
Cohesion: 0.07
Nodes (32): BotConfigEditor, DashboardDomainCard, GET_LABEL, GuildPanel(), PaidTier, Props, safeDomainHref(), T (+24 more)

### Community 35 - "getRequestLang"
Cohesion: 0.10
Nodes (32): AccountPage(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), dynamic, generateMetadata() (+24 more)

### Community 36 - "adminRoute"
Cohesion: 0.07
Nodes (38): dynamic, GET, POST, DELETE, dynamic, dynamic, POST, dynamic (+30 more)

### Community 37 - "Privacy Policy (EN)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

### Community 38 - "HostingSetup.tsx"
Cohesion: 0.09
Nodes (24): FormState, messageFor(), StatusBadge(), T, UploadClient(), UploadCopy, UploadRow, HostingSetup (+16 more)

### Community 39 - "Hosted Bot Management Service"
Cohesion: 0.25
Nodes (9): Attachment Storage (Premium and Premium+), Hosted Bot Management Data and Access Control, Storage Period Table, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials, Hosted Bot Customer Responsibilities, Hosted Bot Management Service, Hosting Termination and 14-Day Deletion (+1 more)

### Community 40 - "Brand Identity Assets"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "Stripe Reconciliation Script"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "Bot Copy Translations"
Cohesion: 0.14
Nodes (15): CommandRow, de, en, GIVEAWAY_COPY, GiveawayCopy, de, en, LabelledText (+7 more)

### Community 43 - "Terms & Conditions (EN)"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "categories/[id]/page.tsx"
Cohesion: 0.11
Nodes (25): CategoryPage(), revalidate, price(), Variant(), BadgeVariant, CATEGORY_SEO, CATEGORY_VARIANT, FEATURED_PACKAGE_IDS (+17 more)

### Community 45 - "Giveaway Bot Marketing"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "File Cleanup Script"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "Package Browser Filtering"
Cohesion: 0.25
Nodes (13): FacetGroup(), PackagesBrowser(), priceOf(), tagsOf(), bucketLabel(), countBy(), countPriceBuckets(), Facet (+5 more)

### Community 48 - "bot-provision.js"
Cohesion: 0.14
Nodes (23): botDir, botReportsRunning(), clone(), configure(), connect(), { execFile }, execFileAsync, exists() (+15 more)

### Community 49 - "couponStatus.ts"
Cohesion: 0.29
Nodes (10): GET, countCouponStates(), CouponExpiry, CouponLike, couponState, isCouponActive(), isTrue(), timestamp() (+2 more)

### Community 50 - "Subscription and SSL Terms"
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

### Community 62 - "transcript/upload/route.ts"
Cohesion: 0.21
Nodes (17): AttachmentInput, checkRateLimit(), isValidGuild(), POST(), RateLimitRow, reencodeImage(), RequestBody, transcriptBasePath() (+9 more)

### Community 63 - "Core Framework Script"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, Core Framework / Core Library Claim, ESX Framework Support, MSK Scripts Brand Identity (green M mark, dark theme), MSK.CORE (msk_core), QBCore Framework Support

### Community 64 - "Engine Toggle Script"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, ESX Framework Support, Manual Engine Control for Vehicle Roleplay, MSK Scripts Brand Identity (Green M Logo, Dark Theme), msk_enginetoggle (Vehicle System Script), QBCore Framework Support

### Community 65 - "Garage System Script"
Cohesion: 0.60
Nodes (6): msk_garage Marketing Banner, ESX Framework Support, Full Garage Management, MSK Scripts Brand Identity (M logo, dark green), MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage

### Community 66 - "giveawayStats.ts"
Cohesion: 0.14
Nodes (17): dynamic, GET(), GiveawayStatsPage(), BotGuild, dynamic, metadata, fetchGuildMemberRoles(), getGiveawayPool() (+9 more)

### Community 67 - "Vehicle Admin Tool"
Cohesion: 0.53
Nodes (6): msk_givevehicle Marketing Banner, MSK Scripts Brand Identity (M logo, green-on-dark), ESX Framework Support Badge, msk_givevehicle (FiveM Admin Tool), QBCore Framework Support Badge, Claim: Spawn & gift any vehicle to players in seconds

### Community 68 - "Documentation Branding"
Cohesion: 0.60
Nodes (6): API Reference, MSK.DOCS Official Documentation Banner, Dark Green Tech Visual Style (monospace uppercase, accent green), MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs

### Community 69 - "Health Check API"
Cohesion: 0.33
Nodes (4): dynamic, IncidentsResponse, SEVERITY, StatusResponse

### Community 70 - "publicImageApi.test.ts"
Cohesion: 0.17
Nodes (17): GET(), OPTIONS, revalidate, GET(), OPTIONS, revalidate, GET(), OPTIONS (+9 more)

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

### Community 75 - "MSK Giveaway Bot"
Cohesion: 0.50
Nodes (4): Giveaway Bot Acceptable Use, MSK Giveaway Bot, Scope of Services, Server Operator Responsibility for Giveaways

### Community 76 - "MSK Scripts Shop (headless storefront)"
Cohesion: 0.16
Nodes (17): Code of Conduct (Contributor Covenant), Contributing Guide, Datenbank-Migrationen, Regeln, Verhältnis zu `database/schema.sql`, Pull Request Template, Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version) (+9 more)

### Community 77 - "URL Shortener Marketing"
Cohesion: 0.67
Nodes (4): Dark Theme with MSK Green Accent Headline, MSK Shortener Hero Screenshot, Long URL Input Form Card, MSK URL Shortener (privacy-friendly, no signup)

### Community 78 - "discord-verify/callback/route.ts"
Cohesion: 0.17
Nodes (14): GET(), GET(), isRecheckState(), fetchUserGuilds(), RawGuild, UserGuilds, ADMINISTRATOR, canManageGuild() (+6 more)

### Community 79 - "Code Coverage CI"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 81 - "deploy.sh"
Cohesion: 0.70
Nodes (4): db(), env_value(), run_as_app_user(), deploy.sh script

### Community 101 - "Color Contrast Testing"
Cohesion: 0.29
Nodes (8): channels(), contrast(), CSS, dark, light, linear(), luminance(), mix()

### Community 102 - "Localization Route Testing"
Cohesion: 0.50
Nodes (4): ALLE, DARF_NEXT_LINK, dateien(), WURZELN

### Community 103 - "Button.tsx"
Cohesion: 0.06
Nodes (33): BotCrossLink(), COMMAND_NAMES, COUPON_ICONS, FEATURE_ICONS, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, SETTINGS_ICONS, STEP_ICONS (+25 more)

### Community 104 - "Tebex Statistics Script"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "authorizeGuild"
Cohesion: 0.16
Nodes (17): execFileAsync, POST(), checkDns(), execFileAsync, POST(), checkDns(), execFileAsync, POST() (+9 more)

### Community 106 - "Lang"
Cohesion: 0.12
Nodes (20): Params, revalidate, Params, revalidate, Search, LangContextValue, BrandNotice(), OWN_WORK_CATEGORY (+12 more)

### Community 107 - "ticketbot/dashboard/page.tsx"
Cohesion: 0.18
Nodes (17): DashboardClient(), DashboardGuild, DashboardPage(), dynamic, GuildRow, metadata, ACCESS_GRACE_DAYS, ACCESS_STALE_HOURS (+9 more)

### Community 108 - "stripe/route.ts"
Cohesion: 0.27
Nodes (17): applySubscription(), downgradeGuild(), GuildIdRow, GuildNameRow, handleTrialWillEnd(), POST(), resolveInvoiceSubscriptionId(), sendOrderConfirmation() (+9 more)

### Community 112 - "Route Guard Testing"
Cohesion: 0.25
Nodes (6): API_DIR, DB_ROUTES, GUARDS, key(), PUBLIC_BY_DESIGN, ROUTES

### Community 113 - "tiers.ts"
Cohesion: 0.17
Nodes (12): GuildRow, GuildRow, GuildRow, GuildRow, GuildRow, Guild, DashboardGuild, getExpiresAt() (+4 more)

### Community 116 - "schema.sql"
Cohesion: 0.13
Nodes (17): giveaway_results, msk_admin_audit, msk_admin_team, msk_cancellations, msk_content_reports, msk_image_categories, msk_image_uploads, msk_images (+9 more)

### Community 118 - "Giveaway Results Page"
Cohesion: 0.29
Nodes (7): dynamic, GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, giveawayResultTranslations

### Community 119 - "botSeo.ts"
Cohesion: 0.10
Nodes (29): generateMetadata(), GiveawayPage(), generateMetadata(), TicketBotComparePage(), generateMetadata(), TicketBotPage(), GiveawayLanding(), TicketBotCompare() (+21 more)

### Community 121 - "URL Shortener API"
Cohesion: 0.40
Nodes (5): dynamic, extractApiKey(), GET(), GuildRow, UrlRow

### Community 123 - "ionosDns.ts"
Cohesion: 0.32
Nodes (13): isGeneratedHost(), call(), createHostRecords(), deleteHostRecords(), DnsRecord, ionosApiKey(), IonosDnsError, isInOwnZone() (+5 more)

### Community 124 - "image-ingest.js"
Cohesion: 0.19
Nodes (16): buildVariants(), CATEGORY_RULES, crypto, fs, main(), mysql, normaliseName(), parseArgs() (+8 more)

### Community 125 - "giveawaySession.ts"
Cohesion: 0.21
Nodes (12): POST(), GiveawayVerifyPage(), Envelope, getSecret(), GIVEAWAY_SESSION_COOKIE, GiveawayGuild, GiveawaySession, GiveawayVerifyData (+4 more)

### Community 126 - "Transcript Service Terms"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 128 - "session.ts"
Cohesion: 0.23
Nodes (10): dynamic, GET(), GET(), RECHECK_COOKIE, RECHECK_COOKIE_TTL_S, RECHECK_STATE_PREFIX, DiscordGuild, generateState() (+2 more)

### Community 129 - "NewsPopup.tsx"
Cohesion: 0.13
Nodes (10): HeaderInner(), NextThemesProviderProps, Props, ThemeProvider(), NewsPopup(), NEWS_POPUP, getServerSnapshot(), getSnapshot() (+2 more)

### Community 130 - "bot-control/route.ts"
Cohesion: 0.24
Nodes (12): ALLOWED_ACTIONS, authHosted(), botDir(), execAsync, GET(), POST(), authHosted(), GET() (+4 more)

### Community 131 - "api/verify/complete/route.ts"
Cohesion: 0.25
Nodes (10): POST(), generateApiKey(), POST(), GuildRow, POST(), DashboardSession, getSecret(), signDashboardSession() (+2 more)

### Community 132 - "env/route.ts"
Cohesion: 0.33
Nodes (11): dynamic, GET(), runtime, botEnvPath(), parseEnv(), patchBotEnv(), quote(), readBotEnv() (+3 more)

### Community 133 - "uploadSession.ts"
Cohesion: 0.22
Nodes (8): GET(), dynamic, Envelope, getSecret(), signUploadSession(), UPLOAD_SESSION_COOKIE, UPLOAD_STATE_COOKIE, UploadSession

### Community 134 - "images/upload/route.ts"
Cohesion: 0.26
Nodes (11): dynamic, GET(), POST(), listUploadsBySubmitter(), MAX_UPLOAD_BYTES, recentUploadCount(), uploadCategories(), UPLOADS_PER_DAY (+3 more)

### Community 135 - "stripe.ts"
Cohesion: 0.30
Nodes (8): CustomerRow, POST(), POST(), getStripe(), isActiveSubStatus(), priceIdForTier(), TRIAL_DAYS, PAID_PRICES

### Community 136 - "Data Processing Agreement (AVV)"
Cohesion: 0.17
Nodes (11): 10. Liability and final provisions, 1. Subject matter and duration, 2. Nature and purpose of the processing, categories of data, data subjects, 3. Instructions, 4. Obligations of MSK Scripts, 5. Obligations of the controller, 6. Technical and organisational measures (Art. 32 GDPR), 7. Sub-processors (+3 more)

### Community 137 - "Vereinbarung zur Auftragsverarbeitung (AVV)"
Cohesion: 0.17
Nodes (11): 10. Haftung und Schlussbestimmungen, 1. Gegenstand und Dauer, 2. Art und Zweck der Verarbeitung, Datenkategorien, Betroffene, 3. Weisungen, 4. Pflichten von MSK Scripts, 5. Pflichten des Auftraggebers, 6. Technische und organisatorische Maßnahmen (Art. 32 DSGVO), 7. Unterauftragsverarbeiter (+3 more)

### Community 138 - "hostedBot.ts"
Cohesion: 0.24
Nodes (8): execFileAsync, teardownCustomDomain(), ScopedGuildId, trustedGuildId(), TrustedGuildSource, archiveHostedBot(), execAsync, HostedRow

### Community 139 - "api/stats/route.ts"
Cohesion: 0.22
Nodes (8): AvgRow, CountRow, dynamic, MaxRow, SumRow, TierRow, getIgnoredApiKeys(), STATS_IGNORED_API_KEYS

### Community 140 - "sendMail"
Cohesion: 0.27
Nodes (9): forLog(), getTransporter(), MailConfig, mailConfigFromEnv(), MailMessage, sendMail(), capture(), CR (+1 more)

### Community 141 - "peds.js"
Cohesion: 0.20
Nodes (10): ALTER, dump, fs, GESCHLECHT_AUS_TYP, GRUPPE, [quelle, ziel], raus, ROLLE (+2 more)

### Community 142 - "imageSyncCheck.ts"
Cohesion: 0.29
Nodes (8): dynamic, GET, cdnRoot(), DERIVATIVES, listFiles(), runSyncCheck(), SyncCheckCategory, SyncCheckResult

### Community 143 - "ticketbot/verify/VerifyClient.tsx"
Cohesion: 0.25
Nodes (5): Props, StepIndicator(), TIER_LABELS, translations, VerifySession

### Community 144 - "trialEnding.ts"
Cohesion: 0.33
Nodes (6): buildTrialEndingEmail(), BuiltEmail, escapeHtml(), formatTrialEnd(), TrialEndingInput, END

### Community 145 - "image-pedshot-prepare.js"
Cohesion: 0.36
Nodes (8): fs, fuelleLoecher(), groesstenBereichBehalten(), main(), maskiere(), parseArgs(), path, sharp

### Community 146 - "adminImageFiles.test.ts"
Cohesion: 0.25
Nodes (4): CATEGORIES, mQuery, mQueryOne, Row

### Community 147 - "brace-expansion Advisory GHSA-mh99-v99m-4gvg (dev-only)"
Cohesion: 0.33
Nodes (7): CI Job: Audit (production tree), CI Job: Lint, Production-Tree-Only Audit Gate, brace-expansion Advisory GHSA-mh99-v99m-4gvg (dev-only), minimatch@3 Pin der ESLint-Plugins, npm ci --no-audit im Deploy, brace-expansion-Override als Anti-Pattern (zurückgebaut)

### Community 148 - "Components"
Cohesion: 0.29
Nodes (7): Badges, Buttons, Cards, Components, Inputs, Navigation, Section Label (`.eyebrow`)

### Community 149 - "image-sync-check.js"
Cohesion: 0.33
Nodes (6): DERIVATIVES, fs, listFiles(), main(), mysql, path

### Community 150 - "items.js"
Cohesion: 0.29
Nodes (6): fs, LABELS, namen, raus, TAGS, TAGS_ZU_LABELS

### Community 151 - "Data Collected by the Transcript Service"
Cohesion: 0.33
Nodes (6): Discord OAuth Verification and Guild Record, Ticket Bot Session Cookies, Stripe Payments Europe, Ltd., Stripe Subscription Webhook, Third Country Transfers (UK Adequacy, SCCs), Data Collected by the Transcript Service

### Community 152 - "Withdrawal Instructions"
Cohesion: 0.33
Nodes (5): Additional notes, Consequences of withdrawal, Model withdrawal form, Right of withdrawal, Withdrawal Instructions

### Community 153 - "Widerrufsbelehrung"
Cohesion: 0.33
Nodes (5): Ergänzende Hinweise, Folgen des Widerrufs, Muster-Widerrufsformular, Widerrufsbelehrung, Widerrufsrecht

### Community 154 - "vehicles.js"
Cohesion: 0.33
Nodes (5): dump, fs, path, [quelle, ziel], raus

### Community 155 - "ticketbot/verify/page.tsx"
Cohesion: 0.40
Nodes (4): dynamic, metadata, VerifyPage(), VerifyClient()

### Community 156 - "image-label-import.js"
Cohesion: 0.50
Nodes (4): fs, main(), mysql, toTagList()

### Community 157 - "Label-Generatoren"
Cohesion: 0.40
Nodes (4): Die Quellen, Label-Generatoren, Warum sie hier liegen, Was der Import garantiert

### Community 159 - "Imprint (EN)"
Cohesion: 0.50
Nodes (4): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Imprint (EN), Impressum (DE)

## Knowledge Gaps
- **705 isolated node(s):** `Tier`, `ApiKey`, `TIER_LABELS`, `TIER_ORDER`, `AuditEntry` (+700 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 865 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `legalForms.ts`, `data/route.ts`, `getClientIp`, `api/verify/complete/route.ts`, `hostedBot.ts`, `api/stats/route.ts`, `imageUploads.ts`, `imageSyncCheck.ts`, `adminApi.ts`, `ticketbot/stats/page.tsx`, `adminImages.ts`, `adminImageFiles.test.ts`, `botProvision.ts`, `domain/route.ts`, `images.ts`, `adminImageStats.test.ts`, `transcript/upload/route.ts`, `publicImageApi.test.ts`, `authorizeGuild`, `ticketbot/dashboard/page.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `queryOne()` connect `query` to `api/verify/complete/route.ts`, `stripe.ts`, `ResourcesClient.tsx`, `hostedBot.ts`, `api/stats/route.ts`, `imageUploads.ts`, `adminApi.ts`, `ticketbot/stats/page.tsx`, `adminImages.ts`, `adminImageFiles.test.ts`, `botProvision.ts`, `domain/route.ts`, `images.ts`, `adminImageStats.test.ts`, `adminRoute`, `transcript/upload/route.ts`, `publicImageApi.test.ts`, `authorizeGuild`, `stripe/route.ts`, `tiers.ts`, `Giveaway Results Page`, `URL Shortener API`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `Lang` connect `Lang` to `Button`, `getRequestLang`, `HostingSetup.tsx`, `ResourcesClient.tsx`, `Button.tsx`, `lang.ts`, `i18n.ts`, `Bot Copy Translations`, `categories/[id]/page.tsx`, `Package Browser Filtering`, `packages/[id]/page.tsx`, `cn`, `giveaway/dashboard/DashboardClient.tsx`, `Custom Package Components`, `botSeo.ts`, `app/page.tsx`, `images.ts`, `lib/tebex.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `Tier`, `ApiKey`, `TIER_LABELS` to the rest of the system?**
  _705 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `legalForms.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0907103825136612 - nodes in this community are weakly interconnected._
- **Should `data/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._