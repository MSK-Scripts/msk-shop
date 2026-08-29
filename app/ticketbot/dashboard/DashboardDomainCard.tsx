'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, ExternalLink, Globe, Info, Loader2, Trash2 } from 'lucide-react'
import { dashboardTranslations } from '@/lib/i18n'
import { useLang }               from '@/components/i18n/LangProvider'
import { Button }                from '@/components/ui/Button'
import { Card }                  from '@/components/ui/Card'
import { Input }                 from '@/components/ui/Input'
import DnsInstructions           from './DnsInstructions'

type Status = 'none' | 'pending_dns' | 'active'

/**
 * The customer's own domain in front of their hosted bot's dashboard.
 *
 * Sits next to the transcripts domain card and shares its DNS instructions, but
 * is a genuinely different thing: a vhost proxying to the bot's port rather than
 * serving files, with its own certificate, and it changes where the bot thinks
 * it lives. That last part is why the redirect-URI notice is not optional
 * decoration — switching domains breaks the Discord login until the new URL is
 * registered, and Discord fails on its own side where nothing points back here.
 */
export default function DashboardDomainCard({
  guildId, isHosted, initialDomain, initialStatus, generatedHost, serverIp,
}: {
  guildId:       string
  isHosted:      boolean
  initialDomain: string | null
  initialStatus: Status
  generatedHost: string | null
  serverIp:      string
}) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]

  const [domain, setDomain]   = useState(initialDomain ?? '')
  const [status, setStatus]   = useState<Status>(initialStatus)
  const [active, setActive]   = useState(initialStatus === 'active' ? (initialDomain ?? '') : '')
  const [redirect, setRedirect] = useState<string | null>(
    initialStatus === 'active' && initialDomain ? `https://${initialDomain}/auth/callback` : null,
  )
  const [busy, setBusy]         = useState<'set' | 'check' | 'remove' | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [notice, setNotice]     = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)

  function say(key: string | null): string | null {
    if (!key) return null
    const map: Record<string, string> = {
      invalid_domain:  t.dashdom_err_invalid_domain,
      reserved_domain: t.dashdom_err_reserved_domain,
      domain_taken:    t.dashdom_err_domain_taken,
      ssl_failed:      t.dashdom_err_ssl_failed,
      setup_failed:    t.dashdom_err_setup_failed,
      not_hosted:      t.dashdom_err_not_hosted,
      rate_limited:    t.host_err_rate_limited,
      tier:            t.no_premium,
    }
    return map[key] ?? t.dashdom_err_setup_failed
  }

  async function call(method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/bot-hosting/domain?guildId=${encodeURIComponent(guildId)}`, {
        method,
        headers: { 'content-type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(String(data?.error ?? 'setup_failed'))

      setStatus(data.status as Status)
      if (data.status === 'active') {
        setActive(String(data.domain))
        setRedirect(String(data.redirectUri))
      } else {
        setActive('')
        setRedirect(null)
        if (method === 'DELETE') { setDomain(''); setNotice(t.dashdom_removed) }
      }
    } catch (err) {
      setError(say(err instanceof Error ? err.message : null))
    } finally {
      setBusy(null)
    }
  }

  async function copyIp() {
    try {
      await navigator.clipboard.writeText(serverIp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t.botdash_copy_failed)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Globe className="h-4 w-4 text-[var(--color-primary)]" />
        <h2 className="text-base font-bold">{t.dashdom_title}</h2>
      </div>
      <p className="mb-5 text-sm text-[var(--color-muted-foreground)]">{t.dashdom_desc}</p>

      {/* Without a hosted bot there is no port to proxy to, so the field would
          promise something the server has to refuse. */}
      {!isHosted ? (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-[var(--color-muted-foreground)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t.dashdom_needs_host}</span>
        </div>
      ) : (
        <>
          {notice && (
            <p role="status" className="mb-4 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-2.5 text-xs text-[var(--color-primary)]">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2.5 text-xs text-[var(--color-danger)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{error}</span>
            </p>
          )}

          <div className="mb-4 flex gap-2">
            <Input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder={t.dashdom_placeholder}
              className="flex-1"
              disabled={busy !== null}
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              onClick={() => { setBusy('set'); void call('POST', { domain: domain.trim().toLowerCase() }) }}
              disabled={busy !== null || !domain.trim()}
              className="tap-target"
            >
              {busy === 'set' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              {busy === 'set' ? t.dashdom_btn_loading : t.dashdom_btn}
            </Button>
          </div>

          {status === 'pending_dns' && (
            <DnsInstructions
              serverIp={serverIp}
              copied={copied}
              onCopyIp={copyIp}
              onValidate={() => { setBusy('check'); void call('PATCH') }}
              validating={busy === 'check'}
              t={t}
            />
          )}

          {status === 'active' && active && (
            <>
              <div className="mb-4 flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  <a href={`https://${active}`} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1 truncate text-sm text-[var(--color-primary)] hover:underline">
                    {active}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <button
                  onClick={() => { setBusy('remove'); void call('DELETE') }}
                  disabled={busy !== null}
                  className="tap-target ml-3 shrink-0 rounded p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                  title={t.remove_title}
                >
                  {busy === 'remove' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>

              {/* The step that decides whether the login works at all. */}
              {redirect && (
                <div className="mb-4 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4">
                  <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--color-warning)]">
                    <Info className="h-4 w-4 shrink-0" /> {t.botdash_redirect_title}
                  </p>
                  <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">{t.dashdom_redirect_warn}</p>
                  <code className="block truncate rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 font-mono text-xs">
                    {redirect}
                  </code>
                </div>
              )}
            </>
          )}

          {generatedHost && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {lang === 'en' ? 'Always reachable at ' : 'Immer erreichbar unter '}
              <code className="font-mono">{generatedHost}</code>
            </p>
          )}
        </>
      )}
    </Card>
  )
}
