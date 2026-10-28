# Graph Report - msk-shop-redesign  (2026-10-28)

## Corpus Check
- 437 files · ~311,705 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2763 nodes · 7003 edges · 170 communities (135 shown, 25 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 105 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac572740`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- legalForms.ts
- products.ts
- getClientIp
- devDependencies
- Card.tsx
- dependencies
- Design System: MSK Scripts Shop
- fivestats.ts
- compilerOptions
- routes.ts
- useLang
- scripts/deploy.sh (Server Deploy Script)
- imageUploads.ts
- Tebex API Reference (5 HTTP APIs)
- lib/tebex.ts
- admin/page.tsx
- giveaway-bot/DashboardClient.tsx
- adminImages.ts
- botproxy/route.ts
- publicPath
- productView.ts
- LegalContent.tsx
- [lang]/page.tsx
- botProvision.ts
- getRequestLang
- adminPerms.ts
- i18n.ts
- ticketbot-copy.ts
- authorizeGuild
- package.json
- ImagesTab.tsx
- [discordUserId]/route.ts
- scripts
- tiers.ts
- Button.tsx
- LangProvider.tsx
- adminApi.ts
- Privacy Policy (EN)
- BotDashboardAddress
- Hosted Bot Management Service
- MSK Scripts Social/OpenGraph Banner
- stripe-reconcile.js
- newsPopup.ts
- Terms & Conditions (EN)
- [id]/page.tsx
- MSK Giveaway Bot Marketing Banner
- cleanup.js
- ProductBrowser.tsx
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
- TranscriptsCard.tsx
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
- [guildId]/route.ts
- Coverage Job
- lib/auth.ts
- deploy.sh
- vhost-create.sh
- ApiKeysTab.tsx
- imagePipeline.ts
- renderMarkdown
- proxy.ts
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
- [category]/page.tsx
- dashboard/ticket-bot/page.tsx
- stripe/route.ts
- MSKanban README/Banner Image
- routeGuards.test.ts
- index.tsx
- domain/route.ts
- Operations
- schema.sql
- Development
- cn
- botSeo.ts
- sitemap.xsl/route.ts
- TicketBotCompare.tsx
- dashboard-host/route.ts
- image-ingest.js
- giveawaySession.ts
- MSK Ticket Bot Transcript Service
- price.ts
- robots.ts
- ThemeProvider.tsx
- discord-verify/callback/route.ts
- Colors
- images/upload/route.ts
- DashboardDomainCard
- HostingSetup.tsx
- Data Processing Agreement (AVV)
- Vereinbarung zur Auftragsverarbeitung (AVV)
- [lang]/layout.tsx
- ticketbotStats.ts
- sendMail
- peds.js
- imageSyncCheck.ts
- audit/route.ts
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
- softNotFound.test.ts
- migrate-stats-ignored.js
- 003-site-settings.sql

## God Nodes (most connected - your core abstractions)
1. `query()` - 84 edges
2. `getRequestLang()` - 84 edges
3. `cn()` - 81 edges
4. `Lang` - 64 edges
5. `useLang()` - 60 edges
6. `publicPath()` - 57 edges
7. `Button` - 47 edges
8. `pageSeo` - 44 edges
9. `queryOne()` - 43 edges
10. `Card` - 42 edges

## Surprising Connections (you probably didn't know these)
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `AccountPage()` --calls--> `getRequestLang()`  [EXTRACTED]
  app/[lang]/account/page.tsx → lib/serverLang.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/[lang]/discord/giveaway-bot/stats/StatsClient.tsx → lib/utils.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/[lang]/discord/ticket-bot/stats/StatsClient.tsx → lib/utils.ts
- `PATCH` --indirect_call--> `isAdminPermission()`  [INFERRED]
  app/api/admin/team/[discordUserId]/route.ts → lib/adminPerms.ts

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

## Communities (170 total, 25 thin omitted)

### Community 0 - "legalForms.ts"
Cohesion: 0.09
Nodes (53): dynamic, POST(), dynamic, POST(), badRequest(), clientIpOrNull(), deliverReceipts(), mailLangFrom() (+45 more)

### Community 1 - "products.ts"
Cohesion: 0.07
Nodes (43): Storefront, ProductBuyBox(), Props, BuyOption, optionFor(), CATEGORY_SEO, CATEGORY_VARIANT, FEATURED_PACKAGE_IDS (+35 more)

### Community 2 - "getClientIp"
Cohesion: 0.18
Nodes (19): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+11 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+21 more)

### Community 4 - "Card.tsx"
Cohesion: 0.10
Nodes (28): AuditEntry, AuditTab(), BanEntry, BansTab(), ErrorCard(), GiftCard, GiftCardsTab(), LookupPayment (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (27): clsx, @fontsource-variable/archivo, @fontsource-variable/source-sans-3, js-cookie, mysql2, nodemailer, dependencies, clsx (+19 more)

### Community 6 - "Design System: MSK Scripts Shop"
Cohesion: 0.10
Nodes (21): Badges, Buttons, Cards, Components, Design System: MSK Scripts Shop, Do:, Do's and Don'ts, Don't: (+13 more)

### Community 7 - "fivestats.ts"
Cohesion: 0.09
Nodes (31): dynamic, GET(), ResourcesPage(), RESOURCE_STATS, RESOURCE_STATS_GAME, RESOURCE_STATS_HEADLINE, RESOURCE_STATS_PERIOD_HOURS, ResourceStatEntry (+23 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "routes.ts"
Cohesion: 0.09
Nodes (37): ProductIndex, productTarget, comparePatterns(), EXEMPT_EXACT, EXEMPT_PREFIXES, fill(), FIVEM_PAGES, internalPath() (+29 more)

### Community 10 - "useLang"
Cohesion: 0.14
Nodes (27): CancellationClient(), ReportClient(), WithdrawalClient(), useLang(), LanguageDropdown(), LanguageLinks(), languages, rememberLanguage() (+19 more)

### Community 11 - "scripts/deploy.sh (Server Deploy Script)"
Cohesion: 0.12
Nodes (17): CI Job: Build, Dependabot Secret Fallback Placeholders, cleanup.js Cron auf /opt/msk-shop/scripts/, scripts/deploy.sh (Server Deploy Script), Deploy Workflow (workflow_run nach grünem CI), /opt/msk-shop/.env.local Build-Variablen, ForceCommand-gepinnter Action-Key, Benötigte GitHub-Secrets (DEPLOY_* + Build-Variablen) (+9 more)

### Community 12 - "imageUploads.ts"
Cohesion: 0.10
Nodes (33): GET, dynamic, failureResponse(), POST, dynamic, GET, STATUSES, categoryExists() (+25 more)

### Community 13 - "Tebex API Reference (5 HTTP APIs)"
Cohesion: 0.15
Nodes (17): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+9 more)

### Community 14 - "lib/tebex.ts"
Cohesion: 0.06
Nodes (44): dynamic, GET, dynamic, GET, CartPage(), CheckoutContent(), generateStaticParams(), GET() (+36 more)

### Community 15 - "admin/page.tsx"
Cohesion: 0.16
Nodes (15): dynamic, GET(), AdminPage(), dynamic, ERROR_MESSAGES, metadata, authorizeAdmin(), loadAdminMember() (+7 more)

### Community 16 - "giveaway-bot/DashboardClient.tsx"
Cohesion: 0.06
Nodes (53): BonusRoleEditor(), Channel, clampBonus(), CouponFields(), couponPayload(), CreateForm(), Ctx, Dict (+45 more)

### Community 17 - "adminImages.ts"
Cohesion: 0.12
Nodes (29): DELETE, dynamic, moveFailure(), PATCH, ADMIN_IMAGE_FILTERS, AdminImage, AdminImageCategoryStat, AdminImageFilter (+21 more)

### Community 18 - "botproxy/route.ts"
Cohesion: 0.10
Nodes (33): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+25 more)

### Community 19 - "publicPath"
Cohesion: 0.09
Nodes (30): dynamic, GiveawayDashboardPage(), metadata, formatBytes(), ImageDetailPage(), Params, revalidate, CopyUrlButton() (+22 more)

### Community 20 - "productView.ts"
Cohesion: 0.12
Nodes (37): AllAccessPage(), generateMetadata(), revalidate, subscription(), CataloguePage(), generateMetadata(), generateStaticParams(), isMarkedUnknown() (+29 more)

### Community 21 - "LegalContent.tsx"
Cohesion: 0.48
Nodes (4): Props, EN, legalNotice, LegalNoticeKind

### Community 22 - "[lang]/page.tsx"
Cohesion: 0.08
Nodes (31): HomePage(), About(), Bots, Catalog(), cheapestScript(), scripts(), FIVEM_SCRIPT_IDS, FreeScripts() (+23 more)

### Community 23 - "botProvision.ts"
Cohesion: 0.09
Nodes (50): dynamic, GET(), POST(), runtime, dynamic, POST(), runtime, dynamic (+42 more)

### Community 24 - "getRequestLang"
Cohesion: 0.10
Nodes (38): generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), dynamic, generateMetadata(), dynamic (+30 more)

### Community 25 - "adminPerms.ts"
Cohesion: 0.16
Nodes (19): dynamic, GET, POST, TeamRow, AdminClient(), Member, AdminAuthResult, AdminTeamRow (+11 more)

### Community 26 - "i18n.ts"
Cohesion: 0.14
Nodes (20): LangContextValue, keepAsIs(), LocaleLink(), ArrowRight, PackagePrice(), PriceSource, Props, Props (+12 more)

### Community 27 - "ticketbot-copy.ts"
Cohesion: 0.14
Nodes (15): CommandRow, de, en, GIVEAWAY_COPY, GiveawayCopy, de, en, LabelledText (+7 more)

### Community 28 - "authorizeGuild"
Cohesion: 0.12
Nodes (24): ALLOWED_ACTIONS, authHosted(), botDir(), execAsync, GET(), POST(), authHosted(), GET() (+16 more)

### Community 29 - "package.json"
Cohesion: 0.17
Nodes (11): engines, node, license, name, overrides, eslint, js-yaml, postcss (+3 more)

### Community 30 - "ImagesTab.tsx"
Cohesion: 0.08
Nodes (24): CatalogItem, Coupon, CouponPayload, CouponsTab(), CouponState, formatDate(), STATE_LABEL, AdminImage (+16 more)

### Community 31 - "[discordUserId]/route.ts"
Cohesion: 0.12
Nodes (20): GET, dynamic, GET, DELETE, dynamic, ownerFlag(), PATCH, adminImageStats() (+12 more)

### Community 32 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:coverage, test:watch (+1 more)

### Community 33 - "tiers.ts"
Cohesion: 0.13
Nodes (18): GuildRow, GuildRow, GuildRow, Guild, GuildPanel(), safeDomainHref(), mb(), TicketBotLanding() (+10 more)

### Community 34 - "Button.tsx"
Cohesion: 0.18
Nodes (15): Done, Done, Done, CircleNotch, Field(), LegalFormShell(), Props, Button (+7 more)

### Community 35 - "LangProvider.tsx"
Cohesion: 0.09
Nodes (22): FALLBACK, LangContext, LangProvider(), Monitor, Moon, Receipt, Scales, Sun (+14 more)

### Community 36 - "adminApi.ts"
Cohesion: 0.08
Nodes (40): dynamic, GET, POST, DELETE, dynamic, POST, DELETE, dynamic (+32 more)

### Community 37 - "Privacy Policy (EN)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

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
Cohesion: 0.23
Nodes (12): dynamic, GET, PUT, isAllowedHref(), NEWS_POPUP_DEFAULT, NEWS_POPUP_LIMITS, NewsPopupButton, parseButton() (+4 more)

### Community 43 - "Terms & Conditions (EN)"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "[id]/page.tsx"
Cohesion: 0.16
Nodes (17): CategoryPage(), generateMetadata(), revalidate, breadcrumbJsonLd(), LANGS, convertPipeTables(), EMOJI, OPTIONS (+9 more)

### Community 45 - "MSK Giveaway Bot Marketing Banner"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "cleanup.js"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "ProductBrowser.tsx"
Cohesion: 0.42
Nodes (6): ProductBrowser(), countBy(), Facet, matchesFrameworks(), PRODUCTS, visible()

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

### Community 66 - "TranscriptsCard.tsx"
Cohesion: 0.14
Nodes (15): CatalogPackage, PAGE_SIZES, Payment, TranscriptsCard, EMPTY_QUERY, formatBytes(), Query, safeUrl() (+7 more)

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
Cohesion: 0.09
Nodes (34): dynamic, GET, GET(), OPTIONS, revalidate, GET(), OPTIONS, revalidate (+26 more)

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

### Community 78 - "[guildId]/route.ts"
Cohesion: 0.21
Nodes (12): dynamic, ExistingRow, PATCH, VALID_TIERS, dynamic, GuildRow, ApiKey, isKeyOrigin() (+4 more)

### Community 79 - "Coverage Job"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 81 - "deploy.sh"
Cohesion: 0.70
Nodes (4): db(), env_value(), run_as_app_user(), deploy.sh script

### Community 87 - "ApiKeysTab.tsx"
Cohesion: 0.17
Nodes (14): ApiKeysTab(), formatRegistered(), maskKey(), originBadgeClass(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass() (+6 more)

### Community 88 - "imagePipeline.ts"
Cohesion: 0.14
Nodes (17): ACCEPTED_INPUT_FORMATS, cdnRootPath(), copyVariants(), deleteVariants(), normaliseName(), PIPELINE_RULES, variantFiles(), Variants (+9 more)

### Community 90 - "renderMarkdown"
Cohesion: 0.19
Nodes (15): DpaPage(), ImprintPage(), PrivacyPage(), TermsPage(), WithdrawalPage(), ALLOWED_SLUGS, getLegalContent(), inline() (+7 more)

### Community 91 - "proxy.ts"
Cohesion: 0.17
Nodes (15): LANG_COOKIE, BODY_LIMITS, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited() (+7 more)

### Community 101 - "contrast.test.ts"
Cohesion: 0.29
Nodes (8): channels(), contrast(), CSS, dark, light, linear(), luminance(), mix()

### Community 102 - "localeLinks.test.ts"
Cohesion: 0.50
Nodes (4): ALLE, DARF_NEXT_LINK, dateien(), WURZELN

### Community 103 - "ResourcesClient.tsx"
Cohesion: 0.16
Nodes (11): formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge(), GithubMark(), ArrowUpRight, Hash (+3 more)

### Community 104 - "tebex-stats.js"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "query"
Cohesion: 0.07
Nodes (35): authorized(), POST(), authorized(), POST(), ResultRow, WinnerIn, dynamic, extractApiKey() (+27 more)

### Community 106 - "[category]/page.tsx"
Cohesion: 0.17
Nodes (13): Params, revalidate, Search, Copyright, BrandNotice(), OWN_WORK_CATEGORY, GallerySearch(), clear() (+5 more)

### Community 107 - "dashboard/ticket-bot/page.tsx"
Cohesion: 0.18
Nodes (17): DashboardClient(), DashboardGuild, DashboardPage(), dynamic, GuildRow, metadata, ACCESS_GRACE_DAYS, ACCESS_STALE_HOURS (+9 more)

### Community 108 - "stripe/route.ts"
Cohesion: 0.13
Nodes (33): CustomerRow, POST(), POST(), applySubscription(), downgradeGuild(), GuildIdRow, GuildNameRow, handleTrialWillEnd() (+25 more)

### Community 112 - "routeGuards.test.ts"
Cohesion: 0.16
Nodes (10): API_DIR, DB_MODULES, DB_ROUTES, GUARDS, key(), LIB_DIR, LIB_SOURCES, libImports() (+2 more)

### Community 113 - "index.tsx"
Cohesion: 0.04
Nodes (84): Guild, Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), formatBytes(), formatNum() (+76 more)

### Community 114 - "domain/route.ts"
Cohesion: 0.35
Nodes (13): activate(), DELETE(), dynamic, execAsync, gate(), PATCH(), pointsHere(), POST() (+5 more)

### Community 115 - "Operations"
Cohesion: 0.22
Nodes (8): CI/CD, auto deploy, Manual Installation, Operations, Required GitHub Secrets, Requirements, Steps, Troubleshooting, Updating (manual)

### Community 116 - "schema.sql"
Cohesion: 0.12
Nodes (18): giveaway_results, msk_admin_audit, msk_admin_team, msk_cancellations, msk_content_reports, msk_image_categories, msk_image_uploads, msk_images (+10 more)

### Community 117 - "Development"
Cohesion: 0.22
Nodes (9): Configuration, Database, Design and styling, Development, Migrations, Products, Project Structure, Security (+1 more)

### Community 118 - "cn"
Cohesion: 0.08
Nodes (24): StatusBadge(), DashboardClient(), VerifyClient(), StepIndicator(), StatusBadge(), MagnifyingGlassPlus, PackageGallery(), PackageGalleryProps (+16 more)

### Community 119 - "botSeo.ts"
Cohesion: 0.11
Nodes (28): generateMetadata(), GiveawayPage(), generateMetadata(), TicketBotComparePage(), generateMetadata(), TicketBotPage(), escapeXml(), GET() (+20 more)

### Community 121 - "TicketBotCompare.tsx"
Cohesion: 0.23
Nodes (10): TicketBotCompare(), BookOpen, Info, Translate, COMPARE_DATA_DATE, CompareRow, de, en (+2 more)

### Community 123 - "dashboard-host/route.ts"
Cohesion: 0.19
Nodes (23): dynamic, execAsync, POST(), runtime, DashboardHostError, execFileAsync, generateDashboardHost(), isGeneratedHost() (+15 more)

### Community 124 - "image-ingest.js"
Cohesion: 0.19
Nodes (16): buildVariants(), CATEGORY_RULES, crypto, fs, main(), mysql, normaliseName(), parseArgs() (+8 more)

### Community 125 - "giveawaySession.ts"
Cohesion: 0.05
Nodes (54): ACTION_PATH, OWNER_ACTIONS, POST(), GET(), ALLOWED, GET(), GwListItem, KIND_PATH (+46 more)

### Community 126 - "MSK Ticket Bot Transcript Service"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 127 - "price.ts"
Cohesion: 0.43
Nodes (4): DisplayPrice, resolveDisplayPrice(), SaleData, SalePricesStore

### Community 128 - "robots.ts"
Cohesion: 0.67
Nodes (3): BLOCKED, robots(), isExemptPath()

### Community 130 - "ThemeProvider.tsx"
Cohesion: 0.47
Nodes (3): NextThemesProviderProps, Props, ThemeProvider()

### Community 131 - "discord-verify/callback/route.ts"
Cohesion: 0.10
Nodes (28): dynamic, GET(), GET(), GET(), POST(), generateApiKey(), GuildRow, POST() (+20 more)

### Community 132 - "Colors"
Cohesion: 0.33
Nodes (6): Colors, Functional, Named Rules, Neutral, Primary, Secondary

### Community 133 - "images/upload/route.ts"
Cohesion: 0.14
Nodes (16): GET(), dynamic, dynamic, GET(), POST(), MAX_UPLOAD_BYTES, recentUploadCount(), uploadCategories() (+8 more)

### Community 134 - "DashboardDomainCard"
Cohesion: 0.67
Nodes (3): DashboardDomainCard(), call(), say()

### Community 135 - "HostingSetup.tsx"
Cohesion: 0.06
Nodes (37): Figures, formatBytes(), QueueFilter, TABS, Upload, UploadsTab(), HostingSetup, BotArchive (+29 more)

### Community 136 - "Data Processing Agreement (AVV)"
Cohesion: 0.17
Nodes (11): 10. Liability and final provisions, 1. Subject matter and duration, 2. Nature and purpose of the processing, categories of data, data subjects, 3. Instructions, 4. Obligations of MSK Scripts, 5. Obligations of the controller, 6. Technical and organisational measures (Art. 32 GDPR), 7. Sub-processors (+3 more)

### Community 137 - "Vereinbarung zur Auftragsverarbeitung (AVV)"
Cohesion: 0.17
Nodes (11): 10. Haftung und Schlussbestimmungen, 1. Gegenstand und Dauer, 2. Art und Zweck der Verarbeitung, Datenkategorien, Betroffene, 3. Weisungen, 4. Pflichten von MSK Scripts, 5. Pflichten des Auftraggebers, 6. Technische und organisatorische Maßnahmen (Art. 32 DSGVO), 7. Unterauftragsverarbeiter (+3 more)

### Community 138 - "[lang]/layout.tsx"
Cohesion: 0.17
Nodes (14): generateMetadata(), RootLayout(), siteMetadata, viewport, UnknownPage(), isLang(), LANG_HEADER, langFromHeader() (+6 more)

### Community 139 - "ticketbotStats.ts"
Cohesion: 0.18
Nodes (12): dynamic, GET(), StatsPage(), AvgRow, CountRow, EMPTY_STATS, loadTicketbotStats(), MaxRow (+4 more)

### Community 140 - "sendMail"
Cohesion: 0.27
Nodes (9): forLog(), getTransporter(), MailConfig, mailConfigFromEnv(), MailMessage, sendMail(), capture(), CR (+1 more)

### Community 141 - "peds.js"
Cohesion: 0.20
Nodes (10): ALTER, dump, fs, GESCHLECHT_AUS_TYP, GRUPPE, [quelle, ziel], raus, ROLLE (+2 more)

### Community 142 - "imageSyncCheck.ts"
Cohesion: 0.29
Nodes (8): dynamic, GET, cdnRoot(), DERIVATIVES, listFiles(), runSyncCheck(), SyncCheckCategory, SyncCheckResult

### Community 143 - "audit/route.ts"
Cohesion: 0.50
Nodes (3): AuditRow, dynamic, GET

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
Cohesion: 0.06
Nodes (41): AccountPage(), BotConfigEditor, DashboardDomainCard, GET_LABEL, PaidTier, Props, T, TabKey (+33 more)

### Community 179 - "migrate-stats-ignored.js"
Cohesion: 0.50
Nodes (4): APPLY, main(), mysql, parseKeys()

## Knowledge Gaps
- **747 isolated node(s):** `Tier`, `TIER_LABELS`, `TIER_ORDER`, `AuditEntry`, `BanEntry` (+742 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 914 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `legalForms.ts`, `getClientIp`, `discord-verify/callback/route.ts`, `ticketbotStats.ts`, `imageUploads.ts`, `imageSyncCheck.ts`, `admin/page.tsx`, `audit/route.ts`, `adminImages.ts`, `adminImageFiles.test.ts`, `botProvision.ts`, `adminPerms.ts`, `authorizeGuild`, `[discordUserId]/route.ts`, `adminApi.ts`, `newsPopup.ts`, `transcript/upload/route.ts`, `images.ts`, `[guildId]/route.ts`, `imagePipeline.ts`, `dashboard/ticket-bot/page.tsx`, `domain/route.ts`, `dashboard-host/route.ts`, `giveawaySession.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `Lang` connect `i18n.ts` to `products.ts`, `Card.tsx`, `HostingSetup.tsx`, `routes.ts`, `useLang`, `[lang]/layout.tsx`, `giveaway-bot/DashboardClient.tsx`, `publicPath`, `productView.ts`, `LegalContent.tsx`, `[lang]/page.tsx`, `getRequestLang`, `ticketbot-copy.ts`, `LangProvider.tsx`, `ticket-bot/DashboardClient.tsx`, `ProductBrowser.tsx`, `TranscriptsCard.tsx`, `images.ts`, `ApiKeysTab.tsx`, `ResourcesClient.tsx`, `[category]/page.tsx`, `index.tsx`, `cn`, `botSeo.ts`, `TicketBotCompare.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `publicPath()` connect `publicPath` to `robots.ts`, `legalForms.ts`, `getClientIp`, `discord-verify/callback/route.ts`, `images/upload/route.ts`, `routes.ts`, `admin/page.tsx`, `productView.ts`, `[lang]/page.tsx`, `getRequestLang`, `ticketbot-copy.ts`, `LangProvider.tsx`, `[id]/page.tsx`, `query`, `dashboard/ticket-bot/page.tsx`, `stripe/route.ts`, `botSeo.ts`, `TicketBotCompare.tsx`, `giveawaySession.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `Tier`, `TIER_LABELS`, `TIER_ORDER` to the rest of the system?**
  _747 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `legalForms.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0907103825136612 - nodes in this community are weakly interconnected._
- **Should `products.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07184325108853411 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._