# Graph Report - msk-shop-redesign  (2026-10-27)

## Corpus Check
- 426 files · ~306,659 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2665 nodes · 6654 edges · 176 communities (138 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 107 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5f986b8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- legalForms.ts
- data/route.ts
- getClientIp
- devDependencies
- Card.tsx
- dependencies
- Design System: MSK Scripts Shop
- fivestats.ts
- compilerOptions
- routes.ts
- i18n.ts
- scripts/deploy.sh (Server Deploy Script)
- imageUploads.ts
- Tebex API Reference (5 HTTP APIs)
- sitemap.ts
- admin/page.tsx
- giveaway-bot/DashboardClient.tsx
- adminImages.ts
- botproxy/route.ts
- llms.ts
- Catalog.tsx
- TranscriptsCard.tsx
- Hero.tsx
- botProvision.ts
- getRequestLang
- adminApi.ts
- [lang]/page.tsx
- domain/route.ts
- bot-control/route.ts
- package.json
- lib/tebex.ts
- adminImageStats.test.ts
- scripts
- [guildId]/route.ts
- ImagesTab.tsx
- AddToCartButton.tsx
- tebexPlugin.ts
- Privacy Policy (EN)
- approveUpload
- Hosted Bot Management Service
- MSK Scripts Social/OpenGraph Banner
- stripe-reconcile.js
- siteSettings.ts
- Terms & Conditions (EN)
- publicPath
- MSK Giveaway Bot Marketing Banner
- cleanup.js
- PackagesBrowser.tsx
- bot-provision.js
- admin/coupons/route.ts
- Stripe Subscription Billing
- MSK Scripts Shop
- Discord Ticket Bot Marketing Banner
- Kanbanly Hero Banner
- Kanbanly Logo (Horizontal Lockup)
- MSK Forms Hero Screenshot
- msk_fuel Marketing Banner
- msk_handcuffs Marketing Banner
- MSK Ticket Bot Marketing Banner
- msk_vehiclekeys Marketing Banner
- repair-transcript-images.js
- Data Collected by the Giveaway Bot
- transcript/upload/route.ts
- msk_core Marketing Banner
- msk_enginetoggle Marketing Banner
- msk_garage Marketing Banner
- giveawayStats.ts
- msk_givevehicle Marketing Banner
- MSK.DOCS Official Documentation Banner
- health/route.ts
- [name]/page.tsx
- Push to Codeberg Job
- Kanbanly Marketing Banner (dark, 1200x630 OG-style)
- MSK Scripts Logo (green M mark)
- MSK Paste (Self-hosted Pastebin)
- MSK Giveaway Bot
- MSK Scripts Shop (headless storefront)
- MSK Shortener Hero Screenshot
- discord-verify/callback/route.ts
- Coverage Job
- lib/auth.ts
- deploy.sh
- vhost-create.sh
- NewsPopupTab.tsx
- imagePipeline.ts
- Cached Discord Online Member Count
- eslint.config.mjs
- Dependabot Config
- Bug Report Issue Template
- CodeQL Analyze Job
- Deploy Workflow
- next.config.js
- vhost-delete.sh
- tailwind.config.ts
- contrast.test.ts
- localeLinks.test.ts
- ResourcesClient.tsx
- tebex-stats.js
- query
- GallerySearch
- dashboard/ticket-bot/page.tsx
- stripe/route.ts
- MSKanban README/Banner Image
- routeGuards.test.ts
- index.tsx
- tiers.test.ts
- Operations
- schema.sql
- Development
- cn
- Lang
- sitemap.xsl/route.ts
- url/route.ts
- dashboard-host/route.ts
- image-ingest.js
- giveawaySession.ts
- MSK Ticket Bot Transcript Service
- open/route.ts
- discord-verify/route.ts
- Header.tsx
- ThemeProvider.tsx
- session.ts
- Colors
- images/upload/route.ts
- DashboardDomainCard
- UploadClient.tsx
- Data Processing Agreement (AVV)
- Vereinbarung zur Auftragsverarbeitung (AVV)
- ticketbotStats.ts
- sendMail
- peds.js
- imageSyncCheck.ts
- writeAudit
- trialEnding.ts
- image-pedshot-prepare.js
- adminImageFiles.test.ts
- CI Workflow (msk-shop)
- next-themes
- image-sync-check.js
- items.js
- Data Collected by the Transcript Service
- Withdrawal Instructions
- Widerrufsbelehrung
- vehicles.js
- react
- image-label-import.js
- Label-Generatoren
- sanitize-html
- sharp
- bot-vhost-create.sh
- msk-cron.sh
- zustand
- react-dom
- bot-vhost-delete.sh
- Pricing migration, 2026-09-19
- ticket-bot/DashboardClient.tsx
- discordPermissions.test.ts
- softNotFound.test.ts
- image-uploads/route.ts
- tiers.ts
- migrate-stats-ignored.js
- labelImportScript.test.ts
- 003-site-settings.sql

## God Nodes (most connected - your core abstractions)
1. `query()` - 84 edges
2. `getRequestLang()` - 77 edges
3. `cn()` - 68 edges
4. `Button` - 56 edges
5. `publicPath()` - 56 edges
6. `Lang` - 53 edges
7. `useLang()` - 52 edges
8. `Card` - 47 edges
9. `pageSeo` - 44 edges
10. `queryOne()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/[lang]/discord/giveaway-bot/stats/StatsClient.tsx → lib/utils.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/[lang]/discord/ticket-bot/stats/StatsClient.tsx → lib/utils.ts
- `StatusBadge()` --calls--> `cn()`  [EXTRACTED]
  app/[lang]/tools/images/upload/UploadClient.tsx → lib/utils.ts
- `POST` --calls--> `writeAudit()`  [EXTRACTED]
  app/api/admin/giftcards/route.ts → lib/adminAudit.ts

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

## Communities (176 total, 25 thin omitted)

### Community 0 - "legalForms.ts"
Cohesion: 0.09
Nodes (53): dynamic, POST(), dynamic, POST(), badRequest(), clientIpOrNull(), deliverReceipts(), mailLangFrom() (+45 more)

### Community 1 - "data/route.ts"
Cohesion: 0.13
Nodes (17): ACTION_PATH, OWNER_ACTIONS, POST(), ALLOWED, GET(), GwListItem, KIND_PATH, OWNER_KINDS (+9 more)

### Community 2 - "getClientIp"
Cohesion: 0.22
Nodes (15): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+7 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+21 more)

### Community 4 - "Card.tsx"
Cohesion: 0.08
Nodes (39): ApiKeysTab(), formatRegistered(), maskKey(), originBadgeClass(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass() (+31 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (27): clsx, @fontsource-variable/archivo, @fontsource-variable/source-sans-3, js-cookie, mysql2, nodemailer, dependencies, clsx (+19 more)

### Community 6 - "Design System: MSK Scripts Shop"
Cohesion: 0.10
Nodes (21): Badges, Buttons, Cards, Components, Design System: MSK Scripts Shop, Do:, Do's and Don'ts, Don't: (+13 more)

### Community 7 - "fivestats.ts"
Cohesion: 0.07
Nodes (36): dynamic, GET(), ResourcesPage(), CTASection(), Entry, ProofLine(), RESOURCE_STATS, RESOURCE_STATS_GAME (+28 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "routes.ts"
Cohesion: 0.06
Nodes (61): authorized(), POST(), ResultRow, WinnerIn, metadata, RootLayout(), viewport, BLOCKED (+53 more)

### Community 10 - "i18n.ts"
Cohesion: 0.13
Nodes (25): CancellationClient(), Done, CheckoutContent(), Done, ReportClient(), Done, WithdrawalClient(), FALLBACK (+17 more)

### Community 11 - "scripts/deploy.sh (Server Deploy Script)"
Cohesion: 0.12
Nodes (17): CI Job: Build, Dependabot Secret Fallback Placeholders, cleanup.js Cron auf /opt/msk-shop/scripts/, scripts/deploy.sh (Server Deploy Script), Deploy Workflow (workflow_run nach grünem CI), /opt/msk-shop/.env.local Build-Variablen, ForceCommand-gepinnter Action-Key, Benötigte GitHub-Secrets (DEPLOY_* + Build-Variablen) (+9 more)

### Community 12 - "imageUploads.ts"
Cohesion: 0.11
Nodes (24): dynamic, GET, normaliseName(), PIPELINE_RULES, categoryAllowsUpload(), DecisionFailure, DecisionResult, ImageUpload (+16 more)

### Community 13 - "Tebex API Reference (5 HTTP APIs)"
Cohesion: 0.15
Nodes (17): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+9 more)

### Community 14 - "sitemap.ts"
Cohesion: 0.13
Nodes (20): dynamic, GET, dynamic, GET, generateStaticParams(), generateStaticParams(), GET(), revalidate (+12 more)

### Community 15 - "admin/page.tsx"
Cohesion: 0.16
Nodes (14): dynamic, GET(), AdminPage(), dynamic, ERROR_MESSAGES, metadata, loadAdminMember(), ADMIN_SESSION_COOKIE (+6 more)

### Community 16 - "giveaway-bot/DashboardClient.tsx"
Cohesion: 0.05
Nodes (55): BonusRoleEditor(), Channel, clampBonus(), CouponFields(), couponPayload(), CreateForm(), Ctx, Dict (+47 more)

### Community 17 - "adminImages.ts"
Cohesion: 0.12
Nodes (31): DELETE, dynamic, moveFailure(), PATCH, dynamic, GET, ADMIN_IMAGE_FILTERS, AdminImage (+23 more)

### Community 18 - "botproxy/route.ts"
Cohesion: 0.11
Nodes (28): bounce(), DELETE, dynamic, GET, handle(), HEAD, HOP_BY_HOP, OPTIONS (+20 more)

### Community 19 - "llms.ts"
Cohesion: 0.19
Nodes (15): GET(), revalidate, escapeXml(), GET(), revalidate, botLandingEntries(), MAX_PER_PAGE, entry() (+7 more)

### Community 20 - "Catalog.tsx"
Cohesion: 0.14
Nodes (21): Bots, price(), Row, Variant(), Props, PackagePrice(), Props, Badge (+13 more)

### Community 21 - "TranscriptsCard.tsx"
Cohesion: 0.13
Nodes (16): CatalogPackage, PAGE_SIZES, Payment, selectClass, TranscriptsCard, EMPTY_QUERY, formatBytes(), Query (+8 more)

### Community 22 - "Hero.tsx"
Cohesion: 0.15
Nodes (14): CustomPackageCard(), resolveImageSrc(), CustomPackages(), HOMEPAGE_TOOL_IDS, FIVEM_SCRIPT_IDS, FreeScripts(), Hero(), ReleaseFeed() (+6 more)

### Community 23 - "botProvision.ts"
Cohesion: 0.09
Nodes (51): dynamic, GET(), POST(), runtime, dynamic, POST(), runtime, dynamic (+43 more)

### Community 24 - "getRequestLang"
Cohesion: 0.07
Nodes (50): POST(), generateMetadata(), AccountPage(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), dynamic (+42 more)

### Community 25 - "adminApi.ts"
Cohesion: 0.15
Nodes (21): dynamic, GET, POST, TeamRow, AdminClient(), Member, AdminCtx, AdminAuthResult (+13 more)

### Community 26 - "[lang]/page.tsx"
Cohesion: 0.33
Nodes (6): HomePage(), countUrls(), loadDocPageCount(), NOTE: server module. No secret behind it, the sitemap is public -- but, webSiteJsonLd(), loadShopStats()

### Community 27 - "domain/route.ts"
Cohesion: 0.32
Nodes (14): activate(), DELETE(), dynamic, execAsync, gate(), PATCH(), pointsHere(), POST() (+6 more)

### Community 28 - "bot-control/route.ts"
Cohesion: 0.24
Nodes (12): ALLOWED_ACTIONS, authHosted(), botDir(), execAsync, GET(), POST(), authHosted(), GET() (+4 more)

### Community 29 - "package.json"
Cohesion: 0.17
Nodes (11): engines, node, license, name, overrides, eslint, js-yaml, postcss (+3 more)

### Community 30 - "lib/tebex.ts"
Cohesion: 0.13
Nodes (22): CartPage(), CartDrawer(), ShoppingBag, Tag, SalePriceFetcher(), cartTranslations, addGiftToBasket(), addToBasket() (+14 more)

### Community 31 - "adminImageStats.test.ts"
Cohesion: 0.14
Nodes (16): GET, dynamic, GET, adminImageStats(), countPendingUploads(), keys(), mQuery, mQueryOne (+8 more)

### Community 32 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:coverage, test:watch (+1 more)

### Community 33 - "[guildId]/route.ts"
Cohesion: 0.21
Nodes (12): dynamic, ExistingRow, PATCH, VALID_TIERS, dynamic, GuildRow, ApiKey, isKeyOrigin() (+4 more)

### Community 34 - "ImagesTab.tsx"
Cohesion: 0.15
Nodes (14): AdminImage, CategoryStat, Figures, Filter, FILTERS, formatBytes(), ImageList, ImagesTab() (+6 more)

### Community 35 - "AddToCartButton.tsx"
Cohesion: 0.16
Nodes (10): MagnifyingGlassPlus, ShoppingCart, SignIn, AddToCartButton(), readStoredDiscordId(), withName(), PackageGallery(), PackageGalleryProps (+2 more)

### Community 36 - "tebexPlugin.ts"
Cohesion: 0.08
Nodes (29): GET, POST, dynamic, GET, POST, dynamic, GET, dynamic (+21 more)

### Community 37 - "Privacy Policy (EN)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

### Community 38 - "approveUpload"
Cohesion: 0.42
Nodes (8): dynamic, failureResponse(), POST, categoryExists(), approveUpload(), dropQuarantine(), getUpload(), rejectUpload()

### Community 39 - "Hosted Bot Management Service"
Cohesion: 0.25
Nodes (9): Attachment Storage (Premium and Premium+), Hosted Bot Management Data and Access Control, Storage Period Table, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials, Hosted Bot Customer Responsibilities, Hosted Bot Management Service, Hosting Termination and 14-Day Deletion (+1 more)

### Community 40 - "MSK Scripts Social/OpenGraph Banner"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "stripe-reconcile.js"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "siteSettings.ts"
Cohesion: 0.42
Nodes (7): dynamic, GET, PUT, parseNewsPopup(), invalidateNewsPopupCache(), loadNewsPopup(), saveNewsPopup()

### Community 43 - "Terms & Conditions (EN)"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "publicPath"
Cohesion: 0.08
Nodes (48): CategoryPage(), generateMetadata(), revalidate, generateMetadata(), PackageDetailPage(), revalidate, generateMetadata(), PackageCard() (+40 more)

### Community 45 - "MSK Giveaway Bot Marketing Banner"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "cleanup.js"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "PackagesBrowser.tsx"
Cohesion: 0.22
Nodes (15): FacetGroup(), PackagesBrowser(), priceOf(), Props, tagsOf(), SlidersHorizontal, bucketLabel(), countBy() (+7 more)

### Community 48 - "bot-provision.js"
Cohesion: 0.14
Nodes (23): botDir, botReportsRunning(), clone(), configure(), connect(), { execFile }, execFileAsync, exists() (+15 more)

### Community 49 - "admin/coupons/route.ts"
Cohesion: 0.27
Nodes (11): dynamic, GET, countCouponStates(), CouponExpiry, CouponLike, couponState, isCouponActive(), isTrue() (+3 more)

### Community 50 - "Stripe Subscription Billing"
Cohesion: 0.33
Nodes (7): Custom Domain: Certbot and Certificate Transparency, Cancellation and Downgrade, Custom Domain for Transcript Delivery, Abonnement und Zahlung (Stripe, Testphase), 14-Day Free Trial, Let's Encrypt SSL Certificate, Stripe Subscription Billing

### Community 51 - "MSK Scripts Shop"
Cohesion: 0.29
Nodes (7): Basket localStorage and sessionStorage, Data Collected by the Shop, Tebex Payment Processing (Shop), Discord ID and Membership Requirement, MSK Scripts Shop, Returns & Refunds (Digital Goods), Tebex Limited (Merchant of Record)

### Community 52 - "Discord Ticket Bot Marketing Banner"
Cohesion: 0.52
Nodes (7): Discord Ticket Bot Marketing Banner, Create Ticket Panel / Open Ticket Button, Ticket Status Workflow (In Progress / Resolved), Ticket Transcript / Support Ticket Card, Discord Ticket Bot (Product), MSK Dark Theme with Green Accent Visual Style, Tagline: Advanced, modular & open source

### Community 53 - "Kanbanly Hero Banner"
Cohesion: 0.43
Nodes (7): Workspaces, Boards and Cards with Labels, Due Dates and Assignments, Custom Package Banner Asset (public/), Dark Navy Background with Purple Accent Branding, Zum Dashboard Call-to-Action, Drag & Drop with Live Saving, Kanbanly Hero Banner, Kanbanly Project Management Tool

### Community 54 - "Kanbanly Logo (Horizontal Lockup)"
Cohesion: 0.33
Nodes (7): Kanbanly (Brand), Custom Package Brand Asset in public/, Indigo/Periwinkle Brand Color with White Tint Steps, Kanban Board Concept (3-Column Task Cards), Kanbanly Logo (Horizontal Lockup), Rounded-Square Kanban Grid Icon, Lowercase Bold Sans Wordmark 'kanbanly'

### Community 55 - "MSK Forms Hero Screenshot"
Cohesion: 0.48
Nodes (7): Application Forms Product, MSK Dark Theme with Green Accent, Open Dashboard / Demo Form CTAs, Discord Bot Invite Integration, MSK Forms Hero Screenshot, Live Status Loop (Submitted / Picked up by a reviewer / Decision), Submission Status Card with Reviewer Note

### Community 56 - "msk_fuel Marketing Banner"
Cohesion: 0.52
Nodes (7): msk_fuel Marketing Banner, ESX Framework Support, Realistic Fuel Consumption, Refueling & Station Logic, MSK Scripts Brand Identity (green M monogram, dark theme), MSK.FUEL (msk_fuel), QBCore Framework Support, Vehicle System Category

### Community 57 - "msk_handcuffs Marketing Banner"
Cohesion: 0.48
Nodes (7): msk_handcuffs Marketing Banner, ESX Framework Support Badge, MSK Scripts Brand Identity (green M logo, dark green gradient, mono type), msk_handcuffs (FiveM Roleplay Restraint Script), QBCore Framework Support Badge, Realistic Restraints, Escort & Struggle Mechanics, Roleplay System (eyebrow claim)

### Community 58 - "MSK Ticket Bot Marketing Banner"
Cohesion: 0.52
Nodes (7): MSK Ticket Bot Marketing Banner, MSK Scripts Green M Logo / Brand Style, HTML Transcripts, Multi-Category Support Tickets, MSK.TICKETBOT (Discord Ticket Bot), Discord.js v14, SQLite

### Community 59 - "msk_vehiclekeys Marketing Banner"
Cohesion: 0.52
Nodes (7): msk_vehiclekeys Marketing Banner, ESX Framework Support, MSK Scripts Brand Identity (M Logo, Dark Green Palette), MSK.VEHICLEKEYS (msk_vehiclekeys), QBCore Framework Support, Secure Key Ownership: Lock, Share and Hotwire Vehicles, Vehicle System Category

### Community 60 - "repair-transcript-images.js"
Cohesion: 0.38
Nodes (6): filenameFromUrl(), main(), mysql, parseArgs(), path, { readFile, writeFile }

### Community 61 - "Data Collected by the Giveaway Bot"
Cohesion: 0.40
Nodes (6): Giveaway Bot: Detaillierte Verarbeitung, Data Collected by the Giveaway Bot, Giveaway Data Retention (Deleted on Bot Removal), Giveaway Dashboard Session Cookies, Anonymous Public Statistics Page, Giveaway Web Dashboard (Discord OAuth)

### Community 62 - "transcript/upload/route.ts"
Cohesion: 0.20
Nodes (18): AttachmentInput, checkRateLimit(), isValidGuild(), POST(), RateLimitRow, reencodeImage(), RequestBody, transcriptBasePath() (+10 more)

### Community 63 - "msk_core Marketing Banner"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, Core Framework / Core Library Claim, ESX Framework Support, MSK Scripts Brand Identity (green M mark, dark theme), MSK.CORE (msk_core), QBCore Framework Support

### Community 64 - "msk_enginetoggle Marketing Banner"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, ESX Framework Support, Manual Engine Control for Vehicle Roleplay, MSK Scripts Brand Identity (Green M Logo, Dark Theme), msk_enginetoggle (Vehicle System Script), QBCore Framework Support

### Community 65 - "msk_garage Marketing Banner"
Cohesion: 0.60
Nodes (6): msk_garage Marketing Banner, ESX Framework Support, Full Garage Management, MSK Scripts Brand Identity (M logo, dark green), MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage

### Community 66 - "giveawayStats.ts"
Cohesion: 0.22
Nodes (11): dynamic, GET(), GiveawayStatsPage(), getGiveawayPool(), giveawayQuery(), giveawayQueryOne(), CountRow, EMPTY_GIVEAWAY_STATS (+3 more)

### Community 67 - "msk_givevehicle Marketing Banner"
Cohesion: 0.53
Nodes (6): msk_givevehicle Marketing Banner, MSK Scripts Brand Identity (M logo, green-on-dark), ESX Framework Support Badge, msk_givevehicle (FiveM Admin Tool), QBCore Framework Support Badge, Claim: Spawn & gift any vehicle to players in seconds

### Community 68 - "MSK.DOCS Official Documentation Banner"
Cohesion: 0.60
Nodes (6): API Reference, MSK.DOCS Official Documentation Banner, Dark Green Tech Visual Style (monospace uppercase, accent green), MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs

### Community 69 - "health/route.ts"
Cohesion: 0.33
Nodes (4): dynamic, IncidentsResponse, SEVERITY, StatusResponse

### Community 70 - "[name]/page.tsx"
Cohesion: 0.07
Nodes (49): GET(), OPTIONS, revalidate, GET(), OPTIONS, revalidate, GET(), OPTIONS (+41 more)

### Community 71 - "Push to Codeberg Job"
Cohesion: 0.40
Nodes (5): Codeberg Mirror Secrets, Mirror Runs Only on Main and Tags, Mirror to Codeberg Workflow, Prune-Based Exact Mirror, Push to Codeberg Job

### Community 72 - "Kanbanly Marketing Banner (dark, 1200x630 OG-style)"
Cohesion: 0.70
Nodes (5): Kanbanly Marketing Banner (dark, 1200x630 OG-style), Kanban board glyph logo (indigo rounded tile, 3x4 card grid), Claim: Minimalistisches Kanban-Tool, DSGVO-konform, Kostenlos, Kanbanly (minimalist Kanban tool), Tagline: "Flow first. Build fast."

### Community 73 - "MSK Scripts Logo (green M mark)"
Cohesion: 0.60
Nodes (5): Angular Geometric Monogram Style, MSK Green Accent Color Palette, MSK Scripts Brand Identity, MSK Scripts Logo (green M mark), Site Branding Asset (favicon, header, metadata)

### Community 74 - "MSK Paste (Self-hosted Pastebin)"
Cohesion: 0.60
Nodes (5): Paste Creation Form (Title + Content, 1 MB limit), MSK Dark Theme with Green Accent, MSK Paste (Self-hosted Pastebin), MSK Paste Screenshot, Syntax Highlighting

### Community 75 - "MSK Giveaway Bot"
Cohesion: 0.50
Nodes (4): Giveaway Bot Acceptable Use, MSK Giveaway Bot, Scope of Services, Server Operator Responsibility for Giveaways

### Community 76 - "MSK Scripts Shop (headless storefront)"
Cohesion: 0.17
Nodes (17): Code of Conduct (Contributor Covenant), Contributing Guide, Datenbank-Migrationen, Regeln, Verhältnis zu `database/schema.sql`, Pull Request Template, Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version) (+9 more)

### Community 77 - "MSK Shortener Hero Screenshot"
Cohesion: 0.67
Nodes (4): Dark Theme with MSK Green Accent Headline, MSK Shortener Hero Screenshot, Long URL Input Form Card, MSK URL Shortener (privacy-friendly, no signup)

### Community 78 - "discord-verify/callback/route.ts"
Cohesion: 0.17
Nodes (17): GET(), GET(), isRecheckState(), fetchGuildMemberRoles(), fetchUserGuilds(), RawGuild, UserGuilds, canManageGuild() (+9 more)

### Community 79 - "Coverage Job"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 81 - "deploy.sh"
Cohesion: 0.70
Nodes (4): db(), env_value(), run_as_app_user(), deploy.sh script

### Community 87 - "NewsPopupTab.tsx"
Cohesion: 0.26
Nodes (11): ButtonDraft, emptyButton(), fromDraft(), NewsPopupTab(), toDraft(), isAllowedHref(), NEWS_POPUP_DEFAULT, NEWS_POPUP_LIMITS (+3 more)

### Community 88 - "imagePipeline.ts"
Cohesion: 0.19
Nodes (12): ACCEPTED_INPUT_FORMATS, buildVariants(), cdnRootPath(), copyVariants(), deleteVariants(), trimAndPad(), variantFiles(), Variants (+4 more)

### Community 101 - "contrast.test.ts"
Cohesion: 0.29
Nodes (8): channels(), contrast(), CSS, dark, light, linear(), luminance(), mix()

### Community 102 - "localeLinks.test.ts"
Cohesion: 0.50
Nodes (4): ALLE, DARF_NEXT_LINK, dateien(), WURZELN

### Community 103 - "ResourcesClient.tsx"
Cohesion: 0.10
Nodes (14): formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge(), GithubMark(), ArrowUpRight, Hash (+6 more)

### Community 104 - "tebex-stats.js"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "query"
Cohesion: 0.11
Nodes (30): dynamic, POST(), runtime, GET(), execFileAsync, POST(), checkDns(), execFileAsync (+22 more)

### Community 106 - "GallerySearch"
Cohesion: 0.83
Nodes (4): GallerySearch(), clear(), navigate(), onChange()

### Community 107 - "dashboard/ticket-bot/page.tsx"
Cohesion: 0.19
Nodes (15): DashboardClient(), DashboardGuild, DashboardPage(), dynamic, GuildRow, metadata, ACCESS_GRACE_DAYS, ACCESS_STALE_HOURS (+7 more)

### Community 108 - "stripe/route.ts"
Cohesion: 0.21
Nodes (19): applySubscription(), downgradeGuild(), GuildIdRow, GuildNameRow, handleTrialWillEnd(), POST(), resolveInvoiceSubscriptionId(), sendOrderConfirmation() (+11 more)

### Community 112 - "routeGuards.test.ts"
Cohesion: 0.16
Nodes (10): API_DIR, DB_MODULES, DB_ROUTES, GUARDS, key(), LIB_DIR, LIB_SOURCES, libImports() (+2 more)

### Community 113 - "index.tsx"
Cohesion: 0.03
Nodes (98): Guild, dynamic, GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, Breakdown() (+90 more)

### Community 114 - "tiers.test.ts"
Cohesion: 0.28
Nodes (8): GuildPanel(), safeDomainHref(), mb(), TicketBotLanding(), tierFeatures(), formatTierPrice(), yearlyMonthsFree(), LADDER

### Community 115 - "Operations"
Cohesion: 0.22
Nodes (8): CI/CD, auto deploy, Manual Installation, Operations, Required GitHub Secrets, Requirements, Steps, Troubleshooting, Updating (manual)

### Community 116 - "schema.sql"
Cohesion: 0.12
Nodes (18): giveaway_results, msk_admin_audit, msk_admin_team, msk_cancellations, msk_content_reports, msk_image_categories, msk_image_uploads, msk_images (+10 more)

### Community 117 - "Development"
Cohesion: 0.25
Nodes (8): Configuration, Database, Design and styling, Development, Migrations, Project Structure, Security, Tech Stack

### Community 118 - "cn"
Cohesion: 0.07
Nodes (32): LookupPayment, LookupResult, LookupTab(), StatusBadge(), VerifyClient(), Props, StepIndicator(), TIER_LABELS (+24 more)

### Community 119 - "Lang"
Cohesion: 0.06
Nodes (50): generateMetadata(), GiveawayPage(), generateMetadata(), TicketBotComparePage(), generateMetadata(), TicketBotPage(), GiveawayLanding(), TicketBotCompare() (+42 more)

### Community 121 - "url/route.ts"
Cohesion: 0.40
Nodes (5): dynamic, extractApiKey(), GET(), GuildRow, UrlRow

### Community 123 - "dashboard-host/route.ts"
Cohesion: 0.18
Nodes (23): dynamic, execAsync, POST(), runtime, DashboardHostError, execFileAsync, generateDashboardHost(), isGeneratedHost() (+15 more)

### Community 124 - "image-ingest.js"
Cohesion: 0.19
Nodes (16): buildVariants(), CATEGORY_RULES, crypto, fs, main(), mysql, normaliseName(), parseArgs() (+8 more)

### Community 125 - "giveawaySession.ts"
Cohesion: 0.18
Nodes (14): POST(), BotGuild, dynamic, GiveawayVerifyPage(), metadata, Envelope, getSecret(), GIVEAWAY_SESSION_COOKIE (+6 more)

### Community 126 - "MSK Ticket Bot Transcript Service"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 127 - "open/route.ts"
Cohesion: 0.47
Nodes (5): dynamic, GET(), runtime, proxySecret(), signHandoff()

### Community 128 - "discord-verify/route.ts"
Cohesion: 0.31
Nodes (7): dynamic, GET(), GET(), RECHECK_COOKIE, RECHECK_COOKIE_TTL_S, RECHECK_STATE_PREFIX, generateState()

### Community 129 - "Header.tsx"
Cohesion: 0.09
Nodes (15): LanguageDropdown(), CaretDown, List, Header(), HeaderInner(), NAV_ITEMS, NavItem, Props (+7 more)

### Community 130 - "ThemeProvider.tsx"
Cohesion: 0.47
Nodes (3): NextThemesProviderProps, Props, ThemeProvider()

### Community 131 - "session.ts"
Cohesion: 0.16
Nodes (18): GuildRow, POST(), generateApiKey(), GuildRow, POST(), GuildRow, POST(), dynamic (+10 more)

### Community 132 - "Colors"
Cohesion: 0.33
Nodes (6): Colors, Functional, Named Rules, Neutral, Primary, Secondary

### Community 133 - "images/upload/route.ts"
Cohesion: 0.14
Nodes (17): GET(), dynamic, dynamic, GET(), POST(), listUploadsBySubmitter(), MAX_UPLOAD_BYTES, recentUploadCount() (+9 more)

### Community 134 - "DashboardDomainCard"
Cohesion: 0.67
Nodes (3): DashboardDomainCard(), call(), say()

### Community 135 - "UploadClient.tsx"
Cohesion: 0.09
Nodes (24): Figures, formatBytes(), QueueFilter, TABS, Upload, UploadsTab(), HostingSetup(), FormState (+16 more)

### Community 136 - "Data Processing Agreement (AVV)"
Cohesion: 0.17
Nodes (11): 10. Liability and final provisions, 1. Subject matter and duration, 2. Nature and purpose of the processing, categories of data, data subjects, 3. Instructions, 4. Obligations of MSK Scripts, 5. Obligations of the controller, 6. Technical and organisational measures (Art. 32 GDPR), 7. Sub-processors (+3 more)

### Community 137 - "Vereinbarung zur Auftragsverarbeitung (AVV)"
Cohesion: 0.17
Nodes (11): 10. Haftung und Schlussbestimmungen, 1. Gegenstand und Dauer, 2. Art und Zweck der Verarbeitung, Datenkategorien, Betroffene, 3. Weisungen, 4. Pflichten von MSK Scripts, 5. Pflichten des Auftraggebers, 6. Technische und organisatorische Maßnahmen (Art. 32 DSGVO), 7. Unterauftragsverarbeiter (+3 more)

### Community 139 - "ticketbotStats.ts"
Cohesion: 0.17
Nodes (13): dynamic, GET(), dynamic, StatsPage(), AvgRow, CountRow, EMPTY_STATS, loadTicketbotStats() (+5 more)

### Community 140 - "sendMail"
Cohesion: 0.27
Nodes (9): forLog(), getTransporter(), MailConfig, mailConfigFromEnv(), MailMessage, sendMail(), capture(), CR (+1 more)

### Community 141 - "peds.js"
Cohesion: 0.20
Nodes (10): ALTER, dump, fs, GESCHLECHT_AUS_TYP, GRUPPE, [quelle, ziel], raus, ROLLE (+2 more)

### Community 142 - "imageSyncCheck.ts"
Cohesion: 0.29
Nodes (8): dynamic, GET, cdnRoot(), DERIVATIVES, listFiles(), runSyncCheck(), SyncCheckCategory, SyncCheckResult

### Community 143 - "writeAudit"
Cohesion: 0.16
Nodes (16): AuditRow, dynamic, GET, dynamic, POST, DELETE, dynamic, DELETE (+8 more)

### Community 144 - "trialEnding.ts"
Cohesion: 0.31
Nodes (7): buildTrialEndingEmail(), BuiltEmail, escapeHtml(), formatTrialEnd(), pickMailLang(), TrialEndingInput, END

### Community 145 - "image-pedshot-prepare.js"
Cohesion: 0.36
Nodes (8): fs, fuelleLoecher(), groesstenBereichBehalten(), main(), maskiere(), parseArgs(), path, sharp

### Community 146 - "adminImageFiles.test.ts"
Cohesion: 0.25
Nodes (4): CATEGORIES, mQuery, mQueryOne, Row

### Community 147 - "CI Workflow (msk-shop)"
Cohesion: 0.24
Nodes (10): CI Job: Audit (production tree), CI Workflow (msk-shop), CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck, brace-expansion Advisory GHSA-mh99-v99m-4gvg (dev-only), minimatch@3 Pin der ESLint-Plugins (+2 more)

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

### Community 156 - "image-label-import.js"
Cohesion: 0.50
Nodes (4): fs, main(), mysql, toTagList()

### Community 157 - "Label-Generatoren"
Cohesion: 0.40
Nodes (4): Die Quellen, Label-Generatoren, Warum sie hier liegen, Was der Import garantiert

### Community 168 - "Pricing migration, 2026-09-19"
Cohesion: 0.20
Nodes (9): 1. Before anything else: find guilds that would lose hosting, 2. Stripe: six prices, created 2026-09-19, 3. The three old prices are still active, 4. Server: `.env.local`, 5. Deploy and check, Pricing migration, 2026-09-19, Status, What changed in the code (+1 more)

### Community 170 - "ticket-bot/DashboardClient.tsx"
Cohesion: 0.05
Nodes (46): BotConfigEditor, BotDashboardAddress(), DashboardDomainCard, GET_LABEL, HostingSetup, PaidTier, Props, T (+38 more)

### Community 172 - "discordPermissions.test.ts"
Cohesion: 0.38
Nodes (4): ADMINISTRATOR, MANAGE_GUILD, SEND_MESSAGES, VIEW_CHANNEL

### Community 175 - "image-uploads/route.ts"
Cohesion: 0.33
Nodes (6): dynamic, GET, STATUSES, listUploads(), toUpload(), UploadStatus

### Community 178 - "tiers.ts"
Cohesion: 0.17
Nodes (14): CustomerRow, POST(), GuildRow, GuildRow, Guild, getStripe(), isActiveSubStatus(), priceIdForTier() (+6 more)

### Community 179 - "migrate-stats-ignored.js"
Cohesion: 0.50
Nodes (4): APPLY, main(), mysql, parseKeys()

## Knowledge Gaps
- **734 isolated node(s):** `Tier`, `TIER_LABELS`, `TIER_ORDER`, `AuditEntry`, `BanEntry` (+729 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 906 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `legalForms.ts`, `data/route.ts`, `session.ts`, `routes.ts`, `ticketbotStats.ts`, `imageUploads.ts`, `imageSyncCheck.ts`, `admin/page.tsx`, `writeAudit`, `adminImages.ts`, `adminImageFiles.test.ts`, `botProvision.ts`, `adminApi.ts`, `domain/route.ts`, `adminImageStats.test.ts`, `[guildId]/route.ts`, `approveUpload`, `siteSettings.ts`, `transcript/upload/route.ts`, `[name]/page.tsx`, `discord-verify/callback/route.ts`, `imagePipeline.ts`, `dashboard/ticket-bot/page.tsx`, `stripe/route.ts`, `dashboard-host/route.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `publicPath()` connect `publicPath` to `legalForms.ts`, `data/route.ts`, `getClientIp`, `images/upload/route.ts`, `[name]/page.tsx`, `routes.ts`, `i18n.ts`, `dashboard/ticket-bot/page.tsx`, `discord-verify/callback/route.ts`, `admin/page.tsx`, `trialEnding.ts`, `tiers.ts`, `llms.ts`, `Lang`, `getRequestLang`, `[lang]/page.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Lang` connect `Lang` to `AddToCartButton.tsx`, `[name]/page.tsx`, `ResourcesClient.tsx`, `UploadClient.tsx`, `fivestats.ts`, `ticket-bot/DashboardClient.tsx`, `i18n.ts`, `publicPath`, `routes.ts`, `PackagesBrowser.tsx`, `giveaway-bot/DashboardClient.tsx`, `index.tsx`, `Catalog.tsx`, `TranscriptsCard.tsx`, `Hero.tsx`, `cn`, `getRequestLang`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `Tier`, `TIER_LABELS`, `TIER_ORDER` to the rest of the system?**
  _734 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `legalForms.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0907103825136612 - nodes in this community are weakly interconnected._
- **Should `data/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._