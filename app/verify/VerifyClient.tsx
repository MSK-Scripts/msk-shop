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
              <p className="text-muted text-sm mb-3">
                Wähle den Discord-Server für den du den API Key generieren möchtest.
                Du siehst nur Server auf denen du Administrator bist.
              </p>
              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5 mb-4 text-xs text-yellow-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Falls du diesen Server bereits verifiziert hast, wird dein bisheriger API Key <strong>sofort ungültig</strong>. Du musst den neuen Key anschließend in der <code className="bg-black/20 px-1 rounded">.env</code> deines Bots eintragen und ihn neu starten.</span>
              </div>

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

              <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-lg px-3 py-2.5 mb-4 text-xs text-accent">
                <CheckCircle size={14} className="shrink-0" />
                Du kannst diese Seite jetzt schließen, sobald du den Key sicher kopiert hast.
              </div>

              <a
                href="https://docu.msk-scripts.de/discord/discord_ticketbot/getting-started"
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
