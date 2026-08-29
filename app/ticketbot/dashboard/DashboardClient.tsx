'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Globe, CheckCircle, AlertCircle, Clock, Trash2,
  ExternalLink, RefreshCw, Loader2, Info, LogOut,
  FileText, Server, CreditCard, ChevronDown, type LucideIcon,
} from 'lucide-react'
import { dashboardTranslations } from '@/lib/i18n'
import { useLang } from '@/components/i18n/LangProvider'
import { TIER_CONFIG, type Tier } from '@/lib/tiers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const BotConfigEditor = dynamic(() => import('@/components/BotConfigEditor'), { ssr: false })
const TranscriptsCard = dynamic(() => import('./TranscriptsCard'), { ssr: false })
const HostingSetup    = dynamic(() => import('./HostingSetup'), { ssr: false })

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
  guild_id:               string
  guild_name:             string | null
  tier:                   Tier
  custom_domain:          string | null
  domain_status:          'none' | 'pending_dns' | 'active'
  is_hosted:              number
  stripe_subscription_id: string | null
  stripe_status:          string | null
  expires_at:             string | null
  bot_port:               number | null
  dashboard_host:          string | null
  dashboard_domain:        string | null
  dashboard_domain_status: 'none' | 'pending_dns' | 'active'
}

interface Props {
  guilds:   Guild[]
  serverIp: string
}

type T = typeof dashboardTranslations['en'] | typeof dashboardTranslations['de']

function StatusBadge({ status, t }: { status: Guild['domain_status']; t: { active_label: string; pending_label: string } }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
      <CheckCircle className="h-3 w-3" /> {t.active_label}
    </span>
  )
  if (status === 'pending_dns') return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-warning)]">
      <Clock className="h-3 w-3" /> {t.pending_label}
    </span>
  )
  return null
}

/** Aufsteigende Reihenfolge der Stufen. Steuert, was als Upgrade angeboten wird. */
const TIER_ORDER: Tier[] = ['basic', 'premium', 'premium_plus', 'business']

type PaidTier = Exclude<Tier, 'basic'>

const GET_LABEL: Record<PaidTier, 'sub_get_premium' | 'sub_get_plus' | 'sub_get_business'> = {
  premium:      'sub_get_premium',
  premium_plus: 'sub_get_plus',
  business:     'sub_get_business',
}

const UPGRADE_LABEL: Record<PaidTier, 'sub_upgrade_premium' | 'sub_upgrade_plus' | 'sub_upgrade_business'> = {
  premium:      'sub_upgrade_premium',
  premium_plus: 'sub_upgrade_plus',
  business:     'sub_upgrade_business',
}

const TIER_COLORS: Record<Tier, string> = {
  basic:        'text-[var(--color-muted-foreground)] bg-[var(--color-muted)] border-[var(--color-border)]',
  premium:      'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30',
  premium_plus: 'text-[var(--color-tier-plus)] bg-[var(--color-tier-plus)]/10 border-[var(--color-tier-plus)]/30',
  business:     'text-[var(--color-tier-business)] bg-[var(--color-tier-business)]/10 border-[var(--color-tier-business)]/30',
}

export default function DashboardClient({ guilds, serverIp }: Props) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]

  const [selectedId, setSelectedId] = useState(guilds[0]?.guild_id ?? '')
  const router = useRouter()
  const selected = guilds.find(g => g.guild_id === selectedId) ?? guilds[0]

  const handleLogout = async () => {
    try {
      await fetch('/api/dashboard/logout', { method: 'POST' })
    } catch { /* leave even on network error */ }
    // refresh() nach push(): /ticketbot/verify liest das Session-Cookie
    // server-seitig, und das ist gerade gelöscht worden.
    router.push('/ticketbot/verify')
    router.refresh()
  }

  return (
    <div className="container-page py-10 md:py-14">
      <div>

        {/* Header */}
        <div className="mb-8">
          <span className="eyebrow">{t.label}</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{t.title}</h1>
        </div>

        {/* Server switcher (only when the account owns more than one server) */}
        {guilds.length > 1 && (
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {t.switch_server}
            </label>
            <div className="relative inline-block w-full max-w-sm">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 pr-9 text-sm font-medium focus:border-[var(--color-primary)] focus:outline-none"
              >
                {guilds.map(g => (
                  <option key={g.guild_id} value={g.guild_id}>
                    {(g.guild_name || g.guild_id)} · {t[`tier_${g.tier}` as 'tier_basic' | 'tier_premium' | 'tier_premium_plus']}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            </div>
          </div>
        )}

        {/* Per-guild panel — keyed so all local state resets on server switch */}
        {selected && (
          <GuildPanel
            key={selected.guild_id}
            guild={selected}
            serverIp={serverIp}
            lang={lang}
            t={t}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  )
}

// ── Single-guild dashboard panel ─────────────────────────────────────────────

type TabKey = 'domain' | 'transcripts' | 'hosting'

function GuildPanel({
  guild, serverIp, lang, t, onLogout,
}: {
  guild:    Guild
  serverIp: string
  lang:     'en' | 'de'
  t:        T
  onLogout: () => void
}) {
  const guildId = guild.guild_id
  const { localize } = useLang()

  const [tab, setTab] = useState<TabKey>('domain')
  const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
    { key: 'domain',      label: t.tab_domain,      icon: Globe },
    { key: 'transcripts', label: t.tab_transcripts, icon: FileText },
    // Shown for every paying tier, not only for an already-hosted guild: this is
    // where hosting is switched ON, so gating it on is_hosted would hide the
    // only door to it.
    ...(TIER_CONFIG[guild.tier].botHosting
      ? [{ key: 'hosting' as const, label: t.tab_hosting, icon: Server }]
      : []),
  ]

  const hasPremium = guild.tier !== 'basic'
  // Alles oberhalb der aktuellen Stufe ist ein moegliches Upgrade.
  const upgradeTargets = TIER_ORDER.slice(TIER_ORDER.indexOf(guild.tier) + 1) as PaidTier[]

  // While a trial runs, expires_at carries its end. Derived during render, not
  // in state: an invalid/absent date must fall back to the wording without a
  // date rather than print "Invalid Date".
  const trialEnd      = guild.expires_at ? new Date(guild.expires_at) : null
  const trialEndLabel = trialEnd && !Number.isNaN(trialEnd.getTime())
    ? trialEnd.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB',
        { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const [domain, setDomain] = useState(guild.custom_domain ?? '')
  const [domainStatus, setDomainStatus] = useState<Guild['domain_status']>(guild.domain_status)
  const [loading, setLoading] = useState(false)
  const [validateLoading, setValidateLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Subscription (Stripe)
  const [billingLoading, setBillingLoading] = useState<null | PaidTier | 'manage'>(null)
  const [billingError, setBillingError] = useState<string | null>(null)

  const showMsg = (type: 'success' | 'error' | 'info', text: string) => setMessage({ type, text })

  const handleCheckout = async (tier: PaidTier) => {
    setBillingLoading(tier)
    setBillingError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId, tier }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { setBillingError(data.error ?? t.sub_err); return }
      // assign() statt der Zuweisung an window.location.href: react-hooks/immutability
      // wertet die Zuweisung als Aenderung einer ausserhalb der Komponente
      // definierten Variable. Der Aufruf macht dasselbe, inklusive History-Eintrag.
      window.location.assign(data.url)
    } catch { setBillingError(t.sub_err) }
    finally   { setBillingLoading(null) }
  }

  const handleManage = async () => {
    setBillingLoading('manage')
    setBillingError(null)
    try {
      const res = await fetch('/api/stripe/portal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { setBillingError(data.error ?? t.sub_err); return }
      // assign() statt der Zuweisung an window.location.href: react-hooks/immutability
      // wertet die Zuweisung als Aenderung einer ausserhalb der Komponente
      // definierten Variable. Der Aufruf macht dasselbe, inklusive History-Eintrag.
      window.location.assign(data.url)
    } catch { setBillingError(t.sub_err) }
    finally   { setBillingLoading(null) }
  }

  const handleSetDomain = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/domain/set', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId, domain: domain.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { showMsg('error', data.error ?? t.dash_err_generic); return }
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
      const res = await fetch('/api/domain/validate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId }),
      })
      const data = await res.json()
      if (!res.ok) { showMsg('error', data.error ?? t.dash_err_generic); return }
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
      const res = await fetch('/api/domain/remove', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId }),
      })
      const data = await res.json()
      if (!res.ok) { showMsg('error', data.error ?? t.dash_err_generic); return }
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
    <>
      <p className="-mt-4 mb-6 text-sm text-[var(--color-muted-foreground)]">
        {t.server_id}{' '}
        <code className="font-mono text-xs">{guild.guild_id}</code>
      </p>

      {/* Tier Badge + Subscription + Quick Links */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold',
            TIER_COLORS[guild.tier],
          )}>
            {t[`tier_${guild.tier}` as 'tier_basic' | 'tier_premium' | 'tier_premium_plus']}
          </div>

          {/* Subscription controls. Derived from the tier order rather than one
              branch per tier: with four tiers the branches multiply, and every
              new tier would need its own combination again. */}
          {upgradeTargets.map((target, i) => (
            <Button
              key={target}
              size="sm"
              variant={i === 0 ? 'primary' : 'outline'}
              onClick={() => handleCheckout(target)}
              disabled={billingLoading !== null}
            >
              {billingLoading === target
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CreditCard className="h-3.5 w-3.5" />}
              {guild.tier === 'basic' ? t[GET_LABEL[target]] : t[UPGRADE_LABEL[target]]}
            </Button>
          ))}
          {guild.tier !== 'basic' && (
            <Button size="sm" variant="outline" onClick={handleManage} disabled={billingLoading !== null}>
              {billingLoading === 'manage' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
              {billingLoading === 'manage' ? t.sub_manage_loading : t.sub_manage}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={localize('/ticketbot/verify')}>{t.new_api_key}</a>
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
            onClick={onLogout}
            title={t.logout_title}
            className="hover:border-[var(--color-danger)]/40 hover:text-[var(--color-danger)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t.logout}
          </Button>
        </div>
      </div>

      {/* Trial / billing hint + error */}
      <div className="mb-6">
        {guild.tier === 'basic' && (
          <p className="text-xs text-[var(--color-muted-foreground)]">{t.sub_trial_hint}</p>
        )}
        {/* Running trial. Checkout no longer takes a card, so the subscription
            cannot convert by itself: without a payment method Stripe cancels at
            trial end. That has to be visible here, otherwise premium simply
            disappears one day without anyone having been told. */}
        {guild.stripe_status === 'trialing' && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-3">
            <Info className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
            <p className="flex-1 text-xs leading-relaxed">
              {trialEndLabel
                ? t.sub_trial_active.replace('{date}', trialEndLabel)
                : t.sub_trial_active_nodate}
            </p>
            <Button size="sm" onClick={handleManage} disabled={billingLoading !== null}>
              {billingLoading === 'manage'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CreditCard className="h-3.5 w-3.5" />}
              {t.sub_add_payment}
            </Button>
          </div>
        )}
        {billingError && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{billingError}</p>
        )}
      </div>

      {/* Tab Bar */}
      <div className="mb-6 border-b border-[var(--color-border)]">
        <div className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
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
              <button
                type="button"
                onClick={() => handleCheckout('premium')}
                className="text-[var(--color-primary)] hover:underline"
              >
                {t.no_premium_link2}
              </button>
            </span>
          </div>
        ) : (
          <>
            {message && (
              <div
                // Die Meldung erscheint nach einer Aktion. Fehler unterbrechen,
                // Erfolg und Hinweis melden sich höflich.
                role={message.type === 'error' ? 'alert' : 'status'}
                className={cn(
                  'mb-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs',
                  message.type === 'success' && 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
                  message.type === 'error'   && 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
                  message.type === 'info'    && 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
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
                      {copied ? `✓ ${t.dash_copied}` : serverIp}
                    </div>
                  </button>
                </div>
                <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">{t.dns_note}</p>
                <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2.5 py-2 text-xs text-[var(--color-warning)]">
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
                ? ' before activating. Set it to “DNS only”, without a Cloudflare or other proxy.'
                : ' zeigt, bevor du die Domain aktivierst. Setze ihn auf „DNS only“, ohne Cloudflare- oder anderen Proxy.'}
            </p>
          </>
        )}
      </Card>
      )}

      {/* Transcripts overview — für alle eingeloggten Nutzer (nur die eigenen) */}
      {tab === 'transcripts' && <TranscriptsCard lang={lang} guildId={guildId} />}

      {/* Bot Config Editor — nur für hosted customers */}
      {tab === 'hosting' && (
        // The gap lives here, not on the individual cards. Each of these
        // components used to carry its own margin, and they disagreed: the
        // editor spaces its cards with an inner gap and no bottom margin, the
        // setup card had a bottom margin and no top one, so the two sat flush
        // against each other while everything else was evenly spaced.
        <div className="flex flex-col gap-4">
          {!!guild.is_hosted && guild.bot_port != null && <BotDashboardAddress guild={guild} t={t} />}
          {!!guild.is_hosted && <BotConfigEditor lang={lang} guildId={guildId} />}
          {/* Last on purpose: for a running bot this is the .env form and the
              remove button, neither of which is what you came for. For a guild
              without hosting it is the only thing on the tab. */}
          <HostingSetup guildId={guildId} />
        </div>
      )}
    </>
  )
}

// ── Public address of the hosted bot's own dashboard ────────────────────────
//
// Two ways in, and they are not interchangeable:
//
//   • The bot's OWN host (tickets-….msk-scripts.de, or the customer's domain).
//     The bot runs its own Discord OAuth there and resolves its own
//     permissions, so the customer's SUPPORT TEAM can sign in. This is the
//     address that belongs in their handbook.
//   • The handoff through msk-scripts.de. Authenticated by msk-shop, which only
//     ever knows the guild's OWNER — nobody else can use it. Kept as the
//     recovery path for when the Discord redirect URI is wrong, because that is
//     precisely when the first route is unusable.
function BotDashboardAddress({ guild, t }: { guild: Guild; t: T }) {
  const [host, setHost]         = useState<string | null>(
    guild.dashboard_domain_status === 'active' && guild.dashboard_domain
      ? guild.dashboard_domain
      : guild.dashboard_host,
  )
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [notice, setNotice]     = useState<string | null>(null)
  const [copied, setCopied]     = useState<string | null>(null)
  const [launching, setLaunching] = useState(false)

  const url         = host ? `https://${host}` : null
  const redirectUri = host ? `https://${host}/auth/callback` : null

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // The clipboard API rejects outright in an insecure context. Saying "copy
      // it by hand" is useful; a checkmark that lies is not.
      setError(t.botdash_copy_failed)
    }
  }

  async function setupAddress() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const res  = await fetch(`/api/bot-hosting/dashboard-host?guildId=${encodeURIComponent(guild.guild_id)}`,
                               { method: 'POST', cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.host) throw new Error(data?.error || 'failed')
      setHost(data.host)
      setNotice(data.warning || t.botdash_setup_done)
    } catch (err) {
      setError(err instanceof Error && err.message !== 'failed' ? err.message : t.botdash_error)
    } finally {
      setBusy(false)
    }
  }

  async function launchFallback() {
    setLaunching(true)
    setError(null)
    try {
      const res  = await fetch(`/api/bot-dashboard/open?guildId=${encodeURIComponent(guild.guild_id)}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) throw new Error(data?.error || 'failed')
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      setError(t.botdash_error)
    } finally {
      setLaunching(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <h2 className="mb-1 text-base font-semibold">{t.botdash_addr_title}</h2>
      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
        {url ? t.botdash_addr_desc : t.botdash_addr_none}
      </p>

      {url ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 font-mono text-sm">
              {url}
            </code>
            <div className="flex gap-2">
              <Button variant="ghost" className="tap-target shrink-0" onClick={() => copy(url, 'url')}>
                {copied === 'url' ? t.botdash_copied : t.botdash_copy}
              </Button>
              <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <Button className="tap-target">
                  <ExternalLink className="h-4 w-4" /> {t.botdash_open}
                </Button>
              </a>
            </div>
          </div>

          {/* The one step we cannot do for them. It is not optional: without the
              redirect URI the Discord login fails, and the error appears on
              Discord's side where nothing points back at us. */}
          <div className="mt-4 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--color-warning)]">
              <Info className="h-4 w-4 shrink-0" /> {t.botdash_redirect_title}
            </p>
            <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">{t.botdash_redirect_desc}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 font-mono text-xs">
                {redirectUri}
              </code>
              <div className="flex gap-2">
                <Button variant="ghost" className="tap-target shrink-0" onClick={() => copy(redirectUri!, 'redirect')}>
                  {copied === 'redirect' ? t.botdash_copied : t.botdash_copy}
                </Button>
                <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button variant="ghost" className="tap-target">
                    <ExternalLink className="h-4 w-4" /> {t.botdash_redirect_open}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Button onClick={setupAddress} disabled={busy} className="tap-target">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          {busy ? t.botdash_setup_busy : t.botdash_setup}
        </Button>
      )}

      {notice && <p className="mt-3 text-xs text-[var(--color-primary)]">{notice}</p>}
      {error  && <p role="alert" className="mt-3 text-xs text-[var(--color-danger)]">{error}</p>}

      <div className="mt-4 border-t border-[var(--color-border)] pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-muted-foreground)]">{t.botdash_fallback_hint}</p>
          <Button variant="ghost" onClick={launchFallback} disabled={launching} className="tap-target shrink-0">
            {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {launching ? t.botdash_opening : t.botdash_fallback}
          </Button>
        </div>
      </div>
    </div>
  )
}
