import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import {
  ArrowRight, KeyRound, LayoutDashboard, BarChart3, Ticket, ClipboardList,
  UserCheck, Flag, Star, Clock, FileText, MessageSquareText, Globe, Lock,
  Megaphone, Bell, MessageSquare,
  Check, X, ServerCog, RefreshCw, Terminal, RotateCcw, Database,
  ShieldCheck, Users, Languages,
} from 'lucide-react'

import { BotCrossLink } from '@/components/bots/BotCrossLink'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { SITE_CONFIG } from '@/lib/config'
import { TIER_CONFIG, type Tier } from '@/lib/tiers'
import type { Lang } from '@/lib/i18n'
import { TICKETBOT_COPY, type TicketBotTierCard } from '@/content/ticketbot-copy'

/**
 * Die Ticket-Bot-Landingpage, einmal gebaut, zweimal gerendert.
 *
 * `/ticketbot` rendert sie mit `lang="en"`, `/de/ticketbot` mit `lang="de"`.
 * Beide Routen sind sprachlich **fest**, nicht cookie-abhängig: zwei URLs mit
 * identischem Inhalt in derselben Sprache wären Duplicate Content, und das
 * hreflang-Paar in den Metadaten wäre gelogen.
 *
 * Hier stehen ausschließlich Icons und Layout. Jeder sichtbare String kommt aus
 * `content/ticketbot-copy.ts`, positionsgleich zu den Icon-Arrays unten.
 */

// ── Icon-Reihenfolgen. Müssen zu den Listen in content/ticketbot-copy.ts passen.

const HUB_ICONS = [KeyRound, LayoutDashboard, BarChart3] as const
const HUB_HREFS = ['/ticketbot/verify', '/ticketbot/dashboard', '/ticketbot/stats'] as const
const HUB_VARIANTS = ['primary', 'outline', 'outline'] as const

const FEATURE_ICONS = [
  Ticket, ClipboardList, UserCheck, Flag, Star, Clock, FileText, MessageSquareText,
  Globe, Lock, RotateCcw, Bell, Megaphone, Database, LayoutDashboard,
] as const

const VERIFY_ICONS = [MessageSquare, ServerCog, KeyRound] as const

const DASHBOARD_ICONS = [LayoutDashboard, Terminal, Users, UserCheck] as const

const HOSTED_ICONS = [ServerCog, RefreshCw, FileText, Globe] as const

const TIER_KEYS: Tier[] = ['basic', 'premium', 'premium_plus', 'business']

const mb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`

export function TicketBotLanding({ lang }: { lang: Lang }) {
  const t = TICKETBOT_COPY[lang]

  /** Feature-Zeilen einer Tarifkarte, Werte immer aus lib/tiers.ts. */
  function tierFeatures(key: Tier, hosted: boolean) {
    const c = TIER_CONFIG[key]
    return [
      { label: t.tierFeatureHosting, ok: true },
      { label: t.tierFeatureTranscript.replace('{size}', mb(c.transcriptMaxBytes)), ok: true },
      {
        label: c.attachments
          ? t.tierFeatureAttachments.replace('{size}', mb(c.attachmentMaxBytes))
          : t.tierFeatureNoAttachments,
        ok: c.attachments,
      },
      { label: t.tierFeatureDomain, ok: c.customDomain },
      { label: t.tierFeatureBranding, ok: c.removeBranding },
      { label: t.tierFeatureStorage.replace('{days}', String(c.storageDays)), ok: true },
      { label: t.tierFeatureUploads.replace('{n}', String(c.uploadsPerHour)), ok: true },
      { label: t.tierFeatureHosted, ok: hosted },
    ]
  }

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />

        <div className="container-page relative py-16 text-center md:py-20 lg:py-24">
          <Badge variant="primary" className="mb-6">
            <Ticket className="h-3.5 w-3.5" />
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
              <Link href="/ticketbot/verify" prefetch={false}>
                {t.heroCtaKey}
                <ArrowRight className="h-4 w-4" />
              </Link>
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

          {/* Sichtbarer Sprachwechsel. Ergänzt die hreflang-Angaben um einen
              Link, dem sowohl Nutzer als auch Crawler folgen können. */}
          <p className="mt-6 text-sm">
            {/* Bewusst `<a>`: das ist ein Sprachwechsel, und beide Adressen
                zeigen nach dem Rewrite auf denselben Routenbaum. Der
                Client-Router sähe keinen Segmentwechsel und liesse den Text
                stehen. Ausserdem darf `LocaleLink` hier nicht greifen, es
                würde die Gegenstück-Adresse ein zweites Mal präfixieren. */}
            <a
              href={t.altHref}
              hrefLang={lang === 'en' ? 'de' : 'en'}
              className="inline-flex items-center gap-1.5 text-[var(--color-muted-foreground)] underline-offset-4 transition-colors hover:text-[var(--color-foreground)] hover:underline"
            >
              <Languages className="h-3.5 w-3.5" />
              {t.altLabel}
            </a>
          </p>
        </div>
      </section>

      {/* ── Hub cards: Verify · Dashboard · Stats ─────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">{t.hubEyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.hubHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            {t.hubSub}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.hubCards.map((card, i) => {
            const Icon = HUB_ICONS[i]
            const href = HUB_HREFS[i]
            const accent = i === 0
            return (
              <Card key={href} hoverLift className="flex flex-col p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className={
                    accent
                      ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                      : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                  }>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                    {card.eyebrow}
                  </span>
                </div>

                <h3 className="mb-2 text-xl font-bold tracking-tight">{card.title}</h3>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {card.text}
                </p>

                <Button asChild variant={HUB_VARIANTS[i]} className="w-full">
                  {/* verify/dashboard sind session-abhängig: kein Prefetch, sonst
                      cacht der Client-Router die Redirect-Entscheidung. */}
                  <Link href={href} prefetch={href === '/ticketbot/stats' ? undefined : false}>
                    {card.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            )
          })}
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

      {/* ── Verify flow ───────────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">{t.verifyEyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.verifyHeading}</h2>
        </div>

        <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {t.verifySteps.map((step, i) => {
            const Icon = VERIFY_ICONS[i]
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
          <Button asChild size="lg">
            <Link href="/ticketbot/verify" prefetch={false}>
              {t.verifyCta}
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
              <span className="eyebrow">{t.dashboardEyebrow}</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.dashboardHeading}</h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                {t.dashboardIntroA}{' '}
                <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.8125rem] text-[var(--color-foreground)]">npm run dashboard</code>
                {' '}{t.dashboardIntroB}{' '}
                <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.8125rem] text-[var(--color-foreground)]">npm start</code>
                {' '}{t.dashboardIntroC}
              </p>
              <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                <span>{t.dashboardSecure}</span>
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <a href={`${SITE_CONFIG.docs}/discord/discord_ticketbot/dashboard`} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                    {t.dashboardDocsCta}
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {t.dashboardItems.map((item, i) => {
                const Icon = DASHBOARD_ICONS[i]
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

      {/* ── Hosted bot management ─────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
        <div className="container-page py-14 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow">{t.hostedEyebrow}</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.hostedHeading}</h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                {t.hostedText}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/ticketbot/dashboard" prefetch={false}>
                    <LayoutDashboard className="h-4 w-4" />
                    {t.hostedCtaDashboard}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <a href={SITE_CONFIG.discord} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-4 w-4" />
                    {t.hostedCtaDiscord}
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {t.hostedItems.map((item, i) => {
                const Icon = HOSTED_ICONS[i]
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

      {/* ── Tiers / pricing ───────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow">{t.tiersEyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.tiersHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            {t.tiersSubLead}{' '}
            <span className="font-medium text-[var(--color-primary)]">{t.tiersSubTrial}</span>
            {t.tiersSubTail}
          </p>
        </div>

        {/* Vier Stufen: bei md zwei nebeneinander, erst ab xl alle vier. Vier
            Karten in einer md-Reihe werden zu schmal fuer die Feature-Listen. */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {t.tierCards.map((card: TicketBotTierCard, i) => {
            const key = TIER_KEYS[i]
            const accent = i === 1
            const hosted = i > 0
            return (
              <Card
                key={key}
                hoverLift
                className={
                  accent
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
                  {tierFeatures(key, hosted).map(f => (
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

                <Button asChild variant={accent ? 'primary' : 'outline'} className="w-full">
                  <Link href="/ticketbot/verify" prefetch={false}>
                    {card.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            )
          })}
        </div>

        {/* Per-guild note */}
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-4 rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/[0.04] p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
            <ServerCog className="h-5 w-5" />
          </div>
          <div>
            <h3 className="mb-1 font-bold tracking-tight">{t.tierNote.title}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">{t.tierNote.text}</p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="container-page pb-14 md:pb-20">
        <Card className="relative overflow-hidden p-8 text-center md:p-12">
          <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.ctaHeading}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--color-muted-foreground)] md:text-base">
              {t.ctaText}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/ticketbot/verify" prefetch={false}>
                  {t.ctaKey}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={SITE_CONFIG.docs} target="_blank" rel="noopener noreferrer">
                  {t.ctaDocs}
                </a>
              </Button>
            </div>
          </div>
        </Card>

        <BotCrossLink lang={lang} current="ticketbot" />
      </section>
    </div>
  )
}
