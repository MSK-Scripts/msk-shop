import Link from 'next/link'
import {
  Gift, Sparkles, RefreshCw, Globe, Palette, Layers,
  Shield, Users, PauseCircle, ScrollText, ClipboardList, Star,
  Check, MessageSquare, FileText, Terminal, UserCheck,
  CalendarClock, ListChecks, Mail, Bell, Pencil,
  LayoutDashboard, Trophy, Ticket, Languages, Package,
} from 'lucide-react'

import { BotCrossLink } from '@/components/bots/BotCrossLink'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { SITE_CONFIG } from '@/lib/config'
import type { Lang } from '@/lib/i18n'
import { GIVEAWAY_COPY } from '@/content/giveaway-copy'
import { GithubMark } from '@/components/icons/GithubMark'

/**
 * Die Giveaway-Bot-Landingpage, einmal gebaut, zweimal gerendert.
 *
 * `/giveaway` mit `lang="en"`, `/de/giveaway` mit `lang="de"`. Wie beim
 * Ticket-Bot ist die Sprache pro Route fest, nicht cookie-abhängig. Nur Icons
 * und Layout stehen hier, die Texte in `content/giveaway-copy.ts`.
 */

export const GIVEAWAY_INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1512465732179329065&scope=bot+applications.commands&permissions=478208'
export const GIVEAWAY_GITHUB_URL = 'https://github.com/MSK-Scripts/discord_giveawaybot'

// ── Icon- und Befehls-Reihenfolgen. Müssen zu content/giveaway-copy.ts passen.

const STEP_ICONS = [MessageSquare, ClipboardList, Gift] as const

const FEATURE_ICONS = [
  Gift, RefreshCw, Package, Users, Shield, PauseCircle, Layers, Sparkles, Mail, Bell,
  Pencil, LayoutDashboard, Trophy, Ticket, Globe, Palette, ScrollText, UserCheck, Shield,
] as const

/** Die Befehlsnamen selbst sind sprachneutral, sie heißen im Bot überall gleich. */
const COMMAND_NAMES = [
  '/gcreate', '/gedit <id>', '/gextend <id>', '/gend <id>', '/greroll <id>',
  '/gcancel <id>', '/gpause <id>', '/gresume <id>', '/gtemplate', '/gsettings',
  '/glist', '/ginfo <id>', '/gstats', '/ghelp', '/ginvite',
] as const

const SETTINGS_ICONS = [Palette, Globe, ListChecks, CalendarClock, Ticket] as const

const COUPON_ICONS = [Ticket, RefreshCw, Shield] as const

const TRUST_ICONS = [Terminal, Shield, Star] as const

export function GiveawayLanding({ lang }: { lang: Lang }) {
  const t = GIVEAWAY_COPY[lang]

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />

        <div className="container-page relative py-16 text-center md:py-20 lg:py-24">
          <Badge variant="primary" className="mb-6">
            <Gift className="h-3.5 w-3.5" />
            {t.badge}
          </Badge>

          {/* Das Keyword steht im H1, nicht nur im Badge und im <title>. */}
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {t.headline.lead}{' '}
            <span className="text-[var(--color-primary)]">{t.headline.accent}</span>
            {t.headline.tail}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-[var(--color-muted-foreground)] md:text-xl">
            {t.heroText}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {t.highlights.map(h => (
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
              <a href={GIVEAWAY_INVITE_URL} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4" />
                {t.heroCtaInvite}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={SITE_CONFIG.docs} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                {t.heroCtaDocs}
              </a>
            </Button>
            <Button asChild size="lg" variant="discord">
              <a href={SITE_CONFIG.discord} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4" />
                {t.heroCtaDiscord}
              </a>
            </Button>
          </div>

          <p className="mt-6 text-sm">
            <Link
              href={t.altHref}
              hrefLang={lang === 'en' ? 'de' : 'en'}
              className="inline-flex items-center gap-1.5 text-[var(--color-muted-foreground)] underline-offset-4 transition-colors hover:text-[var(--color-foreground)] hover:underline"
            >
              <Languages className="h-3.5 w-3.5" />
              {t.altLabel}
            </Link>
          </p>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">{t.stepsEyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.stepsHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            {t.stepsSub}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {t.steps.map((step, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <div key={step.title} className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <span className="absolute right-4 top-4 font-mono text-3xl font-bold leading-none text-[var(--color-border)]">
                  {i + 1}
                </span>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mb-1.5 font-bold tracking-tight">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{step.text}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg" variant="discord">
            <a href={GIVEAWAY_INVITE_URL} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="h-4 w-4" />
              {t.stepsCta}
            </a>
          </Button>
        </div>
      </section>

      {/* ── Feature highlights ────────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
        <div className="container-page py-14 md:py-20">
          <div className="mb-10 text-center">
            <span className="eyebrow">{t.featuresEyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.featuresHeading}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
              {t.featuresSub}
            </p>
          </div>

          <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))]">
            {t.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i]
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mb-1.5 font-bold tracking-tight">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{f.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Commands ──────────────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">{t.commandsEyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.commandsHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            {t.commandsSub}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          {COMMAND_NAMES.map((cmd, i) => (
            <div
              key={cmd}
              className={
                'flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-4' +
                (i > 0 ? ' border-t border-[var(--color-border)]' : '')
              }
            >
              <code className="shrink-0 font-mono text-sm font-bold text-[var(--color-primary)] sm:w-40">
                {cmd}
              </code>
              <span className="shrink-0 sm:w-32">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  {t.commandWho[i]}
                </span>
              </span>
              <span className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {t.commandText[i]}
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
              <span className="eyebrow">{t.settingsEyebrow}</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.settingsHeading}</h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                {t.settingsIntroA}{' '}
                <code className="font-mono text-[var(--color-primary)]">/gsettings</code>
                {t.settingsIntroB}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild variant="discord">
                  <a href={GIVEAWAY_INVITE_URL} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-4 w-4" />
                    {t.settingsCtaInvite}
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={GIVEAWAY_GITHUB_URL} target="_blank" rel="noopener noreferrer">
                    <GithubMark className="h-4 w-4" />
                    {t.settingsCtaSource}
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {t.settings.map((item, i) => {
                const Icon = SETTINGS_ICONS[i]
                return (
                  <div key={item.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="mb-1.5 text-sm font-bold tracking-tight">{item.title}</h3>
                    <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">{item.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tebex winner coupons ──────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">{t.couponEyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.couponHeading}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            {t.couponSubA} <strong>{t.couponSubStrong}</strong> {t.couponSubB}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {t.coupons.map((item, i) => {
            const Icon = COUPON_ICONS[i]
            return (
              <div key={item.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mb-1.5 text-sm font-bold tracking-tight">{item.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">{item.text}</p>
              </div>
            )
          })}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-muted-foreground)]">
          {t.couponNote}
        </p>
      </section>

      {/* ── Tech / trust strip ────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">{t.trustEyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.trustHeading}</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {t.trust.map((item, i) => {
            const Icon = TRUST_ICONS[i]
            return (
              <div key={item.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mb-1.5 font-bold tracking-tight">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{item.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="container-page pb-14 md:pb-20">
        <Card className="relative overflow-hidden p-8 text-center md:p-12">
          <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.ctaHeading}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--color-muted-foreground)] md:text-base">
              {t.ctaTextA}{' '}
              <code className="font-mono text-[var(--color-primary)]">/gcreate</code>
              {' '}{t.ctaTextB}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="discord">
                <a href={GIVEAWAY_INVITE_URL} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="h-4 w-4" />
                  {t.ctaInvite}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={SITE_CONFIG.docs} target="_blank" rel="noopener noreferrer">
                  {t.ctaDocs}
                </a>
              </Button>
            </div>
          </div>
        </Card>

        <BotCrossLink lang={lang} current="giveaway" />
      </section>
    </div>
  )
}
