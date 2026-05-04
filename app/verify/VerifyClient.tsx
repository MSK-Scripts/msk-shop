'use client'

import { useState } from 'react'
import { CheckCircle, Github, Copy, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import type { DiscordGuild, VerifySession } from '@/lib/session'

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['GitHub', 'Discord', 'Server auswählen', 'Fertig']
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
              <div className={`h-px flex-1 mx-2 mb-4 transition-colors
                ${done ? 'bg-accent' : 'bg-border'}`} />
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
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

// ── Error Messages ─────────────────────────────────────────────────────────────

function friendlyError(code: string | null): string | null {
  const map: Record<string, string> = {
    invalid_state:         'Sicherheitsüberprüfung fehlgeschlagen. Bitte versuche es erneut.',
    github_token_failed:   'GitHub-Authentifizierung fehlgeschlagen. Bitte versuche es erneut.',
    github_user_failed:    'GitHub-Nutzerdaten konnten nicht abgerufen werden.',
    discord_token_failed:  'Discord-Authentifizierung fehlgeschlagen. Bitte versuche es erneut.',
    discord_guilds_failed: 'Discord-Server konnten nicht abgerufen werden.',
    github_required:       'Bitte verbinde zuerst deinen GitHub-Account.',
  }
  return code ? (map[code] ?? `Unbekannter Fehler: ${code}`) : null
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  session:    VerifySession | null
  step:       string | null
  errorCode:  string | null
}

export default function VerifyClient({ session, step, errorCode }: Props) {
  const [selectedGuildId, setSelectedGuildId] = useState<string>('')
  const [loading, setLoading]                 = useState(false)
  const [result, setResult]                   = useState<{ apiKey: string; tier: string } | null>(null)
  const [completeError, setCompleteError]     = useState<string | null>(null)
  const [copied, setCopied]                   = useState(false)

  const errorMessage = friendlyError(errorCode)

  // Determine which step we're on
  const hasGitHub  = !!session?.githubUsername
  const hasDiscord = !!session?.guilds
  const currentStep = result ? 4 : hasDiscord ? 3 : hasGitHub ? 2 : 1

  const handleComplete = async () => {
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

      if (!res.ok) {
        setCompleteError(data.error ?? 'Unbekannter Fehler.')
      } else {
        setResult({ apiKey: data.apiKey, tier: data.tier })
      }
    } catch {
      setCompleteError('Netzwerkfehler. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const TIER_LABELS: Record<string, string> = {
    basic:        'Basic (Free)',
    premium:      'Premium',
    premium_plus: 'Premium+',
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="msk-label">Ticket Bot</span>
          <h1 className="text-3xl font-extrabold text-white mt-2">Server verifizieren</h1>
          <p className="text-muted text-sm mt-2">
            Verknüpfe deinen GitHub-Account und Discord-Server um deinen API Key zu erhalten.
          </p>
        </div>

        <StepIndicator current={currentStep} />

        <div className="bg-surface border border-borderlt rounded-xl p-6">

          {errorMessage && <ErrorBanner message={errorMessage} />}

          {/* ── Step 1: GitHub ── */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-surface2 border border-borderlt flex items-center justify-center mx-auto mb-4">
                <Github size={28} className="text-muted" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">GitHub verbinden</h2>
              <p className="text-muted text-sm mb-6">
                Damit wir deinen Sponsoring-Status überprüfen können, musst du dich mit GitHub anmelden.
              </p>
              <a href="/api/auth/github" className="msk-btn-primary w-full justify-center">
                <Github size={18} />
                Mit GitHub anmelden
              </a>
            </div>
          )}

          {/* ── Step 2: Discord ── */}
          {currentStep === 2 && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-discord/20 border border-discord/30 flex items-center justify-center mx-auto mb-4">
                <DiscordIcon size={28} />
              </div>
              <h2 className="text-white font-bold text-lg mb-1">Discord verbinden</h2>
              <p className="text-muted text-sm mb-1">
                Angemeldet als{' '}
                <span className="text-accent font-semibold">@{session?.githubUsername}</span>
              </p>
              <p className="text-muted text-sm mb-6">
                Verbinde nun deinen Discord-Account um deine Server zu sehen.
              </p>
              <a href="/api/auth/discord-verify" className="msk-btn-discord w-full justify-center">
                <DiscordIcon size={18} />
                Mit Discord anmelden
              </a>
            </div>
          )}

          {/* ── Step 3: Select Guild ── */}
          {currentStep === 3 && !result && (
            <div>
              <h2 className="text-white font-bold text-lg mb-1">Server auswählen</h2>
              <p className="text-muted text-sm mb-4">
                Wähle den Discord-Server für den du den API Key generieren möchtest.
                Du siehst nur Server auf denen du Administrator bist.
              </p>

              {completeError && <ErrorBanner message={completeError} />}

              {session?.guilds && session.guilds.length === 0 && (
                <div className="text-center py-6 text-muted text-sm">
                  Keine Server gefunden auf denen du Administrator bist.
                </div>
              )}

              <div className="space-y-2 mb-6 max-h-72 overflow-y-auto pr-1">
                {session?.guilds?.map(guild => (
                  <button
                    key={guild.id}
                    onClick={() => setSelectedGuildId(guild.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                      ${selectedGuildId === guild.id
                        ? 'border-accent bg-accent/10'
                        : 'border-borderlt bg-surface2 hover:border-border'
                      }`}
                  >
                    <GuildIcon guild={guild} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{guild.name}</div>
                      <div className="text-xs text-dim">{guild.id}</div>
                    </div>
                    {selectedGuildId === guild.id && (
                      <CheckCircle size={18} className="text-accent shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleComplete}
                disabled={!selectedGuildId || loading}
                className="msk-btn-primary w-full justify-center"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {loading ? 'Wird verarbeitet...' : 'API Key generieren'}
              </button>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {result && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-accent" />
              </div>
              <h2 className="text-white font-bold text-lg mb-1">Verifizierung abgeschlossen!</h2>
              <p className="text-muted text-sm mb-2">
                Dein Tier:{' '}
                <span className="text-accent font-semibold">
                  {TIER_LABELS[result.tier] ?? result.tier}
                </span>
              </p>
              <p className="text-muted text-sm mb-6">
                Trage den API Key in die <code className="bg-surface2 border border-borderlt px-1.5 py-0.5 rounded text-xs text-accent">.env</code> deines Bots ein.
              </p>

              {/* API Key Display */}
              <div className="bg-surface2 border border-borderlt rounded-lg p-4 mb-4 text-left">
                <div className="text-xs text-dim mb-2 font-medium uppercase tracking-wider">MSK_API_KEY</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-accent font-mono break-all">{result.apiKey}</code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-1.5 rounded hover:bg-surface transition-colors text-muted hover:text-white"
                    title="Kopieren"
                  >
                    {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <p className="text-dim text-xs mb-4">
                ⚠️ Teile diesen Key mit niemandem. Er gibt Zugriff auf deinen Transcript-Upload.
              </p>

              <a
                href="https://github.com/MSK-Scripts/discord_ticketbot#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="msk-btn-ghost w-full justify-center"
              >
                <ExternalLink size={14} />
                Zur Installationsanleitung
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
