'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  CheckCircle, Copy, Check, AlertCircle, Loader2,
  ExternalLink, Globe, RefreshCw, LayoutDashboard,
} from 'lucide-react'
import type { DiscordGuild, VerifySession } from '@/lib/session'
import { translations } from '@/lib/i18n'
import { useLang } from '@/components/i18n/LangProvider'
import type { Tier } from '@/lib/tiers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current, t }: {
  current: number
  t: { step_discord: string; step_select: string; step_done: string; step_completed: string; step_current: string }
}) {
  const steps = [t.step_discord, t.step_select, t.step_done]
  // Welcher Schritt gerade dran und welcher erledigt ist, stand bis zum
  // 22.08.2026 ausschließlich in der Farbe: grüner Ring gegen graue Umrandung.
  // Wer die nicht sieht, hörte drei gleichwertige Wörter.
  return (
    <ol className="mx-auto mb-8 flex w-full max-w-md items-center justify-center gap-0">
      {steps.map((label, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <li
            key={label}
            className="flex flex-1 items-center last:flex-none"
            aria-current={active ? 'step' : undefined}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
                  done && 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
                  active && 'border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
                  !done && !active && 'border border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : idx}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-[10px] font-medium',
                  active && 'text-[var(--color-primary)]',
                  done && !active && 'text-[var(--color-muted-foreground)]',
                  // `opacity-70` lag hier bei rund 3,1:1 auf 10-px-Text.
                  !done && !active && 'text-[var(--color-muted-foreground)]',
                )}
              >
                {label}
              </span>
              {(done || active) && (
                <span className="sr-only">{done ? t.step_completed : t.step_current}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 mb-4 h-px flex-1 transition-colors',
                  done ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ── Discord Icon ───────────────────────────────────────────────────────────────

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden="true">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  )
}

// ── Guild Icon ─────────────────────────────────────────────────────────────────

function GuildIcon({ guild }: { guild: DiscordGuild }) {
  if (guild.icon) {
    return (
      <Image
        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
        alt={guild.name}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] text-sm font-bold text-[var(--color-muted-foreground)]">
      {guild.name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Error Banner ───────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  session: VerifySession | null
  step: string | null
  errorCode: string | null
}

const TIER_LABELS: Record<string, { en: string; de: string }> = {
  basic:        { en: 'Basic (Free)', de: 'Basic (Kostenlos)' },
  premium:      { en: 'Premium',      de: 'Premium' },
  premium_plus: { en: 'Premium+',     de: 'Premium+' },
}

export default function VerifyClient({ session, step: _step, errorCode }: Props) {
  const { lang } = useLang()
  const t = translations[lang]

  const [selectedGuildId, setSelectedGuildId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [result, setResult] = useState<{ apiKey: string; tier: string } | null>(null)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [existingGuild, setExistingGuild] = useState<{ tier: Tier } | null>(null)
  const [discordChecking, setDiscordChecking] = useState(false)
  const [discordStatus, setDiscordStatus] = useState<'none' | 'minor' | 'major' | 'critical' | 'unknown' | null>(null)

  const errorMap: Record<string, keyof typeof t> = {
    invalid_state:         'err_invalid_state',
    discord_token_failed:  'err_discord_token_failed',
    discord_guilds_failed: 'err_discord_guilds_failed',
  }
  const errorMessage = errorCode ? t[errorMap[errorCode] ?? 'err_invalid_state'] : null

  const hasDiscord = !!session?.guilds
  const currentStep = result ? 3 : hasDiscord ? 2 : 1

  const handleContinue = async () => {
    if (!selectedGuildId) return
    setLoading(true)
    setCompleteError(null)
    try {
      const res = await fetch('/api/verify/check-guild', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId: selectedGuildId }),
      })
      const data = await res.json()
      if (!res.ok) { setCompleteError(data.error ?? 'Error'); return }
      if (data.exists && data.ownedByCurrentUser) {
        setExistingGuild({ tier: data.tier })
      } else {
        await handleGenerateKey()
      }
    } catch { setCompleteError(t.err_network) }
    finally   { setLoading(false) }
  }

  const handleGenerateKey = async () => {
    if (!selectedGuildId) return
    setLoading(true)
    setCompleteError(null)
    try {
      const res = await fetch('/api/verify/complete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId: selectedGuildId }),
      })
      const data = await res.json()
      if (!res.ok) setCompleteError(data.error ?? 'Error')
      else { setExistingGuild(null); setResult({ apiKey: data.apiKey, tier: data.tier }) }
    } catch { setCompleteError(t.err_network) }
    finally   { setLoading(false) }
  }

  const handleGoToDashboard = async () => {
    if (!selectedGuildId) return
    setDashboardLoading(true)
    setCompleteError(null)
    try {
      const res = await fetch('/api/verify/redirect-dashboard', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId: selectedGuildId }),
      })
      const data = await res.json()
      if (!res.ok) { setCompleteError(data.error ?? 'Error'); return }
      // Hard-Navigation: das gerade gesetzte msk_dashboard_session-Cookie muss
      // server-seitig gelesen werden. router.push() würde ggf. einen im
      // Router-Cache liegenden (ausgeloggten) Redirect zurück auf /verify abspielen.
      // Die Lint-Regel kennt diesen Fall nicht: sie sieht ein internes Ziel und
      // schlägt router.push() vor, das hier nachweislich den Login zerlegt hat.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/ticketbot/dashboard'
    } catch { setCompleteError(t.err_network) }
    finally   { setDashboardLoading(false) }
  }

  const handleDiscordLogin = async () => {
    setDiscordChecking(true)
    setDiscordStatus(null)
    try {
      const res = await fetch('/api/discord/health')
      const data = await res.json()
      const indicator = data.indicator as typeof discordStatus
      if (indicator === 'none') {
        // Route Handler, keine Seite: der Endpunkt antwortet mit einem Redirect
        // zu Discord. Der Next-Router kann das nicht, er erwartet eine Route im
        // App-Router. Die Regel prüft nur den führenden Slash.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/api/auth/discord-verify'
        return
      }
      setDiscordStatus(indicator ?? 'unknown')
    } catch {
      setDiscordStatus('unknown')
    } finally {
      setDiscordChecking(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    // In einem unsicheren Kontext lehnt die Zwischenablage ab. Ohne `catch`
    // bleibt eine unbehandelte Ablehnung stehen und der Haken erscheint
    // trotzdem, obwohl nichts kopiert wurde.
    try {
      await navigator.clipboard.writeText(result.apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCompleteError(t.done_copy_failed)
    }
  }

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem-12rem)] flex-col items-center justify-center py-12 md:py-16">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <span className="eyebrow">{t.verify_label}</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{t.verify_title}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{t.verify_subtitle}</p>
          </div>
        </div>

        <StepIndicator current={currentStep} t={t} />

        <Card className="p-6">

          {errorMessage && <ErrorBanner message={errorMessage as string} />}

          {/* Step 1 — Discord */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-discord)]/30 bg-[var(--color-discord)]/15 text-[var(--color-discord)]">
                <DiscordIcon size={28} />
              </div>
              <h2 className="mb-1 text-lg font-bold">{t.discord_title}</h2>
              <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">{t.discord_desc}</p>

              {discordStatus && discordStatus !== 'none' && (
                <div
                  className={cn(
                    'mb-4 flex flex-col gap-2 rounded-lg border px-4 py-3 text-left text-sm',
                    discordStatus === 'minor' || discordStatus === 'unknown'
                      ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500'
                      : 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{
                      discordStatus === 'minor'    ? t.discord_status_minor    :
                      discordStatus === 'major'    ? t.discord_status_major    :
                      discordStatus === 'critical' ? t.discord_status_critical :
                      t.discord_status_unknown
                    }</span>
                  </div>
                  <a
                    href="/api/auth/discord-verify"
                    className="pl-6 text-xs underline underline-offset-2 opacity-70 transition-opacity hover:opacity-100"
                  >
                    {t.discord_try_anyway}
                  </a>
                </div>
              )}

              <Button
                onClick={handleDiscordLogin}
                disabled={discordChecking}
                variant="discord"
                className="w-full"
              >
                {discordChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <DiscordIcon size={18} />}
                {discordChecking ? t.discord_btn_checking : t.discord_btn}
              </Button>
            </div>
          )}

          {/* Step 2 — Select Server */}
          {currentStep === 2 && !result && !existingGuild && (
            <div>
              <h2 className="mb-1 text-lg font-bold">{t.select_title}</h2>
              <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">{t.select_desc}</p>

              <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5 text-xs text-yellow-500">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{t.select_warning}</span>
              </div>

              {completeError && <ErrorBanner message={completeError} />}

              {session?.guilds?.length === 0 && (
                <div className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
                  {t.select_no_guilds}
                </div>
              )}

              <div className="mb-6 max-h-72 space-y-2 overflow-y-auto pr-1">
                {session?.guilds?.map(guild => (
                  <button
                    key={guild.id}
                    onClick={() => setSelectedGuildId(guild.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                      selectedGuildId === guild.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'border-[var(--color-border)] bg-[var(--color-muted)] hover:border-[color-mix(in_oklab,var(--color-primary)_30%,var(--color-border))]',
                    )}
                  >
                    <GuildIcon guild={guild} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{guild.name}</div>
                      <div className="font-mono text-xs text-[var(--color-muted-foreground)]">{guild.id}</div>
                    </div>
                    {selectedGuildId === guild.id && (
                      <CheckCircle className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    )}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleContinue}
                disabled={!selectedGuildId || loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {loading ? t.select_btn_loading : t.select_btn}
              </Button>
            </div>
          )}

          {/* Step 2 — Already registered */}
          {currentStep === 2 && !result && existingGuild && (
            <div>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/15 text-yellow-500">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight">{t.existing_title}</h2>
                  <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">{t.existing_desc}</p>
                </div>
              </div>

              {completeError && <ErrorBanner message={completeError} />}

              <div className="mb-5 space-y-3">
                {/* Option A — Generate new key */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" />
                    <span className="text-sm font-semibold">{t.existing_new_key_title}</span>
                  </div>
                  <p className="mb-3 pl-5 text-xs text-[var(--color-muted-foreground)]">
                    {t.existing_new_key_desc}
                  </p>
                  <Button
                    onClick={handleGenerateKey}
                    disabled={loading || dashboardLoading}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    {loading ? t.existing_new_key_loading : t.existing_new_key_btn}
                  </Button>
                </div>

                {/* Option B — Go to Dashboard */}
                {(existingGuild.tier === 'premium' || existingGuild.tier === 'premium_plus') && (
                  <div className="rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                      <span className="text-sm font-semibold">{t.existing_dashboard_title}</span>
                    </div>
                    <p className="mb-3 pl-5 text-xs text-[var(--color-muted-foreground)]">
                      {t.existing_dashboard_desc}
                    </p>
                    <Button
                      onClick={handleGoToDashboard}
                      disabled={loading || dashboardLoading}
                      size="sm"
                      className="w-full"
                    >
                      {dashboardLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LayoutDashboard className="h-3.5 w-3.5" />}
                      {dashboardLoading ? t.existing_dashboard_loading : t.existing_dashboard_btn}
                    </Button>
                  </div>
                )}
              </div>

              <button
                onClick={() => { setExistingGuild(null); setCompleteError(null) }}
                className="w-full text-center text-xs text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
              >
                {t.existing_back}
              </button>
            </div>
          )}

          {/* Step 4 — Done */}
          {result && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/20">
                <CheckCircle className="h-7 w-7 text-[var(--color-primary)]" />
              </div>
              <h2 className="mb-1 text-lg font-bold">{t.done_title}</h2>
              <p className="mb-2 text-sm text-[var(--color-muted-foreground)]">
                {t.done_tier}{' '}
                <span className="font-semibold text-[var(--color-primary)]">
                  {TIER_LABELS[result.tier]?.[lang] ?? result.tier}
                </span>
              </p>
              <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
                {t.done_instruction}{' '}
                <code className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-primary)]">.env</code>
                {lang === 'de' ? ' deines Bots ein.' : ' of your bot.'}
              </p>

              <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-left">
                <div className="mb-2 font-mono text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  MSK_API_KEY
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all font-mono text-xs text-[var(--color-primary)]">{result.apiKey}</code>
                  <button
                    onClick={handleCopy}
                    className="tap-target shrink-0 rounded p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-foreground)]"
                    // Der Knopf trägt nur ein Symbol. Der Name wechselt mit dem
                    // Zustand mit, sonst bleibt das Kopieren unbestätigt, wenn
                    // man den Haken nicht sieht.
                    aria-label={copied ? t.done_copied : t.done_copy}
                    title={copied ? t.done_copied : t.done_copy}
                  >
                    {copied ? <Check className="h-4 w-4 text-[var(--color-primary)]" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <p className="mb-2 text-xs text-[var(--color-muted-foreground)]">{t.done_warning}</p>

              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-2.5 text-xs text-[var(--color-primary)]">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                {t.done_close}
              </div>

              <Button asChild variant="outline" className="mb-2 w-full">
                <a
                  href="https://docu.msk-scripts.de/discord/discord_ticketbot/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t.done_docs}
                </a>
              </Button>

              <Button asChild className="w-full">
                <a href="/ticketbot/dashboard">
                  <Globe className="h-3.5 w-3.5" />
                  {t.done_dashboard}
                </a>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
