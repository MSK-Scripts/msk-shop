'use client'

import { useState, type ReactNode } from 'react'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { CopyField } from '@/components/dashboard/CopyField'
import { FormField } from '@/components/dashboard/FormField'
import { Notice, type NoticeTone } from '@/components/dashboard/Notice'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { useLang } from '@/components/i18n/LangProvider'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowSquareOut, ArrowsClockwise, CircleNotch, FloppyDisk, Trash } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ticketBotHref } from '@/lib/dashboardNav'
import { dashboardTranslations, type Lang } from '@/lib/i18n'
import { TIER_CONFIG, formatTierPrice, type Tier } from '@/lib/tiers'
import { DnsSteps } from './DnsSteps'
import type { DashboardGuild } from './loadGuilds'
import { DomainBadge } from './OverviewArea'
import {
  dashboardDomain, removeTranscriptDomain, setTranscriptDomain, validateTranscriptDomain,
  type DomainStatus,
} from './ticketBotApi'

type Message = { tone: NoticeTone; text: string }

const TIER_ORDER: Tier[] = ['basic', 'premium', 'premium_plus', 'business']

/** The cheapest plan that has a feature, for "comes with … from …" lines. */
function firstTierWith(feature: 'customDomain' | 'botHosting'): Tier {
  return TIER_ORDER.find(tier => TIER_CONFIG[tier][feature]) ?? 'business'
}

/**
 * A domain as a link target, or null if it is not a plain hostname. Guards
 * against a stored value like `javascript:` ever reaching an href.
 */
export function safeDomainHref(domain: string): string | null {
  try {
    const url = new URL(`https://${domain}`)
    return url.hostname === domain ? url.href : null
  } catch {
    return null
  }
}

/**
 * The domains of one server (plan 6.4): the own address of the transcripts
 * and, for a hosted bot, of its dashboard. Each states its state once, puts
 * the DNS steps before the field, saves with the same words, and removes
 * only after asking.
 */
export function DomainsArea({ guild, serverIp }: { guild: DashboardGuild; serverIp: string }) {
  return (
    <div className="grid items-start gap-[var(--app-gutter-y)] @7xl:grid-cols-2">
      <TranscriptDomainCard guild={guild} serverIp={serverIp} />
      <DashboardDomainCard
        guildId={guild.guild_id}
        tier={guild.tier}
        isHosted={!!guild.is_hosted && guild.bot_port != null}
        initialDomain={guild.dashboard_domain}
        initialStatus={guild.dashboard_domain_status}
        generatedHost={guild.dashboard_host}
        serverIp={serverIp}
      />
    </div>
  )
}

// ── Transcripts ──────────────────────────────────────────────────────────────

export function TranscriptDomainCard({ guild, serverIp }: { guild: DashboardGuild; serverIp: string }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]
  const guildId = guild.guild_id

  const [domain, setDomain] = useState(guild.custom_domain ?? '')
  const [saved, setSaved] = useState(guild.custom_domain ?? '')
  const [status, setStatus] = useState<DomainStatus>(guild.domain_status)
  const [busy, setBusy] = useState<'set' | 'check' | 'remove' | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const allowed = TIER_CONFIG[guild.tier].customDomain

  async function save() {
    if (!domain.trim()) return
    setBusy('set')
    setMessage(null)
    try {
      const { ok, data } = await setTranscriptDomain(guildId, domain)
      if (!ok) { setMessage({ tone: 'danger', text: data.error ?? t.dash_err_generic }); return }
      const next = data.domain ?? domain.trim().toLowerCase()
      setStatus(data.status ?? 'pending_dns')
      setSaved(next)
      setMessage(data.status === 'active'
        ? { tone: 'success', text: t.dom_active_msg.replace('{domain}', next) }
        : { tone: 'info', text: t.dom_saved_pending })
    } catch {
      setMessage({ tone: 'danger', text: t.dom_network })
    } finally {
      setBusy(null)
    }
  }

  async function check() {
    setBusy('check')
    setMessage(null)
    try {
      const { ok, data } = await validateTranscriptDomain(guildId)
      if (!ok) { setMessage({ tone: 'danger', text: data.error ?? t.dash_err_generic }); return }
      if (data.status) setStatus(data.status)
      setMessage(data.status === 'active'
        ? { tone: 'success', text: t.dom_active_msg.replace('{domain}', saved) }
        : { tone: 'info', text: t.dom_dns_not_yet })
    } catch {
      setMessage({ tone: 'danger', text: t.dom_network })
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    setBusy('remove')
    setRemoveError(null)
    try {
      const { ok, data } = await removeTranscriptDomain(guildId)
      if (!ok) { setRemoveError(data.error ?? t.dash_err_generic); return }
      setDomain('')
      setSaved('')
      setStatus('none')
      setConfirmOpen(false)
      setMessage({ tone: 'success', text: t.dom_removed })
    } catch {
      setRemoveError(t.dom_network)
    } finally {
      setBusy(null)
    }
  }

  return (
    <SectionCard
      title={t.domain_title}
      description={
        <>
          {t.domain_desc}{' '}
          <code className="font-mono">{t.dom_example}</code>{' '}
          {t.domain_instead}{' '}
          <code className="font-mono">www.msk-scripts.de</code>.
        </>
      }
      actions={allowed ? <DomainBadge status={status} lang={lang} /> : undefined}
    >
      {!allowed ? (
        <Notice
          tone="info"
          action={<PlansLink guildId={guildId}>{t.dom_see_plans}</PlansLink>}
        >
          {t.dom_upgrade.replace('{price}', formatTierPrice(firstTierWith('customDomain'), lang))}
        </Notice>
      ) : (
        <div className="grid gap-6">
          {message && <Notice tone={message.tone} role={message.tone === 'danger' ? 'alert' : 'status'}>{message.text}</Notice>}

          {status === 'active' && saved && (
            <ActiveDomain
              lang={lang}
              domain={saved}
              busy={busy !== null}
              onRemove={() => { setRemoveError(null); setConfirmOpen(true) }}
            />
          )}

          {status === 'pending_dns' && saved && (
            <PendingDomain lang={lang} domain={saved} checking={busy === 'check'} disabled={busy !== null} onCheck={check} />
          )}

          {status === 'active' ? (
            <DomainForm lang={lang} value={domain} onChange={setDomain} onSave={save} busy={busy} />
          ) : (
            <DnsSteps lang={lang} serverIp={serverIp}>
              <DomainForm lang={lang} value={domain} onChange={setDomain} onSave={save} busy={busy} />
            </DnsSteps>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        title={t.dom_remove_title.replace('{domain}', saved)}
        description={t.dom_remove_desc}
        confirmLabel={t.remove_title}
        cancelLabel={t.cancel}
        busy={busy === 'remove'}
        error={removeError}
      />
    </SectionCard>
  )
}

// ── Bot dashboard ────────────────────────────────────────────────────────────

/**
 * The customer's own domain in front of their hosted bot's dashboard.
 *
 * A different thing from the transcripts domain: a vhost proxying to the
 * bot's port rather than serving files, with its own certificate, and it
 * changes where the bot thinks it lives. That last part is why the
 * redirect-URI notice is not optional: switching domains breaks the Discord
 * login until the new URL is registered, and Discord fails on its own side
 * where nothing points back here.
 */
export function DashboardDomainCard({
  guildId, tier, isHosted, initialDomain, initialStatus, generatedHost, serverIp,
}: {
  guildId: string
  tier: Tier
  isHosted: boolean
  initialDomain: string | null
  initialStatus: DomainStatus
  generatedHost: string | null
  serverIp: string
}) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]

  const [domain, setDomain] = useState(initialDomain ?? '')
  const [status, setStatus] = useState<DomainStatus>(initialStatus)
  const [active, setActive] = useState(initialStatus === 'active' ? (initialDomain ?? '') : '')
  const [pending, setPending] = useState(initialStatus === 'pending_dns' ? (initialDomain ?? '') : '')
  const [redirect, setRedirect] = useState<string | null>(
    initialStatus === 'active' && initialDomain ? `https://${initialDomain}/auth/callback` : null,
  )
  const [busy, setBusy] = useState<'set' | 'check' | 'remove' | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const hostingInPlan = TIER_CONFIG[tier].botHosting

  function say(key: string | null): string {
    const map: Record<string, string> = {
      invalid_domain:  t.dashdom_err_invalid_domain,
      reserved_domain: t.dashdom_err_reserved_domain,
      domain_taken:    t.dashdom_err_domain_taken,
      ssl_failed:      t.dashdom_err_ssl_failed,
      setup_failed:    t.dashdom_err_setup_failed,
      not_hosted:      t.dashdom_err_not_hosted,
      rate_limited:    t.host_err_rate_limited,
      tier:            t.dom_upgrade.replace('{price}', formatTierPrice(firstTierWith('customDomain'), lang)),
    }
    return (key && map[key]) || t.dashdom_err_setup_failed
  }

  /** One request, one answer; the three buttons only differ in method and body. */
  async function call(kind: 'set' | 'check' | 'remove'): Promise<boolean> {
    setBusy(kind)
    setMessage(null)
    setRemoveError(null)
    try {
      const { ok, data } = kind === 'set'
        ? await dashboardDomain(guildId, 'POST', { domain: domain.trim().toLowerCase() })
        : await dashboardDomain(guildId, kind === 'check' ? 'PATCH' : 'DELETE')
      if (!ok) throw new Error(String(data.error ?? 'setup_failed'))

      const next = (data.status ?? 'none') as DomainStatus
      setStatus(next)
      if (next === 'active') {
        setActive(String(data.domain))
        setPending('')
        setRedirect(String(data.redirectUri))
        setMessage({ tone: 'success', text: t.dom_active_msg.replace('{domain}', String(data.domain)) })
      } else {
        setActive('')
        setRedirect(null)
        if (kind === 'remove') {
          setDomain('')
          setPending('')
          setMessage({ tone: 'success', text: t.dashdom_removed })
        } else if (next === 'pending_dns') {
          setPending(String(data.domain ?? domain.trim().toLowerCase()))
          setMessage(kind === 'check'
            ? { tone: 'info', text: t.dom_dns_not_yet }
            : { tone: 'info', text: t.dom_saved_pending })
        }
      }
      return true
    } catch (err) {
      const text = say(err instanceof Error ? err.message : null)
      if (kind === 'remove') setRemoveError(text)
      else setMessage({ tone: 'danger', text })
      return false
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    if (await call('remove')) setConfirmOpen(false)
  }

  const copy = { copy: t.botdash_copy, copied: t.botdash_copied, failed: t.botdash_copy_failed }

  return (
    <SectionCard
      title={t.dashdom_title}
      description={t.dashdom_desc}
      actions={hostingInPlan && isHosted ? <DomainBadge status={status} lang={lang} /> : undefined}
    >
      {!hostingInPlan ? (
        <Notice tone="info" action={<PlansLink guildId={guildId}>{t.dom_see_plans}</PlansLink>}>
          {t.dashdom_needs_plan}
        </Notice>
      ) : !isHosted ? (
        // Without a hosted bot there is no port to proxy to, so the field
        // would promise something the server has to refuse.
        <Notice
          tone="info"
          action={
            <Button asChild variant="outline">
              <Link href={ticketBotHref(guildId, 'hosting')} prefetch={false}>{t.ov_att_to_hosting}</Link>
            </Button>
          }
        >
          {t.dashdom_needs_host}
        </Notice>
      ) : (
        <div className="grid gap-6">
          {message && <Notice tone={message.tone} role={message.tone === 'danger' ? 'alert' : 'status'}>{message.text}</Notice>}

          {status === 'active' && active && (
            <>
              <ActiveDomain lang={lang} domain={active} busy={busy !== null} onRemove={() => { setRemoveError(null); setConfirmOpen(true) }} />
              {/* The step that decides whether the login works at all. */}
              {redirect && (
                <Notice tone="warning" title={t.botdash_redirect_title}>
                  <div className="grid gap-3">
                    <p>{t.dashdom_redirect_warn}</p>
                    <CopyField label={t.dashdom_redirect_label} value={redirect} copy={copy} className="max-w-[44rem]" />
                  </div>
                </Notice>
              )}
            </>
          )}

          {status === 'pending_dns' && pending && (
            <PendingDomain lang={lang} domain={pending} checking={busy === 'check'} disabled={busy !== null} onCheck={() => void call('check')} />
          )}

          {status === 'active' ? (
            <DomainForm lang={lang} value={domain} onChange={setDomain} onSave={() => void call('set')} busy={busy} />
          ) : (
            <DnsSteps lang={lang} serverIp={serverIp}>
              <DomainForm lang={lang} value={domain} onChange={setDomain} onSave={() => void call('set')} busy={busy} />
            </DnsSteps>
          )}

          {generatedHost && (
            <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">
              {t.dashdom_generated}{' '}
              <code className="break-all font-mono text-[var(--color-foreground)]">{generatedHost}</code>
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        title={t.dom_remove_title.replace('{domain}', active)}
        description={t.dashdom_remove_desc}
        confirmLabel={t.remove_title}
        cancelLabel={t.cancel}
        busy={busy === 'remove'}
        error={removeError}
      />
    </SectionCard>
  )
}

// ── Pieces shared by both cards ──────────────────────────────────────────────

/**
 * The field and the one save button. Same words in both cards (plan 6.4).
 * No placeholder: an example domain in the field looks like a value that is
 * already there (plan 6.1), so the example stands in the hint.
 */
function DomainForm({ lang, value, onChange, onSave, busy }: {
  lang: Lang
  value: string
  onChange: (value: string) => void
  onSave: () => void
  busy: 'set' | 'check' | 'remove' | null
}) {
  const t = dashboardTranslations[lang]
  return (
    <form
      className="grid max-w-[40rem] gap-3"
      onSubmit={e => { e.preventDefault(); onSave() }}
    >
      <FormField label={t.dom_field} hint={t.dom_field_hint}>
        {field => (
          <Input
            {...field}
            type="text"
            inputMode="url"
            value={value}
            onChange={e => onChange(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={busy !== null}
          />
        )}
      </FormField>
      <Button type="submit" className="w-fit" disabled={busy !== null || !value.trim()} aria-busy={busy === 'set' || undefined}>
        {busy === 'set' ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
        {busy === 'set' ? t.domain_btn_loading : t.domain_btn}
      </Button>
    </form>
  )
}

/** The live domain as a link, with removing as its row action (plan 6.4). */
function ActiveDomain({ lang, domain, busy, onRemove }: {
  lang: Lang
  domain: string
  busy: boolean
  onRemove: () => void
}) {
  const t = dashboardTranslations[lang]
  const href = safeDomainHref(domain)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-border)] px-4 py-2">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 min-w-0 items-center gap-2 break-all font-semibold text-[var(--color-primary)] underline underline-offset-2">
          {domain}
          <ArrowSquareOut className="h-4 w-4 shrink-0" />
          <span className="sr-only">{t.opens_new_tab}</span>
        </a>
      ) : (
        <span className="min-w-0 break-all font-semibold">{domain}</span>
      )}
      <Button variant="outline" onClick={onRemove} disabled={busy} aria-haspopup="dialog">
        <Trash className="h-4 w-4" />
        {t.remove_title}
      </Button>
    </div>
  )
}

function PendingDomain({ lang, domain, checking, disabled, onCheck }: {
  lang: Lang
  domain: string
  checking: boolean
  disabled: boolean
  onCheck: () => void
}) {
  const t = dashboardTranslations[lang]
  return (
    <Notice
      tone="warning"
      title={t.dom_pending_title.replace('{domain}', domain)}
      action={
        <Button variant="outline" onClick={onCheck} disabled={disabled} aria-busy={checking || undefined}>
          {checking ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ArrowsClockwise className="h-4 w-4" />}
          {checking ? t.dns_checking : t.dns_check}
        </Button>
      }
    >
      {t.dom_pending_body}
    </Notice>
  )
}

/** To the plans of the overview: ordering only ever happens through the order summary there. */
function PlansLink({ guildId, children }: { guildId: string; children: ReactNode }) {
  return (
    <Button asChild variant="outline">
      <Link href={`${ticketBotHref(guildId, 'overview')}#subscription`} prefetch={false}>{children}</Link>
    </Button>
  )
}
