'use client'

import { useEffect, useState } from 'react'
import { FileText, Key, HardDrive, Paperclip, Github, BarChart3, Globe, Server, TrendingUp, Database, Activity, Files, Maximize2 } from 'lucide-react'
import { statsTranslations, type Lang } from '@/lib/i18n'
import { setLangCookie } from '@/lib/lang'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export interface Stats {
  available:                  boolean
  transcripts:                number
  apiKeys:                    number
  tiers:                      Record<string, number>
  avgTranscriptBytes:         number
  attachments:                number
  avgAttachmentBytes:         number
  sponsors:                   number
  sponsorTiers:               Record<string, number>
  customDomains:              number
  hostedBots:                 number
  newGuilds30d:               number
  totalStorageBytes:          number
  transcripts30d:             number
  transcriptsWithAttachments: number
  maxTranscriptBytes:         number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024)      return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatNum(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US').format(n)
}

function LanguageToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-1 text-xs font-semibold">
      <button
        onClick={() => setLang('en')}
        className={cn(
          'rounded px-2.5 py-1 transition-colors',
          lang === 'en'
            ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
            : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLang('de')}
        className={cn(
          'rounded px-2.5 py-1 transition-colors',
          lang === 'de'
            ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
            : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
        )}
      >
        DE
      </button>
    </div>
  )
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

function TierBreakdown({ tiers, total, label, lang }: {
  tiers: Record<string, number>
  total: number
  label: string
  lang:  Lang
}) {
  const items = [
    { key: 'basic',        tierLabel: 'Basic',    bg: 'bg-[var(--color-muted-foreground)]', text: 'text-[var(--color-muted-foreground)]' },
    { key: 'premium',      tierLabel: 'Premium',  bg: 'bg-[var(--color-primary)]',          text: 'text-[var(--color-primary)]' },
    { key: 'premium_plus', tierLabel: 'Premium+', bg: 'bg-yellow-400',                       text: 'text-yellow-400' },
  ]

  return (
    <Card hoverLift className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
          <BarChart3 className="h-4 w-4" />
        </div>
        <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {label}
        </span>
      </div>

      {total > 0 ? (
        <div className="mb-4 flex h-3 gap-px overflow-hidden rounded-full">
          {items.map(({ key, bg }) => {
            const pct = (tiers[key] / total) * 100
            return pct > 0 ? (
              <div key={key} className={cn(bg, 'transition-all')} style={{ width: `${pct}%` }} />
            ) : null
          })}
        </div>
      ) : (
        <div className="mb-4 h-3 rounded-full bg-[var(--color-muted)]" />
      )}

      <div className="grid grid-cols-3 gap-3">
        {items.map(({ key, tierLabel, text }) => (
          <div key={key} className="flex flex-col gap-1 rounded-lg bg-[var(--color-muted)] px-3 py-2.5">
            <span className={cn('font-mono text-[0.625rem] font-bold uppercase tracking-widest', text)}>
              {tierLabel}
            </span>
            <span className="font-mono text-xl font-bold">{formatNum(tiers[key], lang)}</span>
            <span className="text-[0.6875rem] text-[var(--color-muted-foreground)]">
              {total > 0 ? `${((tiers[key] / total) * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function StatsClient({ stats, initialLang }: { stats: Stats; initialLang: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang)
  const t = statsTranslations[lang]

  useEffect(() => { setLangCookie(lang) }, [lang])

  const cards = [
    { icon: FileText,   label: t.card_transcripts,       value: formatNum(stats.transcripts, lang),                 sub: t.card_transcripts_sub,        accent: true  },
    { icon: Activity,   label: t.card_transcripts_30d,   value: formatNum(stats.transcripts30d, lang),              sub: t.card_transcripts_30d_sub,    accent: false },
    { icon: Key,        label: t.card_api_keys,          value: formatNum(stats.apiKeys, lang),                     sub: t.card_api_keys_sub,           accent: false },
    { icon: TrendingUp, label: t.card_new_guilds,        value: formatNum(stats.newGuilds30d, lang),                sub: t.card_new_guilds_sub,         accent: false },
    { icon: Globe,      label: t.card_custom_domains,    value: formatNum(stats.customDomains, lang),               sub: t.card_custom_domains_sub,     accent: true  },
    { icon: Server,     label: t.card_hosted_bots,       value: formatNum(stats.hostedBots, lang),                  sub: t.card_hosted_bots_sub,        accent: false },
    { icon: Paperclip,  label: t.card_attachments,       value: formatNum(stats.attachments, lang),                 sub: t.card_attachments_sub,        accent: false },
    { icon: Files,      label: t.card_with_attachments,  value: formatNum(stats.transcriptsWithAttachments, lang),  sub: t.card_with_attachments_sub,   accent: false },
    { icon: Database,   label: t.card_total_storage,     value: formatBytes(stats.totalStorageBytes),               sub: t.card_total_storage_sub,      accent: true  },
    { icon: HardDrive,  label: t.card_avg_transcript,    value: formatBytes(stats.avgTranscriptBytes),              sub: t.card_avg_transcript_sub,     accent: false },
    { icon: HardDrive,  label: t.card_avg_attachment,    value: formatBytes(stats.avgAttachmentBytes),              sub: t.card_avg_attachment_sub,     accent: false },
    { icon: Maximize2,  label: t.card_max_transcript,    value: formatBytes(stats.maxTranscriptBytes),              sub: t.card_max_transcript_sub,     accent: false },
    { icon: Github,     label: t.card_sponsors,          value: formatNum(stats.sponsors, lang),                    sub: t.card_sponsors_sub,           accent: true  },
  ]

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-5xl">

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
          <div className="mt-1 shrink-0">
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(c => <StatCard key={c.label} {...c} />)}
        </div>

        {/* Tier Breakdowns */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TierBreakdown tiers={stats.tiers}        total={stats.apiKeys}  label={t.tier_distribution}    lang={lang} />
          <TierBreakdown tiers={stats.sponsorTiers} total={stats.sponsors} label={t.sponsor_distribution} lang={lang} />
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[0.6875rem] text-[var(--color-muted-foreground)]">
          {t.footer_note}
        </p>
      </div>
    </div>
  )
}
