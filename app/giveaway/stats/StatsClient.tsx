'use client'

import { useEffect, useState } from 'react'
import {
  Server, Gift, Sparkles, Users, Trophy, BarChart3,
  TrendingUp, Layers, Flame,
} from 'lucide-react'
import { giveawayStatsTranslations, type Lang } from '@/lib/i18n'
import { useLang } from '@/components/i18n/LangProvider'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { GiveawayStats } from '@/lib/giveawayStats'

function formatNum(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US').format(n)
}

function StatCard({
  icon: Icon, label, value, sub, accent = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <Card hoverLift className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          accent
            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
            : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {label}
        </span>
      </div>
      <p className="font-mono text-3xl font-bold leading-none tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[var(--color-muted-foreground)]">{sub}</p>}
    </Card>
  )
}

interface BreakdownItem {
  key:   string
  label: string
  bg:    string
  text:  string
}

function Breakdown({
  items, data, total, label, lang,
}: {
  items: BreakdownItem[]
  data:  Record<string, number>
  total: number
  label: string
  lang:  Lang
}) {
  return (
    <Card hoverLift className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
          <BarChart3 className="h-4 w-4" />
        </div>
        <h2 className="font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {label}
        </h2>
      </div>

      {total > 0 ? (
        <div className="mb-4 flex h-3 gap-px overflow-hidden rounded-full">
          {items.map(({ key, bg }) => {
            const pct = ((data[key] ?? 0) / total) * 100
            return pct > 0 ? (
              <div key={key} className={cn(bg, 'transition-all')} style={{ width: `${pct}%` }} />
            ) : null
          })}
        </div>
      ) : (
        <div className="mb-4 h-3 rounded-full bg-[var(--color-muted)]" />
      )}

      {/* Vier Spalten unabhängig von der Anzahl. Die Regel hing bis zum
          25.08.2026 an `items.length === 4` und fiel bei jeder anderen Zahl auf
          drei Spalten zurück. Mit der siebten Sprache stand PT allein in einer
          dritten Reihe, und die Karte war fast doppelt so hoch wie die daneben. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(({ key, label: itemLabel, text }) => (
          <div key={key} className="flex flex-col gap-1 rounded-lg bg-[var(--color-muted)] px-3 py-2.5">
            <span className={cn('font-mono text-[0.625rem] font-bold uppercase tracking-widest', text)}>
              {itemLabel}
            </span>
            <span className="font-mono text-xl font-bold">{formatNum(data[key] ?? 0, lang)}</span>
            <span className="text-[0.6875rem] text-[var(--color-muted-foreground)]">
              {total > 0 ? `${(((data[key] ?? 0) / total) * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

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
    { icon: Server,     label: t.card_servers,     value: formatNum(stats.servers, lang),         sub: t.card_servers_sub,     accent: true  },
    { icon: Gift,       label: t.card_giveaways,    value: formatNum(stats.giveaways, lang),       sub: t.card_giveaways_sub,    accent: false },
    { icon: Sparkles,   label: t.card_active,       value: formatNum(stats.activeGiveaways, lang), sub: t.card_active_sub,       accent: true  },
    { icon: Users,      label: t.card_entries,      value: formatNum(stats.entries, lang),         sub: t.card_entries_sub,      accent: false },
    { icon: Trophy,     label: t.card_winners,      value: formatNum(stats.winners, lang),         sub: t.card_winners_sub,      accent: false },
    { icon: TrendingUp, label: t.card_avg_entries,  value: formatNum(stats.avgEntries, lang),      sub: t.card_avg_entries_sub,  accent: false },
    { icon: Flame,      label: t.card_max_entries,  value: formatNum(stats.maxEntries, lang),      sub: t.card_max_entries_sub,  accent: false },
    { icon: Layers,     label: t.card_templates,    value: formatNum(stats.templates, lang),       sub: t.card_templates_sub,    accent: false },
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

  const statusItems: BreakdownItem[] = [
    { key: 'ACTIVE',    label: t.status_active,    bg: 'bg-[var(--color-primary)]',          text: 'text-[var(--color-primary)]' },
    { key: 'PAUSED',    label: t.status_paused,    bg: 'bg-[var(--color-warning)]',          text: 'text-[var(--color-warning)]' },
    { key: 'ENDED',     label: t.status_ended,     bg: 'bg-[var(--color-muted-foreground)]', text: 'text-[var(--color-muted-foreground)]' },
    { key: 'CANCELLED', label: t.status_cancelled, bg: 'bg-[var(--color-danger)]',           text: 'text-[var(--color-danger)]' },
  ]
  const statusTotal = statusItems.reduce((s, i) => s + (stats.status[i.key] ?? 0), 0)

  return (
    <div className="container-page py-10 md:py-14">
      <div>

        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              {stats.available ? (
                <>
                  <span className="eyebrow">{t.status_live}</span>
                  <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-[var(--color-muted-foreground)]">
                    <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                    {t.status_refresh}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-danger)]">
                    {t.status_unavailable}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-[var(--color-muted-foreground)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
                    {t.status_db_unreachable}
                  </span>
                </>
              )}
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">{t.title}</h1>
            <p className="max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Stat Cards. Die Überschrift ist `sr-only`: sichtbar wäre sie eine
            Doppelung des Seitentitels, im Baum fehlte bisher jede Zwischenebene
            zwischen H1 und den 14 Kacheln. */}
        <section aria-labelledby="figures-heading">
          <h2 id="figures-heading" className="sr-only">{t.region_figures}</h2>
          <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
            {cards.map(c => <StatCard key={c.label} {...c} />)}
          </div>
        </section>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Breakdown items={langItems}   data={stats.langs}  total={langTotal}   label={t.lang_distribution}   lang={lang} />
          <Breakdown items={statusItems} data={stats.status} total={statusTotal} label={t.status_distribution} lang={lang} />
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[0.6875rem] text-[var(--color-muted-foreground)]">
          {t.footer_note}
        </p>
      </div>
    </div>
  )
}
