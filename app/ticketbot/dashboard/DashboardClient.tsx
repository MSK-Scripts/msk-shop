'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Globe, CheckCircle, AlertCircle, Clock, Trash2,
  ExternalLink, RefreshCw, Loader2, Info, LogOut,
  FileText, Server, type LucideIcon,
} from 'lucide-react'
import { dashboardTranslations, type Lang } from '@/lib/i18n'
import { setLangCookie } from '@/lib/lang'
import type { Tier } from '@/lib/tiers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const BotConfigEditor = dynamic(() => import('@/components/BotConfigEditor'), { ssr: false })
const TranscriptsCard = dynamic(() => import('./TranscriptsCard'), { ssr: false })

/**
 * Validates a user-supplied domain and returns a safe https:// URL.
 * Returns null if the value is not a valid hostname (prevents XSS via
 * javascript: URLs or other protocol injections).
 */
function safeDomainHref(domain: string): string | null {
  try {
    const url = new URL(`https://${domain}`)
    if (url.hostname !== domain) return null
    return url.href
  } catch {
    return null
  }
}

interface Guild {
  guild_id:        string
  tier:            Tier
  custom_domain:   string | null
  domain_status:   'none' | 'pending_dns' | 'active'
  github_username: string | null
  is_hosted:       number
}

interface Props {
  guild:       Guild
  serverIp:    string
  initialLang: Lang
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

function StatusBadge({ status, t }: { status: Guild['domain_status']; t: { active_label: string; pending_label: string } }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
      <CheckCircle className="h-3 w-3" /> {t.active_label}
    </span>
  )
  if (status === 'pending_dns') return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-500">
      <Clock className="h-3 w-3" /> {t.pending_label}
    </span>
  )
  return null
}

type TabKey = 'domain' | 'transcripts' | 'hosting'

export default function DashboardClient({ guild, serverIp, initialLang }: Props) {
  const [lang, setLang] = useState<Lang>(initialLang)
  const t = dashboardTranslations[lang]

  useEffect(() => { setLangCookie(lang) }, [lang])

  const [tab, setTab] = useState<TabKey>('domain')
  const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
    { key: 'domain',      label: t.tab_domain,      icon: Globe },
    { key: 'transcripts', label: t.tab_transcripts, icon: FileText },
    ...(guild.is_hosted ? [{ key: 'hosting' as const, label: t.tab_hosting, icon: Server }] : []),
  ]

  const hasPremium = guild.tier === 'premium' || guild.tier === 'premium_plus'
  const [domain, setDomain] = useState(guild.custom_domain ?? '')
  const [domainStatus, setDomainStatus] = useState<Guild['domain_status']>(guild.domain_status)
  const [loading, setLoading] = useState(false)
  const [validateLoading, setValidateLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const showMsg = (type: 'success' | 'error' | 'info', text: string) => setMessage({ type, text })

  const TIER_COLORS: Record<Tier, string> = {
    basic:        'text-[var(--color-muted-foreground)] bg-[var(--color-muted)] border-[var(--color-border)]',
    premium:      'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30',
    premium_plus: 'text-[#9d65fe] bg-[#9d65fe]/10 border-[#9d65fe]/30',
  }

  const handleSetDomain = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/domain/set', {
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
      const res = await fetch('/api/domain/validate', { method: 'POST' })
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
      const res = await fetch('/api/domain/remove', { method: 'POST' })
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

  const handleLogout = async () => {
    try {
      await fetch('/api/dashboard/logout', { method: 'POST' })
    } catch {
      // siehe Hinweis im Original — auch bei Netzwerkfehler verlassen
    }
    window.location.href = '/ticketbot/verify'
  }

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <span className="eyebrow">{t.label}</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{t.title}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {t.server_id}{' '}
              <code className="font-mono text-xs">{guild.guild_id}</code>
            </p>
          </div>
          <div className="mt-1 shrink-0">
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
        </div>

        {/* Tier Badge + Quick Links */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold',
            TIER_COLORS[guild.tier],
          )}>
            {t[`tier_${guild.tier}` as 'tier_basic' | 'tier_premium' | 'tier_premium_plus']}
            {guild.tier === 'basic' && (
              <a
                href="https://github.com/sponsors/MSK-Scripts"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-xs font-normal text-[var(--color-primary)] hover:underline"
              >
                {t.upgrade}
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/ticketbot/verify">{t.new_api_key}</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://docu.msk-scripts.de/discord/discord_ticketbot/getting-started"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t.docs}
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              title={t.logout_title}
              className="hover:border-[var(--color-danger)]/40 hover:text-[var(--color-danger)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t.logout}
            </Button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
                tab === key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Custom Domain Card */}
        {tab === 'domain' && (
        <Card className="p-6">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-base font-bold">{t.domain_title}</h2>
            {domainStatus !== 'none' && <StatusBadge status={domainStatus} t={t} />}
          </div>
          <p className="mb-5 text-sm text-[var(--color-muted-foreground)]">
            {t.domain_desc}{' '}
            <code className="font-mono text-xs">tickets.yourserver.com</code>{' '}
            {t.domain_instead}{' '}
            <code className="font-mono text-xs">www.msk-scripts.de</code>
          </p>

          {!hasPremium ? (
            <div className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-[var(--color-muted-foreground)]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              <span>
                {t.no_premium}{' '}
                <strong className="text-[var(--color-primary)]">{t.no_premium_link}</strong>{' '}
                {lang === 'en' ? 'available.' : 'verfügbar.'}{' '}
                <a
                  href="https://github.com/sponsors/MSK-Scripts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  {t.no_premium_link2}
                </a>
              </span>
            </div>
          ) : (
            <>
              {message && (
                <div
                  className={cn(
                    'mb-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs',
                    message.type === 'success' && 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
                    message.type === 'error'   && 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
                    message.type === 'info'    && 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',
                  )}
                >
                  {message.type === 'success' && <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                  {message.type === 'error'   && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                  {message.type === 'info'    && <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="mb-4 flex gap-2">
                <Input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder={t.domain_placeholder}
                  className="flex-1"
                  disabled={loading}
                />
                <Button onClick={handleSetDomain} disabled={loading || !domain.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  {loading ? t.domain_btn_loading : t.domain_btn}
                </Button>
              </div>

              {domainStatus === 'pending_dns' && (
                <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
                  <p className="mb-3 text-sm font-semibold">{t.dns_title}</p>
                  <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">{t.dns_desc}</p>
                  <div className="mb-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] p-2">
                      <div className="mb-1 text-[var(--color-muted-foreground)]">{t.dns_type}</div>
                      <div className="font-mono font-semibold">A</div>
                    </div>
                    <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] p-2">
                      <div className="mb-1 text-[var(--color-muted-foreground)]">{t.dns_name}</div>
                      <div className="font-mono font-semibold">@ or subdomain (www, transcript, etc.)</div>
                    </div>
                    <button
                      type="button"
                      onClick={copyIp}
                      className="cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-left transition-colors hover:border-[var(--color-primary)]/50"
                    >
                      <div className="mb-1 text-[var(--color-muted-foreground)]">{t.dns_target}</div>
                      <div className="font-mono font-semibold text-[var(--color-primary)]">
                        {copied ? '✓ Copied!' : serverIp}
                      </div>
                    </button>
                  </div>
                  <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">{t.dns_note}</p>
                  <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-2 text-xs text-yellow-600 dark:text-yellow-500">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{t.dns_cloudflare}</span>
                  </p>
                  <Button
                    onClick={handleValidate}
                    disabled={validateLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {validateLoading
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.dns_checking}</>
                      : <><RefreshCw className="h-3.5 w-3.5" /> {t.dns_check}</>
                    }
                  </Button>
                </div>
              )}

              {domainStatus === 'active' && domain && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    {safeDomainHref(domain) ? (
                      <a
                        href={safeDomainHref(domain)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-sm text-[var(--color-primary)] hover:underline"
                      >
                        {domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="truncate text-sm text-[var(--color-primary)]">{domain}</span>
                    )}
                  </div>
                  <button
                    onClick={handleRemove}
                    disabled={removeLoading}
                    className="ml-3 shrink-0 rounded p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                    title={t.remove_title}
                  >
                    {removeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              )}

              <p className="text-xs text-[var(--color-muted-foreground)]">
                {lang === 'en' ? 'Make sure the A-Record points to ' : 'Stelle sicher, dass der A-Record auf '}
                <strong className="text-[var(--color-foreground)]">{serverIp}</strong>
                {lang === 'en'
                  ? ' before activating — set to “DNS only”, without a Cloudflare/other proxy.'
                  : ' zeigt bevor du die Domain aktivierst — als „DNS only“, ohne Cloudflare-/anderen Proxy.'}
              </p>
            </>
          )}
        </Card>
        )}

        {/* Transcripts overview — für alle eingeloggten Nutzer (nur die eigenen) */}
        {tab === 'transcripts' && <TranscriptsCard lang={lang} />}

        {/* Bot Config Editor — nur für hosted customers */}
        {tab === 'hosting' && !!guild.is_hosted && (
          <BotConfigEditor lang={lang} />
        )}

      </div>
    </div>
  )
}
