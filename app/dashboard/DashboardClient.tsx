'use client'

import { useState } from 'react'
import {
  Globe, CheckCircle, AlertCircle, Clock, Trash2,
  ExternalLink, RefreshCw, Loader2, Info,
} from 'lucide-react'
import type { Tier } from '@/lib/tiers'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<Tier, string> = {
  basic:        'Basic (Free)',
  premium:      'Premium',
  premium_plus: 'Premium+',
}

const TIER_COLORS: Record<Tier, string> = {
  basic:        'text-dim bg-surface2 border-border',
  premium:      'text-accent bg-accent/10 border-accent/30',
  premium_plus: 'text-[#9d65fe] bg-[#9d65fe]/10 border-[#9d65fe]/30',
}

function StatusBadge({ status }: { status: Guild['domain_status'] }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 border border-accent/30 rounded-full px-2.5 py-0.5">
      <CheckCircle size={11} /> Aktiv
    </span>
  )
  if (status === 'pending_dns') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-2.5 py-0.5">
      <Clock size={11} /> DNS ausstehend
    </span>
  )
  return null
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DashboardClient({ guild, serverIp }: Props) {
  const hasPremium     = guild.tier === 'premium' || guild.tier === 'premium_plus'
  const [domain, setDomain]             = useState(guild.custom_domain ?? '')
  const [domainStatus, setDomainStatus] = useState<Guild['domain_status']>(guild.domain_status)
  const [loading, setLoading]           = useState(false)
  const [validateLoading, setValidateLoading] = useState(false)
  const [removeLoading, setRemoveLoading]     = useState(false)
  const [message, setMessage]           = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied]             = useState(false)

  const showMsg = (type: 'success' | 'error' | 'info', text: string) => setMessage({ type, text })

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
      if (!res.ok) { showMsg('error', data.error ?? 'Fehler'); return }
      setDomainStatus(data.status)
      if (data.status === 'active') {
        showMsg('success', `✅ Domain ${data.domain} ist jetzt aktiv!`)
      } else {
        showMsg('info', data.message)
      }
    } catch { showMsg('error', 'Netzwerkfehler. Bitte erneut versuchen.') }
    finally   { setLoading(false) }
  }

  const handleValidate = async () => {
    setValidateLoading(true)
    setMessage(null)
    try {
      const res  = await fetch('/api/domain/validate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { showMsg('error', data.error ?? 'Fehler'); return }
      setDomainStatus(data.status)
      if (data.status === 'active') {
        showMsg('success', `✅ DNS bestätigt! Domain ist jetzt aktiv.`)
      } else {
        showMsg('info', 'DNS zeigt noch nicht auf diesen Server. Bitte warte ein paar Minuten.')
      }
    } catch { showMsg('error', 'Netzwerkfehler.') }
    finally   { setValidateLoading(false) }
  }

  const handleRemove = async () => {
    if (!confirm('Domain wirklich entfernen? Die Domain wird sofort deaktiviert.')) return
    setRemoveLoading(true)
    setMessage(null)
    try {
      const res  = await fetch('/api/domain/remove', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { showMsg('error', data.error ?? 'Fehler'); return }
      setDomain('')
      setDomainStatus('none')
      showMsg('success', 'Domain erfolgreich entfernt.')
    } catch { showMsg('error', 'Netzwerkfehler.') }
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
        <div className="mb-8">
          <span className="msk-label">Ticket Bot</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Server-ID: <code className="text-dim text-xs">{guild.guild_id}</code>
          </p>
        </div>

        {/* Tier Badge */}
        <div className={`inline-flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm font-semibold mb-6 ${TIER_COLORS[guild.tier]}`}>
          {TIER_LABELS[guild.tier]}
          {guild.tier === 'basic' && (
            <a
              href="https://github.com/sponsors/MSK-Scripts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline text-xs font-normal ml-1"
            >
              Upgrade →
            </a>
          )}
        </div>

        {/* Custom Domain Card */}
        <div className="bg-surface border border-borderlt rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={18} className="text-accent" />
            <h2 className="text-white font-bold text-base">Eigene Domain</h2>
            {domainStatus !== 'none' && <StatusBadge status={domainStatus} />}
          </div>
          <p className="text-muted text-sm mb-5">
            Transkripte unter deiner eigenen Domain abrufbar — z.B. <code className="text-dim text-xs">tickets.deinserver.de</code>
          </p>

          {!hasPremium ? (
            <div className="flex items-start gap-3 bg-surface2 border border-borderlt rounded-lg p-4 text-sm text-muted">
              <Info size={16} className="shrink-0 mt-0.5 text-dim" />
              <span>
                Eigene Domains sind ab <strong className="text-accent">Premium (5 €/Monat)</strong> verfügbar.{' '}
                <a href="https://github.com/sponsors/MSK-Scripts" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Jetzt upgraden →
                </a>
              </span>
            </div>
          ) : (
            <>
              {/* Message */}
              {message && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4 text-xs mb-4
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

              {/* Domain Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="tickets.deinserver.de"
                  className="msk-input flex-1"
                  disabled={loading}
                />
                <button
                  onClick={handleSetDomain}
                  disabled={loading || !domain.trim()}
                  className="msk-btn-primary shrink-0"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
                  {loading ? 'Wird gesetzt...' : 'Setzen'}
                </button>
              </div>

              {/* DNS Instructions (shown when pending) */}
              {domainStatus === 'pending_dns' && (
                <div className="bg-surface2 border border-borderlt rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-white mb-3">
                    📋 DNS-Einstellung erforderlich
                  </p>
                  <p className="text-muted text-xs mb-3">
                    Trage bei deinem Domain-Anbieter folgenden <strong className="text-text">A-Record</strong> ein:
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className="bg-surface border border-borderlt rounded p-2">
                      <div className="text-dim mb-1">Typ</div>
                      <div className="text-white font-mono font-semibold">A</div>
                    </div>
                    <div className="bg-surface border border-borderlt rounded p-2">
                      <div className="text-dim mb-1">Name</div>
                      <div className="text-white font-mono font-semibold">@</div>
                    </div>
                    <div className="bg-surface border border-borderlt rounded p-2 cursor-pointer hover:border-accent/50" onClick={copyIp}>
                      <div className="text-dim mb-1">Ziel (IP)</div>
                      <div className="text-accent font-mono font-semibold">{copied ? '✓ Kopiert!' : serverIp}</div>
                    </div>
                  </div>
                  <p className="text-dim text-xs mb-3">
                    ⏱ DNS-Änderungen können bis zu 24 Stunden dauern. Klicke anschließend auf „DNS prüfen".
                  </p>
                  <button
                    onClick={handleValidate}
                    disabled={validateLoading}
                    className="msk-btn-ghost w-full justify-center text-sm"
                  >
                    {validateLoading
                      ? <><Loader2 size={14} className="animate-spin" /> Wird geprüft...</>
                      : <><RefreshCw size={14} /> DNS prüfen</>
                    }
                  </button>
                </div>
              )}

              {/* Active domain actions */}
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
                    title="Domain entfernen"
                  >
                    {removeLoading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              )}

              <p className="text-dim text-xs">
                Stelle sicher, dass der A-Record auf <strong className="text-muted">{serverIp}</strong> zeigt bevor du die Domain aktivierst.
              </p>
            </>
          )}
        </div>

        {/* Links */}
        <div className="mt-4 flex gap-3">
          <a
            href="/verify"
            className="msk-btn-ghost text-sm"
          >
            Neuen API Key generieren
          </a>
          <a
            href="https://docu.msk-scripts.de/discord/discord_ticketbot/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="msk-btn-ghost text-sm"
          >
            <ExternalLink size={14} />
            Dokumentation
          </a>
        </div>

      </div>
    </div>
  )
}
