import Link from 'next/link'
import {
  ArrowRight, KeyRound, LayoutDashboard, BarChart3, Ticket, ClipboardList,
  UserCheck, Flag, Star, Clock, FileText, MessageSquareText, Globe, Lock,
  Megaphone, Bell, Database, Languages, ShieldBan, Github, MessageSquare,
  Check, X, ServerCog, RefreshCw, Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { SITE_CONFIG } from '@/lib/config'
import { TIER_CONFIG, type Tier } from '@/lib/tiers'

export const metadata = {
  title:       'Discord Ticket Bot – MSK Scripts',
  description:
    'A modern, self-hosted Discord ticket bot built on Discord.js v14 and SQLite — no external database, no telemetry, full feature set out of the box. Get your API key, manage your bot and track live stats.',
}

const SPONSORS_URL = 'https://github.com/sponsors/MSK-Scripts'

const HIGHLIGHTS = ['Self-hosted', 'No telemetry', 'No external DB', 'Discord.js v14', 'German & English']

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
    text:    'Sign in with GitHub, connect your Discord account and select your server. Your personal API key is generated instantly and unlocks the MSK transcript service for your bot.',
    href:    '/verify',
    cta:     'Get API Key',
    variant: 'primary',
    accent:  true,
  },
  {
    icon:    LayoutDashboard,
    eyebrow: 'Manage',
    title:   'Dashboard',
    text:    'Set up a custom domain for your transcripts and — on Premium — fully manage a hosted bot: edit config, snippets & .env, start / stop / restart, one-click update and stream live logs.',
    href:    '/dashboard',
    cta:     'Open Dashboard',
    variant: 'outline',
    accent:  false,
  },
  {
    icon:    BarChart3,
    eyebrow: 'Insights',
    title:   'Stats',
    text:    'Browse anonymous live statistics of the MSK Ticket Bot across all servers — hosted transcripts, active API keys, tier distribution and storage usage.',
    href:    '/stats',
    cta:     'View Stats',
    variant: 'outline',
    accent:  false,
  },
]

// ── Feature highlights (from the bot README) ───────────────────────────────────

const FEATURES = [
  { icon: Ticket,            title: 'Ticket Types',        text: 'Up to 25 configurable types — each with its own emoji, color, category and questions.' },
  { icon: ClipboardList,     title: 'Questionnaires',      text: 'Modal forms with up to 5 questions shown when a ticket is opened.' },
  { icon: UserCheck,         title: 'Claim System',        text: 'Staff claim and release tickets — embed, topic and channel name update automatically.' },
  { icon: Flag,              title: 'Priorities',          text: 'Low, Medium, High or Urgent — reflected in the channel topic and opening embed.' },
  { icon: Star,              title: 'Rating System',       text: '1–5 star feedback after closing, posted automatically to a channel of your choice.' },
  { icon: Clock,             title: 'Auto-Close & Reminders', text: 'Close inactive tickets automatically and ping staff after X hours without a reply.' },
  { icon: FileText,          title: 'HTML Transcripts',    text: 'Self-contained HTML with avatars embedded as Base64 — no CDN, served via a public link.' },
  { icon: MessageSquareText, title: 'Canned Responses',    text: 'Pre-defined snippets sent with one command, with placeholders and autocomplete.' },
  { icon: Globe,             title: 'Custom Domain',       text: 'Premium servers serve transcripts under their own domain with automatic SSL.' },
  { icon: Lock,              title: 'Lock & Blacklist',    text: 'Lock a ticket to mute the user, or blacklist users from opening tickets entirely.' },
  { icon: Bell,              title: 'User Notifications',  text: 'Users can opt in to a DM when staff first replies — rate-limited to avoid spam.' },
  { icon: Megaphone,         title: 'Broadcast',           text: 'Send a single message to every open ticket channel at once.' },
]

// ── Verify flow (4 steps) ───────────────────────────────────────────────────────

const VERIFY_STEPS = [
  { n: '1', icon: Github,          title: 'Sign in with GitHub', text: 'Used to detect your sponsor tier.' },
  { n: '2', icon: MessageSquare,   title: 'Connect Discord',     text: 'Link your Discord account and servers.' },
  { n: '3', icon: ServerCog,       title: 'Select your server',  text: 'Pick the guild the bot runs on.' },
  { n: '4', icon: KeyRound,        title: 'Get your API key',    text: 'Generated instantly — drop it into .env.' },
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
  { key: 'basic',        name: 'Basic',    price: 'Free', priceSub: 'forever',  badge: null,            accent: false, hosted: false, variant: 'outline', cta: 'Get API Key',         href: '/verify' },
  { key: 'premium',      name: 'Premium',  price: '€5',   priceSub: '/ month',  badge: 'Most popular',  accent: true,  hosted: true,  variant: 'primary', cta: 'Become a Sponsor',    href: SPONSORS_URL },
  { key: 'premium_plus', name: 'Premium+', price: '€10',  priceSub: '/ month',  badge: null,            accent: false, hosted: true,  variant: 'outline', cta: 'Become a Sponsor',    href: SPONSORS_URL },
]

function tierFeatures(card: TierCard) {
  const c = TIER_CONFIG[card.key]
  return [
    { label: 'Transcript hosting & links',                    ok: true },
    { label: `Up to ${mb(c.transcriptMaxBytes)} per transcript`, ok: true },
    { label: c.attachments ? `Attachments up to ${mb(c.attachmentMaxBytes)}` : 'File attachments', ok: c.attachments },
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
            Self-hosted, built on Discord.js v14 and SQLite — no external
            database, no telemetry, full feature set out of the box. Verify to
            get your API key, run and configure your bot from the dashboard, and
            keep an eye on the live stats.
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
              <Link href="/verify">
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
                <Link href={card.href}>
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
              Everything a serious support team needs — no add-ons, no paywalled basics.
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
            <Link href="/verify">
              Start verification
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Hosted bot management ─────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
        <div className="container-page py-14 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow">Premium &amp; Premium+</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                Let us host it for you
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                Premium customers can have their bot instance fully hosted by MSK
                Scripts and manage everything from the dashboard — no SSH access
                or server knowledge required.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/dashboard">
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
                { icon: Terminal,   title: 'Config Editor',    text: 'Edit config.jsonc, snippets & .env in the browser with syntax highlighting.' },
                { icon: ServerCog,  title: 'Bot Control',      text: 'Start, stop and restart the bot with a single click.' },
                { icon: RefreshCw,  title: 'One-click Update', text: 'Pull the latest version, install deps and restart — no terminal.' },
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
            Host transcripts as public links. Premium tiers are unlocked via{' '}
            <a href={SPONSORS_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--color-primary)] hover:underline">
              GitHub Sponsors
            </a>.
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
                <Badge variant="primary" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {card.badge}
                </Badge>
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
                  <Link href={card.href}>
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
              Verify your account to grab your API key — it only takes a minute.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/verify">
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
