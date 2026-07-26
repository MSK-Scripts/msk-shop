# Graph Report - .  (2026-07-21)

## Corpus Check
- 39 files · ~317,462 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1055 nodes · 1963 edges · 105 communities (78 shown, 27 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Header.tsx
- adminApi.ts
- giveawaySession.ts
- devDependencies
- botDashboardProxy.ts
- dependencies
- Tebex API Reference (5 HTTP APIs)
- ResourcesClient.tsx
- compilerOptions
- cn()
- queryOne()
- Button.tsx
- adminAuth.ts
- DashboardClient.tsx
- route.ts
- route.ts
- markdown.ts
- LangProvider.tsx
- Lang
- adminSession.ts
- db.ts
- Input.tsx
- sessions.test.ts
- session.ts
- page.tsx
- Card.tsx
- middleware.ts
- DashboardClient.tsx
- page.tsx
- Card
- Tier
- CI Workflow
- PaymentsTab.tsx
- route.ts
- i18n.ts
- page.tsx
- VerifyClient.tsx
- stripe-reconcile.js
- ApiKeysTab.tsx
- StatsClient.tsx
- BotConfigEditor.tsx
- sanitize.ts
- cleanup.js
- route.ts
- parseSession()
- repair-transcript-images.js
- auth.ts
- route.ts
- route.ts
- TranscriptsCard.tsx
- eslint.config.mjs
- Push to Codeberg Job
- tiers.ts
- LookupTab.tsx
- route.ts
- route.ts
- MSK Scripts Logo
- MSK Forms Landing Hero
- MSK Scripts Documentation & Guides Banne
- route.ts
- route.ts
- route.ts
- route.ts
- Contributing Guide
- auth.ts
- Kanbanly Hero Graphic
- deploy.sh
- vhost-create.sh
- Dependabot Config
- Bug Report Issue Template
- Deploy Workflow
- next.config.js
- vhost-delete.sh
- tailwind.config.ts
- getTebexAuth
- DELETE
- GET
- HEAD
- OPTIONS
- PATCH
- POST
- PUT
- Auto Release Workflow
- Discord Ticket Bot Marketing Banner
- Discord Giveaway Bot Marketing Banner
- Banner Image

## God Nodes (most connected - your core abstractions)
1. `cn()` - 39 edges
2. `Button` - 34 edges
3. `Card` - 30 edges
4. `useLang()` - 25 edges
5. `query()` - 25 edges
6. `useCart()` - 20 edges
7. `queryOne()` - 19 edges
8. `adminRoute()` - 17 edges
9. `Tier` - 17 edges
10. `Lang` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GuildRow` --references--> `Tier`  [EXTRACTED]
  app/api/verify/check-guild/route.ts → lib/tiers.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  app/giveaway/stats/StatsClient.tsx → lib/utils.ts
- `RootLayout()` --calls--> `resolveLang()`  [EXTRACTED]
  app/layout.tsx → lib/lang.ts
- `HomePage()` --calls--> `resolveLang()`  [EXTRACTED]
  app/page.tsx → lib/lang.ts
- `ResourcesClient()` --calls--> `useLang()`  [EXTRACTED]
  app/resources/ResourcesClient.tsx → components/i18n/LangProvider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Main/PR Quality-Gate Workflows** — github_workflows_ci_ci, github_workflows_code_coverage_code_coverage, github_workflows_codeql_codeql_advanced [INFERRED 0.75]
- **CI/CD Pipeline (CI gates Deploy)** — github_workflows_deploy, github_workflows_dependency_review [INFERRED 0.75]
- **Contribution Governance Docs** — contributing, code_of_conduct, github_pull_request_template, github_issue_template_bug_report, github_issue_template_feature_request [INFERRED 0.75]
- **Tebex admin dashboard: Plugin API behind own Discord-ID permission gate + audit** — docs_admin_dashboard_plan, docs_admin_dashboard_permissions, docs_admin_dashboard_schema, docs_tebex_api_reference_plugin_api [EXTRACTED 0.90]
- **CI-gated server-side git deploy via ForceCommand-pinned key** — readme_ci_cd_deploy, docs_deployment_deploy_sh, docs_deployment_forcecommand_key [EXTRACTED 0.90]
- **Payment providers: Tebex (shop MoR) + Stripe (Ticket Bot subscriptions)** — content_legal_entity_tebex, content_legal_entity_stripe, content_legal_imprint, content_legal_privacy [EXTRACTED 0.85]

## Communities (105 total, 27 thin omitted)

### Community 0 - "Header.tsx"
Cohesion: 0.06
Nodes (60): GET, CartPage(), generateMetadata(), generateStaticParams(), PackageDetailPage(), metadata, PackagesPage(), CartDrawer() (+52 more)

### Community 1 - "adminApi.ts"
Cohesion: 0.07
Nodes (41): AuditRow, GET, GET, POST, DELETE, GET, POST, DELETE (+33 more)

### Community 2 - "giveawaySession.ts"
Cohesion: 0.07
Nodes (39): ACTION_PATH, POST(), ADMINISTRATOR, GET(), isAdmin(), ALLOWED, GET(), GwListItem (+31 more)

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (45): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss (+37 more)

### Community 4 - "botDashboardProxy.ts"
Cohesion: 0.10
Nodes (33): GET(), POST(), GET(), parseDate(), parsePositiveInt(), TranscriptRow, bounce(), handle() (+25 more)

### Community 5 - "dependencies"
Cohesion: 0.05
Nodes (39): clsx, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, js-cookie, lucide-react, mysql2, next, next-themes (+31 more)

### Community 6 - "Tebex API Reference (5 HTTP APIs)"
Cohesion: 0.07
Nodes (39): fivestats.io (resource stats, server-side only), Moritz Kohm (data controller / licensor), netcup GmbH (hosting processor), Stripe Payments Europe, Ltd. (subscriptions), Tebex Limited (payment MoR, UK), Imprint (EN), Impressum (DE), Privacy Policy (EN, GDPR) (+31 more)

### Community 7 - "ResourcesClient.tsx"
Cohesion: 0.10
Nodes (24): GET(), metadata, ResourcesPage(), formatNum(), formatSigned(), ResourceCard(), ResourcesClient(), TrendBadge() (+16 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 9 - "cn()"
Cohesion: 0.14
Nodes (17): StatusBadge(), DashboardClient(), VerifyClient(), VerifyClient(), useLang(), LanguageDropdown(), languages, LegalContent() (+9 more)

### Community 10 - "queryOne()"
Cohesion: 0.13
Nodes (18): AvgRow, CountRow, GET(), MaxRow, SumRow, TierRow, AvgRow, CountRow (+10 more)

### Community 11 - "Button.tsx"
Cohesion: 0.13
Nodes (9): ERROR_MESSAGES, metadata, Guild, Button, ButtonProps, ButtonSize, ButtonVariant, sizeClasses (+1 more)

### Community 12 - "adminAuth.ts"
Cohesion: 0.20
Nodes (14): AdminClient(), ALL_TABS, TabDef, Member, AdminCtx, AdminAuthResult, AdminTeamRow, ADMIN_PERMISSIONS (+6 more)

### Community 13 - "DashboardClient.tsx"
Cohesion: 0.16
Nodes (17): Channel, CreateForm(), Ctx, Dict, EditButton(), ExtendButton(), Giveaway, GiveawaysTab() (+9 more)

### Community 14 - "route.ts"
Cohesion: 0.20
Nodes (13): ALLOWED_ACTIONS, authHosted(), botDir(), execAsync, GET(), POST(), authHosted(), GET() (+5 more)

### Community 15 - "route.ts"
Cohesion: 0.23
Nodes (15): AttachmentInput, checkRateLimit(), GuildRow, isValidGuild(), POST(), RateLimitRow, reencodeImage(), RequestBody (+7 more)

### Community 16 - "markdown.ts"
Cohesion: 0.22
Nodes (14): ImprintPage(), metadata, metadata, TermsPage(), metadata, PrivacyPage(), ALLOWED_SLUGS, getLegalContent() (+6 more)

### Community 17 - "LangProvider.tsx"
Cohesion: 0.16
Nodes (11): metadata, RootLayout(), viewport, LangContext, LangProvider(), ECOSYSTEM_LINKS, Footer(), NextThemesProviderProps (+3 more)

### Community 18 - "Lang"
Cohesion: 0.20
Nodes (10): HomePage(), CTASection(), Hero(), Kpi, TrustBar(), WhyMSK(), LangContextValue, HOME_FEATURE_ICONS (+2 more)

### Community 19 - "adminSession.ts"
Cohesion: 0.23
Nodes (10): AdminPage(), GET(), authorizeAdmin(), loadAdminMember(), AdminSession, getSecret(), parseAdminSession(), signAdminSession() (+2 more)

### Community 20 - "db.ts"
Cohesion: 0.22
Nodes (12): authorized(), POST(), authorized(), POST(), ResultRow, WinnerIn, getPool(), query() (+4 more)

### Community 21 - "Input.tsx"
Cohesion: 0.17
Nodes (4): BanEntry, GiftCard, Package, Input

### Community 22 - "sessions.test.ts"
Cohesion: 0.25
Nodes (9): GuildRow, POST(), DashboardPage(), metadata, DashboardSession, getSecret(), parseDashboardSession(), signDashboardSession() (+1 more)

### Community 23 - "session.ts"
Cohesion: 0.27
Nodes (9): GET(), ADMINISTRATOR, GET(), isAdmin(), GET(), DiscordGuild, generateState(), getSecret() (+1 more)

### Community 24 - "page.tsx"
Cohesion: 0.24
Nodes (10): GiveawayResultPage(), metadata, parseWinners(), ResultRow, Winner, giveawayResultTranslations, isSupportedLang(), parseAcceptLanguage() (+2 more)

### Community 25 - "Card.tsx"
Cohesion: 0.22
Nodes (10): CustomPackages(), resolveImageSrc(), CardContent, CardDescription, CardFooter, CardHeader, CardProps, CardTitle (+2 more)

### Community 26 - "middleware.ts"
Cohesion: 0.22
Nodes (12): BODY_LIMIT_PREFIXES, BOT_DASHBOARD_HOST, Bucket, buckets, clientIp(), config, isRateLimited(), middleware() (+4 more)

### Community 27 - "DashboardClient.tsx"
Cohesion: 0.18
Nodes (9): BotConfigEditor, DashboardClient(), GuildPanel(), Props, safeDomainHref(), T, TabKey, TIER_COLORS (+1 more)

### Community 28 - "page.tsx"
Cohesion: 0.20
Nodes (11): FEATURES, HIGHLIGHTS, HUB_CARDS, HubCard, mb(), metadata, TicketBotPage(), TIER_CARDS (+3 more)

### Community 29 - "Card"
Cohesion: 0.20
Nodes (3): AuditEntry, CheckoutContent(), Card

### Community 30 - "Tier"
Cohesion: 0.24
Nodes (8): generateApiKey(), GuildRow, POST(), GuildRow, Guild, DashboardGuild, TierCard, Tier

### Community 31 - "CI Workflow"
Cohesion: 0.18
Nodes (11): CI Build Job, CI Workflow, Dependabot Secret Fallback in CI Build, CI Lint Job, CI Test Job, CI Typecheck Job, Code Coverage Workflow, Coverage Job (+3 more)

### Community 32 - "PaymentsTab.tsx"
Cohesion: 0.20
Nodes (5): CatalogItem, Coupon, CatalogPackage, PAGE_SIZES, Payment

### Community 33 - "route.ts"
Cohesion: 0.40
Nodes (8): applySubscription(), downgradeGuild(), GuildIdRow, POST(), resolveInvoiceSubscriptionId(), upsertCustomer(), execFileAsync, teardownCustomDomain()

### Community 34 - "i18n.ts"
Cohesion: 0.27
Nodes (8): Breakdown(), BreakdownItem, formatNum(), StatCard(), StatsClient(), giveawayDashboardTranslations, giveawayStatsTranslations, TranslationKey

### Community 35 - "page.tsx"
Cohesion: 0.22
Nodes (7): CommandRow, COMMANDS, FEATURES, HIGHLIGHTS, metadata, SETTINGS, STEPS

### Community 36 - "VerifyClient.tsx"
Cohesion: 0.22
Nodes (5): Props, StepIndicator(), TIER_LABELS, translations, VerifySession

### Community 37 - "stripe-reconcile.js"
Cohesion: 0.31
Nodes (8): DRY_RUN, { execFile }, execFileAsync, isActiveStatus(), main(), mysql, { promisify }, resolveTierFromPrice()

### Community 38 - "ApiKeysTab.tsx"
Cohesion: 0.32
Nodes (7): ApiKey, ApiKeysTab(), maskKey(), Tier, TIER_LABELS, TIER_ORDER, tierBadgeClass()

### Community 39 - "StatsClient.tsx"
Cohesion: 0.36
Nodes (7): formatBytes(), formatNum(), StatCard(), Stats, StatsClient(), TierBreakdown(), statsTranslations

### Community 40 - "BotConfigEditor.tsx"
Cohesion: 0.29
Nodes (5): BotConfigEditor(), BotStatus, logLineClass(), Msg, dashboardTranslations

### Community 41 - "sanitize.ts"
Cohesion: 0.39
Nodes (6): convertPipeTables(), EMOJI, OPTIONS, replaceEmojiShortcodes(), sanitizeTebexHtml(), splitPipeRow()

### Community 42 - "cleanup.js"
Cohesion: 0.29
Nodes (7): { execFile }, execFileAsync, main(), mysql, path, { promisify }, { rm, readdir, stat }

### Community 43 - "route.ts"
Cohesion: 0.33
Nodes (4): GET, POST, TeamRow, TEAM_MANAGE

### Community 44 - "parseSession()"
Cohesion: 0.38
Nodes (5): GuildRow, POST(), metadata, VerifyPage(), parseSession()

### Community 45 - "repair-transcript-images.js"
Cohesion: 0.38
Nodes (6): filenameFromUrl(), main(), mysql, parseArgs(), path, { readFile, writeFile }

### Community 47 - "route.ts"
Cohesion: 0.40
Nodes (3): IncidentsResponse, SEVERITY, StatusResponse

### Community 48 - "route.ts"
Cohesion: 0.50
Nodes (4): extractApiKey(), GET(), GuildRow, UrlRow

### Community 49 - "TranscriptsCard.tsx"
Cohesion: 0.60
Nodes (4): formatBytes(), safeUrl(), TranscriptItem, TranscriptsCard()

### Community 50 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 51 - "Push to Codeberg Job"
Cohesion: 0.40
Nodes (5): Codeberg Mirror Secrets, Mirror Runs Only on Main and Tags, Mirror to Codeberg Workflow, Prune-Based Exact Mirror, Push to Codeberg Job

### Community 52 - "tiers.ts"
Cohesion: 0.60
Nodes (3): getExpiresAt(), TIER_CONFIG, TierConfig

### Community 54 - "route.ts"
Cohesion: 0.83
Nodes (3): checkDns(), execFileAsync, POST()

### Community 55 - "route.ts"
Cohesion: 0.83
Nodes (3): checkDns(), execFileAsync, POST()

### Community 56 - "MSK Scripts Logo"
Cohesion: 1.00
Nodes (4): MSK Scripts Logo, MSK Core Banner, MSK Scripts Documentation Banner, MSK EngineToggle Banner

### Community 57 - "MSK Forms Landing Hero"
Cohesion: 1.00
Nodes (4): MSK Forms Landing Hero, MSK Handcuffs Banner, Discord Multi Bot Banner, MSK Paste Pastebin UI

### Community 58 - "MSK Scripts Documentation & Guides Banne"
Cohesion: 0.67
Nodes (4): MSK Scripts Documentation & Guides Banner, MSK Scripts FiveM Scripts & More Banner, MSK URL Shortener Hero Screenshot, MSK VehicleKeys Product Banner

### Community 63 - "Contributing Guide"
Cohesion: 0.67
Nodes (3): Code of Conduct (Contributor Covenant), Contributing Guide, Pull Request Template

### Community 65 - "Kanbanly Hero Graphic"
Cohesion: 1.00
Nodes (3): Kanbanly Hero Graphic, Kanbanly Product Banner, Kanbanly Logo (Wordmark)

## Knowledge Gaps
- **314 isolated node(s):** `AuditEntry`, `BanEntry`, `Coupon`, `CatalogItem`, `GiftCard` (+309 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Card` connect `Card` to `PaymentsTab.tsx`, `Header.tsx`, `i18n.ts`, `VerifyClient.tsx`, `ResourcesClient.tsx`, `StatsClient.tsx`, `Button.tsx`, `DashboardClient.tsx`, `TranscriptsCard.tsx`, `Lang`, `LookupTab.tsx`, `Input.tsx`, `page.tsx`, `Card.tsx`, `DashboardClient.tsx`, `page.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `Button` connect `Button.tsx` to `PaymentsTab.tsx`, `Header.tsx`, `VerifyClient.tsx`, `ResourcesClient.tsx`, `cn()`, `DashboardClient.tsx`, `TranscriptsCard.tsx`, `Lang`, `LangProvider.tsx`, `LookupTab.tsx`, `Input.tsx`, `Card.tsx`, `DashboardClient.tsx`, `page.tsx`, `Card`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `queryOne()` connect `queryOne()` to `adminApi.ts`, `botDashboardProxy.ts`, `parseSession()`, `adminAuth.ts`, `route.ts`, `adminSession.ts`, `db.ts`, `sessions.test.ts`, `page.tsx`, `Tier`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `AuditEntry`, `BanEntry`, `Coupon` to the rest of the system?**
  _314 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05616509926854754 - nodes in this community are weakly interconnected._
- **Should `adminApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07117255504352278 - nodes in this community are weakly interconnected._
- **Should `giveawaySession.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06748911465892599 - nodes in this community are weakly interconnected._