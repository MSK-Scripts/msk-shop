'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Server, TrendingUp, TrendingDown, Minus, ArrowUpRight, Github, Hash } from 'lucide-react'
import { resourceStatsTranslations, type Lang } from '@/lib/i18n'
import { useLang } from '@/components/i18n/LangProvider'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { ResourceStatsResult, ResourceStat, ResourceLink, HistoryPoint } from '@/lib/fivestats'

function formatNum(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US').format(n)
}

function formatSigned(n: number, lang: Lang): string {
  const s = formatNum(Math.abs(n), lang)
  return n > 0 ? `+${s}` : n < 0 ? `-${s}` : s
}

// ── Sparkline: pure SVG area + line chart (CSP-safe, no dependency) ──
function Sparkline({ history, id }: { history: HistoryPoint[]; id: string }) {
  const W = 320
  const H = 72
  const P = 4 // vertical padding

  if (history.length < 2) return null

  const values = history.map(p => p.serverCount)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const x = (i: number) => (i / (history.length - 1)) * W
  const y = (v: number) => H - P - ((v - min) / span) * (H - P * 2)

  const line = history.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.serverCount).toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const gradId = `spark-${id}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-16 w-full"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function TrendBadge({ change, lang }: { change: number; lang: Lang }) {
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const color =
    change > 0 ? 'text-[var(--color-primary)]' :
    change < 0 ? 'text-[var(--color-danger)]' :
    'text-[var(--color-muted-foreground)]'
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono text-xs font-bold', color)}>
      <Icon className="h-3.5 w-3.5" />
      {formatSigned(change, lang)}
    </span>
  )
}

function ResourceLinkButton({ link }: { link: ResourceLink }) {
  const content = (
    <>
      {link.external ? <Github className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
      {link.label}
    </>
  )
  return (
    <Button asChild variant={link.variant} size="sm" className="flex-1">
      {link.external ? (
        <a href={link.href} target="_blank" rel="noopener noreferrer">{content}</a>
      ) : (
        <Link href={link.href}>{content}</Link>
      )}
    </Button>
  )
}

function ResourceCard({ res, t, lang }: { res: ResourceStat; t: typeof resourceStatsTranslations[Lang]; lang: Lang }) {
  return (
    <Card hoverLift className="flex flex-col gap-4 p-5">
      {/* Header: name + rank */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold leading-tight tracking-tight">{res.displayName}</h3>
        {res.available && res.rank > 0 && (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-[var(--color-muted)] px-2 py-1 font-mono text-xs font-bold text-[var(--color-foreground)]">
            <Hash className="h-3 w-3 text-[var(--color-muted-foreground)]" />
            {res.rank}
          </span>
        )}
      </div>

      {res.available ? (
        <>
          {/* Server count + trend */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                <Server className="h-3 w-3" />
                {t.metric_servers}
              </div>
              <p className="mt-1 font-mono text-3xl font-bold leading-none tracking-tight">
                {formatNum(res.serverCount, lang)}
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                {t.metric_trend}
              </div>
              <div className="mt-1.5">
                <TrendBadge change={res.serverCountChange} lang={lang} />
              </div>
            </div>
          </div>

          {/* Chart */}
          {res.history.length >= 2 ? (
            <Sparkline history={res.history} id={res.resourceName} />
          ) : (
            <div className="flex h-16 items-center justify-center rounded-lg bg-[var(--color-muted)]/50 text-xs text-[var(--color-muted-foreground)]">
              {t.chart_empty}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
          <p className="font-mono text-sm font-bold text-[var(--color-muted-foreground)]">{t.no_data}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">{t.no_data_hint}</p>
        </div>
      )}

      {/* Links */}
      {res.links.length > 0 && (
        <div className="mt-auto flex gap-2 pt-1">
          {res.links.map(link => <ResourceLinkButton key={link.href} link={link} />)}
        </div>
      )}
    </Card>
  )
}

function Section({ title, resources, t, lang }: {
  title: string
  resources: ResourceStat[]
  t: typeof resourceStatsTranslations[Lang]
  lang: Lang
}) {
  if (resources.length === 0) return null
  return (
    <section className="mb-12">
      <h2 className="mb-5 font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
        {title}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
        {resources.map(res => <ResourceCard key={res.resourceName} res={res} t={t} lang={lang} />)}
      </div>
    </section>
  )
}

export default function ResourcesClient({ stats: initialStats }: { stats: ResourceStatsResult }) {
  const { lang }          = useLang()
  const [stats, setStats] = useState<ResourceStatsResult>(initialStats)
  const t = resourceStatsTranslations[lang]

  // Live refresh: poll the API once a minute, replacing the SSR snapshot.
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const res = await fetch('/api/resource-stats', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as ResourceStatsResult
        if (alive) setStats(data)
      } catch { /* keep last good snapshot */ }
    }
    const id = setInterval(tick, 60_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  // Sort within a tier by server_count desc, keeping unavailable ones last.
  const byPopularity = (a: ResourceStat, b: ResourceStat) =>
    Number(b.available) - Number(a.available) || b.serverCount - a.serverCount

  const free = stats.resources.filter(r => r.tier === 'free').sort(byPopularity)
  const paid = stats.resources.filter(r => r.tier === 'paid').sort(byPopularity)

  return (
    <div className="container-wide py-10 md:py-14">
      <div>

        {/* Header */}
        <div className="mb-10">
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
                  {t.status_upstream}
                </span>
              </>
            )}
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">{t.title}</h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            {t.subtitle}
          </p>
        </div>

        <Section title={t.section_free} resources={free} t={t} lang={lang} />
        <Section title={t.section_paid} resources={paid} t={t} lang={lang} />

        <p className="mt-4 text-center text-[0.6875rem] text-[var(--color-muted-foreground)]">
          {t.footer_note}
        </p>
      </div>
    </div>
  )
}
