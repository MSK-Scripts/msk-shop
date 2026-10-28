'use client'

import type { ReactNode } from 'react'

import { EmptyState } from '@/components/dashboard/EmptyState'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Button } from '@/components/ui/Button'
import { giveawayHref } from '@/lib/dashboardNav'
import { formatDateTime, formatNumber, formatPercent, isoDate } from '@/lib/format'
import { GiveawayActions } from './GiveawayActions'
import { GiveawayForm } from './GiveawayForm'
import { isOpen, winnerCount } from './giveawayModel'
import { FlashNotice, useGiveawayCopy, useGiveawayData } from './GiveawayProvider'
import { GiveawayStatusBadge } from './GiveawaysArea'

/**
 * One giveaway (plan 6.5): the head with title, state and its actions, then
 * the facts, the prizes and, once it has ended, the winners. A giveaway
 * that still runs or is paused can be changed right below.
 *
 * The id in the address only picks among the giveaways the session's server
 * returned; nothing is loaded by it.
 */
export function GiveawayDetail({ id }: { id: string }) {
  const { t, lang } = useGiveawayCopy()
  const d = useGiveawayData()
  const g = d.giveaways.find(x => x.id === id)
  const back = { href: giveawayHref('giveaways'), label: t.back_to_list }

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

  const channel = d.channels.find(c => c.id === g.channelId)
  const created = formatDateTime(g.createdAt, lang)
  const ends = g.status === 'ACTIVE' ? g.endAt : g.status === 'PAUSED' ? null : (g.endedAt ?? g.endAt)
  const coupon = g.couponPercent != null
    ? (g.couponValidDays
        ? t.dt_coupon_days.replace('{percent}', formatPercent(g.couponPercent, lang)).replace('{days}', formatNumber(g.couponValidDays, lang))
        : t.dt_coupon_never.replace('{percent}', formatPercent(g.couponPercent, lang)))
    : null

  return (
    <>
      <PageHeader
        title={g.title}
        badge={<GiveawayStatusBadge status={g.status} lang={lang} />}
        back={back}
        action={<GiveawayActions giveaway={g} variant="header" />}
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
            {created && <Fact label={t.dt_created}><time dateTime={isoDate(g.createdAt)}>{created}</time></Fact>}
            <Fact label={g.status === 'ACTIVE' || g.status === 'PAUSED' ? t.dt_ends : t.dt_ended}>
              {ends ? <time dateTime={isoDate(ends)}>{formatDateTime(ends, lang)}</time> : t.end_paused}
            </Fact>
            {coupon && <Fact label={t.dt_coupon}>{coupon}</Fact>}
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
          <SectionCard title={t.dt_winners} description={t.dt_winners_desc}>
            {(g.winnerIds?.length ?? 0) === 0 ? (
              <p className="max-w-[65ch] text-[var(--color-muted-foreground)]">{t.dt_no_winners}</p>
            ) : (
              <ul className="grid max-w-[65ch] gap-1.5">
                {/* With one prize per winner the prize follows the winner,
                    otherwise the assignment could not be read here. */}
                {(g.prizeMode === 'INDIVIDUAL' && g.winners?.length ? g.winners : (g.winnerIds ?? []).map(userId => ({ userId, prizeIndex: null }))).map(w => (
                  <li key={w.userId} className="flex flex-wrap gap-x-2">
                    <span className="font-mono">@{w.userId}</span>
                    {w.prizeIndex != null && g.prizes[w.prizeIndex] && (
                      <span className="text-[var(--color-muted-foreground)]">{g.prizes[w.prizeIndex]}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        )}

        {isOpen(g) && (
          <section aria-labelledby="giveaway-edit" className="grid gap-4">
            <h2 id="giveaway-edit" className="font-display text-h2 font-bold">{t.edit_title}</h2>
            {/* Keyed by the giveaway's state, so a reload after a change in
                Discord starts the form from the new values. */}
            <GiveawayForm key={`${g.id}-${g.status}`} giveaway={g} />
          </section>
        )}
      </div>
    </>
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
