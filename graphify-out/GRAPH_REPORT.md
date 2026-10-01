# Graph Report - msk-shop  (2026-10-01)

## Corpus Check
- 413 files · ~298,892 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2478 nodes · 5849 edges · 184 communities (157 shown, 27 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 107 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20b23fc2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- legalReceipts.ts
- data/route.ts
- getClientIp
- devDependencies
- Card
- dependencies
- Design System: MSK Scripts Shop
- fivestats.ts
- TypeScript Configuration
- app/layout.tsx
- useLang
- scripts/deploy.sh (Server Deploy Script)
- imageUploads.ts
- Tebex API Reference (5 HTTP APIs)
- sitemap.ts
- admin/page.tsx
- i18n.ts
- adminImages.ts
- botproxy/route.ts
- jsonLd.ts
- Catalog.tsx
- giveaway/dashboard/DashboardClient.tsx
- CustomPackageCard.tsx
- botProvision.ts
- renderMarkdown
- adminPerms.ts
- app/page.tsx
- domain/route.ts
- images.ts
- package.json
- lib/tebex.ts
- adminImageStats.test.ts
- NPM Scripts
- [guildId]/route.ts
- ticketbot/dashboard/DashboardClient.tsx
- getRequestLang
- writeAudit
- Privacy Policy (EN)
- HostingSetup.tsx
- Hosted Bot Management Service
- Brand Identity Assets
- Stripe Reconciliation Script
- ticketbot-copy.ts
- Terms & Conditions (EN)
- packages/[id]/page.tsx
- Giveaway Bot Marketing
- File Cleanup Script
- Package Browser Filtering
- bot-provision.js
- admin/coupons/route.ts
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
- NewsPopupTab.tsx
- imagePipeline.ts
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
- GiveawayLanding.tsx
- Tebex Statistics Script
- query
- LocaleLink.tsx
- ticketbot/dashboard/page.tsx
- stripe/route.ts
- Documentation Assets
- routeGuards.test.ts
- TicketBotLanding.tsx
- Lucide Icon Library
- Next.js Framework
- schema.sql
- legalForms.ts
- Card.tsx
- botSeo.ts
- Sitemap Route
- URL Shortener API
- dashboard-host/route.ts
- image-ingest.js
- giveawaySession.ts
- Transcript Service Terms
- SWR Data Fetching
- discord-verify/route.ts
- cn
- getPackages
- session.ts
- env/route.ts
- images/upload/route.ts
- ImagesTab.tsx
- UploadsTab.tsx
- Data Processing Agreement (AVV)
- Vereinbarung zur Auftragsverarbeitung (AVV)
- CouponsTab.tsx
- ticketbot/stats/StatsClient.tsx
- sendMail
- peds.js
- imageSyncCheck.ts
- adminApi.ts
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
- ResourcesClient.tsx
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
- Pricing migration, 2026-09-19
- ApiKeysTab.tsx
- BotConfigEditor.tsx
- TranscriptsCard.tsx
- discordPermissions.test.ts
- softNotFound.test.ts
- LookupTab.tsx
- image-uploads/route.ts
- api/images/route.ts
- orderConfirmation.ts
- Tier
- migrate-stats-ignored.js
- DashboardDomainCard
- labelImportScript.test.ts
- 003-site-settings.sql

## God Nodes (most connected - your core abstractions)
1. `query()` - 84 edges
2. `getRequestLang()` - 73 edges
3. `cn()` - 64 edges
4. `Button` - 56 edges
5. `useLang()` - 52 edges
6. `Lang` - 50 edges
7. `Card` - 47 edges
8. `pageSeo` - 44 edges
9. `queryOne()` - 42 edges
10. `getClientIp()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `GuildRow` --references--> `Tier`  [EXTRACTED]
  app/api/verify/check-guild/route.ts → lib/tiers.ts
- `GuildRow` --references--> `Tier`  [EXTRACTED]
  app/api/verify/complete/route.ts → lib/tiers.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/giveaway/stats/StatsClient.tsx → lib/utils.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/ticketbot/stats/StatsClient.tsx → lib/utils.ts

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

## Communities (184 total, 27 thin omitted)

### Community 0 - "legalReceipts.ts"
Cohesion: 0.17
Nodes (31): dynamic, POST(), dynamic, POST(), badRequest(), clientIpOrNull(), deliverReceipts(), mailLangFrom() (+23 more)

### Community 1 - "data/route.ts"
Cohesion: 0.13
Nodes (17): ACTION_PATH, OWNER_ACTIONS, POST(), ALLOWED, GET(), GwListItem, KIND_PATH, OWNER_KINDS (+9 more)

### Community 2 - "getClientIp"
Cohesion: 0.13
Nodes (28): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+20 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+21 more)

### Community 4 - "Card"
Cohesion: 0.16
Nodes (20): AuditEntry, AuditTab(), BanEntry, BansTab(), ErrorCard(), GiftCard, GiftCardsTab(), Package (+12 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (27): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, js-cookie, mysql2, next-themes, nodemailer, dependencies (+19 more)

### Community 6 - "Design System: MSK Scripts Shop"
Cohesion: 0.10
Nodes (20): Colors, Design System: MSK Scripts Shop, Do:, Do's and Don'ts, Don't:, Elevation & Depth, Functional, Hierarchy (+12 more)

### Community 7 - "fivestats.ts"
Cohesion: 0.10
Nodes (28): dynamic, GET(), ResourcesPage(), RESOURCE_STATS, RESOURCE_STATS_GAME, RESOURCE_STATS_HEADLINE, RESOURCE_STATS_PERIOD_HOURS, ResourceStatEntry (+20 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "app/layout.tsx"
Cohesion: 0.10
Nodes (29): metadata, RootLayout(), viewport, NextThemesProviderProps, Props, ThemeProvider(), organizationJsonLd(), DEFAULT_LANG (+21 more)

### Community 10 - "useLang"
Cohesion: 0.13
Nodes (23): Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), VerifyClient(), Done, ReportClient() (+15 more)

### Community 11 - "scripts/deploy.sh (Server Deploy Script)"
Cohesion: 0.14
Nodes (17): CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Test, CI Job: Typecheck, cleanup.js Cron auf /opt/msk-shop/scripts/, scripts/deploy.sh (Server Deploy Script), Deploy Workflow (workflow_run nach grünem CI) (+9 more)

### Community 12 - "imageUploads.ts"
Cohesion: 0.13
Nodes (25): dynamic, GET, dynamic, failureResponse(), POST, categoryExists(), approveUpload(), categoryAllowsUpload() (+17 more)

### Community 13 - "Tebex API Reference (5 HTTP APIs)"
Cohesion: 0.22
Nodes (13): Tebex Limited (payment MoR, UK), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit), msk_admin_team + msk_admin_audit tables, Tebex API Reference (5 HTTP APIs), Admin dashboard implications, Affiliate API (affiliate.tebex.io) (+5 more)

### Community 14 - "sitemap.ts"
Cohesion: 0.22
Nodes (11): GET(), revalidate, bothLanguages(), buildSitemapEntries(), escapeXml(), newest(), parseTimestamp(), renderSitemapXml() (+3 more)

### Community 15 - "admin/page.tsx"
Cohesion: 0.15
Nodes (16): AdminPage(), dynamic, ERROR_MESSAGES, metadata, dynamic, GET(), AdminAuthResult, AdminTeamRow (+8 more)

### Community 16 - "i18n.ts"
Cohesion: 0.10
Nodes (22): Guild, STEP_ICONS, Entry, ProofLine(), ReleaseFeed(), WhyMSK(), HOME_FEATURE_ICONS, COMPARE_DATA_DATE (+14 more)

### Community 17 - "adminImages.ts"
Cohesion: 0.12
Nodes (31): DELETE, dynamic, moveFailure(), PATCH, dynamic, GET, ADMIN_IMAGE_FILTERS, AdminImage (+23 more)

### Community 18 - "botproxy/route.ts"
Cohesion: 0.10
Nodes (33): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+25 more)

### Community 19 - "jsonLd.ts"
Cohesion: 0.13
Nodes (23): GESPERRT, robots(), TicketBotComparePage(), TicketBotCompare(), ticketBotCompareCopy, botLandingEntries(), breadcrumbJsonLd(), Crumb (+15 more)

### Community 20 - "Catalog.tsx"
Cohesion: 0.10
Nodes (27): Props, BotEntry, price(), Row, Variant(), Props, PackageGallery(), PackageGalleryProps (+19 more)

### Community 21 - "giveaway/dashboard/DashboardClient.tsx"
Cohesion: 0.06
Nodes (47): BonusRoleEditor(), Channel, clampBonus(), CouponFields(), couponPayload(), CreateForm(), Ctx, Dict (+39 more)

### Community 22 - "CustomPackageCard.tsx"
Cohesion: 0.33
Nodes (7): CustomPackageCard(), resolveImageSrc(), HOMEPAGE_TOOL_IDS, FIVEM_SCRIPT_IDS, CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE, CustomPackage

### Community 23 - "botProvision.ts"
Cohesion: 0.14
Nodes (33): POST(), dynamic, POST(), runtime, botDir(), allocateBotPort(), archiveName(), archivePath() (+25 more)

### Community 24 - "renderMarkdown"
Cohesion: 0.22
Nodes (15): DpaPage(), ImprintPage(), TermsPage(), PrivacyPage(), WithdrawalPage(), LegalContent(), ALLOWED_SLUGS, getLegalContent() (+7 more)

### Community 25 - "adminPerms.ts"
Cohesion: 0.13
Nodes (23): AdminClient(), Member, DELETE, dynamic, ownerFlag(), PATCH, dynamic, GET (+15 more)

### Community 26 - "app/page.tsx"
Cohesion: 0.17
Nodes (12): HomePage(), Bots, CTASection(), CustomPackages(), FreeScripts(), Hero(), HowItWorks(), countUrls() (+4 more)

### Community 27 - "domain/route.ts"
Cohesion: 0.23
Nodes (18): activate(), DELETE(), dynamic, execAsync, gate(), PATCH(), pointsHere(), POST() (+10 more)

### Community 28 - "images.ts"
Cohesion: 0.14
Nodes (19): CategoryPage(), findCategory(), formatCount(), ImagesPage(), escapeXml(), GET(), revalidate, booleanTerms() (+11 more)

### Community 29 - "package.json"
Cohesion: 0.17
Nodes (11): engines, node, license, name, overrides, eslint, js-yaml, postcss (+3 more)

### Community 30 - "lib/tebex.ts"
Cohesion: 0.12
Nodes (23): CartPage(), CheckoutContent(), CartDrawer(), AddToCartButton(), readStoredDiscordId(), withName(), cartTranslations, addGiftToBasket() (+15 more)

### Community 31 - "adminImageStats.test.ts"
Cohesion: 0.31
Nodes (7): dynamic, GET, adminImageStats(), countPendingUploads(), figures(), mQuery, mQueryOne

### Community 32 - "NPM Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:coverage, test:watch (+1 more)

### Community 33 - "[guildId]/route.ts"
Cohesion: 0.13
Nodes (20): ApiKey, dynamic, ExistingRow, PATCH, VALID_TIERS, dynamic, GET, GuildRow (+12 more)

### Community 34 - "ticketbot/dashboard/DashboardClient.tsx"
Cohesion: 0.16
Nodes (13): DashboardDomainCard, GET_LABEL, PaidTier, Props, T, TabKey, TIER_COLORS, TIER_ORDER (+5 more)

### Community 35 - "getRequestLang"
Cohesion: 0.10
Nodes (35): AccountPage(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), dynamic, generateMetadata(), generateMetadata() (+27 more)

### Community 36 - "writeAudit"
Cohesion: 0.09
Nodes (34): dynamic, GET, POST, DELETE, dynamic, POST, DELETE, dynamic (+26 more)

### Community 37 - "Privacy Policy (EN)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

### Community 38 - "HostingSetup.tsx"
Cohesion: 0.15
Nodes (14): HostingSetup, BotArchive, EnvValues, errorText(), Job, RemoveCard(), remove(), RunningCard() (+6 more)

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

### Community 44 - "packages/[id]/page.tsx"
Cohesion: 0.09
Nodes (40): CategoryPage(), generateMetadata(), revalidate, generateMetadata(), PackageDetailPage(), revalidate, PackageCard(), BadgeVariant (+32 more)

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

### Community 49 - "admin/coupons/route.ts"
Cohesion: 0.27
Nodes (11): dynamic, GET, countCouponStates(), CouponExpiry, CouponLike, couponState, isCouponActive(), isTrue() (+3 more)

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
Cohesion: 0.20
Nodes (18): AttachmentInput, checkRateLimit(), isValidGuild(), POST(), RateLimitRow, reencodeImage(), RequestBody, transcriptBasePath() (+10 more)

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
Cohesion: 0.22
Nodes (11): dynamic, GET(), GiveawayStatsPage(), getGiveawayPool(), giveawayQuery(), giveawayQueryOne(), CountRow, EMPTY_GIVEAWAY_STATS (+3 more)

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
Cohesion: 0.16
Nodes (17): GET(), OPTIONS, revalidate, GET(), OPTIONS, revalidate, formatBytes(), ImageDetailPage() (+9 more)

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
Cohesion: 0.18
Nodes (16): GET(), GET(), isRecheckState(), fetchGuildMemberRoles(), fetchUserGuilds(), RawGuild, UserGuilds, canManageGuild() (+8 more)

### Community 79 - "Code Coverage CI"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 81 - "deploy.sh"
Cohesion: 0.70
Nodes (4): db(), env_value(), run_as_app_user(), deploy.sh script

### Community 87 - "NewsPopupTab.tsx"
Cohesion: 0.17
Nodes (18): ButtonDraft, emptyButton(), fromDraft(), NewsPopupTab(), toDraft(), dynamic, GET, PUT (+10 more)

### Community 88 - "imagePipeline.ts"
Cohesion: 0.13
Nodes (19): ACCEPTED_INPUT_FORMATS, buildVariants(), cdnRootPath(), copyVariants(), deleteVariants(), normaliseName(), PIPELINE_RULES, trimAndPad() (+11 more)

### Community 101 - "Color Contrast Testing"
Cohesion: 0.29
Nodes (8): channels(), contrast(), CSS, dark, light, linear(), luminance(), mix()

### Community 102 - "Localization Route Testing"
Cohesion: 0.50
Nodes (4): ALLE, DARF_NEXT_LINK, dateien(), WURZELN

### Community 103 - "GiveawayLanding.tsx"
Cohesion: 0.10
Nodes (13): BotCrossLink(), COMMAND_NAMES, COUPON_ICONS, FEATURE_ICONS, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, SETTINGS_ICONS, STEP_ICONS (+5 more)

### Community 104 - "Tebex Statistics Script"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "query"
Cohesion: 0.09
Nodes (36): dynamic, POST(), runtime, execFileAsync, POST(), checkDns(), execFileAsync, POST() (+28 more)

### Community 106 - "LocaleLink.tsx"
Cohesion: 0.10
Nodes (20): Params, revalidate, Params, revalidate, Search, istSprachlos(), LocaleLink(), OWN_WORK_CATEGORY (+12 more)

### Community 107 - "ticketbot/dashboard/page.tsx"
Cohesion: 0.18
Nodes (16): DashboardClient(), DashboardGuild, DashboardPage(), dynamic, GuildRow, metadata, ACCESS_GRACE_DAYS, ACCESS_STALE_HOURS (+8 more)

### Community 108 - "stripe/route.ts"
Cohesion: 0.15
Nodes (27): CustomerRow, POST(), POST(), applySubscription(), downgradeGuild(), GuildIdRow, GuildNameRow, handleTrialWillEnd() (+19 more)

### Community 112 - "routeGuards.test.ts"
Cohesion: 0.16
Nodes (10): API_DIR, DB_MODULES, DB_ROUTES, GUARDS, key(), LIB_DIR, LIB_SOURCES, libImports() (+2 more)

### Community 113 - "TicketBotLanding.tsx"
Cohesion: 0.11
Nodes (20): GuildPanel(), safeDomainHref(), DASHBOARD_ICONS, FEATURE_ICONS, HOSTED_ICONS, HUB_HREFS, HUB_ICONS, HUB_VARIANTS (+12 more)

### Community 116 - "schema.sql"
Cohesion: 0.12
Nodes (18): giveaway_results, msk_admin_audit, msk_admin_team, msk_cancellations, msk_content_reports, msk_image_categories, msk_image_uploads, msk_images (+10 more)

### Community 117 - "legalForms.ts"
Cohesion: 0.15
Nodes (17): CancellationFields, CancellationKind, clean(), cleanMultiline(), FieldErrors, MAX_CONTRACT, MAX_EMAIL, MAX_NAME (+9 more)

### Community 118 - "Card.tsx"
Cohesion: 0.12
Nodes (10): dynamic, GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, CardFooter, CardHeader (+2 more)

### Community 119 - "botSeo.ts"
Cohesion: 0.13
Nodes (22): generateMetadata(), GiveawayPage(), generateMetadata(), generateMetadata(), TicketBotPage(), GiveawayLanding(), JsonLd(), serialize() (+14 more)

### Community 121 - "URL Shortener API"
Cohesion: 0.40
Nodes (5): dynamic, extractApiKey(), GET(), GuildRow, UrlRow

### Community 123 - "dashboard-host/route.ts"
Cohesion: 0.19
Nodes (23): dynamic, execAsync, POST(), runtime, DashboardHostError, execFileAsync, generateDashboardHost(), isGeneratedHost() (+15 more)

### Community 124 - "image-ingest.js"
Cohesion: 0.19
Nodes (16): buildVariants(), CATEGORY_RULES, crypto, fs, main(), mysql, normaliseName(), parseArgs() (+8 more)

### Community 125 - "giveawaySession.ts"
Cohesion: 0.18
Nodes (14): POST(), BotGuild, dynamic, GiveawayVerifyPage(), metadata, Envelope, getSecret(), GIVEAWAY_SESSION_COOKIE (+6 more)

### Community 126 - "Transcript Service Terms"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 128 - "discord-verify/route.ts"
Cohesion: 0.31
Nodes (7): dynamic, GET(), GET(), RECHECK_COOKIE, RECHECK_COOKIE_TTL_S, RECHECK_STATE_PREFIX, generateState()

### Community 129 - "cn"
Cohesion: 0.06
Nodes (35): FormState, messageFor(), StatusBadge(), T, UploadClient(), UploadCopy, UploadRow, Props (+27 more)

### Community 130 - "getPackages"
Cohesion: 0.15
Nodes (13): dynamic, GET, dynamic, GET, generateStaticParams(), GET(), revalidate, generateStaticParams() (+5 more)

### Community 131 - "session.ts"
Cohesion: 0.16
Nodes (18): GuildRow, POST(), generateApiKey(), GuildRow, POST(), GuildRow, POST(), dynamic (+10 more)

### Community 132 - "env/route.ts"
Cohesion: 0.33
Nodes (11): dynamic, GET(), runtime, botEnvPath(), parseEnv(), patchBotEnv(), quote(), readBotEnv() (+3 more)

### Community 133 - "images/upload/route.ts"
Cohesion: 0.13
Nodes (18): GET(), dynamic, dynamic, GET(), POST(), listUploadsBySubmitter(), MAX_UPLOAD_BYTES, recentUploadCount() (+10 more)

### Community 134 - "ImagesTab.tsx"
Cohesion: 0.18
Nodes (12): AdminImage, CategoryStat, Figures, Filter, FILTERS, formatBytes(), ImageList, ImagesTab() (+4 more)

### Community 135 - "UploadsTab.tsx"
Cohesion: 0.18
Nodes (9): Figures, formatBytes(), QueueFilter, TABS, Upload, UploadsTab(), HostingSetup(), readJsonResource() (+1 more)

### Community 136 - "Data Processing Agreement (AVV)"
Cohesion: 0.17
Nodes (11): 10. Liability and final provisions, 1. Subject matter and duration, 2. Nature and purpose of the processing, categories of data, data subjects, 3. Instructions, 4. Obligations of MSK Scripts, 5. Obligations of the controller, 6. Technical and organisational measures (Art. 32 GDPR), 7. Sub-processors (+3 more)

### Community 137 - "Vereinbarung zur Auftragsverarbeitung (AVV)"
Cohesion: 0.17
Nodes (11): 10. Haftung und Schlussbestimmungen, 1. Gegenstand und Dauer, 2. Art und Zweck der Verarbeitung, Datenkategorien, Betroffene, 3. Weisungen, 4. Pflichten von MSK Scripts, 5. Pflichten des Auftraggebers, 6. Technische und organisatorische Maßnahmen (Art. 32 DSGVO), 7. Unterauftragsverarbeiter (+3 more)

### Community 138 - "CouponsTab.tsx"
Cohesion: 0.22
Nodes (8): CatalogItem, Coupon, CouponPayload, CouponsTab(), CouponState, formatDate(), STATE_LABEL, selectClass

### Community 139 - "ticketbot/stats/StatsClient.tsx"
Cohesion: 0.12
Nodes (19): dynamic, GET(), StatsPage(), formatBytes(), formatNum(), StatCard(), StatsClient(), TIER_GRID (+11 more)

### Community 140 - "sendMail"
Cohesion: 0.27
Nodes (9): forLog(), getTransporter(), MailConfig, mailConfigFromEnv(), MailMessage, sendMail(), capture(), CR (+1 more)

### Community 141 - "peds.js"
Cohesion: 0.20
Nodes (10): ALTER, dump, fs, GESCHLECHT_AUS_TYP, GRUPPE, [quelle, ziel], raus, ROLLE (+2 more)

### Community 142 - "imageSyncCheck.ts"
Cohesion: 0.29
Nodes (8): dynamic, GET, cdnRoot(), DERIVATIVES, listFiles(), runSyncCheck(), SyncCheckCategory, SyncCheckResult

### Community 143 - "adminApi.ts"
Cohesion: 0.27
Nodes (7): AuditRow, dynamic, GET, dynamic, GET, adminRoute(), authorizeAdmin()

### Community 144 - "trialEnding.ts"
Cohesion: 0.31
Nodes (7): buildTrialEndingEmail(), BuiltEmail, escapeHtml(), formatTrialEnd(), pickMailLang(), TrialEndingInput, END

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

### Community 155 - "ResourcesClient.tsx"
Cohesion: 0.27
Nodes (6): formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge(), resourceStatsTranslations

### Community 156 - "image-label-import.js"
Cohesion: 0.50
Nodes (4): fs, main(), mysql, toTagList()

### Community 157 - "Label-Generatoren"
Cohesion: 0.40
Nodes (4): Die Quellen, Label-Generatoren, Warum sie hier liegen, Was der Import garantiert

### Community 159 - "Imprint (EN)"
Cohesion: 0.50
Nodes (4): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Imprint (EN), Impressum (DE)

### Community 168 - "Pricing migration, 2026-09-19"
Cohesion: 0.20
Nodes (9): 1. Before anything else: find guilds that would lose hosting, 2. Stripe: six prices, created 2026-09-19, 3. The three old prices are still active, 4. Server: `.env.local`, 5. Deploy and check, Pricing migration, 2026-09-19, Status, What changed in the code (+1 more)

### Community 169 - "ApiKeysTab.tsx"
Cohesion: 0.33
Nodes (8): ApiKeysTab(), formatRegistered(), maskKey(), originBadgeClass(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass()

### Community 170 - "BotConfigEditor.tsx"
Cohesion: 0.25
Nodes (5): BotConfigEditor, BotConfigEditor(), BotStatus, logLineClass(), Msg

### Community 171 - "TranscriptsCard.tsx"
Cohesion: 0.28
Nodes (7): TranscriptsCard, EMPTY_QUERY, formatBytes(), Query, safeUrl(), TranscriptItem, TranscriptsCard()

### Community 172 - "discordPermissions.test.ts"
Cohesion: 0.38
Nodes (4): ADMINISTRATOR, MANAGE_GUILD, SEND_MESSAGES, VIEW_CHANNEL

### Community 174 - "LookupTab.tsx"
Cohesion: 0.40
Nodes (4): LookupPayment, LookupResult, LookupTab(), StatusBadge()

### Community 175 - "image-uploads/route.ts"
Cohesion: 0.40
Nodes (5): dynamic, GET, STATUSES, listUploads(), UploadStatus

### Community 176 - "api/images/route.ts"
Cohesion: 0.40
Nodes (5): GET(), OPTIONS, revalidate, categoryExists(), DEFAULT_PER_PAGE

### Community 177 - "orderConfirmation.ts"
Cohesion: 0.47
Nodes (5): buildOrderConfirmation(), BuiltEmail, escapeHtml(), formatDate(), OrderConfirmationInput

### Community 178 - "Tier"
Cohesion: 0.40
Nodes (5): GuildRow, GuildRow, Guild, DashboardGuild, Tier

### Community 179 - "migrate-stats-ignored.js"
Cohesion: 0.50
Nodes (4): APPLY, main(), mysql, parseKeys()

### Community 180 - "DashboardDomainCard"
Cohesion: 0.67
Nodes (3): DashboardDomainCard(), call(), say()

## Knowledge Gaps
- **718 isolated node(s):** `Tier`, `TIER_LABELS`, `TIER_ORDER`, `AuditEntry`, `BanEntry` (+713 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `legalReceipts.ts`, `data/route.ts`, `session.ts`, `ticketbot/stats/StatsClient.tsx`, `imageUploads.ts`, `imageSyncCheck.ts`, `admin/page.tsx`, `adminApi.ts`, `adminImages.ts`, `adminImageFiles.test.ts`, `botProvision.ts`, `adminPerms.ts`, `domain/route.ts`, `images.ts`, `adminImageStats.test.ts`, `[guildId]/route.ts`, `writeAudit`, `transcript/upload/route.ts`, `publicImageApi.test.ts`, `discord-verify/callback/route.ts`, `NewsPopupTab.tsx`, `imagePipeline.ts`, `ticketbot/dashboard/page.tsx`, `stripe/route.ts`, `legalForms.ts`, `dashboard-host/route.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `queryOne()` connect `query` to `session.ts`, `ticketbot/stats/StatsClient.tsx`, `imageUploads.ts`, `admin/page.tsx`, `i18n.ts`, `adminImages.ts`, `adminImageFiles.test.ts`, `botProvision.ts`, `adminPerms.ts`, `domain/route.ts`, `images.ts`, `adminImageStats.test.ts`, `[guildId]/route.ts`, `transcript/upload/route.ts`, `publicImageApi.test.ts`, `NewsPopupTab.tsx`, `imagePipeline.ts`, `stripe/route.ts`, `Card.tsx`, `URL Shortener API`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `Lang` connect `i18n.ts` to `cn`, `app/layout.tsx`, `useLang`, `ticketbot/stats/StatsClient.tsx`, `jsonLd.ts`, `Catalog.tsx`, `giveaway/dashboard/DashboardClient.tsx`, `CustomPackageCard.tsx`, `ResourcesClient.tsx`, `images.ts`, `lib/tebex.ts`, `getRequestLang`, `BotConfigEditor.tsx`, `TranscriptsCard.tsx`, `ticketbot-copy.ts`, `packages/[id]/page.tsx`, `Package Browser Filtering`, `GiveawayLanding.tsx`, `LocaleLink.tsx`, `TicketBotLanding.tsx`, `botSeo.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `Tier`, `TIER_LABELS`, `TIER_ORDER` to the rest of the system?**
  _718 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `data/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._
- **Should `getClientIp` be split into smaller, more focused modules?**
  _Cohesion score 0.12560386473429952 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._