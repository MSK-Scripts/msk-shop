'use client'

import { useEffect, useState } from 'react'
import { giveawayStatsTranslations, homeTranslations, layoutTranslations, packagesTranslations } from '@/lib/i18n'
import { useLang } from '@/components/i18n/LangProvider'
import { Breakdown, FigureList, StatsHero, formatNum, type BreakdownItem } from '@/components/stats/StatsParts'
import type { GiveawayStats } from '@/lib/giveawayStats'

export default function StatsClient({
  stats: initialStats,
}: {
  stats: GiveawayStats
}) {
  const { lang }          = useLang()
  const [stats, setStats] = useState<GiveawayStats>(initialStats)
  const t = giveawayStatsTranslations[lang]

  // Live refresh: poll the API once a minute, replacing the SSR snapshot.
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const res = await fetch('/api/giveaway-stats', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as GiveawayStats
        if (alive) setStats({ ...data, available: true })
      } catch { /* keep last good snapshot */ }
    }
    const id = setInterval(tick, 60_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const cards = [
    { label: t.card_servers,     value: formatNum(stats.servers, lang),         sub: t.card_servers_sub },
    { label: t.card_giveaways,    value: formatNum(stats.giveaways, lang),       sub: t.card_giveaways_sub },
    { label: t.card_active,       value: formatNum(stats.activeGiveaways, lang), sub: t.card_active_sub },
    { label: t.card_entries,      value: formatNum(stats.entries, lang),         sub: t.card_entries_sub },
    { label: t.card_winners,      value: formatNum(stats.winners, lang),         sub: t.card_winners_sub },
    { label: t.card_avg_entries,  value: formatNum(stats.avgEntries, lang),      sub: t.card_avg_entries_sub },
    { label: t.card_max_entries,  value: formatNum(stats.maxEntries, lang),      sub: t.card_max_entries_sub },
    { label: t.card_templates,    value: formatNum(stats.templates, lang),       sub: t.card_templates_sub },
  ]

  const langItems: BreakdownItem[] = [
    { key: 'en', label: 'EN', bg: 'bg-[var(--color-primary)]',          text: 'text-[var(--color-primary)]' },
    { key: 'de', label: 'DE', bg: 'bg-[var(--color-warning)]',    text: 'text-[var(--color-warning)]' },
    { key: 'fr', label: 'FR', bg: 'bg-[var(--color-info)]',       text: 'text-[var(--color-info)]' },
    { key: 'es', label: 'ES', bg: 'bg-[var(--color-chart-rose)]', text: 'text-[var(--color-chart-rose)]' },
    { key: 'hu', label: 'HU', bg: 'bg-[var(--color-chart-violet)]',  text: 'text-[var(--color-chart-violet)]' },
    { key: 'pl', label: 'PL', bg: 'bg-[var(--color-chart-teal)]',    text: 'text-[var(--color-chart-teal)]' },
    { key: 'pt', label: 'PT', bg: 'bg-[var(--color-chart-fuchsia)]', text: 'text-[var(--color-chart-fuchsia)]' },
  ]
  const langTotal = langItems.reduce((s, i) => s + (stats.langs[i.key] ?? 0), 0)

  // In the order a giveaway goes through them. Scheduled ones have their own
  // entry: they are neither running nor over.
  const statusItems: BreakdownItem[] = [
    { key: 'SCHEDULED', label: t.status_scheduled, bg: 'bg-[var(--color-info)]',             text: 'text-[var(--color-info)]' },
    { key: 'ACTIVE',   label: t.status_active,    bg: 'bg-[var(--color-primary)]',          text: 'text-[var(--color-primary)]' },
    { key: 'PAUSED',    label: t.status_paused,    bg: 'bg-[var(--color-warning)]',          text: 'text-[var(--color-warning)]' },
    { key: 'ENDED',     label: t.status_ended,     bg: 'bg-[var(--color-muted-foreground)]', text: 'text-[var(--color-muted-foreground)]' },
    { key: 'CANCELLED', label: t.status_cancelled, bg: 'bg-[var(--color-danger)]',           text: 'text-[var(--color-danger)]' },
  ]
  const statusTotal = statusItems.reduce((s, i) => s + (stats.status[i.key] ?? 0), 0)

  const home = homeTranslations[lang]
  const crumbs = [
    { label: packagesTranslations[lang].breadcrumb_home, href: '/' },
    { label: layoutTranslations[lang].nav_discord, href: '/discord' },
    { label: 'Giveaway Bot', href: '/discord/giveaway-bot' },
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
          <Breakdown items={langItems}   data={stats.langs}  total={langTotal}   label={t.lang_distribution}   lang={lang} />
          <Breakdown items={statusItems} data={stats.status} total={statusTotal} label={t.status_distribution} lang={lang} />
        </div>

        <p className="max-w-[46rem] text-small text-[var(--color-muted-foreground)]">{t.footer_note}</p>
      </div>
    </>
  )
}
