# Graph Report - msk-shop-giveaway  (2026-10-28)

## Corpus Check
- 552 files · ~389,975 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3559 nodes · 10810 edges · 193 communities (157 shown, 24 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `90bb57eb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- legalReceipts.ts
- productView.ts
- getClientIp
- devDependencies
- ImagesArea.tsx
- dependencies
- Design System: MSK Scripts Shop
- fivestats.ts
- compilerOptions
- routes.ts
- cn
- scripts/deploy.sh (Server Deploy Script)
- imageUploads.ts
- Tebex API Reference (5 HTTP APIs)
- sitemap.ts
- ticketBotApi.ts
- giveawayHref
- adminImages.ts
- botDashboardProxy.ts
- domain/route.ts
- DomainsArea.tsx
- (site)/page.tsx
- ticket-bot/OverviewArea.tsx
- botProvision.ts
- getRequestLang
- adminNavLocked.test.ts
- useAdminCopy
- (panel)/sectionPage.tsx
- GiveawayActions.tsx
- package.json
- Footer.tsx
- CouponsArea.tsx
- scripts
- PackagesArea.tsx
- LangProvider.tsx
- TranscriptsArea.tsx
- writeAudit
- Privacy Policy (EN)
- legalForms.ts
- Hosted Bot Management Service
- MSK Scripts Social/OpenGraph Banner
- stripe-reconcile.js
- newsPopup.ts
- Terms & Conditions (EN)
- i18n.ts
- MSK Giveaway Bot Marketing Banner
- cleanup.js
- Lang
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
- TicketBotLanding.tsx
- msk_core Marketing Banner
- msk_enginetoggle Marketing Banner
- msk_garage Marketing Banner
- BansArea.tsx
- msk_givevehicle Marketing Banner
- MSK.DOCS Official Documentation Banner
- health/route.ts
- images.ts
- Push to Codeberg Job
- Kanbanly Marketing Banner (dark, 1200x630 OG-style)
- MSK Scripts Logo (green M mark)
- MSK Paste (Self-hosted Pastebin)
- MSK Giveaway Bot
- MSK Scripts Shop (headless storefront)
- MSK Shortener Hero Screenshot
- images/upload/route.ts
- Coverage Job
- lib/auth.ts
- deploy.sh
- vhost-create.sh
- loadGuilds.ts
- lib/tebex.ts
- ticket-bot/stats/StatsClient.tsx
- adminUi.tsx
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
- GiftCardsArea.tsx
- tebex-stats.js
- authorizeGuild
- Button.tsx
- publicPath
- stripe/route.ts
- MSKanban README/Banner Image
- routeGuards.test.ts
- index.tsx
- adminOverview.test.ts
- Operations
- schema.sql
- Development
- EmbedPreview.tsx
- botSeo.ts
- sitemap.xsl/route.ts
- ApiKeysArea.tsx
- giveawayModel.ts
- image-ingest.js
- giveawaySession.ts
- MSK Ticket Bot Transcript Service
- adminApi.ts
- [server]/sectionPage.tsx
- NewsPopupArea.tsx
- ThemeProvider.tsx
- [guildId]/route.ts
- imagePipeline.ts
- GiveawaysArea.tsx
- adminFixtures.ts
- db.ts
- Data Processing Agreement (AVV)
- Vereinbarung zur Auftragsverarbeitung (AVV)
- proxy.ts
- fillCopy
- query
- peds.js
- imageSyncCheck.ts
- tiers.ts
- PaymentsArea.tsx
- image-pedshot-prepare.js
- HistoryChart.tsx
- CI Workflow (msk-shop)
- trialEnding.ts
- image-sync-check.js
- items.js
- Data Collected by the Transcript Service
- Withdrawal Instructions
- Widerrufsbelehrung
- vehicles.js
- data/route.ts
- image-label-import.js
- Label-Generatoren
- sendMail
- sharp
- bot-vhost-create.sh
- msk-cron.sh
- TeamArea.tsx
- react-dom
- giveaway/auth/callback/route.ts
- ticketbotStats.ts
- bot-vhost-delete.sh
- Pricing migration, 2026-09-19
- giveawayStats.ts
- HostingSetup.tsx
- a11yPreferences.test.ts
- cart/page.tsx
- softNotFound.test.ts
- [slug]/page.tsx
- @phosphor-icons/react
- discordPermissions.test.ts
- react
- migrate-stats-ignored.js
- Admin dashboard
- (site)/layout.tsx
- 003-site-settings.sql
- customDomain.ts
- adminAreas.test.ts
- adminImageFiles.test.ts
- TemplatesArea.tsx
- packageFacets.ts
- Features
- Datenbank-Migrationen
- dashboard/layout.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 122 edges
2. `Lang` - 104 edges
3. `getRequestLang()` - 103 edges
4. `useLang()` - 99 edges
5. `query()` - 88 edges
6. `Button` - 73 edges
7. `publicPath()` - 73 edges
8. `useAdminCopy()` - 70 edges
9. `LocaleLink()` - 65 edges
10. `fillCopy()` - 59 edges

## Surprising Connections (you probably didn't know these)
- `html()` --indirect_call--> `LangProvider()`  [INFERRED]
  tests/ticketBotServerScope.test.ts → components/i18n/LangProvider.tsx
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `NotFound()` --calls--> `getRequestLang()`  [EXTRACTED]
  app/[lang]/(site)/not-found.tsx → lib/serverLang.ts
- `StatusBadge()` --calls--> `cn()`  [EXTRACTED]
  app/[lang]/(site)/tools/images/upload/UploadClient.tsx → lib/utils.ts
- `save()` --indirect_call--> `draft()`  [INFERRED]
  app/[lang]/admin/NewsPopupArea.tsx → tests/giveawayApi.test.ts

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

## Communities (193 total, 24 thin omitted)

### Community 0 - "legalReceipts.ts"
Cohesion: 0.17
Nodes (31): dynamic, POST(), dynamic, POST(), badRequest(), clientIpOrNull(), deliverReceipts(), mailLangFrom() (+23 more)

### Community 1 - "productView.ts"
Cohesion: 0.05
Nodes (73): AdminPackage, CategoryPage(), generateMetadata(), revalidate, Catalog(), scripts(), ProductBuyBox(), ProductPage() (+65 more)

### Community 2 - "getClientIp"
Cohesion: 0.12
Nodes (30): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+22 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+19 more)

### Community 4 - "ImagesArea.tsx"
Cohesion: 0.09
Nodes (27): FilterChips(), AdminImage, CategoryStat, Filter, ImageFigures, ImageList, imageListUrl(), ImageQuery (+19 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (27): clsx, @fontsource-variable/archivo, @fontsource-variable/source-sans-3, mysql2, next-themes, nodemailer, dependencies, clsx (+19 more)

### Community 6 - "Design System: MSK Scripts Shop"
Cohesion: 0.10
Nodes (21): Accessibility, Adding a colour, Adding an icon, Base (`components/ui`), Colour, Components, Contrast, Dashboards (`components/dashboard`) (+13 more)

### Community 7 - "fivestats.ts"
Cohesion: 0.10
Nodes (28): dynamic, GET(), ResourcesPage(), ProofLine(), RESOURCE_STATS, RESOURCE_STATS_GAME, RESOURCE_STATS_HEADLINE, RESOURCE_STATS_PERIOD_HOURS (+20 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "routes.ts"
Cohesion: 0.09
Nodes (41): LANGS, ProductIndex, productTarget, chooseRootLang(), comparePatterns(), EXEMPT_EXACT, EXEMPT_PREFIXES, fill() (+33 more)

### Community 10 - "cn"
Cohesion: 0.08
Nodes (47): VerifyClient(), VerifyClient(), CheckoutContent(), ShopSignIn(), ServerSwitcher(), ServerSwitcherCopy, SwitcherServer, useLang() (+39 more)

### Community 11 - "scripts/deploy.sh (Server Deploy Script)"
Cohesion: 0.16
Nodes (14): CI Job: Build, Dependabot Secret Fallback Placeholders, cleanup.js Cron auf /opt/msk-shop/scripts/, scripts/deploy.sh (Server Deploy Script), Deploy Workflow (workflow_run nach grünem CI), /opt/msk-shop/.env.local Build-Variablen, ForceCommand-gepinnter Action-Key, Benötigte GitHub-Secrets (DEPLOY_* + Build-Variablen) (+6 more)

### Community 12 - "imageUploads.ts"
Cohesion: 0.11
Nodes (29): dynamic, GET, dynamic, failureResponse(), POST, buildVariants(), trimAndPad(), approveUpload() (+21 more)

### Community 13 - "Tebex API Reference (5 HTTP APIs)"
Cohesion: 0.15
Nodes (17): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+9 more)

### Community 14 - "sitemap.ts"
Cohesion: 0.14
Nodes (19): dynamic, GET, generateStaticParams(), GET(), revalidate, GET(), revalidate, productUpdatedAt() (+11 more)

### Community 15 - "ticketBotApi.ts"
Cohesion: 0.18
Nodes (25): BotAddress(), launchFallback(), setupAddress(), ApiResult, botAction, dashboardDomain(), DashboardDomainAnswer, fetchBotLogs() (+17 more)

### Community 16 - "giveawayHref"
Cohesion: 0.12
Nodes (32): act(), remove(), saveTemplate(), browserZone(), draftErrorText(), focusFirstInvalid(), GiveawayForm(), pickTemplate() (+24 more)

### Community 17 - "adminImages.ts"
Cohesion: 0.11
Nodes (29): DELETE, dynamic, moveFailure(), PATCH, ADMIN_IMAGE_FILTERS, AdminImage, AdminImageCategoryStat, AdminImageFilter (+21 more)

### Community 18 - "botDashboardProxy.ts"
Cohesion: 0.11
Nodes (28): bounce(), DELETE, dynamic, GET, handle(), HEAD, HOP_BY_HOP, OPTIONS (+20 more)

### Community 19 - "domain/route.ts"
Cohesion: 0.14
Nodes (36): dynamic, execAsync, POST(), runtime, activate(), DELETE(), dynamic, execAsync (+28 more)

### Community 20 - "DomainsArea.tsx"
Cohesion: 0.10
Nodes (19): DnsSteps(), ActiveDomain(), DashboardDomainCard(), call(), remove(), say(), firstTierWith(), Message (+11 more)

### Community 21 - "(site)/page.tsx"
Cohesion: 0.15
Nodes (16): AboutPage(), HomePage(), cheapestScript(), AboutFigure, aboutFigures(), countUrls(), loadDocPageCount(), NOTE: server module. No secret behind it, the sitemap is public -- but (+8 more)

### Community 22 - "ticket-bot/OverviewArea.tsx"
Cohesion: 0.09
Nodes (35): Flash, BotControl(), confirmStop(), runAction(), runUpdate(), Msg, botIsDown(), BotStatus (+27 more)

### Community 23 - "botProvision.ts"
Cohesion: 0.09
Nodes (50): dynamic, GET(), POST(), runtime, dynamic, POST(), runtime, dynamic (+42 more)

### Community 24 - "getRequestLang"
Cohesion: 0.07
Nodes (64): generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), dynamic, generateMetadata() (+56 more)

### Community 25 - "adminNavLocked.test.ts"
Cohesion: 0.08
Nodes (35): AdminClient(), AdminShell(), ICONS, permissionList(), AttentionItem, Key, ListChecks, Megaphone (+27 more)

### Community 26 - "useAdminCopy"
Cohesion: 0.21
Nodes (18): LockedArea(), useAdminCopy(), ApiKeysArea(), AuditArea(), BansArea(), CouponsArea(), GiftCardsArea(), ImagesArea() (+10 more)

### Community 27 - "(panel)/sectionPage.tsx"
Cohesion: 0.06
Nodes (34): NewGiveawayPage(), GiveawayShell(), dynamic, generateMetadata(), dynamic, generateMetadata(), dynamic, generateMetadata() (+26 more)

### Community 28 - "GiveawayActions.tsx"
Cohesion: 0.09
Nodes (42): DialogKind, GiveawayActions(), extend(), ActionResult, changeGiveaway(), clearTebexSecret(), createGiveaway(), DashboardBundle (+34 more)

### Community 29 - "package.json"
Cohesion: 0.17
Nodes (11): engines, node, license, name, overrides, eslint, js-yaml, postcss (+3 more)

### Community 30 - "Footer.tsx"
Cohesion: 0.14
Nodes (11): GithubMark(), Receipt, Scales, ColumnLink(), Footer(), footerColumns(), FooterLink, trustItems() (+3 more)

### Community 31 - "CouponsArea.tsx"
Cohesion: 0.11
Nodes (30): AreaLoad(), Coupon, couponColumns(), CouponErrors, CouponPayload, CouponState, CouponsView(), STATE_TONE (+22 more)

### Community 32 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:coverage, test:watch (+1 more)

### Community 33 - "PackagesArea.tsx"
Cohesion: 0.21
Nodes (12): updatePackage(), NoneText(), EditPackageDialog(), submit(), packageColumns(), PackagesView(), ProductRow, productRows() (+4 more)

### Community 34 - "LangProvider.tsx"
Cohesion: 0.12
Nodes (24): CancellationClient(), Done, Done, ReportClient(), WithdrawalPage(), Done, WithdrawalClient(), FALLBACK (+16 more)

### Community 35 - "TranscriptsArea.tsx"
Cohesion: 0.11
Nodes (14): DomainsArea(), DOCS_URL, TRANSCRIPT_PAGE_SIZE, TranscriptItem, TranscriptQuery, EMPTY_QUERY, safeUrl(), transcriptColumns() (+6 more)

### Community 36 - "writeAudit"
Cohesion: 0.12
Nodes (22): DELETE, dynamic, POST, DELETE, dynamic, PUT, dynamic, PUT (+14 more)

### Community 37 - "Privacy Policy (EN)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

### Community 38 - "legalForms.ts"
Cohesion: 0.15
Nodes (17): CancellationFields, CancellationKind, clean(), cleanMultiline(), FieldErrors, MAX_CONTRACT, MAX_EMAIL, MAX_NAME (+9 more)

### Community 39 - "Hosted Bot Management Service"
Cohesion: 0.25
Nodes (9): Attachment Storage (Premium and Premium+), Hosted Bot Management Data and Access Control, Storage Period Table, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials, Hosted Bot Customer Responsibilities, Hosted Bot Management Service, Hosting Termination and 14-Day Deletion (+1 more)

### Community 40 - "MSK Scripts Social/OpenGraph Banner"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "stripe-reconcile.js"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "newsPopup.ts"
Cohesion: 0.22
Nodes (13): dynamic, GET, PUT, isAllowedHref(), NEWS_POPUP_DEFAULT, NEWS_POPUP_LIMITS, NewsPopupButton, NewsPopupSettings (+5 more)

### Community 43 - "Terms & Conditions (EN)"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "i18n.ts"
Cohesion: 0.12
Nodes (24): imageSrc(), Tool(), ToolsPage(), About(), Bots, FreeScripts(), Hero(), Section() (+16 more)

### Community 45 - "MSK Giveaway Bot Marketing Banner"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "cleanup.js"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "Lang"
Cohesion: 0.11
Nodes (24): ArrowDown, CaretLeft, DownloadSimple, MagnifyingGlassPlus, ShoppingCart, Storefront, AddToCartButton(), readStoredDiscordId() (+16 more)

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

### Community 62 - "TicketBotLanding.tsx"
Cohesion: 0.05
Nodes (59): OrderSummary(), Props, PaidTier, BotsOverview(), COMMAND_NAMES, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, HUB_HREFS (+51 more)

### Community 63 - "msk_core Marketing Banner"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, Core Framework / Core Library Claim, ESX Framework Support, MSK Scripts Brand Identity (green M mark, dark theme), MSK.CORE (msk_core), QBCore Framework Support

### Community 64 - "msk_enginetoggle Marketing Banner"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, ESX Framework Support, Manual Engine Control for Vehicle Roleplay, MSK Scripts Brand Identity (Green M Logo, Dark Theme), msk_enginetoggle (Vehicle System Script), QBCore Framework Support

### Community 65 - "msk_garage Marketing Banner"
Cohesion: 0.60
Nodes (6): msk_garage Marketing Banner, ESX Framework Support, Full Garage Management, MSK Scripts Brand Identity (M logo, dark green), MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage

### Community 66 - "BansArea.tsx"
Cohesion: 0.23
Nodes (10): createBan(), Ban, banColumns(), BanErrors, BansView(), CreateBanForm(), ban(), playerOf() (+2 more)

### Community 67 - "msk_givevehicle Marketing Banner"
Cohesion: 0.53
Nodes (6): msk_givevehicle Marketing Banner, MSK Scripts Brand Identity (M logo, green-on-dark), ESX Framework Support Badge, msk_givevehicle (FiveM Admin Tool), QBCore Framework Support Badge, Claim: Spawn & gift any vehicle to players in seconds

### Community 68 - "MSK.DOCS Official Documentation Banner"
Cohesion: 0.60
Nodes (6): API Reference, MSK.DOCS Official Documentation Banner, Dark Green Tech Visual Style (monospace uppercase, accent green), MSK.DOCS (docu.msk-scripts.de), MSK Scripts Brand Identity (green M monogram), Setup Guides & Configs

### Community 69 - "health/route.ts"
Cohesion: 0.33
Nodes (4): dynamic, IncidentsResponse, SEVERITY, StatusResponse

### Community 70 - "images.ts"
Cohesion: 0.10
Nodes (33): GET(), OPTIONS, revalidate, GET(), OPTIONS, revalidate, GET(), OPTIONS (+25 more)

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
Cohesion: 0.19
Nodes (14): Code of Conduct (Contributor Covenant), Contributing Guide, Pull Request Template, Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version), MSK Source Available License (MSK-SAL v1.0), Protected Components (Verify System, Dashboard, Shop/Website Design), Server-side git deploy (CI-gated) (+6 more)

### Community 77 - "MSK Shortener Hero Screenshot"
Cohesion: 0.67
Nodes (4): Dark Theme with MSK Green Accent Headline, MSK Shortener Hero Screenshot, Long URL Input Form Card, MSK URL Shortener (privacy-friendly, no signup)

### Community 78 - "images/upload/route.ts"
Cohesion: 0.14
Nodes (16): GET(), dynamic, dynamic, GET(), POST(), MAX_UPLOAD_BYTES, recentUploadCount(), uploadCategories() (+8 more)

### Community 79 - "Coverage Job"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 81 - "deploy.sh"
Cohesion: 0.70
Nodes (4): db(), env_value(), run_as_app_user(), deploy.sh script

### Community 87 - "loadGuilds.ts"
Cohesion: 0.08
Nodes (31): GET(), GuildRow, loadTicketBotGuilds, loadTicketBotServer(), dynamic, metadata, TicketBotDashboardEntry(), TicketBotServerLayout() (+23 more)

### Community 88 - "lib/tebex.ts"
Cohesion: 0.17
Nodes (17): SignInReturn(), canAddToBasket(), addGiftToBasket(), addToBasket(), applyCoupon(), createBasket(), getAllAuthUrls(), getBasket() (+9 more)

### Community 90 - "ticket-bot/stats/StatsClient.tsx"
Cohesion: 0.15
Nodes (17): StatsClient(), formatBytes(), StatsClient(), TIER_ITEMS, Props, Crumb, Breakdown(), BreakdownItem (+9 more)

### Community 91 - "adminUi.tsx"
Cohesion: 0.12
Nodes (15): revealValue(), ADMIN_GUIDE_URL, Catalog, CatalogItem, ChipOption, ConfirmAction(), FIELD_NAME, PAGE_SIZE (+7 more)

### Community 101 - "contrast.test.ts"
Cohesion: 0.14
Nodes (14): channels(), contrast(), CSS, dark, light, linear(), LINES_ONLY, luminance() (+6 more)

### Community 102 - "localeLinks.test.ts"
Cohesion: 0.50
Nodes (4): ALLE, DARF_NEXT_LINK, dateien(), WURZELN

### Community 103 - "GiftCardsArea.tsx"
Cohesion: 0.09
Nodes (29): addTeamMember(), ADMIN_URL, AdminRequestError, createGiftCard(), decideUpload(), deleteCoupon(), deleteImage(), lookupPlayer() (+21 more)

### Community 104 - "tebex-stats.js"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "authorizeGuild"
Cohesion: 0.12
Nodes (23): dynamic, GET(), runtime, checkDns(), execFileAsync, POST(), checkDns(), execFileAsync (+15 more)

### Community 106 - "Button.tsx"
Cohesion: 0.06
Nodes (37): dynamic, Props, StepIndicator(), TIER_LABELS, dynamic, Params, revalidate, Params (+29 more)

### Community 107 - "publicPath"
Cohesion: 0.09
Nodes (35): GET(), POST(), loadGiveawaySession, dynamic, GiveawayPanelLayout(), AccountPage(), botSessions(), formatBytes() (+27 more)

### Community 108 - "stripe/route.ts"
Cohesion: 0.16
Nodes (27): CustomerRow, POST(), applySubscription(), downgradeGuild(), GuildIdRow, GuildNameRow, handleTrialWillEnd(), POST() (+19 more)

### Community 112 - "routeGuards.test.ts"
Cohesion: 0.16
Nodes (10): API_DIR, DB_MODULES, DB_ROUTES, GUARDS, key(), LIB_DIR, LIB_SOURCES, libImports() (+2 more)

### Community 113 - "index.tsx"
Cohesion: 0.03
Nodes (84): AdminError(), ICONS, Guild, ICONS, dynamic, GiveawayResultPage(), metadata, parseWinners() (+76 more)

### Community 114 - "adminOverview.test.ts"
Cohesion: 0.10
Nodes (26): GET, dynamic, GET, GET, adminImageStats(), round2(), summarizePayments(), countPendingUploads() (+18 more)

### Community 115 - "Operations"
Cohesion: 0.22
Nodes (8): CI/CD, auto deploy, Manual Installation, Operations, Required GitHub Secrets, Requirements, Steps, Troubleshooting, Updating (manual)

### Community 116 - "schema.sql"
Cohesion: 0.12
Nodes (18): giveaway_results, msk_admin_audit, msk_admin_team, msk_cancellations, msk_content_reports, msk_image_categories, msk_image_uploads, msk_images (+10 more)

### Community 117 - "Development"
Cohesion: 0.22
Nodes (9): Configuration, Database, Design and styling, Development, Migrations, Products, Project Structure, Security (+1 more)

### Community 118 - "EmbedPreview.tsx"
Cohesion: 0.16
Nodes (16): embedColor(), inline(), MarkupNode, parseMarkup(), TOKEN, BUTTON_STYLE, DiscordText(), JoinButton() (+8 more)

### Community 119 - "botSeo.ts"
Cohesion: 0.08
Nodes (37): generateMetadata(), GiveawayPage(), generateMetadata(), TicketBotComparePage(), generateMetadata(), TicketBotPage(), GiveawayLanding(), TicketBotCompare() (+29 more)

### Community 121 - "ApiKeysArea.tsx"
Cohesion: 0.09
Nodes (27): updateApiKey(), AreaHeader(), pageOf(), Pager(), ApiKeyCell(), apiKeyColumns(), ApiKeysView(), EditApiKeyDialog() (+19 more)

### Community 123 - "giveawayModel.ts"
Cohesion: 0.13
Nodes (31): MarkupContext, Channel, clampBonus(), couponAndConditions(), couponPayload(), createBody(), DELETABLE, draftOf() (+23 more)

### Community 124 - "image-ingest.js"
Cohesion: 0.19
Nodes (16): buildVariants(), CATEGORY_RULES, crypto, fs, main(), mysql, normaliseName(), parseArgs() (+8 more)

### Community 125 - "giveawaySession.ts"
Cohesion: 0.15
Nodes (16): POST(), BotGuild, dynamic, GiveawayVerifyPage(), metadata, Envelope, getSecret(), GIVEAWAY_SESSION_COOKIE (+8 more)

### Community 126 - "MSK Ticket Bot Transcript Service"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 127 - "adminApi.ts"
Cohesion: 0.10
Nodes (28): dynamic, GET(), dynamic, GET, POST, TeamRow, AdminArea(), AdminPage() (+20 more)

### Community 128 - "[server]/sectionPage.tsx"
Cohesion: 0.14
Nodes (14): dynamic, generateMetadata(), dynamic, generateMetadata(), dynamic, generateMetadata(), sectionCopy(), ticketBotSectionMetadata() (+6 more)

### Community 129 - "NewsPopupArea.tsx"
Cohesion: 0.18
Nodes (13): saveNewsPopup(), ButtonDraft, buttonErrors(), fromButton(), fromDraft(), NewsPopupDraft, NewsPopupEditor(), save() (+5 more)

### Community 130 - "ThemeProvider.tsx"
Cohesion: 0.47
Nodes (3): NextThemesProviderProps, Props, ThemeProvider()

### Community 131 - "[guildId]/route.ts"
Cohesion: 0.21
Nodes (12): dynamic, ExistingRow, PATCH, VALID_TIERS, dynamic, GuildRow, ApiKeyRow, isKeyOrigin() (+4 more)

### Community 132 - "imagePipeline.ts"
Cohesion: 0.14
Nodes (18): moveAdminImage(), ACCEPTED_INPUT_FORMATS, cdnRootPath(), copyVariants(), deleteVariants(), normaliseName(), PIPELINE_RULES, variantFiles() (+10 more)

### Community 133 - "GiveawaysArea.tsx"
Cohesion: 0.06
Nodes (53): auditColumns(), auditSentence(), parseDetail(), EmbedCard(), renderNode(), FirstClickTag(), DeletionInfo, extraOf() (+45 more)

### Community 134 - "adminFixtures.ts"
Cohesion: 0.12
Nodes (18): ago(), auditRows, bans, coupon(), coupons, EMAILS, EUR, giftCards (+10 more)

### Community 135 - "db.ts"
Cohesion: 0.11
Nodes (23): dynamic, loadValue(), NO_STORE, POST, text(), dynamic, extractApiKey(), GET() (+15 more)

### Community 136 - "Data Processing Agreement (AVV)"
Cohesion: 0.17
Nodes (11): 10. Liability and final provisions, 1. Subject matter and duration, 2. Nature and purpose of the processing, categories of data, data subjects, 3. Instructions, 4. Obligations of MSK Scripts, 5. Obligations of the controller, 6. Technical and organisational measures (Art. 32 GDPR), 7. Sub-processors (+3 more)

### Community 137 - "Vereinbarung zur Auftragsverarbeitung (AVV)"
Cohesion: 0.17
Nodes (11): 10. Haftung und Schlussbestimmungen, 1. Gegenstand und Dauer, 2. Art und Zweck der Verarbeitung, Datenkategorien, Betroffene, 3. Weisungen, 4. Pflichten von MSK Scripts, 5. Pflichten des Auftraggebers, 6. Technische und organisatorische Maßnahmen (Art. 32 DSGVO), 7. Unterauftragsverarbeiter (+3 more)

### Community 138 - "proxy.ts"
Cohesion: 0.10
Nodes (27): generateMetadata(), RootLayout(), siteMetadata, viewport, UnknownPage(), DEFAULT_LANG, isLang(), LANG_HEADER (+19 more)

### Community 139 - "fillCopy"
Cohesion: 0.23
Nodes (12): updateImage(), EditImageDialog(), submit(), imageColumns(), ImageFiguresView(), ImagesInventory(), remove(), setStatus() (+4 more)

### Community 140 - "query"
Cohesion: 0.11
Nodes (29): dynamic, POST(), runtime, authorized(), POST(), ResultRow, WinnerIn, AttachmentInput (+21 more)

### Community 141 - "peds.js"
Cohesion: 0.20
Nodes (10): ALTER, dump, fs, GESCHLECHT_AUS_TYP, GRUPPE, [quelle, ziel], raus, ROLLE (+2 more)

### Community 142 - "imageSyncCheck.ts"
Cohesion: 0.29
Nodes (8): dynamic, GET, cdnRoot(), DERIVATIVES, listFiles(), runSyncCheck(), SyncCheckCategory, SyncCheckResult

### Community 143 - "tiers.ts"
Cohesion: 0.09
Nodes (26): dynamic, GET(), GET(), GuildRow, GuildRow, POST(), generateApiKey(), GuildRow (+18 more)

### Community 144 - "PaymentsArea.tsx"
Cohesion: 0.14
Nodes (21): createCoupon(), givePackage(), useCatalog(), CreateCouponForm(), submit(), filterPayments(), GiveErrors, GivePackageDialog() (+13 more)

### Community 145 - "image-pedshot-prepare.js"
Cohesion: 0.36
Nodes (8): fs, fuelleLoecher(), groesstenBereichBehalten(), main(), maskiere(), parseArgs(), path, sharp

### Community 146 - "HistoryChart.tsx"
Cohesion: 0.23
Nodes (12): HISTORY_RANGES, HistoryDay, HistoryRange, HistoryCard(), pick(), historySentence(), historySummary(), HistoryTable() (+4 more)

### Community 147 - "CI Workflow (msk-shop)"
Cohesion: 0.24
Nodes (10): CI Job: Audit (production tree), CI Workflow (msk-shop), CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck, brace-expansion Advisory GHSA-mh99-v99m-4gvg (dev-only), minimatch@3 Pin der ESLint-Plugins (+2 more)

### Community 148 - "trialEnding.ts"
Cohesion: 0.24
Nodes (11): buildOrderConfirmation(), BuiltEmail, escapeHtml(), formatDate(), OrderConfirmationInput, buildTrialEndingEmail(), BuiltEmail, escapeHtml() (+3 more)

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

### Community 155 - "data/route.ts"
Cohesion: 0.14
Nodes (20): ACTION_PATH, OWNER_ACTIONS, POST(), ALLOWED, GwListItem, HISTORY_DAYS, KIND_PATH, OWNER_KINDS (+12 more)

### Community 156 - "image-label-import.js"
Cohesion: 0.50
Nodes (4): fs, main(), mysql, toTagList()

### Community 157 - "Label-Generatoren"
Cohesion: 0.40
Nodes (4): Die Quellen, Label-Generatoren, Warum sie hier liegen, Was der Import garantiert

### Community 158 - "sendMail"
Cohesion: 0.27
Nodes (9): forLog(), getTransporter(), MailConfig, mailConfigFromEnv(), MailMessage, sendMail(), capture(), CR (+1 more)

### Community 162 - "TeamArea.tsx"
Cohesion: 0.17
Nodes (16): removeTeamMember(), updateTeamMember(), FlashMessage, MemberEditor(), save(), nameOf(), PERMISSION_GROUPS, teamColumns() (+8 more)

### Community 164 - "giveaway/auth/callback/route.ts"
Cohesion: 0.22
Nodes (12): GET(), fetchGuildMemberRoles(), fetchUserGuilds(), RawGuild, UserGuilds, getGiveawayPool(), giveawayQuery(), resolveManagerGuilds() (+4 more)

### Community 165 - "ticketbotStats.ts"
Cohesion: 0.18
Nodes (12): dynamic, GET(), StatsPage(), AvgRow, CountRow, EMPTY_STATS, loadTicketbotStats(), MaxRow (+4 more)

### Community 168 - "Pricing migration, 2026-09-19"
Cohesion: 0.20
Nodes (9): 1. Before anything else: find guilds that would lose hosting, 2. Stripe: six prices, created 2026-09-19, 3. The three old prices are still active, 4. Server: `.env.local`, 5. Deploy and check, Pricing migration, 2026-09-19, Status, What changed in the code (+1 more)

### Community 169 - "giveawayStats.ts"
Cohesion: 0.20
Nodes (11): dynamic, GET(), GiveawayStatsPage(), giveawayQueryOne(), CountRow, EMPTY_GIVEAWAY_STATS, GiveawayStats, GroupRow (+3 more)

### Community 170 - "HostingSetup.tsx"
Cohesion: 0.10
Nodes (24): HostingArea(), BotArchive, EnvValues, errorText(), FIELD_OF_ERROR, HostingJob, HostingSetup(), submit() (+16 more)

### Community 172 - "cart/page.tsx"
Cohesion: 0.20
Nodes (16): CartPage(), CartDrawer(), CartLineList(), CartSummary(), CouponField(), ShoppingBag, X, LinkedText() (+8 more)

### Community 174 - "[slug]/page.tsx"
Cohesion: 0.18
Nodes (16): AllAccessPage(), generateMetadata(), revalidate, subscription(), generateMetadata(), generateStaticParams(), isMarkedUnknown(), productFor() (+8 more)

### Community 176 - "discordPermissions.test.ts"
Cohesion: 0.36
Nodes (5): ADMINISTRATOR, canManageGuild(), MANAGE_GUILD, SEND_MESSAGES, VIEW_CHANNEL

### Community 179 - "migrate-stats-ignored.js"
Cohesion: 0.50
Nodes (4): APPLY, main(), mysql, parseKeys()

### Community 180 - "Admin dashboard"
Cohesion: 0.12
Nodes (16): Access and permissions, Admin dashboard, API keys, Audit log, Bans, Coupons, Gift cards, Images (+8 more)

### Community 181 - "(site)/layout.tsx"
Cohesion: 0.22
Nodes (8): SiteLayout(), SalePriceFetcher(), DisplayPrice, resolveDisplayPrice(), SaleData, isBotPath(), SalePricesStore, useSalePricesStore

### Community 184 - "customDomain.ts"
Cohesion: 0.36
Nodes (5): execFileAsync, teardownCustomDomain(), ScopedGuildId, trustedGuildId(), TrustedGuildSource

### Community 186 - "adminAreas.test.ts"
Cohesion: 0.06
Nodes (51): AuditRow, dynamic, GET, maskedDetail(), dynamic, GET, POST, dynamic (+43 more)

### Community 187 - "adminImageFiles.test.ts"
Cohesion: 0.25
Nodes (4): CATEGORIES, mQuery, mQueryOne, Row

### Community 189 - "TemplatesArea.tsx"
Cohesion: 0.09
Nodes (53): PreviewPanel(), BonusEditor(), ChannelSelect(), DrawModeField(), DurationField(), FieldGroup(), MultiPicker(), NumberWithUnit() (+45 more)

### Community 190 - "packageFacets.ts"
Cohesion: 0.39
Nodes (6): ProductBrowser(), countBy(), Facet, matchesFrameworks(), PRODUCTS, visible()

### Community 192 - "Features"
Cohesion: 0.67
Nodes (3): Features, Features, Tiers (`lib/tiers.ts`)

### Community 194 - "Datenbank-Migrationen"
Cohesion: 0.67
Nodes (3): Datenbank-Migrationen, Regeln, Verhältnis zu `database/schema.sql`

## Knowledge Gaps
- **862 isolated node(s):** `dynamic`, `Done`, `dynamic`, `ResultRow`, `Winner` (+857 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1095 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `legalReceipts.ts`, `getClientIp`, `[guildId]/route.ts`, `imagePipeline.ts`, `db.ts`, `imageUploads.ts`, `imageSyncCheck.ts`, `tiers.ts`, `adminImages.ts`, `domain/route.ts`, `botProvision.ts`, `data/route.ts`, `writeAudit`, `ticketbotStats.ts`, `legalForms.ts`, `newsPopup.ts`, `customDomain.ts`, `adminAreas.test.ts`, `adminImageFiles.test.ts`, `images.ts`, `loadGuilds.ts`, `authorizeGuild`, `stripe/route.ts`, `adminOverview.test.ts`, `adminApi.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `Lang` connect `Lang` to `[server]/sectionPage.tsx`, `productView.ts`, `ImagesArea.tsx`, `GiveawaysArea.tsx`, `routes.ts`, `cn`, `proxy.ts`, `PaymentsArea.tsx`, `HistoryChart.tsx`, `DomainsArea.tsx`, `(site)/page.tsx`, `ticket-bot/OverviewArea.tsx`, `getRequestLang`, `adminNavLocked.test.ts`, `(panel)/sectionPage.tsx`, `Footer.tsx`, `CouponsArea.tsx`, `PackagesArea.tsx`, `LangProvider.tsx`, `TranscriptsArea.tsx`, `i18n.ts`, `cart/page.tsx`, `TemplatesArea.tsx`, `TicketBotLanding.tsx`, `BansArea.tsx`, `images.ts`, `loadGuilds.ts`, `lib/tebex.ts`, `ticket-bot/stats/StatsClient.tsx`, `adminUi.tsx`, `GiftCardsArea.tsx`, `Button.tsx`, `publicPath`, `index.tsx`, `EmbedPreview.tsx`, `botSeo.ts`, `ApiKeysArea.tsx`, `giveawayModel.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `publicPath()` connect `publicPath` to `[server]/sectionPage.tsx`, `productView.ts`, `getClientIp`, `routes.ts`, `query`, `botDashboardProxy.ts`, `trialEnding.ts`, `(site)/page.tsx`, `getRequestLang`, `(panel)/sectionPage.tsx`, `data/route.ts`, `LangProvider.tsx`, `giveaway/auth/callback/route.ts`, `i18n.ts`, `TicketBotLanding.tsx`, `images/upload/route.ts`, `loadGuilds.ts`, `Button.tsx`, `stripe/route.ts`, `botSeo.ts`, `adminApi.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `dynamic`, `Done`, `dynamic` to the rest of the system?**
  _862 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `productView.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.054901960784313725 - nodes in this community are weakly interconnected._
- **Should `getClientIp` be split into smaller, more focused modules?**
  _Cohesion score 0.11734693877551021 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._