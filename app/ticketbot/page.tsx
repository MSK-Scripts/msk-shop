import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, KeyRound, LayoutDashboard, BarChart3, Ticket, ClipboardList,
  UserCheck, Flag, Star, Clock, FileText, MessageSquareText, Globe, Lock,
  Megaphone, Bell, Github, MessageSquare,
  Check, X, ServerCog, RefreshCw, Terminal, RotateCcw, Database,
  ShieldCheck, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { SITE_CONFIG } from '@/lib/config'
import { TIER_CONFIG, type Tier } from '@/lib/tiers'

export const metadata: Metadata = {
  title: { absolute: 'Discord Ticket Bot – Self-Hosted Support Tickets | MSK Scripts' },
  description:
    'Free, self-hosted Discord ticket bot built on Discord.js v14. It runs on SQLite, MySQL/MariaDB or PostgreSQL. Custom ticket types, claim system, HTML transcripts, ratings, auto-close and a hosted dashboard. Get your API key in minutes.',
  keywords: [
    'Discord ticket bot', 'Discord support bot', 'self-hosted ticket bot',
    'Discord.js ticket system', 'ticket transcripts', 'open source ticket bot',
    'free ticket bot', 'Discord tickets', 'MSK Scripts',
  ],
  alternates: { canonical: '/ticketbot' },
  openGraph: {
    type:        'website',
    siteName:    'MSK Scripts',
    url:         '/ticketbot',
    title:       'Discord Ticket Bot – Self-Hosted Support Tickets',
    description:
      'Free, self-hosted Discord ticket bot: custom ticket types, claim system, HTML transcripts, ratings, auto-close and a hosted management dashboard.',
    images: [{ url: '/discord_ticketbot_banner.png', alt: 'MSK Discord Ticket Bot' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Discord Ticket Bot – Self-Hosted Support Tickets',
    description:
      'Free, self-hosted Discord ticket bot built on Discord.js v14: SQLite, MySQL or PostgreSQL, tickets, transcripts, ratings and a hosted dashboard.',
    images: ['/discord_ticketbot_banner.png'],
  },
}

const HIGHLIGHTS = ['Self-hosted', 'No telemetry', 'SQLite · MySQL · PostgreSQL', 'Discord.js v14', 'German & English']

// ── Hub cards: Verify · Dashboard · Stats ──────────────────────────────────────

interface HubCard {
  icon:    React.ElementType
  eyebrow: string
  title:   string
  text:    string
  href:    string
  cta:     string
  variant: 'primary' | 'outline'
  accent:  boolean
}

const HUB_CARDS: HubCard[] = [
  {
    icon:    KeyRound,
    eyebrow: 'Step 1',
    title:   'Verify',
    text:    'Sign in with Discord and select your server. Your personal API key is generated instantly and unlocks the MSK transcript service for your bot.',
    href:    '/ticketbot/verify',
    cta:     'Get API Key',
    variant: 'primary',
    accent:  true,
  },
  {
    icon:    LayoutDashboard,
    eyebrow: 'Manage',
    title:   'Dashboard',
    text:    'Set up a custom domain for your transcripts and, on Premium, fully manage a hosted bot: edit config, snippets, .env & language files, start / stop / restart, one-click update and stream live logs.',
    href:    '/ticketbot/dashboard',
    cta:     'Open Dashboard',
    variant: 'outline',
    accent:  false,
  },
  {
    icon:    BarChart3,
    eyebrow: 'Insights',
    title:   'Stats',
    text:    'Browse anonymous live statistics of the MSK Ticket Bot across all servers: hosted transcripts, active API keys, tier distribution and storage usage.',
    href:    '/ticketbot/stats',
    cta:     'View Stats',
    variant: 'outline',
    accent:  false,
  },
]

// ── Feature highlights (from the bot README) ───────────────────────────────────

const FEATURES = [
  { icon: Ticket,            title: 'Ticket Types',        text: 'Up to 25 configurable types, each with its own emoji, color, category and questions.' },
  { icon: ClipboardList,     title: 'Questionnaires',      text: 'Modal forms with up to 5 questions shown when a ticket is opened.' },
  { icon: UserCheck,         title: 'Claim System',        text: 'Staff claim and release tickets. Embed, topic and channel name update automatically.' },
  { icon: Flag,              title: 'Priorities',          text: 'Low, Medium, High or Urgent, predefined per ticket type or set live via /priority, reflected in the channel topic and opening embed.' },
  { icon: Star,              title: 'Rating System',       text: '1–5 star feedback after closing, posted automatically to a channel of your choice.' },
  { icon: Clock,             title: 'Auto-Close & Reminders', text: 'Close inactive tickets automatically and ping staff after X hours without a reply.' },
  { icon: FileText,          title: 'HTML Transcripts',    text: 'Self-contained HTML with avatars embedded as Base64, no CDN needed, served via a public link.' },
  { icon: MessageSquareText, title: 'Canned Responses',    text: 'Pre-defined snippets sent with one command, with placeholders and autocomplete.' },
  { icon: Globe,             title: 'Custom Domain',       text: 'Premium servers serve transcripts under their own domain with automatic SSL.' },
  { icon: Lock,              title: 'Lock & Blacklist',    text: 'Lock a ticket to mute the user, or blacklist users from opening tickets entirely.' },
  { icon: RotateCcw,         title: 'Reopen Tickets',      text: 'Reopen a closed ticket with one click or /reopen. It restores access and moves the ticket back, so you never have to recreate it.' },
  { icon: Bell,              title: 'User Notifications',  text: 'Users can opt in to a DM when staff first replies, rate-limited to avoid spam.' },
  { icon: Megaphone,         title: 'Broadcast',           text: 'Send a single message to every open ticket channel at once.' },
  { icon: Database,          title: 'Flexible Database',   text: 'Runs on SQLite with zero setup, or connect your own MySQL, MariaDB or PostgreSQL, with a migration script to move existing data.' },
  { icon: LayoutDashboard,   title: 'Self-Hosted Dashboard', text: 'Optional built-in web dashboard to manage tickets, stats, config and the bot itself from the browser. Disabled by default, secure by default.' },
]

// ── Verify flow (4 steps) ───────────────────────────────────────────────────────

const VERIFY_STEPS = [
  { n: '1', icon: MessageSquare,   title: 'Connect Discord',     text: 'Link your Discord account and servers.' },
  { n: '2', icon: ServerCog,       title: 'Select your server',  text: 'Pick the guild the bot runs on.' },
  { n: '3', icon: KeyRound,        title: 'Get your API key',    text: 'Generated instantly, just drop it into .env.' },
]

// ── Tiers (limits sourced from lib/tiers.ts) ────────────────────────────────────

const mb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`

interface TierCard {
  key:      Tier
  name:     string
  price:    string
  priceSub: string
  badge:    string | null
  accent:   boolean
  hosted:   boolean
  variant:  'primary' | 'outline'
  cta:      string
  href:     string
}

const TIER_CARDS: TierCard[] = [
  { key: 'basic',        name: 'Basic',    price: 'Free',   priceSub: 'forever',  badge: null,            accent: false, hosted: false, variant: 'outline', cta: 'Get API Key',     href: '/ticketbot/verify' },
  { key: 'premium',      name: 'Premium',  price: '€3.99',  priceSub: '/ month',  badge: 'Most popular',  accent: true,  hosted: true,  variant: 'primary', cta: 'Start free trial', href: '/ticketbot/verify' },
  { key: 'premium_plus', name: 'Premium+', price: '€6.99',  priceSub: '/ month',  badge: null,            accent: false, hosted: true,  variant: 'outline', cta: 'Start free trial', href: '/ticketbot/verify' },
]

function tierFeatures(card: TierCard) {
  const c = TIER_CONFIG[card.key]
  return [
    { label: 'Transcript hosting & links',                    ok: true },
    { label: `Up to ${mb(c.transcriptMaxBytes)} per transcript`, ok: true },
    { label: c.attachments ? `Attachments up to ${mb(c.attachmentMaxBytes)} per ticket` : 'File attachments', ok: c.attachments },
    { label: 'Custom domain',                                 ok: c.customDomain },
    { label: `${c.storageDays} days storage`,                 ok: true },
    { label: `${c.uploadsPerHour} uploads / hour`,            ok: true },
    { label: 'Hosted bot management',                         ok: card.hosted },
  ]
}

export default function TicketBotPage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />

        <div className="container-page relative py-16 text-center md:py-20 lg:py-24">
          <Badge variant="primary" className="mb-6">
            <Ticket className="h-3.5 w-3.5" />
            Discord Ticket Bot
          </Badge>

          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            A modern{' '}
            <span className="text-[var(--color-primary)]">ticket system</span>
            {' '}for your Discord
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-[var(--color-muted-foreground)] md:text-xl">
            Self-hosted, built on Discord.js v14. It runs on SQLite out of the
            box or your own MySQL, MariaDB or PostgreSQL. No telemetry, full
            feature set out of the box. Verify to get your API key, run and
            configure your bot from the dashboard, and keep an eye on the live
            stats.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {HIGHLIGHTS.map(h => (
              <span
                key={h}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]"
              >
                <Check className="h-3 w-3 text-[var(--color-primary)]" />
                {h}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/ticketbot/verify" prefetch={false}>
                Get API Key
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={SITE_CONFIG.docs} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                Documentation
              </a>
            </Button>
            <Button asChild size="lg" variant="discord">
              <a href={SITE_CONFIG.discord} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4" />
                Join Discord
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Hub cards: Verify · Dashboard · Stats ─────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">Get started</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Everything in three steps
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            Verify your account, manage your bot and track its usage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {HUB_CARDS.map(card => (
            <Card key={card.href} hoverLift className="flex flex-col p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className={
                  card.accent
                    ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                    : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }>
                  <card.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                  {card.eyebrow}
                </span>
              </div>

              <h3 className="mb-2 text-xl font-bold tracking-tight">{card.title}</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {card.text}
              </p>

              <Button asChild variant={card.variant} className="w-full">
                <Link
                  href={card.href}
                  prefetch={card.href.startsWith('/ticketbot/dashboard') || card.href.startsWith('/ticketbot/verify') ? false : undefined}
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Feature highlights ────────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
        <div className="container-page py-14 md:py-20">
          <div className="mb-10 text-center">
            <span className="eyebrow">Features</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              A full feature set out of the box
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
              Everything a serious support team needs. No add-ons, no paywalled basics.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="mb-1.5 font-bold tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Verify flow ───────────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">How verification works</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Your API key in under a minute
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VERIFY_STEPS.map(step => (
            <div key={step.n} className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <span className="absolute right-4 top-4 font-mono text-3xl font-bold leading-none text-[var(--color-border)]">
                {step.n}
              </span>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                <step.icon className="h-4 w-4" />
              </div>
              <h3 className="mb-1.5 font-bold tracking-tight">{step.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {step.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/ticketbot/verify" prefetch={false}>
              Start verification
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Self-hosted dashboard ─────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)]">
        <div className="container-page py-14 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow">New &middot; self-hosted</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                A web dashboard, right in your bot
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                Start the bot with{' '}
                <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.8125rem] text-[var(--color-foreground)]">npm run dashboard</code>
                {' '}and manage everything from the browser instead of over SSH:
                tickets, statistics, the full config and the bot process itself. It
                ships with the bot and works on every tier, including the free one.
                It stays fully optional:{' '}
                <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.8125rem] text-[var(--color-foreground)]">npm start</code>
                {' '}keeps running the plain bot with no web server at all.
              </p>
              <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                <span>
                  Secure by default: off until you enable it, bound to localhost so
                  it is never exposed by accident, and it refuses to start on a
                  public interface without HTTPS. Login is Discord OAuth, access is
                  granted per role and per user, and every change is written to an
                  audit log.
                </span>
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <a href={`${SITE_CONFIG.docs}/discord/discord_ticketbot/dashboard`} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                    Dashboard docs
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { icon: LayoutDashboard,   title: 'Tickets & Stats',   text: 'Browse and filter tickets, claim, close, reopen, move and reply, with live team statistics.' },
                { icon: Terminal,          title: 'Config & Locales',  text: 'Edit config.jsonc, snippets, .env and the language files in a form or raw view with syntax highlighting.' },
                { icon: Users,             title: 'Permissions',       text: 'Grant dashboard access per role or per user, each with fine-grained rights, backed by an audit log.' },
                { icon: UserCheck,         title: 'Reply as yourself', text: 'Answers you send from the dashboard appear in Discord under your own name and avatar, not the bot.' },
              ].map(item => (
                <div key={item.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold tracking-tight">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Hosted bot management ─────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
        <div className="container-page py-14 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow">Premium &amp; Premium+</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                Or let us host it for you
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                Prefer not to run a server at all? Premium customers can have their
                bot instance fully hosted by MSK Scripts and manage everything from
                the same dashboard. No SSH access or server knowledge required.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/ticketbot/dashboard" prefetch={false}>
                    <LayoutDashboard className="h-4 w-4" />
                    Open Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <a href={SITE_CONFIG.discord} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-4 w-4" />
                    Request hosting
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { icon: Terminal,   title: 'Config Editor',    text: 'Edit config.jsonc, snippets, .env & the active language file in the browser with syntax highlighting.' },
                { icon: ServerCog,  title: 'Bot Control',      text: 'Start, stop and restart the bot with a single click.' },
                { icon: RefreshCw,  title: 'One-click Update', text: 'Pull the latest version, install deps and restart, no terminal needed.' },
                { icon: FileText,   title: 'Live Log Console', text: 'Real-time stream of the bot output right in the dashboard.' },
              ].map(item => (
                <div key={item.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold tracking-tight">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tiers / pricing ───────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">Transcript service</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Choose your tier
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            Host transcripts as public links. Premium tiers come with a{' '}
            <span className="font-medium text-[var(--color-primary)]">14-day free trial</span>
            . Cancel anytime, billed monthly afterwards.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIER_CARDS.map(card => (
            <Card
              key={card.key}
              hoverLift
              className={
                card.accent
                  ? 'relative flex flex-col p-6 ring-2 ring-[var(--color-primary)]'
                  : 'relative flex flex-col p-6'
              }
            >
              {card.badge && (
                <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--color-primary)] px-3 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-primary-foreground)] shadow-sm">
                  {card.badge}
                </span>
              )}

              <h3 className="text-lg font-bold tracking-tight">{card.name}</h3>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-bold tracking-tight">{card.price}</span>
                <span className="text-sm text-[var(--color-muted-foreground)]">{card.priceSub}</span>
              </div>

              <ul className="mt-6 mb-6 flex-1 space-y-2.5">
                {tierFeatures(card).map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    {f.ok ? (
                      <Check className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                    )}
                    <span className={f.ok ? '' : 'text-[var(--color-muted-foreground)] line-through'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Button asChild variant={card.variant} className="w-full">
                {card.href.startsWith('/') ? (
                  <Link
                    href={card.href}
                    prefetch={card.href.startsWith('/ticketbot/dashboard') || card.href.startsWith('/ticketbot/verify') ? false : undefined}
                  >
                    {card.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <a href={card.href} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                    {card.cta}
                  </a>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* Per-guild note */}
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-4 rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/[0.04] p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
            <ServerCog className="h-5 w-5" />
          </div>
          <div>
            <h3 className="mb-1 font-bold tracking-tight">Plans are per guild</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              A subscription applies to a single Discord server. Each guild you manage has its own plan,
              upgrade them independently from each guild&rsquo;s dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="container-page pb-14 md:pb-20">
        <Card className="relative overflow-hidden p-8 text-center md:p-12">
          <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Ready to set up your ticket bot?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--color-muted-foreground)] md:text-base">
              Verify your account to grab your API key, it only takes a minute.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/ticketbot/verify" prefetch={false}>
                  Get API Key
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={SITE_CONFIG.docs} target="_blank" rel="noopener noreferrer">
                  Read the Docs
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
