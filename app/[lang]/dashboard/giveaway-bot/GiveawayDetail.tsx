'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { EmptyState } from '@/components/dashboard/EmptyState'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Button } from '@/components/ui/Button'
import { giveawayHref } from '@/lib/dashboardNav'
import { formatDateTime, formatNumber, formatPercent, isoDate } from '@/lib/format'
import { GiveawayActions, type DeletionInfo } from './GiveawayActions'
import { fetchGiveaway } from './giveawayApi'
import { GiveawayForm } from './GiveawayForm'
import { discordImage, isEditable, winnerCount, winnerLabel, type GiveawayWinner } from './giveawayModel'
import { FlashNotice, useGiveawayCopy, useGiveawayData } from './GiveawayProvider'
import { GiveawayStatusBadge } from './GiveawaysArea'

/** What the bot's answer for this one giveaway adds to its row in the list. */
export interface GiveawayExtra {
  /** Winners with the names looked up that the list leaves empty. */
  winners?: GiveawayWinner[]
  /** Present only from a bot that can delete; deleting is offered with it. */
  deletion?: DeletionInfo
}

/** The useful part of a `/giveaway` answer; nothing from an older bot but the winners. */
export function extraOf(answer: Record<string, unknown> | null): GiveawayExtra {
  if (!answer) return {}
  const extra: GiveawayExtra = {}
  if (Array.isArray(answer.winners)) extra.winners = answer.winners as GiveawayWinner[]
  if (typeof answer.couponsIssued === 'number' && Number.isFinite(answer.couponsIssued)) {
    extra.deletion = { couponsIssued: Math.max(0, Math.round(answer.couponsIssued)) }
  }
  return extra
}

/**
 * One giveaway (plan 6.5): the head with title, state and its actions, then
 * the facts, the prizes and, once it has ended, the winners. A giveaway
 * that still runs, is paused or is scheduled can be changed right below.
 *
 * The id in the address only picks among the giveaways the session's server
 * returned. Once picked, the bot is asked for that one giveaway (through the
 * session's guild): it brings winner names the list leaves out and, from a
 * bot that can delete, the coupon codes a deletion has to warn about.
 * `extra` stands in for that answer where nothing is fetched (tests).
 */
export function GiveawayDetail({ id, extra: given }: { id: string; extra?: GiveawayExtra }) {
  const { t, lang } = useGiveawayCopy()
  const d = useGiveawayData()
  const g = d.giveaways.find(x => x.id === id)
  const back = { href: giveawayHref('giveaways'), label: t.back_to_list }
  const [fetched, setFetched] = useState<{ key: string; extra: GiveawayExtra } | null>(null)
  // Asked again when the list was reloaded or the state changed, so the
  // number of coupons is the one of now.
  const key = g ? `${g.id}:${g.status}:${d.loadedAt}` : ''

  useEffect(() => {
    if (!key || given) return
    let alive = true
    fetchGiveaway(id)
      .then(res => { if (alive) setFetched({ key, extra: extraOf(res.giveaway) }) })
      .catch(() => { /* the page works without it: ids instead of names, no delete */ })
    return () => { alive = false }
  }, [id, key, given])

  if (!g) {
    return (
      <>
        <PageHeader title={t.detail_missing_title} back={back} />
        <EmptyState
          kind="unavailable"
          headingLevel="h2"
          title={t.detail_missing_title}
          action={<Button asChild variant="outline"><Link href={giveawayHref('giveaways')} prefetch={false}>{t.back_to_list}</Link></Button>}
        >
          {t.detail_missing_body}
        </EmptyState>
      </>
    )
  }

  const extra = given ?? (fetched?.key === key ? fetched.extra : {})
  const scheduled = g.status === 'SCHEDULED'
  const running = g.status === 'ACTIVE' || g.status === 'PAUSED'
  const channel = d.channels.find(c => c.id === g.channelId)
  // A giveaway that was scheduled started at its start, not when it was created.
  const started = scheduled ? null : (g.startAt ?? g.createdAt)
  const ends = g.status === 'ACTIVE' || scheduled ? g.endAt : g.status === 'PAUSED' ? null : (g.endedAt ?? g.endAt)
  const coupon = g.couponPercent != null
    ? (g.couponValidDays
        ? t.dt_coupon_days.replace('{percent}', formatPercent(g.couponPercent, lang)).replace('{days}', formatNumber(g.couponValidDays, lang))
        : t.dt_coupon_never.replace('{percent}', formatPercent(g.couponPercent, lang)))
    : null

  const current = (extra.winners ?? g.winners ?? []).filter(w => !w.rerolled)
  const shown: GiveawayWinner[] = current.length
    ? current
    : (g.winnerIds ?? []).map(userId => ({ userId, prizeIndex: null }))
  const named = shown.some(w => w.displayName?.trim())

  return (
    <>
      <PageHeader
        title={g.title}
        badge={<GiveawayStatusBadge status={g.status} lang={lang} />}
        back={back}
        action={<GiveawayActions giveaway={g} variant="header" deletion={extra.deletion} />}
      />
      <div className="grid gap-[var(--app-gutter-y)]">
        <FlashNotice />

        <SectionCard title={t.dt_summary}>
          <dl className="grid max-w-[60rem] gap-x-10 gap-y-3 @xl:grid-cols-[max-content_1fr]">
            <Fact label={t.dt_id}><span className="font-mono">{g.id}</span></Fact>
            <Fact label={t.dt_channel}>{channel ? `# ${channel.name}` : <span className="font-mono">{g.channelId}</span>}</Fact>
            <Fact label={t.col_entries}><span className="tabular-nums">{formatNumber(g.entryCount, lang)}</span></Fact>
            {winnerCount(g) !== null && (
              <Fact label={g.status === 'ENDED' ? t.dt_winners_drawn : t.dt_winners_planned}>
                <span className="tabular-nums">{formatNumber(winnerCount(g)!, lang)}</span>
              </Fact>
            )}
            <Fact label={t.f_draw_mode}>{g.winnerMode === 'FIRST_CLICK' ? t.draw_first_click : t.draw_random}</Fact>
            {scheduled && g.createdAt && <Fact label={t.dt_created_at}><Moment value={g.createdAt} /></Fact>}
            {scheduled && g.startAt && <Fact label={t.dt_starts}><Moment value={g.startAt} /></Fact>}
            {started && formatDateTime(started, lang) && <Fact label={t.dt_created}><Moment value={started} /></Fact>}
            <Fact label={running || scheduled ? t.dt_ends : t.dt_ended}>
              {ends ? <Moment value={ends} /> : t.end_paused}
            </Fact>
            {coupon && <Fact label={t.dt_coupon}>{coupon}</Fact>}
            {(extra.deletion?.couponsIssued ?? 0) > 0 && (
              <Fact label={t.dt_coupons_issued}><span className="tabular-nums">{formatNumber(extra.deletion!.couponsIssued, lang)}</span></Fact>
            )}
          </dl>
        </SectionCard>

        <SectionCard title={t.dt_prizes}>
          {g.prizes.length === 0 ? (
            <p className="max-w-[65ch] text-[var(--color-muted-foreground)]">{t.dt_no_prizes}</p>
          ) : g.prizeMode === 'INDIVIDUAL' ? (
            <ol className="grid max-w-[65ch] list-decimal gap-1 pl-6">
              {g.prizes.map((p, i) => <li key={i}>{p}</li>)}
            </ol>
          ) : (
            <>
              <p className="mb-2 max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.mode_all}</p>
              <ul className="grid max-w-[65ch] list-disc gap-1 pl-6">
                {g.prizes.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </>
          )}
        </SectionCard>

        {g.status === 'ENDED' && (
          <SectionCard title={t.dt_winners} description={named ? t.dt_winners_desc_named : t.dt_winners_desc}>
            {shown.length === 0 ? (
              <p className="max-w-[65ch] text-[var(--color-muted-foreground)]">{t.dt_no_winners}</p>
            ) : (
              <ul className="grid max-w-[65ch] gap-2">
                {/* With one prize per winner the prize follows the winner,
                    otherwise the assignment could not be read here. */}
                {shown.map(w => (
                  <li key={w.userId} className="flex min-w-0 items-center gap-3">
                    <WinnerAvatar winner={w} />
                    <span className="grid min-w-0">
                      {w.displayName?.trim() ? (
                        <>
                          <span className="truncate font-semibold">{winnerLabel(w)}</span>
                          <span className="truncate font-mono text-small text-[var(--color-muted-foreground)]">@{w.userId}</span>
                        </>
                      ) : (
                        <span className="truncate font-mono">@{w.userId}</span>
                      )}
                      {g.prizeMode === 'INDIVIDUAL' && w.prizeIndex != null && g.prizes[w.prizeIndex] && (
                        <span className="text-small text-[var(--color-muted-foreground)]">{g.prizes[w.prizeIndex]}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        )}

        {isEditable(g) && (
          <section aria-labelledby="giveaway-edit" className="grid gap-4">
            <h2 id="giveaway-edit" className="font-display text-h2 font-bold">{t.edit_title}</h2>
            {/* Keyed by the giveaway's state, so a reload after a change in
                Discord starts the form from the new values. */}
            <GiveawayForm key={`${g.id}-${g.status}-${g.startAt ?? ''}`} giveaway={g} />
          </section>
        )}
      </div>
    </>
  )
}

function Moment({ value }: { value: string }) {
  const { lang } = useGiveawayCopy()
  return <time dateTime={isoDate(value)}>{formatDateTime(value, lang)}</time>
}

/**
 * The winner's Discord avatar at the time of the draw, or the first letter of
 * the name in its place. Decorative either way: name and id are written beside it.
 */
function WinnerAvatar({ winner }: { winner: GiveawayWinner }) {
  const src = discordImage(winner.avatarUrl)
  if (src) {
    return (
      // 32 px from Discord's CDN, which the CSP allows (proxy.ts).
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" width={32} height={32} loading="lazy" className="h-8 w-8 shrink-0 rounded-full object-cover" />
    )
  }
  const letter = winner.displayName?.trim().match(/[\p{L}\p{N}]/u)?.[0] ?? '#'
  return (
    <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-small font-bold uppercase text-[var(--color-muted-foreground)]">
      {letter}
    </span>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  )
}

/** The page "New giveaway": head with the way back, then the form. */
export function NewGiveawayPage({ template }: { template?: string }) {
  const { t } = useGiveawayCopy()
  return (
    <>
      <PageHeader
        title={t.new_giveaway}
        description={t.new_lead}
        back={{ href: giveawayHref('giveaways'), label: t.back_to_list }}
      />
      <FlashNotice />
      <GiveawayForm initialTemplate={template} />
    </>
  )
}
