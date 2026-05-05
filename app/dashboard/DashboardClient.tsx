'use client'

import { useState } from 'react'
import {
  Globe, CheckCircle, AlertCircle, Clock, Trash2,
  ExternalLink, RefreshCw, Loader2, Info,
} from 'lucide-react'
import { dashboardTranslations, type Lang } from '@/lib/i18n'
import type { Tier } from '@/lib/tiers'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Guild {
  guild_id:        string
  tier:            Tier
  custom_domain:   string | null
  domain_status:   'none' | 'pending_dns' | 'active'
  github_username: string | null
}

interface Props {
  guild:    Guild
  serverIp: string
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

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status, t }: { status: Guild['domain_status']; t: typeof dashboardTranslations.en }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 border border-accent/30 rounded-full px-2.5 py-0.5">
      <CheckCircle size={11} /> {t.active_label}
    </span>
  )
  if (status === 'pending_dns') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-2.5 py-0.5">
      <Clock size={11} /> {t.pending_label}
    </span>
  )
  return null
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DashboardClient({ guild, serverIp }: Props) {
  const [lang, setLang]                               = useState<Lang>('en')
  const t                                             = dashboardTranslations[lang]
  const hasPremium                                    = guild.tier === 'premium' || guild.tier === 'premium_plus'
  const [domain, setDomain]                           = useState(guild.custom_domain ?? '')
  const [domainStatus, setDomainStatus]               = useState<Guild['domain_status']>(guild.domain_status)
  const [loading, setLoading]                         = useState(false)
  const [validateLoading, setValidateLoading]         = useState(false)
  const [removeLoading, setRemoveLoading]             = useState(false)
  const [message, setMessage]                         = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied]                           = useState(false)

  const showMsg = (type: 'success' | 'error' | 'info', text: string) => setMessage({ type, text })

  const TIER_COLORS: Record<Tier, string> = {
    basic:        'text-dim bg-surface2 border-border',
    premium:      'text-accent bg-accent/10 border-accent/30',
    premium_plus: 'text-[#9d65fe] bg-[#9d65fe]/10 border-[#9d65fe]/30',
  }

  const handleSetDomain = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res  = await fetch('/api/domain/set', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ domain: domain.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { showMsg('error', data.error ?? 'Error'); return }
      setDomainStatus(data.status)
      if (data.status === 'active') showMsg('success', `✅ ${data.domain} is now active!`)
      else showMsg('info', data.message)
    } catch { showMsg('error', 'Network error. Please try again.') }
    finally   { setLoading(false) }
  }

  const handleValidate = async () => {
    setValidateLoading(true)
    setMessage(null)
    try {
      const res  = await fetch('/api/domain/validate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { showMsg('error', data.error ?? 'Error'); return }
      setDomainStatus(data.status)
      if (data.status === 'active') showMsg('success', `✅ DNS confirmed! Domain is now active.`)
      else showMsg('info', lang === 'en'
        ? 'DNS is not yet pointing to this server. Please wait a few minutes.'
        : 'DNS zeigt noch nicht auf diesen Server. Bitte warte ein paar Minuten.')
    } catch { showMsg('error', 'Network error.') }
    finally   { setValidateLoading(false) }
  }

  const handleRemove = async () => {
    const confirm_msg = lang === 'en'
      ? 'Really remove domain? It will be deactivated immediately.'
      : 'Domain wirklich entfernen? Die Domain wird sofort deaktiviert.'
    if (!confirm(confirm_msg)) return
    setRemoveLoading(true)
    setMessage(null)
    try {
      const res  = await fetch('/api/domain/remove', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { showMsg('error', data.error ?? 'Error'); return }
      setDomain('')
      setDomainStatus('none')
      showMsg('success', lang === 'en' ? 'Domain successfully removed.' : 'Domain erfolgreich entfernt.')
    } catch { showMsg('error', 'Network error.') }
    finally   { setRemoveLoading(false) }
  }

  const copyIp = () => {
    navigator.clipboard.writeText(serverIp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <span className="msk-label">{t.label}</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">{t.title}</h1>
            <p className="text-muted text-sm mt-1">
              {t.server_id} <code className="text-dim text-xs">{guild.guild_id}</code>
            </p>
          </div>
          <div className="mt-1">
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
        </div>

        {/* Tier Badge */}
        <div className={`inline-flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm font-semibold mb-6 ${TIER_COLORS[guild.tier]}`}>
          {t[`tier_${guild.tier}` as 'tier_basic' | 'tier_premium' | 'tier_premium_plus']}
          {guild.tier === 'basic' && (
            <a
              href="https://github.com/sponsors/MSK-Scripts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline text-xs font-normal ml-1"
            >
              {t.upgrade}
            </a>
          )}
        </div>

        {/* Custom Domain Card */}
        <div className="bg-surface border border-borderlt rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={18} className="text-accent" />
            <h2 className="text-white font-bold text-base">{t.domain_title}</h2>
            {domainStatus !== 'none' && <StatusBadge status={domainStatus} t={t} />}
          </div>
          <p className="text-muted text-sm mb-5">
            {t.domain_desc}{' '}
            <code className="text-dim text-xs">tickets.yourserver.com</code>{' '}
            {t.domain_instead}{' '}
            <code className="text-dim text-xs">www.msk-scripts.de</code>
          </p>

          {!hasPremium ? (
            <div className="flex items-start gap-3 bg-surface2 border border-borderlt rounded-lg p-4 text-sm text-muted">
              <Info size={16} className="shrink-0 mt-0.5 text-dim" />
              <span>
                {t.no_premium}{' '}
                <strong className="text-accent">{t.no_premium_link}</strong>{' '}
                {lang === 'en' ? 'available.' : 'verfügbar.'}{' '}
                <a href="https://github.com/sponsors/MSK-Scripts" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {t.no_premium_link2}
                </a>
              </span>
            </div>
          ) : (
            <>
              {message && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4 text-xs
                  ${message.type === 'success' ? 'bg-accent/10 border border-accent/30 text-accent' : ''}
                  ${message.type === 'error'   ? 'bg-danger/10 border border-danger/30 text-danger' : ''}
                  ${message.type === 'info'    ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' : ''}`}
                >
                  {message.type === 'success' && <CheckCircle size={14} className="shrink-0 mt-0.5" />}
                  {message.type === 'error'   && <AlertCircle size={14} className="shrink-0 mt-0.5" />}
                  {message.type === 'info'    && <Clock size={14} className="shrink-0 mt-0.5" />}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder={t.domain_placeholder}
                  className="msk-input flex-1"
                  disabled={loading}
                />
                <button
                  onClick={handleSetDomain}
                  disabled={loading || !domain.trim()}
                  className="msk-btn-primary shrink-0"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
                  {loading ? t.domain_btn_loading : t.domain_btn}
                </button>
              </div>

              {domainStatus === 'pending_dns' && (
                <div className="bg-surface2 border border-borderlt rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-white mb-3">{t.dns_title}</p>
                  <p className="text-muted text-xs mb-3">{t.dns_desc}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className="bg-surface border border-borderlt rounded p-2">
                      <div className="text-dim mb-1">{t.dns_type}</div>
                      <div className="text-white font-mono font-semibold">A</div>
                    </div>
                    <div className="bg-surface border border-borderlt rounded p-2">
                      <div className="text-dim mb-1">{t.dns_name}</div>
                      <div className="text-white font-mono font-semibold">@</div>
                    </div>
                    <div className="bg-surface border border-borderlt rounded p-2 cursor-pointer hover:border-accent/50" onClick={copyIp}>
                      <div className="text-dim mb-1">{t.dns_target}</div>
                      <div className="text-accent font-mono font-semibold">{copied ? '✓ Copied!' : serverIp}</div>
                    </div>
                  </div>
                  <p className="text-dim text-xs mb-3">{t.dns_note}</p>
                  <button
                    onClick={handleValidate}
                    disabled={validateLoading}
                    className="msk-btn-ghost w-full justify-center text-sm"
                  >
                    {validateLoading
                      ? <><Loader2 size={14} className="animate-spin" /> {t.dns_checking}</>
                      : <><RefreshCw size={14} /> {t.dns_check}</>
                    }
                  </button>
                </div>
              )}

              {domainStatus === 'active' && domain && (
                <div className="flex items-center justify-between bg-surface2 border border-borderlt rounded-lg px-4 py-3 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle size={15} className="text-accent shrink-0" />
                    <a
                      href={`https://${domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline truncate flex items-center gap-1"
                    >
                      {domain}
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <button
                    onClick={handleRemove}
                    disabled={removeLoading}
                    className="shrink-0 ml-3 p-1.5 rounded hover:bg-danger/10 text-dim hover:text-danger transition-colors"
                    title={t.remove_title}
                  >
                    {removeLoading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              )}

              <p className="text-dim text-xs">
                {lang === 'en'
                  ? `Make sure the A-Record points to `
                  : `Stelle sicher, dass der A-Record auf `}
                <strong className="text-muted">{serverIp}</strong>
                {lang === 'en' ? ' before activating.' : ' zeigt bevor du die Domain aktivierst.'}
              </p>
            </>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-4 flex gap-3">
          <a href="/verify" className="msk-btn-ghost text-sm">
            {t.new_api_key}
          </a>
          <a
            href="https://docu.msk-scripts.de/discord/discord_ticketbot/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="msk-btn-ghost text-sm"
          >
            <ExternalLink size={14} />
            {t.docs}
          </a>
        </div>

      </div>
    </div>
  )
}
