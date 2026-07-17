import type { Metadata } from 'next'
import {
  Gift, Sparkles, RefreshCw, Globe, Palette, Layers,
  Shield, Users, PauseCircle, ScrollText, ClipboardList, Star,
  Check, MessageSquare, FileText, Github, Terminal, UserCheck,
  CalendarClock, ListChecks, Mail, Bell, Pencil,
  LayoutDashboard, Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { SITE_CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: { absolute: 'Discord Giveaway Bot – Restart-Safe & Multilingual | MSK Scripts' },
  description:
    'Free Discord giveaway bot built on Discord.js v14. Button entry, restart-safe scheduling, weighted bonus entries, eligibility rules, templates, reroll and pause/resume. Invite the official instance in one click.',
  keywords: [
    'Discord giveaway bot', 'Discord giveaway', 'giveaway bot', 'button entry giveaway',
    'Discord.js giveaway', 'multilingual giveaway bot', 'free giveaway bot',
    'weighted giveaway entries', 'MSK Scripts',
  ],
  alternates: { canonical: '/giveaway' },
  openGraph: {
    type:        'website',
    siteName:    'MSK Scripts',
    url:         '/giveaway',
    title:       'Discord Giveaway Bot – Restart-Safe & Multilingual',
    description:
      'Free Discord giveaway bot: button entry, restart-safe scheduling, weighted bonus entries, eligibility rules, templates, reroll and pause/resume.',
    // images: [{ url: '/msk_multibot_banner.png', alt: 'MSK Discord Giveaway Bot' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Discord Giveaway Bot – Restart-Safe & Multilingual',
    description:
      'Free Discord giveaway bot built on Discord.js v14 — button entry, weighted entries, eligibility rules, templates and reroll.',
    // images: ['/msk_multibot_banner.png'],
  },
}

const INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1512465732179329065&scope=bot+applications.commands&permissions=478208'
const GITHUB_URL = 'https://github.com/MSK-Scripts/discord_giveawaybot'

const HIGHLIGHTS = ['Free to invite', 'Restart-safe', 'Multilingual', 'Discord.js v14', 'No privileged intents']

// ── Feature highlights (from the bot README) ──────────────────────────────────

const FEATURES = [
  { icon: Gift,         title: 'Button Entry',        text: 'Members join with a single click — no reactions, no spam. Customisable emoji, label and button style.' },
  { icon: RefreshCw,    title: 'Restart-Safe',        text: 'A poll-based scheduler means no giveaway is ever lost or orphaned, even after a full server reboot.' },
  { icon: Users,        title: 'Weighted Bonus Entries', text: 'Grant specific roles extra entries (up to 100) for a fairer or reward-driven draw.' },
  { icon: Shield,       title: 'Eligibility Rules',   text: 'Whitelist / blacklist roles — server-wide or scoped to a single giveaway — plus minimum account age and server membership.' },
  { icon: PauseCircle,  title: 'Pause & Resume',      text: 'Freeze the timer mid-giveaway if something goes wrong, then resume seamlessly where you left off.' },
  { icon: Layers,       title: 'Templates',           text: 'Save and reuse giveaway configurations — perfect for recurring weekly or event giveaways.' },
  { icon: Sparkles,     title: 'Reroll Winners',      text: 'Redraw all winners — or replace a single winner — for any ended giveaway.' },
  { icon: Mail,         title: 'Winner DMs',          text: 'Winners get a DM with the prize, your claim instructions and a link to the giveaway.' },
  { icon: Bell,         title: 'Ending-Soon Reminders', text: 'Automatically remind your members a configurable time before a giveaway ends.' },
  { icon: Pencil,       title: 'Edit & Extend',       text: 'Adjust a running giveaway or extend its end time on the fly — no need to recreate it.' },
  { icon: LayoutDashboard, title: 'Web Dashboard',    text: 'Create and fully manage your giveaways and settings from the browser — log in with Discord, no commands required.' },
  { icon: Trophy,       title: 'Public Results Pages', text: 'Every finished giveaway gets a clean, shareable results page showing the winners and the participant count.' },
  { icon: Globe,        title: 'Multilingual',        text: 'English, German, French and Spanish built in — pick the language per server.' },
  { icon: Palette,      title: 'Per-Guild Branding',  text: 'Custom embed colour, button emoji and style so every giveaway matches your community.' },
  { icon: ScrollText,   title: 'Audit Logging',       text: 'Optional log channel records every giveaway event — created, ended, rerolled and more.' },
  { icon: UserCheck,    title: 'Manager Role',        text: 'Delegate giveaway control to a dedicated role without handing out Manage Server.' },
  { icon: Shield,       title: 'Least-Privilege',     text: 'Only the Guilds intent and minimal permissions — no message-content access, firewall friendly.' },
]

// ── Commands (from the README command table) ──────────────────────────────────

interface CommandRow {
  cmd:    string
  who:    string
  text:   string
}

const COMMANDS: CommandRow[] = [
  { cmd: '/gcreate',          who: 'Manager',     text: 'Open a modal and create a giveaway in the current channel.' },
  { cmd: '/gedit <id>',       who: 'Manager',     text: 'Edit a running giveaway (title, description, winners, prize).' },
  { cmd: '/gextend <id>',     who: 'Manager',     text: "Extend a running giveaway's end time." },
  { cmd: '/gend <id>',        who: 'Manager',     text: 'End a giveaway immediately and draw the winners.' },
  { cmd: '/greroll <id>',     who: 'Manager',     text: 'Redraw all winners, or replace a single winner with the optional user option.' },
  { cmd: '/gcancel <id>',     who: 'Manager',     text: 'Cancel an active giveaway without drawing a winner.' },
  { cmd: '/gpause <id>',      who: 'Manager',     text: 'Pause a giveaway and freeze its timer.' },
  { cmd: '/gresume <id>',     who: 'Manager',     text: 'Resume a paused giveaway.' },
  { cmd: '/gtemplate',        who: 'Manager',     text: 'Save, list, delete or use giveaway templates.' },
  { cmd: '/gsettings',        who: 'Manage Server', text: 'Show, set or remove per-server settings — and per-giveaway role rules.' },
  { cmd: '/glist',            who: 'Everyone',    text: 'List the active giveaways in the server.' },
  { cmd: '/ginfo <id>',       who: 'Everyone',    text: 'Show details about a specific giveaway.' },
  { cmd: '/gstats',           who: 'Everyone',    text: "Show this server's giveaway statistics." },
  { cmd: '/ghelp',            who: 'Everyone',    text: 'Overview of every command.' },
  { cmd: '/ginvite',          who: 'Everyone',    text: 'Get the invite link for the bot.' },
]

// ── How it works (3 steps) ────────────────────────────────────────────────────

const STEPS = [
  { n: '1', icon: MessageSquare, title: 'Invite the bot',   text: 'One click adds the official instance — no hosting, no setup.' },
  { n: '2', icon: ClipboardList, title: 'Run /gcreate',     text: 'Fill in title, prize, duration and number of winners in a modal.' },
  { n: '3', icon: Gift,          title: 'Members join',     text: 'They click the button; winners are drawn automatically when the timer ends.' },
]

// ── Customisation options (from /gsettings) ───────────────────────────────────

const SETTINGS = [
  { icon: Palette,       title: 'Appearance',  text: 'Embed colour, button emoji and button style (Primary / Secondary / Success / Danger).' },
  { icon: Globe,         title: 'Language',    text: 'Switch the bot UI between English, German, French and Spanish.' },
  { icon: ListChecks,    title: 'Eligibility', text: 'Whitelist & blacklist roles (server-wide or per giveaway), bonus entries, minimum account and membership age.' },
  { icon: CalendarClock, title: 'Roles & Logs', text: 'Manager role, notify role to ping on creation and an optional audit log channel.' },
]

export default function GiveawayBotPage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />

        <div className="container-page relative py-16 text-center md:py-20 lg:py-24">
          <Badge variant="primary" className="mb-6">
            <Gift className="h-3.5 w-3.5" />
            Discord Giveaway Bot
          </Badge>

          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Run flawless{' '}
            <span className="text-[var(--color-primary)]">giveaways</span>
            {' '}on your Discord
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-[var(--color-muted-foreground)] md:text-xl">
            A multilingual, per-guild configurable giveaway bot built on
            Discord.js v14. Restart-safe scheduling, weighted bonus entries,
            eligibility rules, templates and pause/resume — invite the official
            instance and create your first giveaway in seconds.
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
              <a href={INVITE_URL} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4" />
                Invite the bot
              </a>
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

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">Get started</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Your first giveaway in three steps
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            No server, no database, no config files — just invite and go.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {STEPS.map(step => (
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
          <Button asChild size="lg" variant="discord">
            <a href={INVITE_URL} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="h-4 w-4" />
              Invite the bot
            </a>
          </Button>
        </div>
      </section>

      {/* ── Feature highlights ────────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
        <div className="container-page py-14 md:py-20">
          <div className="mb-10 text-center">
            <span className="eyebrow">Features</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              More than just a draw
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
              Everything a serious community needs to run fair, reliable giveaways.
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

      {/* ── Commands ──────────────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">Commands</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Slash commands for everything
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            Manager commands need Manage Server or your configured manager role.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          {COMMANDS.map((c, i) => (
            <div
              key={c.cmd}
              className={
                'flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-4' +
                (i > 0 ? ' border-t border-[var(--color-border)]' : '')
              }
            >
              <code className="shrink-0 font-mono text-sm font-bold text-[var(--color-primary)] sm:w-40">
                {c.cmd}
              </code>
              <span className="shrink-0 sm:w-32">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  {c.who}
                </span>
              </span>
              <span className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {c.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Customisation ─────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
        <div className="container-page py-14 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow">Per-server settings</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                Tailored to your community
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                Every server configures the bot independently via{' '}
                <code className="font-mono text-[var(--color-primary)]">/gsettings</code>.
                Match your branding, set the rules and delegate control — all
                without touching a config file.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild variant="discord">
                  <a href={INVITE_URL} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-4 w-4" />
                    Invite the bot
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                    View source
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SETTINGS.map(item => (
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

      {/* ── Tech / trust strip ────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">Built right</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Reliable by design
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            { icon: Terminal, title: 'Discord.js v14',  text: 'Native slash commands, modals and buttons — no legacy message-content scraping.' },
            { icon: Shield,   title: 'Open source',     text: 'Code published on GitHub for full transparency, with a documented security model.' },
            { icon: Star,     title: 'Maintained',      text: 'Automated CI checks, dependency updates and active development by MSK Scripts.' },
          ].map(item => (
            <div key={item.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                <item.icon className="h-4 w-4" />
              </div>
              <h3 className="mb-1.5 font-bold tracking-tight">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="container-page pb-14 md:pb-20">
        <Card className="relative overflow-hidden p-8 text-center md:p-12">
          <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Ready to host your next giveaway?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--color-muted-foreground)] md:text-base">
              Invite the official instance — it&apos;s free, and your first
              giveaway is only a <code className="font-mono text-[var(--color-primary)]">/gcreate</code> away.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="discord">
                <a href={INVITE_URL} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="h-4 w-4" />
                  Invite the bot
                </a>
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
