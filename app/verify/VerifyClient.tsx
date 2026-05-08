'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Github, Copy, Check, AlertCircle, Loader2, ExternalLink, Globe, RefreshCw, LayoutDashboard } from 'lucide-react'
import type { DiscordGuild, VerifySession } from '@/lib/session'
import { translations, type Lang } from '@/lib/i18n'
import type { Tier } from '@/lib/tiers'

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

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current, t }: { current: number; t: { step_github: string; step_discord: string; step_select: string; step_done: string } }) {
  const steps = [t.step_github, t.step_discord, t.step_select, t.step_done]
  return (
    <div className="flex items-center justify-center gap-0 mb-8 w-full max-w-md mx-auto">
      {steps.map((label, i) => {
        const idx    = i + 1
        const done   = idx < current
        const active = idx === current
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${done   ? 'bg-accent text-white' : ''}
                ${active ? 'bg-accent/20 border-2 border-accent text-accent' : ''}
                ${!done && !active ? 'bg-surface2 border border-border text-dim' : ''}`}
              >
                {done ? <Check size={14} /> : idx}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap
                ${active ? 'text-accent' : done ? 'text-muted' : 'text-dim'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 mx-2 mb-4 transition-colors ${done ? 'bg-accent' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Discord Icon ───────────────────────────────────────────────────────────────

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  )
}

// ── Guild Icon ─────────────────────────────────────────────────────────────────

function GuildIcon({ guild }: { guild: DiscordGuild }) {
  if (guild.icon) {
    return (
      <img
        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
        alt={guild.name}
        className="w-10 h-10 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-surface2 border border-borderlt flex items-center justify-center text-sm font-bold text-muted">
      {guild.name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Error Banner ───────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 mb-6 text-sm text-danger">
      <AlertCircle size={16} className="shrink-0" />
      {message}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  session:   VerifySession | null
  step:      string | null
  errorCode: string | null
}

const TIER_LABELS: Record<string, { en: string; de: string }> = {
  basic:        { en: 'Basic (Free)',  de: 'Basic (Kostenlos)' },
  premium:      { en: 'Premium',       de: 'Premium' },
  premium_plus: { en: 'Premium+',      de: 'Premium+' },
}

export default function VerifyClient({ session, step, errorCode }: Props) {
  const router                                  = useRouter()
  const [lang, setLang]                         = useState<Lang>('en')
  const t                                       = translations[lang]
  const [selectedGuildId, setSelectedGuildId]   = useState<string>('')
  const [loading, setLoading]                   = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [result, setResult]                     = useState<{ apiKey: string; tier: string } | null>(null)
  const [completeError, setCompleteError]       = useState<string | null>(null)
  const [copied, setCopied]                     = useState(false)
  const [existingGuild, setExistingGuild]       = useState<{ tier: Tier } | null>(null)
  const [discordChecking, setDiscordChecking]   = useState(false)
  const [discordStatus, setDiscordStatus]       = useState<'none' | 'minor' | 'major' | 'critical' | 'unknown' | null>(null)

  const errorMap: Record<string, keyof typeof t> = {
    invalid_state:         'err_invalid_state',
    github_token_failed:   'err_github_token_failed',
    github_user_failed:    'err_github_user_failed',
    discord_token_failed:  'err_discord_token_failed',
    discord_guilds_failed: 'err_discord_guilds_failed',
    github_required:       'err_github_required',
  }
  const errorMessage = errorCode ? t[errorMap[errorCode] ?? 'err_invalid_state'] : null

  const hasGitHub  = !!session?.githubUsername
  const hasDiscord = !!session?.guilds
  const currentStep = result ? 4 : hasDiscord ? 3 : hasGitHub ? 2 : 1

  // Step 1: check if guild already has a key, then show choice or proceed directly
  const handleContinue = async () => {
    if (!selectedGuildId) return
    setLoading(true)
    setCompleteError(null)
    try {
      const res  = await fetch('/api/verify/check-guild', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId: selectedGuildId }),
      })
      const data = await res.json()
      if (!res.ok) { setCompleteError(data.error ?? 'Error'); return }
      if (data.exists && data.ownedByCurrentUser) {
        setExistingGuild({ tier: data.tier })
      } else {
        // Not registered yet (or owned by different account — let complete handle that error)
        await handleGenerateKey()
      }
    } catch { setCompleteError('Network error. Please try again.') }
    finally   { setLoading(false) }
  }

  // Step 2a: generate a new API key (replaces existing)
  const handleGenerateKey = async () => {
    if (!selectedGuildId) return
    setLoading(true)
    setCompleteError(null)
    try {
      const res  = await fetch('/api/verify/complete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId: selectedGuildId }),
      })
      const data = await res.json()
      if (!res.ok) setCompleteError(data.error ?? 'Error')
      else { setExistingGuild(null); setResult({ apiKey: data.apiKey, tier: data.tier }) }
    } catch { setCompleteError('Network error. Please try again.') }
    finally   { setLoading(false) }
  }

  // Step 2b: go to dashboard without generating a new key
  const handleGoToDashboard = async () => {
    if (!selectedGuildId) return
    setDashboardLoading(true)
    setCompleteError(null)
    try {
      const res  = await fetch('/api/verify/redirect-dashboard', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId: selectedGuildId }),
      })
      const data = await res.json()
      if (!res.ok) { setCompleteError(data.error ?? 'Error'); return }
      router.push('/dashboard')
    } catch { setCompleteError('Network error. Please try again.') }
    finally   { setDashboardLoading(false) }
  }

  const handleDiscordLogin = async () => {
    setDiscordChecking(true)
    setDiscordStatus(null)
    try {
      const res  = await fetch('/api/discord/health')
      const data = await res.json()
      const indicator = data.indicator as typeof discordStatus
      if (indicator === 'none') {
        // All good — redirect immediately
        window.location.href = '/api/auth/discord-verify'
        return
      }
      // Issues detected — show banner, let user decide
      setDiscordStatus(indicator ?? 'unknown')
    } catch {
      setDiscordStatus('unknown')
    } finally {
      setDiscordChecking(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <span className="msk-label">{t.verify_label}</span>
            <h1 className="text-3xl font-extrabold text-white mt-2">{t.verify_title}</h1>
            <p className="text-muted text-sm mt-2">{t.verify_subtitle}</p>
          </div>
          <div className="mt-1">
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
        </div>

        <StepIndicator current={currentStep} t={t} />

        <div className="bg-surface border border-borderlt rounded-xl p-6">

          {errorMessage && <ErrorBanner message={errorMessage as string} />}

          {/* Step 1 — GitHub */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-surface2 border border-borderlt flex items-center justify-center mx-auto mb-4">
                <Github size={28} className="text-muted" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">{t.github_title}</h2>
              <p className="text-muted text-sm mb-6">{t.github_desc}</p>
              <a href="/api/auth/github" className="msk-btn-primary w-full justify-center">
                <Github size={18} />
                {t.github_btn}
              </a>
            </div>
          )}

          {/* Step 2 — Discord */}
          {currentStep === 2 && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-discord/20 border border-discord/30 flex items-center justify-center mx-auto mb-4">
                <DiscordIcon size={28} />
              </div>
              <h2 className="text-white font-bold text-lg mb-1">{t.discord_title}</h2>
              <p className="text-muted text-sm mb-1">
                {t.discord_signed_as}{' '}
                <span className="text-accent font-semibold">@{session?.githubUsername}</span>
              </p>
              <p className="text-muted text-sm mb-6">{t.discord_desc}</p>

              {/* Discord status banner */}
              {discordStatus && discordStatus !== 'none' && (
                <div className={`flex flex-col gap-2 rounded-lg px-4 py-3 mb-4 text-sm text-left ${
                  discordStatus === 'minor' || discordStatus === 'unknown'
                    ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                    : 'bg-danger/10 border border-danger/30 text-danger'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{
                      discordStatus === 'minor'    ? t.discord_status_minor    :
                      discordStatus === 'major'    ? t.discord_status_major    :
                      discordStatus === 'critical' ? t.discord_status_critical :
                      t.discord_status_unknown
                    }</span>
                  </div>
                  <a
                    href="/api/auth/discord-verify"
                    className="text-xs underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity pl-6"
                  >
                    {t.discord_try_anyway}
                  </a>
                </div>
              )}

              <button
                onClick={handleDiscordLogin}
                disabled={discordChecking}
                className="msk-btn-discord w-full justify-center disabled:opacity-60"
              >
                {discordChecking
                  ? <Loader2 size={18} className="animate-spin" />
                  : <DiscordIcon size={18} />}
                {discordChecking ? t.discord_btn_checking : t.discord_btn}
              </button>
            </div>
          )}

          {/* Step 3 — Select Server */}
          {currentStep === 3 && !result && !existingGuild && (
            <div>
              <h2 className="text-white font-bold text-lg mb-1">{t.select_title}</h2>
              <p className="text-muted text-sm mb-3">{t.select_desc}</p>

              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5 mb-4 text-xs text-yellow-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{t.select_warning}</span>
              </div>

              {completeError && <ErrorBanner message={completeError} />}

              {session?.guilds?.length === 0 && (
                <div className="text-center py-6 text-muted text-sm">{t.select_no_guilds}</div>
              )}

              <div className="space-y-2 mb-6 max-h-72 overflow-y-auto pr-1">
                {session?.guilds?.map(guild => (
                  <button
                    key={guild.id}
                    onClick={() => setSelectedGuildId(guild.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                      ${selectedGuildId === guild.id
                        ? 'border-accent bg-accent/10'
                        : 'border-borderlt bg-surface2 hover:border-border'}`}
                  >
                    <GuildIcon guild={guild} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{guild.name}</div>
                      <div className="text-xs text-dim">{guild.id}</div>
                    </div>
                    {selectedGuildId === guild.id && <CheckCircle size={18} className="text-accent shrink-0" />}
                  </button>
                ))}
              </div>

              <button
                onClick={handleContinue}
                disabled={!selectedGuildId || loading}
                className="msk-btn-primary w-full justify-center"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {loading ? t.select_btn_loading : t.select_btn}
              </button>
            </div>
          )}

          {/* Step 3 — Already registered: choose action */}
          {currentStep === 3 && !result && existingGuild && (
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">{t.existing_title}</h2>
                  <p className="text-muted text-xs mt-0.5">{t.existing_desc}</p>
                </div>
              </div>

              {completeError && <ErrorBanner message={completeError} />}

              <div className="space-y-3 mb-5">
                {/* Option A — Generate new key */}
                <div className="bg-surface2 border border-borderlt rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw size={14} className="text-muted shrink-0" />
                    <span className="text-sm font-semibold text-white">{t.existing_new_key_title}</span>
                  </div>
                  <p className="text-xs text-dim mb-3 pl-5">{t.existing_new_key_desc}</p>
                  <button
                    onClick={handleGenerateKey}
                    disabled={loading || dashboardLoading}
                    className="msk-btn-ghost w-full justify-center text-xs py-2"
                  >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    {loading ? t.existing_new_key_loading : t.existing_new_key_btn}
                  </button>
                </div>

                {/* Option B — Go to Dashboard (Premium / Premium+ only) */}
                {(existingGuild.tier === 'premium' || existingGuild.tier === 'premium_plus') && (
                  <div className="bg-accent/5 border border-accent/25 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <LayoutDashboard size={14} className="text-accent shrink-0" />
                      <span className="text-sm font-semibold text-white">{t.existing_dashboard_title}</span>
                    </div>
                    <p className="text-xs text-dim mb-3 pl-5">{t.existing_dashboard_desc}</p>
                    <button
                      onClick={handleGoToDashboard}
                      disabled={loading || dashboardLoading}
                      className="msk-btn-primary w-full justify-center text-xs py-2"
                    >
                      {dashboardLoading ? <Loader2 size={13} className="animate-spin" /> : <LayoutDashboard size={13} />}
                      {dashboardLoading ? t.existing_dashboard_loading : t.existing_dashboard_btn}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => { setExistingGuild(null); setCompleteError(null) }}
                className="text-xs text-dim hover:text-muted transition-colors w-full text-center"
              >
                {t.existing_back}
              </button>
            </div>
          )}

          {/* Step 4 — Done */}
          {result && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-accent" />
              </div>
              <h2 className="text-white font-bold text-lg mb-1">{t.done_title}</h2>
              <p className="text-muted text-sm mb-2">
                {t.done_tier}{' '}
                <span className="text-accent font-semibold">
                  {TIER_LABELS[result.tier]?.[lang] ?? result.tier}
                </span>
              </p>
              <p className="text-muted text-sm mb-6">
                {t.done_instruction}{' '}
                <code className="bg-surface2 border border-borderlt px-1.5 py-0.5 rounded text-xs text-accent">.env</code>
                {lang === 'de' ? ' deines Bots ein.' : ' of your bot.'}
              </p>

              <div className="bg-surface2 border border-borderlt rounded-lg p-4 mb-4 text-left">
                <div className="text-xs text-dim mb-2 font-medium uppercase tracking-wider">MSK_API_KEY</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-accent font-mono break-all">{result.apiKey}</code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-1.5 rounded hover:bg-surface transition-colors text-muted hover:text-white"
                    title={t.done_copy}
                  >
                    {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <p className="text-dim text-xs mb-2">{t.done_warning}</p>

              <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-lg px-3 py-2.5 mb-4 text-xs text-accent">
                <CheckCircle size={14} className="shrink-0" />
                {t.done_close}
              </div>

              <a
                href="https://docu.msk-scripts.de/discord/discord_ticketbot/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="msk-btn-ghost w-full justify-center mb-2"
              >
                <ExternalLink size={14} />
                {t.done_docs}
              </a>

              <a href="/dashboard" className="msk-btn-primary w-full justify-center">
                <Globe size={14} />
                {t.done_dashboard}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
