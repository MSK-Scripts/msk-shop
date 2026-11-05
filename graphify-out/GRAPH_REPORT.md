# Graph Report - msk-shop  (2026-11-05)

## Corpus Check
- 561 files · ~395,817 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3611 nodes · 10962 edges · 194 communities (168 shown, 26 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `32b9ed95`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- legalForms.ts
- productView.ts
- getClientIp
- devDependencies
- ImagesArea.tsx
- dependencies
- Design System: MSK Scripts Shop
- ResourcesClient.tsx
- TypeScript Configuration
- routes.ts
- useLang
- scripts/deploy.sh (Server Deploy Script)
- imageUploads.ts
- Tebex API Reference (5 HTTP APIs)
- sitemap.ts
- ticketBotApi.ts
- TemplatesArea.tsx
- adminImages.ts
- botDashboardProxy.ts
- domain/route.ts
- DomainsArea.tsx
- LangProvider.tsx
- ticket-bot/OverviewArea.tsx
- botProvision.ts
- getRequestLang
- sponsorLink.ts
- useAdminCopy
- giveawaySectionMetadata
- GiveawayActions.tsx
- package.json
- Footer.tsx
- TicketBotShell.tsx
- NPM Scripts
- RowMenu
- WithdrawalClient.tsx
- ticketBotAreas.test.ts
- writeAudit
- Privacy Policy (EN)
- [name]/page.tsx
- Hosted Bot Management Service
- Brand Identity Assets
- Stripe Reconciliation Script
- giveawaySubPageMetadata
- Terms & Conditions (EN)
- i18n.ts
- Giveaway Bot Marketing
- File Cleanup Script
- Lang
- bot-provision.js
- adminMask.ts
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
- TicketBotLanding.tsx
- Core Framework Script
- Engine Toggle Script
- Garage System Script
- sponsors.test.ts
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
- uploadSession.ts
- Code Coverage CI
- Auth URL Utilities
- deploy.sh
- VHost Creation Scripts
- loadGuilds.ts
- lib/tebex.ts
- ticket-bot/stats/StatsClient.tsx
- proxy.ts
- Discord Statistics Integration
- ESLint Configuration
- Dependency Management Workflows
- GitHub Issue Templates
- CodeQL Security Analysis
- Deployment Workflows
- Next.js Configuration
- VHost Deletion Scripts
- Tailwind CSS Configuration
- contrast.test.ts
- Localization Route Testing
- adminRequests.ts
- Tebex Statistics Script
- routes.test.ts
- LocaleLink.tsx
- categories/[id]/page.tsx
- stripe/route.ts
- Documentation Assets
- routeGuards.test.ts
- index.tsx
- adminAreas.test.ts
- Operations
- schema.sql
- Development
- GiveawayProvider.tsx
- jsonLd.ts
- Sitemap Route
- Button.tsx
- absoluteUrl
- image-ingest.js
- giveawaySession.ts
- Transcript Service Terms
- adminApi.ts
- [server]/sectionPage.tsx
- NewsPopupArea.tsx
- ThemeProvider.tsx
- [guildId]/route.ts
- images/page.tsx
- GiveawaysArea.tsx
- sponsors.ts
- reveal/route.ts
- Data Processing Agreement (AVV)
- Vereinbarung zur Auftragsverarbeitung (AVV)
- lang.ts
- fillCopy
- transcript/upload/route.ts
- peds.js
- imageSyncCheck.ts
- query
- cn
- image-pedshot-prepare.js
- images.ts
- LegalContent.tsx
- tiers.ts
- image-sync-check.js
- items.js
- Data Collected by the Transcript Service
- Withdrawal Instructions
- Widerrufsbelehrung
- vehicles.js
- data/route.ts
- image-label-import.js
- Label-Generatoren
- url/route.ts
- sharp
- bot-vhost-create.sh
- msk-cron.sh
- loadSession.ts
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
- AddToCartButton
- @phosphor-icons/react
- discordPermissions.test.ts
- react
- migrate-stats-ignored.js
- Admin dashboard
- (site)/layout.tsx
- 003-site-settings.sql
- robots.ts
- GallerySearch
- adminNavLocked.test.ts
- adminRequests.test.ts
- 004-sponsor-links.sql
- giveawayModel.ts
- Features
- Datenbank-Migrationen
- dashboard/layout.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 122 edges
2. `getRequestLang()` - 106 edges
3. `Lang` - 104 edges
4. `useLang()` - 99 edges
5. `query()` - 89 edges
6. `publicPath()` - 77 edges
7. `Button` - 73 edges
8. `useAdminCopy()` - 70 edges
9. `LocaleLink()` - 65 edges
10. `fillCopy()` - 59 edges

## Surprising Connections (you probably didn't know these)
- `html()` --indirect_call--> `LangProvider()`  [INFERRED]
  tests/dashboardShell.test.ts → components/i18n/LangProvider.tsx
- `npm ci --no-audit im Deploy` --semantically_similar_to--> `Production-Tree-Only Audit Gate`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → .github/workflows/ci.yml
- `LoginPage()` --calls--> `getRequestLang()`  [EXTRACTED]
  app/[lang]/(site)/login/page.tsx → lib/serverLang.ts
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

## Communities (194 total, 26 thin omitted)

### Community 0 - "legalForms.ts"
Cohesion: 0.09
Nodes (53): dynamic, POST(), dynamic, POST(), badRequest(), clientIpOrNull(), deliverReceipts(), mailLangFrom() (+45 more)

### Community 1 - "productView.ts"
Cohesion: 0.06
Nodes (68): AdminPackage, AllAccessPage(), generateMetadata(), revalidate, subscription(), generateMetadata(), generateStaticParams(), isMarkedUnknown() (+60 more)

### Community 2 - "getClientIp"
Cohesion: 0.09
Nodes (44): getBasketCreateAuth(), getTebexAuth, TEBEX_BASE, TEBEX_HEADERS, GET(), DELETE(), POST(), POST() (+36 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+19 more)

### Community 4 - "ImagesArea.tsx"
Cohesion: 0.06
Nodes (38): runImageSyncCheck(), ADMIN_GUIDE_URL, Catalog, CatalogItem, ChipOption, FIELD_NAME, FilterChips(), FlashMessage (+30 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (27): clsx, @fontsource-variable/archivo, @fontsource-variable/source-sans-3, mysql2, next-themes, nodemailer, dependencies, clsx (+19 more)

### Community 6 - "Design System: MSK Scripts Shop"
Cohesion: 0.10
Nodes (21): Accessibility, Adding a colour, Adding an icon, Base (`components/ui`), Colour, Components, Contrast, Dashboards (`components/dashboard`) (+13 more)

### Community 7 - "ResourcesClient.tsx"
Cohesion: 0.07
Nodes (38): dynamic, GET(), ResourcesPage(), formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge() (+30 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 9 - "routes.ts"
Cohesion: 0.11
Nodes (25): ProductIndex, productTarget, comparePatterns(), EXEMPT_EXACT, EXEMPT_PREFIXES, fill(), FIVEM_PAGES, hasClosingBand() (+17 more)

### Community 10 - "useLang"
Cohesion: 0.13
Nodes (27): About(), Hero(), useLang(), LanguageDropdown(), LanguageLinks(), languages, rememberLanguage(), CaretDown (+19 more)

### Community 11 - "scripts/deploy.sh (Server Deploy Script)"
Cohesion: 0.11
Nodes (24): CI Job: Audit (production tree), CI Job: Build, CI Workflow (msk-shop), Dependabot Secret Fallback Placeholders, CI Job: Lint, Production-Tree-Only Audit Gate, CI Job: Test, CI Job: Typecheck (+16 more)

### Community 12 - "imageUploads.ts"
Cohesion: 0.07
Nodes (55): dynamic, failureResponse(), POST, dynamic, GET(), POST(), categoryExists(), moveAdminImage() (+47 more)

### Community 13 - "Tebex API Reference (5 HTTP APIs)"
Cohesion: 0.15
Nodes (17): Moritz Kohm (data controller / licensor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), 8-permission admin model + is_owner, Admin Dashboard Implementation Plan, Admin route auth pattern (authorizeAdmin → rate limit → Plugin call → writeAudit) (+9 more)

### Community 14 - "sitemap.ts"
Cohesion: 0.16
Nodes (16): dynamic, GET, generateStaticParams(), GET(), revalidate, productUpdatedAt(), bothLanguages(), buildSitemapEntries() (+8 more)

### Community 15 - "ticketBotApi.ts"
Cohesion: 0.11
Nodes (30): BotAddress(), launchFallback(), setupAddress(), check(), remove(), save(), RemoveHosting(), remove() (+22 more)

### Community 16 - "TemplatesArea.tsx"
Cohesion: 0.11
Nodes (35): PreviewPanel(), FirstClickTag(), NewGiveawayPage(), PrizeSection(), durationInput, durationSeconds(), hasOwnConditions(), FlashNotice() (+27 more)

### Community 17 - "adminImages.ts"
Cohesion: 0.08
Nodes (35): DELETE, dynamic, moveFailure(), PATCH, dynamic, GET, ADMIN_IMAGE_FILTERS, AdminImage (+27 more)

### Community 18 - "botDashboardProxy.ts"
Cohesion: 0.10
Nodes (31): dynamic, GET(), runtime, bounce(), DELETE, dynamic, GET, handle() (+23 more)

### Community 19 - "domain/route.ts"
Cohesion: 0.23
Nodes (18): activate(), DELETE(), dynamic, execAsync, gate(), PATCH(), pointsHere(), POST() (+10 more)

### Community 20 - "DomainsArea.tsx"
Cohesion: 0.12
Nodes (18): DnsSteps(), ActiveDomain(), DashboardDomainCard(), call(), remove(), say(), firstTierWith(), Message (+10 more)

### Community 21 - "LangProvider.tsx"
Cohesion: 0.09
Nodes (24): AppShell(), AppShellProps, NavDrawer(), navItemClass, ShellAccount, ShellCopy, ShellNavItem, SidebarFooter() (+16 more)

### Community 22 - "ticket-bot/OverviewArea.tsx"
Cohesion: 0.09
Nodes (32): Flash, AttentionItem, BotControl(), confirmStop(), runAction(), runUpdate(), Msg, botIsDown() (+24 more)

### Community 23 - "botProvision.ts"
Cohesion: 0.07
Nodes (69): dynamic, execAsync, POST(), runtime, dynamic, GET(), POST(), runtime (+61 more)

### Community 24 - "getRequestLang"
Cohesion: 0.07
Nodes (62): generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), dynamic, generateMetadata() (+54 more)

### Community 25 - "sponsorLink.ts"
Cohesion: 0.18
Nodes (20): GET(), decodeJson(), Env, GITHUB_LOGIN_RE, hmac(), newOAuthState(), readSponsorConfig(), readStateCookie() (+12 more)

### Community 26 - "useAdminCopy"
Cohesion: 0.09
Nodes (41): AdminClient(), LockedArea(), signOut(), AdminShell(), permissionList(), useAdminCopy(), ApiKeysArea(), AuditArea() (+33 more)

### Community 27 - "giveawaySectionMetadata"
Cohesion: 0.13
Nodes (13): dynamic, generateMetadata(), dynamic, generateMetadata(), giveawaySectionMetadata(), GiveawaySectionPage(), sectionCopy(), dynamic (+5 more)

### Community 28 - "GiveawayActions.tsx"
Cohesion: 0.08
Nodes (54): DialogKind, GiveawayActions(), act(), extend(), remove(), saveTemplate(), changeGiveaway(), clearTebexSecret() (+46 more)

### Community 29 - "package.json"
Cohesion: 0.17
Nodes (11): engines, node, license, name, overrides, eslint, js-yaml, postcss (+3 more)

### Community 30 - "Footer.tsx"
Cohesion: 0.17
Nodes (9): Receipt, Scales, Footer(), footerColumns(), FooterLink, trustItems(), PaymentMarks(), EXPECTED (+1 more)

### Community 31 - "TicketBotShell.tsx"
Cohesion: 0.12
Nodes (15): ICONS, ShellServer, TicketBotShell(), dynamic, metadata, VerifyPage(), VerifyClient(), ShellNavGroup (+7 more)

### Community 32 - "NPM Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:coverage, test:watch (+1 more)

### Community 33 - "RowMenu"
Cohesion: 0.67
Nodes (3): RowMenu(), onBefore(), place()

### Community 34 - "WithdrawalClient.tsx"
Cohesion: 0.14
Nodes (21): CancellationClient(), Done, Done, ReportClient(), WithdrawalPage(), Done, WithdrawalClient(), WarningCircle (+13 more)

### Community 35 - "ticketBotAreas.test.ts"
Cohesion: 0.09
Nodes (19): DomainsArea(), HostingArea(), HostingStatus, LiveLogs(), logLineClass(), DashboardGuild, botLogStreamUrl(), hostingStatusUrl() (+11 more)

### Community 36 - "writeAudit"
Cohesion: 0.09
Nodes (26): POST, DELETE, dynamic, POST, DELETE, dynamic, PUT, POST (+18 more)

### Community 37 - "Privacy Policy (EN)"
Cohesion: 0.22
Nodes (11): Datenschutzerklärung (DE), Ihre Rechte nach der DSGVO, Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO), GDPR Data Subject Rights (Art. 15-21), Language Preference Cookie (msk_lang), Legal Bases for Processing (Art. 6 GDPR), netcup GmbH Hosting and DPA, No Tracking, Analytics or Consent Banner (+3 more)

### Community 38 - "[name]/page.tsx"
Cohesion: 0.16
Nodes (15): formatBytes(), ImageDetailPage(), Params, revalidate, CategoryPage(), findCategory(), Params, revalidate (+7 more)

### Community 39 - "Hosted Bot Management Service"
Cohesion: 0.25
Nodes (9): Attachment Storage (Premium and Premium+), Hosted Bot Management Data and Access Control, Storage Period Table, Transcript Storage and Tier Retention, Operator Access to Hosted Bot Credentials, Hosted Bot Customer Responsibilities, Hosted Bot Management Service, Hosting Termination and 14-Day Deletion (+1 more)

### Community 40 - "Brand Identity Assets"
Cohesion: 0.36
Nodes (9): MSK Scripts Social/OpenGraph Banner, Dark Green Tech Brand Style (MSK green accent, mono labels), Discord Bots Offering, FiveM Resource Development (eyebrow claim), msk_core (product chip), msk_handcuffs (product chip), msk_vehiclekeys (product chip), Tagline: Scripts, Tools & Discord bots for servers that want more. (+1 more)

### Community 41 - "Stripe Reconciliation Script"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 42 - "giveawaySubPageMetadata"
Cohesion: 0.16
Nodes (10): dynamic, generateMetadata(), dynamic, generateMetadata(), GiveawaySubPage(), giveawaySubPageMetadata(), dynamic, generateMetadata() (+2 more)

### Community 43 - "Terms & Conditions (EN)"
Cohesion: 0.25
Nodes (8): CFX.re Account Requirement, Anwendbares Recht (Bundesrepublik Deutschland), Lizenzbedingungen (Einzelserver-Lizenz), Nutzungsbedingungen (DE), FiveM Asset Escrow System, Governing Law (Federal Republic of Germany), Single-Server License Terms, Terms & Conditions (EN)

### Community 44 - "i18n.ts"
Cohesion: 0.07
Nodes (45): AboutPage(), FreeScriptsPage(), serverCounts(), HomePage(), imageSrc(), Tool(), ToolsPage(), Bots (+37 more)

### Community 45 - "Giveaway Bot Marketing"
Cohesion: 0.46
Nodes (8): MSK Giveaway Bot Marketing Banner, Dark Green Tech Banner Visual Style, Discord.js v14 Tech Badge, MSK Scripts Brand Wordmark and M Logo, Multilingual Giveaways Claim, Prisma Tech Badge, MSK.GiveawayBot (Discord Giveaway Bot), Slash Commands and Modals Feature

### Community 46 - "File Cleanup Script"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 47 - "Lang"
Cohesion: 0.11
Nodes (26): cheapestScript(), scripts(), Check, PackageGalleryProps, PackagePrice(), PriceSource, Props, ProductBrowser() (+18 more)

### Community 48 - "bot-provision.js"
Cohesion: 0.14
Nodes (23): botDir, botReportsRunning(), clone(), configure(), connect(), { execFile }, execFileAsync, exists() (+15 more)

### Community 49 - "adminMask.ts"
Cohesion: 0.27
Nodes (13): AuditRow, dynamic, GET, maskedDetail(), EMAIL_KEYS, IP_KEYS, maskApiKey(), maskEmail() (+5 more)

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

### Community 62 - "TicketBotLanding.tsx"
Cohesion: 0.10
Nodes (29): BotCrossLink(), COMMAND_NAMES, GIVEAWAY_GITHUB_URL, GIVEAWAY_INVITE_URL, HUB_HREFS, ArrowRight, Translate, Fact (+21 more)

### Community 63 - "Core Framework Script"
Cohesion: 0.60
Nodes (6): msk_core Marketing Banner, Core Framework / Core Library Claim, ESX Framework Support, MSK Scripts Brand Identity (green M mark, dark theme), MSK.CORE (msk_core), QBCore Framework Support

### Community 64 - "Engine Toggle Script"
Cohesion: 0.53
Nodes (6): msk_enginetoggle Marketing Banner, ESX Framework Support, Manual Engine Control for Vehicle Roleplay, MSK Scripts Brand Identity (Green M Logo, Dark Theme), msk_enginetoggle (Vehicle System Script), QBCore Framework Support

### Community 65 - "Garage System Script"
Cohesion: 0.60
Nodes (6): msk_garage Marketing Banner, ESX Framework Support, Full Garage Management, MSK Scripts Brand Identity (M logo, dark green), MSK.GARAGE (msk_garage), Vehicle System / Persistent Vehicle Storage

### Community 66 - "sponsors.test.ts"
Cohesion: 0.17
Nodes (11): dynamic, GET(), NO_STORE, bearerMatches(), LinkPayload, readSyncSecret(), signLinkToken(), listSponsorLinks() (+3 more)

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
Cohesion: 0.15
Nodes (19): GET(), OPTIONS, revalidate, GET(), OPTIONS, revalidate, GET(), OPTIONS (+11 more)

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
Cohesion: 0.19
Nodes (14): Code of Conduct (Contributor Covenant), Contributing Guide, Pull Request Template, Contribution Rights Assignment (CLA, § 5), MSK Source Available License (German version), MSK Source Available License (MSK-SAL v1.0), Protected Components (Verify System, Dashboard, Shop/Website Design), Server-side git deploy (CI-gated) (+6 more)

### Community 77 - "URL Shortener Marketing"
Cohesion: 0.67
Nodes (4): Dark Theme with MSK Green Accent Headline, MSK Shortener Hero Screenshot, Long URL Input Form Card, MSK URL Shortener (privacy-friendly, no signup)

### Community 78 - "uploadSession.ts"
Cohesion: 0.22
Nodes (8): GET(), dynamic, Envelope, getSecret(), signUploadSession(), UPLOAD_SESSION_COOKIE, UPLOAD_STATE_COOKIE, UploadSession

### Community 79 - "Code Coverage CI"
Cohesion: 0.67
Nodes (3): Code Coverage Workflow, Coverage Job, Same-Repo-Only Coverage Upload Guard

### Community 81 - "deploy.sh"
Cohesion: 0.70
Nodes (4): db(), env_value(), run_as_app_user(), deploy.sh script

### Community 87 - "loadGuilds.ts"
Cohesion: 0.07
Nodes (34): dynamic, GET(), GET(), GET(), GuildRow, loadTicketBotGuilds, loadTicketBotServer(), dynamic (+26 more)

### Community 88 - "lib/tebex.ts"
Cohesion: 0.13
Nodes (21): ShopSignIn(), SignInReturn(), canAddToBasket(), addGiftToBasket(), addToBasket(), applyCoupon(), createBasket(), getAllAuthUrls() (+13 more)

### Community 90 - "ticket-bot/stats/StatsClient.tsx"
Cohesion: 0.27
Nodes (12): StatsClient(), formatBytes(), StatsClient(), TIER_ITEMS, Breakdown(), BreakdownItem, Figure, FigureList() (+4 more)

### Community 91 - "proxy.ts"
Cohesion: 0.17
Nodes (15): LANG_COOKIE, BODY_LIMITS, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited() (+7 more)

### Community 101 - "contrast.test.ts"
Cohesion: 0.14
Nodes (14): channels(), contrast(), CSS, dark, light, linear(), LINES_ONLY, luminance() (+6 more)

### Community 102 - "Localization Route Testing"
Cohesion: 0.50
Nodes (4): ALLE, DARF_NEXT_LINK, dateien(), WURZELN

### Community 103 - "adminRequests.ts"
Cohesion: 0.08
Nodes (34): addTeamMember(), AdminRequestError, createBan(), createCoupon(), createGiftCard(), decideUpload(), deleteCoupon(), deleteImage() (+26 more)

### Community 104 - "Tebex Statistics Script"
Cohesion: 0.43
Nodes (6): aggregate(), DRY_RUN, fetchAllPayments(), log(), main(), mysql

### Community 105 - "routes.test.ts"
Cohesion: 0.21
Nodes (12): chooseRootLang(), internalPath(), langFromAcceptLanguage(), LEGACY_ROUTES, legacyTarget(), resolveInternal(), resolveRequest(), ROUTES (+4 more)

### Community 106 - "LocaleLink.tsx"
Cohesion: 0.17
Nodes (13): AccountPage(), botSessions(), dynamic, CheckoutContent(), LoginPage(), keepAsIs(), LocaleLink(), Flag (+5 more)

### Community 107 - "categories/[id]/page.tsx"
Cohesion: 0.09
Nodes (29): CategoryPage(), revalidate, GET(), revalidate, botLandingEntries(), CATEGORY_SEO, CATEGORY_VARIANT, PRODUCT_COPY (+21 more)

### Community 108 - "stripe/route.ts"
Cohesion: 0.08
Nodes (47): CustomerRow, POST(), POST(), applySubscription(), downgradeGuild(), GuildIdRow, GuildNameRow, handleTrialWillEnd() (+39 more)

### Community 112 - "routeGuards.test.ts"
Cohesion: 0.16
Nodes (10): API_DIR, DB_MODULES, DB_ROUTES, GUARDS, key(), LIB_DIR, LIB_SOURCES, libImports() (+2 more)

### Community 113 - "index.tsx"
Cohesion: 0.04
Nodes (66): ICONS, AdminError(), Guild, Props, StepIndicator(), TIER_LABELS, dynamic, GiveawayResultPage() (+58 more)

### Community 114 - "adminAreas.test.ts"
Cohesion: 0.06
Nodes (48): GET, dynamic, GET, dynamic, GET, Section, dynamic, GET (+40 more)

### Community 115 - "Operations"
Cohesion: 0.22
Nodes (8): CI/CD, auto deploy, Manual Installation, Operations, Required GitHub Secrets, Requirements, Steps, Troubleshooting, Updating (manual)

### Community 116 - "schema.sql"
Cohesion: 0.12
Nodes (19): giveaway_results, msk_admin_audit, msk_admin_team, msk_cancellations, msk_content_reports, msk_image_categories, msk_image_uploads, msk_images (+11 more)

### Community 117 - "Development"
Cohesion: 0.22
Nodes (9): Configuration, Database, Design and styling, Development, Migrations, Products, Project Structure, Security (+1 more)

### Community 118 - "GiveawayProvider.tsx"
Cohesion: 0.06
Nodes (44): embedColor(), inline(), MarkupNode, parseMarkup(), TOKEN, BUTTON_STYLE, DiscordText(), JoinButton() (+36 more)

### Community 119 - "jsonLd.ts"
Cohesion: 0.07
Nodes (44): generateMetadata(), GiveawayPage(), generateMetadata(), TicketBotComparePage(), generateMetadata(), TicketBotPage(), GiveawayLanding(), TicketBotCompare() (+36 more)

### Community 121 - "Button.tsx"
Cohesion: 0.08
Nodes (58): ADMIN_URL, AreaHeader(), AreaLoad(), ConfirmAction(), NoneText(), Pager(), ApiKeyCell(), ORIGIN_TONE (+50 more)

### Community 123 - "absoluteUrl"
Cohesion: 0.31
Nodes (9): GET(), returnUrl(), softwareApplicationJsonLd(), absoluteUrl(), siteUrl(), grantSponsorRole(), LinkRow, SponsorLink (+1 more)

### Community 124 - "image-ingest.js"
Cohesion: 0.19
Nodes (16): buildVariants(), CATEGORY_RULES, crypto, fs, main(), mysql, normaliseName(), parseArgs() (+8 more)

### Community 125 - "giveawaySession.ts"
Cohesion: 0.15
Nodes (16): POST(), BotGuild, dynamic, GiveawayVerifyPage(), metadata, Envelope, getSecret(), GIVEAWAY_SESSION_COOKIE (+8 more)

### Community 126 - "Transcript Service Terms"
Cohesion: 0.29
Nodes (8): Public Giveaway Results Page, In-Memory IP Rate Limiting, Transcript Service API Key, Limitation of Liability, Public Transcript URLs (UUID, unlisted), No Guaranteed Uptime / SLA, MSK Ticket Bot Transcript Service, Transcript Content and Responsibility

### Community 127 - "adminApi.ts"
Cohesion: 0.06
Nodes (46): dynamic, GET(), dynamic, GET, POST, TeamRow, AdminArea(), AdminPage() (+38 more)

### Community 128 - "[server]/sectionPage.tsx"
Cohesion: 0.15
Nodes (14): dynamic, generateMetadata(), dynamic, generateMetadata(), dynamic, generateMetadata(), sectionCopy(), ticketBotSectionMetadata() (+6 more)

### Community 129 - "NewsPopupArea.tsx"
Cohesion: 0.16
Nodes (18): saveNewsPopup(), ButtonDraft, buttonErrors(), fromButton(), fromDraft(), NewsPopupDraft, NewsPopupEditor(), save() (+10 more)

### Community 130 - "ThemeProvider.tsx"
Cohesion: 0.47
Nodes (3): NextThemesProviderProps, Props, ThemeProvider()

### Community 131 - "[guildId]/route.ts"
Cohesion: 0.21
Nodes (12): dynamic, ExistingRow, PATCH, VALID_TIERS, dynamic, GuildRow, ApiKeyRow, isKeyOrigin() (+4 more)

### Community 132 - "images/page.tsx"
Cohesion: 0.23
Nodes (11): formatCount(), ImagesPage(), revalidate, escapeXml(), GET(), revalidate, cdnBase(), countPublished() (+3 more)

### Community 133 - "GiveawaysArea.tsx"
Cohesion: 0.09
Nodes (46): auditColumns(), EmbedCard(), renderNode(), DeletionInfo, extraOf(), GiveawayDetail(), GiveawayExtra, Moment() (+38 more)

### Community 134 - "sponsors.ts"
Cohesion: 0.21
Nodes (12): better(), currentSponsors(), evaluateSponsorships(), fetchSponsorships(), GraphQlPage, MIN_PRICE_USD, ONE_TIME_DAYS, parseDate() (+4 more)

### Community 135 - "reveal/route.ts"
Cohesion: 0.14
Nodes (18): dynamic, loadValue(), NO_STORE, POST, text(), parseRevealRequest(), REVEAL_FIELDS, REVEAL_KINDS (+10 more)

### Community 136 - "Data Processing Agreement (AVV)"
Cohesion: 0.17
Nodes (11): 10. Liability and final provisions, 1. Subject matter and duration, 2. Nature and purpose of the processing, categories of data, data subjects, 3. Instructions, 4. Obligations of MSK Scripts, 5. Obligations of the controller, 6. Technical and organisational measures (Art. 32 GDPR), 7. Sub-processors (+3 more)

### Community 137 - "Vereinbarung zur Auftragsverarbeitung (AVV)"
Cohesion: 0.17
Nodes (11): 10. Haftung und Schlussbestimmungen, 1. Gegenstand und Dauer, 2. Art und Zweck der Verarbeitung, Datenkategorien, Betroffene, 3. Weisungen, 4. Pflichten von MSK Scripts, 5. Pflichten des Auftraggebers, 6. Technische und organisatorische Maßnahmen (Art. 32 DSGVO), 7. Unterauftragsverarbeiter (+3 more)

### Community 138 - "lang.ts"
Cohesion: 0.22
Nodes (11): generateMetadata(), RootLayout(), siteMetadata, viewport, UnknownPage(), isLang(), LANG_HEADER, langFromHeader() (+3 more)

### Community 139 - "fillCopy"
Cohesion: 0.09
Nodes (44): updateImage(), updatePackage(), pageOf(), useFlash(), apiKeyColumns(), ApiKeysView(), auditSentence(), AuditView() (+36 more)

### Community 140 - "transcript/upload/route.ts"
Cohesion: 0.20
Nodes (18): AttachmentInput, checkRateLimit(), isValidGuild(), POST(), RateLimitRow, reencodeImage(), RequestBody, transcriptBasePath() (+10 more)

### Community 141 - "peds.js"
Cohesion: 0.20
Nodes (10): ALTER, dump, fs, GESCHLECHT_AUS_TYP, GRUPPE, [quelle, ziel], raus, ROLLE (+2 more)

### Community 142 - "imageSyncCheck.ts"
Cohesion: 0.29
Nodes (8): dynamic, GET, cdnRoot(), DERIVATIVES, listFiles(), runSyncCheck(), SyncCheckCategory, SyncCheckResult

### Community 143 - "query"
Cohesion: 0.09
Nodes (36): dynamic, POST(), runtime, authorized(), POST(), ResultRow, WinnerIn, GuildRow (+28 more)

### Community 144 - "cn"
Cohesion: 0.08
Nodes (30): RevealValue(), GiveErrors, KindFilter, Payment, PaymentStatus(), Period, STATUS, VerifyClient() (+22 more)

### Community 145 - "image-pedshot-prepare.js"
Cohesion: 0.36
Nodes (8): fs, fuelleLoecher(), groesstenBereichBehalten(), main(), maskiere(), parseArgs(), path, sharp

### Community 146 - "images.ts"
Cohesion: 0.28
Nodes (7): ImageCard(), booleanTerms(), ImageListResult, ImageRecord, ImageRow, ListOptions, searchClause()

### Community 147 - "LegalContent.tsx"
Cohesion: 0.48
Nodes (4): Props, EN, legalNotice, LegalNoticeKind

### Community 148 - "tiers.ts"
Cohesion: 0.15
Nodes (23): OrderSummary(), Props, PaidTier, BotsOverview(), prefetch(), TicketBotLanding(), mb(), TicketBotTiers() (+15 more)

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
Nodes (21): ACTION_PATH, OWNER_ACTIONS, POST(), ALLOWED, GET(), GwListItem, HISTORY_DAYS, KIND_PATH (+13 more)

### Community 156 - "image-label-import.js"
Cohesion: 0.50
Nodes (4): fs, main(), mysql, toTagList()

### Community 157 - "Label-Generatoren"
Cohesion: 0.40
Nodes (4): Die Quellen, Label-Generatoren, Warum sie hier liegen, Was der Import garantiert

### Community 158 - "url/route.ts"
Cohesion: 0.40
Nodes (5): dynamic, extractApiKey(), GET(), GuildRow, UrlRow

### Community 162 - "loadSession.ts"
Cohesion: 0.53
Nodes (4): loadGiveawaySession, dynamic, GiveawayPanelLayout(), parseGiveawaySession()

### Community 164 - "giveaway/auth/callback/route.ts"
Cohesion: 0.25
Nodes (10): GET(), fetchGuildMemberRoles(), fetchUserGuilds(), RawGuild, UserGuilds, resolveManagerGuilds(), SettingsRow, signGiveawayVerify() (+2 more)

### Community 165 - "ticketbotStats.ts"
Cohesion: 0.18
Nodes (12): dynamic, GET(), StatsPage(), AvgRow, CountRow, EMPTY_STATS, loadTicketbotStats(), MaxRow (+4 more)

### Community 168 - "Pricing migration, 2026-09-19"
Cohesion: 0.20
Nodes (9): 1. Before anything else: find guilds that would lose hosting, 2. Stripe: six prices, created 2026-09-19, 3. The three old prices are still active, 4. Server: `.env.local`, 5. Deploy and check, Pricing migration, 2026-09-19, Status, What changed in the code (+1 more)

### Community 169 - "giveawayStats.ts"
Cohesion: 0.20
Nodes (13): dynamic, GET(), GiveawayStatsPage(), getGiveawayPool(), giveawayQuery(), giveawayQueryOne(), CountRow, EMPTY_GIVEAWAY_STATS (+5 more)

### Community 170 - "HostingSetup.tsx"
Cohesion: 0.11
Nodes (18): BotArchive, EnvValues, errorText(), FIELD_OF_ERROR, HostingJob, HostingSetup(), submit(), RunningCard() (+10 more)

### Community 172 - "cart/page.tsx"
Cohesion: 0.21
Nodes (16): CartPage(), CartDrawer(), CartLineList(), CartSummary(), CouponField(), ShoppingBag, CartLine, cartLines() (+8 more)

### Community 174 - "AddToCartButton"
Cohesion: 0.33
Nodes (3): AddToCartButton(), readStoredDiscordId(), withName()

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
Cohesion: 0.20
Nodes (9): SiteLayout(), SalePriceFetcher(), NewsPopup(), organizationJsonLd(), SaleData, isBotPath(), loadNewsPopup(), SalePricesStore (+1 more)

### Community 184 - "robots.ts"
Cohesion: 0.50
Nodes (4): BLOCKED, robots(), LANGS, isExemptPath()

### Community 185 - "GallerySearch"
Cohesion: 0.83
Nodes (4): GallerySearch(), clear(), navigate(), onChange()

### Community 186 - "adminNavLocked.test.ts"
Cohesion: 0.08
Nodes (38): dynamic, GET, dynamic, GET, dynamic, GET, dynamic, GET (+30 more)

### Community 189 - "giveawayModel.ts"
Cohesion: 0.06
Nodes (72): BonusEditor(), ChannelSelect(), DrawModeField(), DurationField(), FieldGroup(), MultiPicker(), NumberWithUnit(), PickItem (+64 more)

### Community 192 - "Features"
Cohesion: 0.67
Nodes (3): Features, Features, Tiers (`lib/tiers.ts`)

### Community 194 - "Datenbank-Migrationen"
Cohesion: 0.67
Nodes (3): Datenbank-Migrationen, Regeln, Verhältnis zu `database/schema.sql`

## Knowledge Gaps
- **875 isolated node(s):** `dynamic`, `Done`, `dynamic`, `ResultRow`, `Winner` (+870 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `legalForms.ts`, `getClientIp`, `[guildId]/route.ts`, `reveal/route.ts`, `transcript/upload/route.ts`, `imageUploads.ts`, `imageSyncCheck.ts`, `adminImages.ts`, `images.ts`, `domain/route.ts`, `botProvision.ts`, `data/route.ts`, `writeAudit`, `ticketbotStats.ts`, `adminMask.ts`, `adminNavLocked.test.ts`, `sponsors.test.ts`, `publicImageApi.test.ts`, `loadGuilds.ts`, `stripe/route.ts`, `adminAreas.test.ts`, `absoluteUrl`, `adminApi.ts`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `Lang` connect `Lang` to `[server]/sectionPage.tsx`, `productView.ts`, `ImagesArea.tsx`, `GiveawaysArea.tsx`, `ResourcesClient.tsx`, `routes.ts`, `useLang`, `lang.ts`, `cn`, `TemplatesArea.tsx`, `images.ts`, `LegalContent.tsx`, `DomainsArea.tsx`, `tiers.ts`, `ticket-bot/OverviewArea.tsx`, `LangProvider.tsx`, `getRequestLang`, `useAdminCopy`, `Footer.tsx`, `loadSession.ts`, `ticketBotAreas.test.ts`, `WithdrawalClient.tsx`, `[name]/page.tsx`, `i18n.ts`, `cart/page.tsx`, `TicketBotLanding.tsx`, `loadGuilds.ts`, `lib/tebex.ts`, `ticket-bot/stats/StatsClient.tsx`, `LocaleLink.tsx`, `categories/[id]/page.tsx`, `index.tsx`, `GiveawayProvider.tsx`, `jsonLd.ts`, `Button.tsx`, `adminApi.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `queryOne()` connect `query` to `getClientIp`, `[guildId]/route.ts`, `reveal/route.ts`, `transcript/upload/route.ts`, `imageUploads.ts`, `adminImages.ts`, `images.ts`, `domain/route.ts`, `botProvision.ts`, `url/route.ts`, `writeAudit`, `ticketbotStats.ts`, `i18n.ts`, `adminNavLocked.test.ts`, `publicImageApi.test.ts`, `stripe/route.ts`, `index.tsx`, `adminAreas.test.ts`, `adminApi.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `dynamic`, `Done`, `dynamic` to the rest of the system?**
  _875 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `legalForms.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0907103825136612 - nodes in this community are weakly interconnected._
- **Should `productView.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06394027913015254 - nodes in this community are weakly interconnected._
- **Should `getClientIp` be split into smaller, more focused modules?**
  _Cohesion score 0.08593396653098145 - nodes in this community are weakly interconnected._