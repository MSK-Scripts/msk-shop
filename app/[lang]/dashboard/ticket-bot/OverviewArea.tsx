'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { CopyField } from '@/components/dashboard/CopyField'
import { Notice, type NoticeTone } from '@/components/dashboard/Notice'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatGrid, StatTile } from '@/components/dashboard/StatTile'
import { StatusBadge, type StatusTone } from '@/components/dashboard/StatusBadge'
import { useLang } from '@/components/i18n/LangProvider'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowSquareOut, CircleNotch, CreditCard } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ticketBotHref, ticketBotSections } from '@/lib/dashboardNav'
import { formatDate, formatNumber, formatRetention, isoDate } from '@/lib/format'
import { dashboardShellTranslations, dashboardTranslations, type Lang } from '@/lib/i18n'
import { TIER_CONFIG, type BillingInterval, type Tier } from '@/lib/tiers'
import { botIsDown, botStatusLabel, botStatusTone, toBotStatus, type BotStatus } from './botStatus'
import type { DashboardGuild } from './loadGuilds'
import { OrderSummary } from './OrderSummary'
import { fetchBotStatus, fetchTranscripts, openBillingPortal, startCheckout, type PaidTier } from './ticketBotApi'

type T = typeof dashboardTranslations['en'] | typeof dashboardTranslations['de']

/** Ascending order of the tiers. Controls what is offered as an upgrade. */
const TIER_ORDER: Tier[] = ['basic', 'premium', 'premium_plus', 'business']

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

export const DOCS_URL = 'https://docu.msk-scripts.de/discord/discord_ticketbot/getting-started'

export function tierLabel(t: T, tier: Tier): string {
  return t[`tier_${tier}` as 'tier_basic' | 'tier_premium' | 'tier_premium_plus' | 'tier_business']
}

/** The subscription's state as Stripe names it, or null where there is nothing to say. */
function subscriptionState(guild: DashboardGuild, t: T): { tone: StatusTone; label: string } | null {
  // The free plan has no subscription; its name already says "free".
  if (guild.tier === 'basic') return null
  switch (guild.stripe_status) {
    case 'trialing': return { tone: 'info', label: t.sub_status_trialing }
    case 'active':   return { tone: 'success', label: t.sub_status_active }
    case 'past_due':
    case 'unpaid':   return { tone: 'warning', label: t.sub_status_past_due }
    default:         return null
  }
}

interface AttentionItem {
  id: string
  tone: NoticeTone
  text: ReactNode
  action: ReactNode
}

/**
 * The overview of one server (plan 6.4): what it pays for and until when,
 * how many transcripts it keeps and for how long, the state of its domain
 * and of its hosted bot. Below that only what needs a look, and nothing when
 * nothing does.
 *
 * The page has checked that `guild` belongs to the signed-in person. The two
 * numbers fetched here (transcripts, bot status) go to routes that check it
 * again.
 */
export function OverviewArea({ guild }: { guild: DashboardGuild }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]
  const s = dashboardShellTranslations[lang]
  const guildId = guild.guild_id

  const hostingOffered = ticketBotSections(guild.tier).includes('hosting')
  const hosted = hostingOffered && !!guild.is_hosted
  const retention = formatRetention(TIER_CONFIG[guild.tier].storageDays, lang)

  // `undefined` while loading, null when the number could not be read.
  const [transcripts, setTranscripts] = useState<number | null | undefined>(undefined)
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)

  // Billing (Stripe)
  const [billingLoading, setBillingLoading] = useState<null | PaidTier | 'manage'>(null)
  const [billingError, setBillingError] = useState<string | null>(null)
  // § 312j Abs. 2 BGB requires the essential information immediately BEFORE the
  // order button. Choosing a plan therefore only opens the summary; only the
  // button inside it starts the checkout.
  const [pendingTier, setPendingTier] = useState<PaidTier | null>(null)
  // Named `billingInterval` and not `interval`: a setter called `setInterval`
  // would shadow the global one inside this component.
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly')

  // The two numbers of the tiles. State only after the await, so the effect
  // causes no extra render pass (react-hooks/set-state-in-effect).
  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetchTranscripts(guildId, { ticketId: '', from: '', to: '', attachmentsOnly: false, page: 1 }, 1)
        if (alive) setTranscripts(res.ok ? Number(res.data.total ?? 0) : null)
      } catch {
        if (alive) setTranscripts(null)
      }
    }
    void load()
    return () => { alive = false }
  }, [guildId])

  useEffect(() => {
    if (!hosted) return
    let alive = true
    async function load() {
      try {
        const res = await fetchBotStatus(guildId)
        if (alive) setBotStatus(res.ok ? toBotStatus(res.data.status) : 'unknown')
      } catch {
        if (alive) setBotStatus('unknown')
      }
    }
    void load()
    return () => { alive = false }
  }, [guildId, hosted])

  async function handleCheckout(tier: PaidTier, interval: BillingInterval) {
    setBillingLoading(tier)
    setBillingError(null)
    try {
      const { ok, data } = await startCheckout(guildId, tier, interval)
      if (!ok || !data.url) { setBillingError(data.error ?? t.sub_err); return }
      window.location.assign(data.url)
    } catch { setBillingError(t.sub_err) }
    finally { setBillingLoading(null) }
  }

  async function handleManage() {
    setBillingLoading('manage')
    setBillingError(null)
    try {
      const { ok, data } = await openBillingPortal(guildId)
      if (!ok || !data.url) { setBillingError(data.error ?? t.sub_err); return }
      window.location.assign(data.url)
    } catch { setBillingError(t.sub_err) }
    finally { setBillingLoading(null) }
  }

  const trialing = guild.stripe_status === 'trialing'
  const periodEnd = formatDate(guild.expires_at, lang)
  const graceEnd = formatDate(guild.access_grace_ends_at, lang)
  const state = subscriptionState(guild, t)
  const upgradeTargets = TIER_ORDER.slice(TIER_ORDER.indexOf(guild.tier) + 1) as PaidTier[]

  const planHint = guild.tier === 'basic'
    ? t.ov_plan_free
    : periodEnd
      ? (trialing ? t.ov_trial_until : t.ov_period_until).replace('{date}', periodEnd)
      : undefined

  // ── Needs attention: only what is not fine, in order of consequence ───────
  const attention: AttentionItem[] = []
  if (trialing) {
    attention.push({
      id: 'trial',
      tone: 'warning',
      text: periodEnd ? t.sub_trial_active.replace('{date}', periodEnd) : t.sub_trial_active_nodate,
      action: (
        <Button onClick={handleManage} disabled={billingLoading !== null} aria-busy={billingLoading === 'manage' || undefined}>
          {billingLoading === 'manage' ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {t.sub_add_payment}
        </Button>
      ),
    })
  }
  if (hosted && botIsDown(botStatus)) {
    attention.push({
      id: 'bot',
      tone: 'danger',
      text: t.ov_att_bot_down.replace('{status}', botStatusLabel(botStatus!, lang)),
      action: <AreaLink href={ticketBotHref(guildId, 'hosting')}>{t.ov_att_to_hosting}</AreaLink>,
    })
  }
  if (guild.domain_status === 'pending_dns' && guild.custom_domain) {
    attention.push({
      id: 'domain',
      tone: 'info',
      text: t.ov_att_domain_pending.replace('{domain}', guild.custom_domain),
      action: <AreaLink href={ticketBotHref(guildId, 'domains')}>{t.ov_att_to_domains}</AreaLink>,
    })
  }
  if (guild.dashboard_domain_status === 'pending_dns' && guild.dashboard_domain) {
    attention.push({
      id: 'dashboard-domain',
      tone: 'info',
      text: t.ov_att_dashdomain_pending.replace('{domain}', guild.dashboard_domain),
      action: <AreaLink href={ticketBotHref(guildId, 'domains')}>{t.ov_att_to_domains}</AreaLink>,
    })
  }

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {/* Discord rights for this server are gone and the clock is running. The
          one banner of the page, with role="alert": it appears on a load the
          customer did not ask for, and it is the only warning before the
          server disappears from this list. */}
      {guild.access_state === 'grace' && (
        <Notice tone="warning" role="alert" title={t.access_lost_title}>
          {graceEnd ? t.access_lost_body.replace('{date}', graceEnd) : t.access_lost_body_nodate}
        </Notice>
      )}

      <StatGrid>
        <StatTile label={s.tb_stat_plan} value={tierLabel(t, guild.tier)} hint={planHint} />
        <StatTile
          label={t.ov_stat_transcripts}
          href={ticketBotHref(guildId, 'transcripts')}
          value={
            transcripts === undefined
              ? <><Skeleton className="h-9 w-16" /><span className="sr-only">{t.tx_loading}</span></>
              : transcripts === null ? <span className="text-[var(--color-muted-foreground)]">–</span> : formatNumber(transcripts, lang)
          }
          hint={t.ov_retention_hint.replace('{period}', retention)}
        />
        <StatTile
          label={s.tb_stat_domain}
          href={ticketBotHref(guildId, 'domains')}
          value={<DomainBadge status={guild.domain_status} lang={lang} />}
          hint={guild.domain_status !== 'none' && guild.custom_domain ? guild.custom_domain : undefined}
        />
        <StatTile
          label={s.tb_stat_hosting}
          href={hostingOffered ? ticketBotHref(guildId, 'hosting') : undefined}
          value={
            !hostingOffered ? <StatusBadge tone="neutral">{s.tb_hosting_none}</StatusBadge>
              : !hosted ? <StatusBadge tone="neutral">{s.tb_hosting_off}</StatusBadge>
              : botStatus ? <StatusBadge tone={botStatusTone(botStatus)}>{botStatusLabel(botStatus, lang)}</StatusBadge>
              : <StatusBadge tone="success">{s.tb_hosting_on}</StatusBadge>
          }
          hint={hosted && botStatus ? s.tb_hosting_on : undefined}
        />
      </StatGrid>

      {attention.length > 0 && (
        <SectionCard title={t.ov_attention_title}>
          <ul className="grid gap-3">
            {attention.map(item => (
              <li key={item.id}>
                <Notice tone={item.tone} action={item.action}>{item.text}</Notice>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <div id="subscription" className="scroll-mt-[calc(var(--app-topbar)+1rem)]">
        <SectionCard title={t.ov_sub_title} description={t.ov_sub_desc}>
          <div className="grid gap-5">
            <dl className="grid gap-x-10 gap-y-3 @xl:grid-cols-[max-content_1fr]">
              <dt className="text-[var(--color-muted-foreground)]">{t.ov_sub_plan}</dt>
              <dd className="flex flex-wrap items-center gap-2 font-semibold">
                {tierLabel(t, guild.tier)}
                {state && <StatusBadge tone={state.tone}>{state.label}</StatusBadge>}
              </dd>
              {guild.tier !== 'basic' && periodEnd && (
                <>
                  <dt className="text-[var(--color-muted-foreground)]">{trialing ? t.ov_sub_trial_ends : t.ov_sub_period_ends}</dt>
                  <dd className="tabular-nums">
                    <time dateTime={isoDate(guild.expires_at)}>{periodEnd}</time>
                  </dd>
                </>
              )}
            </dl>

            {guild.tier === 'basic' && <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.sub_trial_hint}</p>}

            {(upgradeTargets.length > 0 || guild.tier !== 'basic') && (
              <div className="flex flex-wrap gap-3">
                {/* Derived from the tier order rather than one branch per tier:
                    every new tier would otherwise need its own combination. */}
                {upgradeTargets.map((target, i) => (
                  <Button
                    key={target}
                    variant={i === 0 && guild.tier === 'basic' ? 'primary' : 'outline'}
                    onClick={() => { setBillingError(null); setPendingTier(target) }}
                    disabled={billingLoading !== null}
                    aria-expanded={pendingTier === target}
                  >
                    <CreditCard className="h-4 w-4" />
                    {guild.tier === 'basic' ? t[GET_LABEL[target]] : t[UPGRADE_LABEL[target]]}
                  </Button>
                ))}
                {guild.tier !== 'basic' && (
                  <Button
                    variant={upgradeTargets.length === 0 ? 'primary' : 'outline'}
                    onClick={handleManage}
                    disabled={billingLoading !== null}
                    aria-busy={billingLoading === 'manage' || undefined}
                  >
                    {billingLoading === 'manage' ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ArrowSquareOut className="h-4 w-4" />}
                    {billingLoading === 'manage' ? t.sub_manage_loading : t.sub_manage}
                  </Button>
                )}
              </div>
            )}

            {/* Order summary (§ 312j Abs. 2 BGB), right before the order button. */}
            {pendingTier && (
              <OrderSummary
                lang={lang}
                tier={pendingTier}
                guildLabel={guild.guild_name ?? guild.guild_id}
                interval={billingInterval}
                onIntervalChange={setBillingInterval}
                busy={billingLoading !== null}
                submitting={billingLoading === pendingTier}
                onSubmit={() => handleCheckout(pendingTier, billingInterval)}
                onCancel={() => setPendingTier(null)}
              />
            )}

            {billingError && <Notice tone="danger" role="alert">{billingError}</Notice>}
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t.ov_setup_title} description={t.ov_setup_desc}>
        <div className="grid max-w-[44rem] gap-6">
          <CopyField
            label={t.ov_server_id}
            value={guild.guild_id}
            copy={{ copy: t.botdash_copy, copied: t.botdash_copied, failed: t.botdash_copy_failed }}
          />
          <div className="grid gap-1.5">
            <p className="font-semibold">{t.ov_api_key}</p>
            <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.ov_api_key_hint}</p>
            <Button asChild variant="outline" className="mt-1 w-fit">
              <Link href="/dashboard/ticket-bot/verify" prefetch={false}>{t.new_api_key}</Link>
            </Button>
          </div>
          <div className="grid gap-1.5">
            <p className="font-semibold">{t.docs}</p>
            <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.ov_docs_hint}</p>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-fit items-center gap-2 font-semibold text-[var(--color-primary)] underline underline-offset-2"
            >
              {t.ov_docs_link}
              <ArrowSquareOut className="h-4 w-4" />
              <span className="sr-only">{t.opens_new_tab}</span>
            </a>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function AreaLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button asChild variant="outline">
      <Link href={href} prefetch={false}>{children}</Link>
    </Button>
  )
}

/** State of a custom domain, the same words on every page of the dashboard. */
export function DomainBadge({ status, lang }: { status: DashboardGuild['domain_status']; lang: Lang }) {
  const s = dashboardShellTranslations[lang]
  if (status === 'active') return <StatusBadge tone="success">{s.tb_domain_active}</StatusBadge>
  if (status === 'pending_dns') return <StatusBadge tone="warning">{s.tb_domain_pending}</StatusBadge>
  return <StatusBadge tone="neutral">{s.tb_domain_none}</StatusBadge>
}
