'use client'

import { useState } from 'react'

import { CopyField } from '@/components/dashboard/CopyField'
import { Notice } from '@/components/dashboard/Notice'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { useLang } from '@/components/i18n/LangProvider'
import { ArrowSquareOut, CircleNotch, Globe } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { dashboardTranslations } from '@/lib/i18n'
import { openOwnerDashboard, setupDashboardHost } from './ticketBotApi'

/**
 * Public address of the hosted bot's own dashboard.
 *
 * Two ways in, and they are not interchangeable:
 *
 *   - The bot's OWN host (tickets-….msk-scripts.de, or the customer's
 *     domain). The bot runs its own Discord OAuth there and resolves its own
 *     permissions, so the customer's SUPPORT TEAM can sign in. This is the
 *     address that belongs in their handbook.
 *   - The handoff through msk-scripts.de. Authenticated by msk-shop, which
 *     only ever knows the guild's OWNER; nobody else can use it. Kept as the
 *     recovery path for when the Discord redirect URI is wrong, because that
 *     is precisely when the first route is unusable.
 */
export function BotAddress({ guildId, initialHost }: { guildId: string; initialHost: string | null }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]

  const [host, setHost] = useState<string | null>(initialHost)
  const [busy, setBusy] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const url = host ? `https://${host}` : null
  const redirectUri = host ? `https://${host}/auth/callback` : null
  const copy = { copy: t.botdash_copy, copied: t.botdash_copied, failed: t.botdash_copy_failed }

  async function setupAddress() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const { ok, data } = await setupDashboardHost(guildId)
      if (!ok || !data.host) throw new Error(data.error || 'failed')
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
      const { ok, data } = await openOwnerDashboard(guildId)
      if (!ok || !data.url) throw new Error(data.error || 'failed')
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      setError(t.botdash_error)
    } finally {
      setLaunching(false)
    }
  }

  return (
    <SectionCard title={t.botdash_addr_title} description={url ? t.botdash_addr_desc : t.botdash_addr_none}>
      <div className="grid gap-5">
        {url && redirectUri ? (
          <>
            <div className="grid max-w-[44rem] gap-3">
              <CopyField label={t.botdash_url_label} value={url} copy={copy} />
              <Button asChild className="w-fit">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ArrowSquareOut className="h-4 w-4" />
                  {t.botdash_open}
                  <span className="sr-only">{t.opens_new_tab}</span>
                </a>
              </Button>
            </div>

            {/* The one step we cannot do for them. Without the redirect URI the
                Discord login fails, and the error appears on Discord's side
                where nothing points back at us. */}
            <Notice
              tone="warning"
              title={t.botdash_redirect_title}
              action={
                <Button asChild variant="outline">
                  <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">
                    <ArrowSquareOut className="h-4 w-4" />
                    {t.botdash_redirect_open}
                    <span className="sr-only">{t.opens_new_tab}</span>
                  </a>
                </Button>
              }
            >
              <div className="grid gap-3">
                <p>{t.botdash_redirect_desc}</p>
                <CopyField label={t.dashdom_redirect_label} value={redirectUri} copy={copy} className="max-w-[44rem]" />
              </div>
            </Notice>
          </>
        ) : (
          <Button onClick={setupAddress} disabled={busy} aria-busy={busy || undefined} className="w-fit">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            {busy ? t.botdash_setup_busy : t.botdash_setup}
          </Button>
        )}

        {notice && <Notice tone="success" role="status">{notice}</Notice>}
        {error && <Notice tone="danger" role="alert">{error}</Notice>}

        <div className="grid gap-2 border-t border-[var(--color-border)] pt-5">
          <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.botdash_fallback_hint}</p>
          <Button variant="ghost" onClick={launchFallback} disabled={launching} aria-busy={launching || undefined} className="w-fit">
            {launching ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ArrowSquareOut className="h-4 w-4" />}
            {launching ? t.botdash_opening : t.botdash_fallback}
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}
