'use client'

import { homeTranslations, layoutTranslations, packagesTranslations, statsTranslations } from '@/lib/i18n'
import { useLang } from '@/components/i18n/LangProvider'
import { Breakdown, FigureList, StatsHero, formatNum, type BreakdownItem } from '@/components/stats/StatsParts'
import type { Stats } from '@/lib/ticketbotStats'

// Der Typ liegt bei den Queries in lib/ticketbotStats.ts, nicht hier: die
// Seite und die Poll-Route liefern beide dieselbe Form, und eine Kopie in der
// Komponente war schon einmal die Stelle, an der ein neues Feld fehlte.
export type { Stats } from '@/lib/ticketbotStats'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024)      return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

/** The tiers in the order of the price table, with the chart colours of the tier. */
const TIER_ITEMS: BreakdownItem[] = [
  { key: 'basic',        label: 'Basic',    bg: 'bg-[var(--color-muted-foreground)]', text: 'text-[var(--color-muted-foreground)]' },
  { key: 'premium',      label: 'Premium',  bg: 'bg-[var(--color-primary)]',          text: 'text-[var(--color-primary)]' },
  { key: 'premium_plus', label: 'Hosted',   bg: 'bg-[var(--color-warning)]',          text: 'text-[var(--color-warning)]' },
  { key: 'business',     label: 'Business', bg: 'bg-[var(--color-tier-business)]',    text: 'text-[var(--color-tier-business)]' },
]

export default function StatsClient({ stats }: { stats: Stats }) {
  const { lang } = useLang()
  const t = statsTranslations[lang]

  // Giveaway- und Sponsoring-Keys kommen seit dem 19.09.2026 als gezaehlte
  // Werte aus der Datenbank. Vorher stand hier
  // `premium + premium_plus + business - subscriptions`, also eine Subtraktion,
  // die jeden bezahlten Key ohne Stripe-Abo zum Giveaway erklaerte: auch
  // gesponserte Keys und den eigenen Testserver.
  const giveawayKeys  = stats.giveawayKeys
  const sponsoredKeys = stats.sponsoredKeys

  const cards = [
    { label: t.card_transcripts,       value: formatNum(stats.transcripts, lang),                 sub: t.card_transcripts_sub },
    { label: t.card_transcripts_30d,   value: formatNum(stats.transcripts30d, lang),              sub: t.card_transcripts_30d_sub },
    { label: t.card_api_keys,          value: formatNum(stats.apiKeys, lang),                     sub: t.card_api_keys_sub },
    { label: t.card_new_guilds,        value: formatNum(stats.newGuilds30d, lang),                sub: t.card_new_guilds_sub },
    { label: t.card_custom_domains,    value: formatNum(stats.customDomains, lang),               sub: t.card_custom_domains_sub },
    { label: t.card_hosted_bots,       value: formatNum(stats.hostedBots, lang),                  sub: t.card_hosted_bots_sub },
    { label: t.card_attachments,       value: formatNum(stats.attachments, lang),                 sub: t.card_attachments_sub },
    { label: t.card_with_attachments,  value: formatNum(stats.transcriptsWithAttachments, lang),  sub: t.card_with_attachments_sub },
    { label: t.card_total_storage,     value: formatBytes(stats.totalStorageBytes),               sub: t.card_total_storage_sub },
    { label: t.card_avg_transcript,    value: formatBytes(stats.avgTranscriptBytes),              sub: t.card_avg_transcript_sub },
    { label: t.card_avg_attachment,    value: formatBytes(stats.avgAttachmentBytes),              sub: t.card_avg_attachment_sub },
    { label: t.card_max_transcript,    value: formatBytes(stats.maxTranscriptBytes),              sub: t.card_max_transcript_sub },
    { label: t.card_subscriptions,     value: formatNum(stats.subscriptions, lang),               sub: t.card_subscriptions_sub },
    { label: t.card_giveaway_keys,     value: formatNum(giveawayKeys, lang),                      sub: t.card_giveaway_keys_sub },
    { label: t.card_sponsored_keys, value: formatNum(sponsoredKeys, lang),                     sub: t.card_sponsored_keys_sub },
  ]

  const home = homeTranslations[lang]
  const crumbs = [
    { label: packagesTranslations[lang].breadcrumb_home, href: '/' },
    { label: layoutTranslations[lang].nav_discord, href: '/discord' },
    { label: 'Ticket Bot', href: '/discord/ticket-bot' },
    { label: home.bot_stats },
  ]

  return (
    <>
      <StatsHero
        id="stats-title"
        crumbs={crumbs}
        live={stats.available}
        labels={{ live: t.status_live, refresh: t.status_refresh, unavailable: t.status_unavailable, unreachable: t.status_db_unreachable }}
        title={t.title}
        subtitle={t.subtitle}
      />

      <div className="container-page grid gap-[var(--space-stack)] py-[var(--space-section)]">
        <FigureList figures={cards} headingId="figures-heading" heading={t.region_figures} />

        <div className="grid gap-x-[clamp(2rem,3vw,4rem)] gap-y-[var(--space-stack)] min-[1024px]:grid-cols-2">
          <Breakdown items={TIER_ITEMS} data={stats.tiers} total={stats.apiKeys} label={t.tier_distribution} lang={lang} />
          <Breakdown
            items={TIER_ITEMS.filter(i => i.key !== 'basic')}
            data={stats.subscriptionTiers}
            total={stats.subscriptions}
            label={t.subscription_distribution}
            lang={lang}
          />
        </div>

        <p className="max-w-[46rem] text-small text-[var(--color-muted-foreground)]">{t.footer_note}</p>
      </div>
    </>
  )
}
