'use client'

import { useEffect, useState }  from 'react'
import { FileText, Key, HardDrive, Paperclip, Github, BarChart3 } from 'lucide-react'
import { statsTranslations, type Lang } from '@/lib/i18n'
import { setLangCookie }         from '@/lib/lang'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Stats {
  available:          boolean
  transcripts:        number
  apiKeys:            number
  tiers:              Record<string, number>
  avgTranscriptBytes: number
  attachments:        number
  avgAttachmentBytes: number
  sponsors:           number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3)  return `${(bytes / 1024 ** 2).toFixed(2)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatNum(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US').format(n)
}

// ── Language Toggle ────────────────────────────────────────────────────────────

function LanguageToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 bg-surface2 border border-borderlt rounded-lg p-1 text-xs font-semibold">
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded transition-colors ${lang === 'en' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('de')}
        className={`px-2.5 py-1 rounded transition-colors ${lang === 'de' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
      >
        DE
      </button>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

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
    <div className="bg-surface border border-borderlt rounded-xl p-5 flex flex-col gap-3 hover:border-accent/30 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted'}`}>
          <Icon size={16} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</span>
      </div>
      <p className="text-3xl font-extrabold text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-dim">{sub}</p>}
    </div>
  )
}

// ── Tier Bar ───────────────────────────────────────────────────────────────────

function TierBreakdown({ tiers, total, label, lang }: {
  tiers: Record<string, number>
  total: number
  label: string
  lang:  Lang
}) {
  const items = [
    { key: 'basic',        label: 'Basic',    color: 'bg-dim',        textColor: 'text-dim' },
    { key: 'premium',      label: 'Premium',  color: 'bg-accent',     textColor: 'text-accent' },
    { key: 'premium_plus', label: 'Premium+', color: 'bg-yellow-400', textColor: 'text-yellow-400' },
  ]

  return (
    <div className="bg-surface border border-borderlt rounded-xl p-5 hover:border-accent/30 transition-colors">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-surface2 text-muted flex items-center justify-center shrink-0">
          <BarChart3 size={16} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</span>
      </div>

      {total > 0 ? (
        <div className="flex h-3 rounded-full overflow-hidden gap-px mb-4">
          {items.map(({ key, color }) => {
            const pct = (tiers[key] / total) * 100
            return pct > 0 ? (
              <div key={key} className={`${color} transition-all`} style={{ width: `${pct}%` }} />
            ) : null
          })}
        </div>
      ) : (
        <div className="h-3 rounded-full bg-surface2 mb-4" />
      )}

      <div className="grid grid-cols-3 gap-3">
        {items.map(({ key, label: tierLabel, textColor }) => (
          <div key={key} className="bg-surface2 rounded-lg px-3 py-2.5 flex flex-col gap-1">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor}`}>{tierLabel}</span>
            <span className="text-xl font-extrabold text-white">{formatNum(tiers[key], lang)}</span>
            <span className="text-[11px] text-dim">
              {total > 0 ? `${((tiers[key] / total) * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StatsClient({ stats, initialLang }: { stats: Stats; initialLang: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang)
  const t = statsTranslations[lang]

  useEffect(() => { setLangCookie(lang) }, [lang])

  const cards = [
    { icon: FileText,  label: t.card_transcripts,    value: formatNum(stats.transcripts, lang),        sub: t.card_transcripts_sub,    accent: true  },
    { icon: Key,       label: t.card_api_keys,        value: formatNum(stats.apiKeys, lang),            sub: t.card_api_keys_sub,       accent: false },
    { icon: Paperclip, label: t.card_attachments,     value: formatNum(stats.attachments, lang),        sub: t.card_attachments_sub,    accent: false },
    { icon: HardDrive, label: t.card_avg_transcript,  value: formatBytes(stats.avgTranscriptBytes),     sub: t.card_avg_transcript_sub, accent: false },
    { icon: HardDrive, label: t.card_avg_attachment,  value: formatBytes(stats.avgAttachmentBytes),     sub: t.card_avg_attachment_sub, accent: false },
    { icon: Github,    label: t.card_sponsors,        value: formatNum(stats.sponsors, lang),           sub: t.card_sponsors_sub,       accent: true  },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {stats.available ? (
              <>
                <span className="msk-label">{t.status_live}</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" />
                  {t.status_refresh}
                </span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-bold uppercase tracking-widest text-danger">{t.status_unavailable}</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" />
                  {t.status_db_unreachable}
                </span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">{t.title}</h1>
          <p className="text-sm text-muted max-w-xl">{t.subtitle}</p>
        </div>
        <div className="mt-1 shrink-0">
          <LanguageToggle lang={lang} setLang={setLang} />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Tier Breakdown */}
      <TierBreakdown tiers={stats.tiers} total={stats.apiKeys} label={t.tier_distribution} lang={lang} />

      {/* Footer note */}
      <p className="text-center text-[11px] text-dim mt-8">{t.footer_note}</p>
    </div>
  )
}
