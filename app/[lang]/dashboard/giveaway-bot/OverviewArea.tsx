'use client'

import type { ReactNode } from 'react'

import { EmptyState } from '@/components/dashboard/EmptyState'
import { Notice, type NoticeTone } from '@/components/dashboard/Notice'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatGrid, StatTile } from '@/components/dashboard/StatTile'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Plus } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { GIVEAWAY_NEW_HREF, giveawayDetailHref, giveawayHref } from '@/lib/dashboardNav'
import { formatDateTime, formatNumber, formatRelative, isoDate } from '@/lib/format'
import { isEditable, type Giveaway, type TebexStatus } from './giveawayModel'
import { useGiveawayCopy, useGiveawayData, type GiveawayCopy } from './GiveawayProvider'
import { HistoryCard } from './HistoryChart'

/** A finished giveaway counts as recent for this long, for "ended without a winner". */
const RECENT_MS = 7 * 24 * 60 * 60 * 1000

interface AttentionItem { id: string; tone: NoticeTone; text: string; href: string; action: string }

/**
 * What needs a look, in order of consequence (plan 6.3: Stripe, Ticket Tool).
 * Only what is not fine; nothing at all when everything is.
 */
export function attentionItems(
  t: GiveawayCopy, giveaways: Giveaway[], tebex: TebexStatus | null, owner: boolean, now: number,
): AttentionItem[] {
  const items: AttentionItem[] = []
  if (owner && tebex && !tebex.encryptionReady) {
    items.push({ id: 'encryption', tone: 'danger', text: t.store_no_key, href: giveawayHref('store'), action: t.to_store })
  }
  if (owner && tebex && !tebex.configured && giveaways.some(g => isEditable(g) && g.couponPercent != null)) {
    items.push({ id: 'coupon', tone: 'warning', text: t.att_coupon_no_store, href: giveawayHref('store'), action: t.to_store })
  }
  for (const g of giveaways) {
    if (g.status === 'PAUSED') {
      items.push({ id: `paused-${g.id}`, tone: 'warning', text: t.att_paused.replace('{title}', g.title), href: giveawayDetailHref(g.id), action: t.to_giveaway })
    }
  }
  for (const g of giveaways) {
    const ended = Date.parse(g.endedAt ?? g.endAt ?? '')
    if (g.status === 'ENDED' && (g.winnerIds?.length ?? 0) === 0 && Number.isFinite(ended) && now - ended < RECENT_MS) {
      items.push({ id: `nowinner-${g.id}`, tone: 'info', text: t.att_no_winner.replace('{title}', g.title), href: giveawayDetailHref(g.id), action: t.to_giveaway })
    }
  }
  return items
}

/**
 * The start page of the giveaway dashboard (plan 6.5): how many run, how many
 * entered, when the next one ends, and below that what needs a look and the
 * running giveaways with their time left and entries.
 *
 * Everything comes from what the dashboard loads anyway. A bot of the
 * scheduling release adds the scheduled giveaways and the activity per day;
 * with an older one both are left out and the page is what it was.
 */
export function OverviewArea() {
  const { t, lang } = useGiveawayCopy()
  const d = useGiveawayData()
  const now = d.loadedAt

  const running = d.giveaways.filter(g => g.status === 'ACTIVE')
  const scheduled = d.giveaways
    .filter(g => g.status === 'SCHEDULED' && g.startAt)
    .sort((a, b) => Date.parse(a.startAt!) - Date.parse(b.startAt!))
  const nextStart = scheduled[0]
  const paused = d.giveaways.filter(g => g.status === 'PAUSED')
  const ended = d.giveaways.filter(g => g.status === 'ENDED' || g.status === 'CANCELLED')
  const cancelled = ended.filter(g => g.status === 'CANCELLED').length
  const entries = [...running, ...paused].reduce((sum, g) => sum + g.entryCount, 0)
  const byEnd = running.filter(g => g.endAt).sort((a, b) => Date.parse(a.endAt!) - Date.parse(b.endAt!))
  const next = byEnd[0]
  const attention = attentionItems(t, d.giveaways, d.tebex, d.owner, now)
  const most = Math.max(1, ...running.map(g => g.entryCount))

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {/* Five tiles with scheduling: three and two on a laptop, one row on a wide screen. */}
      <StatGrid className={d.canSchedule ? '@5xl:grid-cols-3 @7xl:grid-cols-5' : undefined}>
        <StatTile
          label={t.ov_running}
          value={formatNumber(running.length, lang)}
          hint={paused.length > 0 ? t.ov_running_paused.replace('{n}', formatNumber(paused.length, lang)) : undefined}
          href={giveawayHref('giveaways')}
        />
        {d.canSchedule && (
          <StatTile
            label={t.ov_scheduled}
            value={formatNumber(scheduled.length, lang)}
            hint={nextStart ? (
              <>
                {t.ov_scheduled_next.replace('{when}', formatRelative(nextStart.startAt, lang, now) ?? '')}
                {' · '}
                <time dateTime={isoDate(nextStart.startAt)} className="tabular-nums">{formatDateTime(nextStart.startAt, lang)}</time>
              </>
            ) : t.ov_scheduled_none}
            href={nextStart ? giveawayDetailHref(nextStart.id) : giveawayHref('giveaways')}
          />
        )}
        <StatTile label={t.ov_entries} value={formatNumber(entries, lang)} hint={t.ov_entries_hint} />
        <StatTile
          label={t.ov_next_end}
          value={next ? formatRelative(next.endAt, lang, now) : <span className="text-[var(--color-muted-foreground)]">–</span>}
          hint={next ? <time dateTime={isoDate(next.endAt)}>{formatDateTime(next.endAt, lang)}</time> : t.ov_next_none}
          href={next ? giveawayDetailHref(next.id) : undefined}
        />
        <StatTile
          label={t.ov_ended}
          value={formatNumber(ended.length, lang)}
          hint={cancelled > 0 ? t.ov_ended_cancelled.replace('{n}', formatNumber(cancelled, lang)) : undefined}
          href={giveawayHref('giveaways')}
        />
      </StatGrid>

      {attention.length > 0 && (
        <SectionCard title={t.att_title}>
          <ul className="grid max-w-[60rem] gap-3">
            {attention.map(item => (
              <li key={item.id}>
                <Notice tone={item.tone} action={<AreaLink href={item.href}>{item.action}</AreaLink>}>{item.text}</Notice>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard
        title={t.ov_now_title}
        description={t.ov_now_desc}
        actions={<Button asChild><Link href={GIVEAWAY_NEW_HREF} prefetch={false}><Plus className="h-4 w-4" />{t.new_giveaway}</Link></Button>}
      >
        {running.length === 0 ? (
          <EmptyState kind="first-use" title={t.ov_now_empty}>{t.ov_now_empty_body}</EmptyState>
        ) : (
          <ul className="grid max-w-[60rem] gap-5">
            {byEnd.concat(running.filter(g => !g.endAt)).map(g => (
              <li key={g.id} className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-x-6">
                  <Link href={giveawayDetailHref(g.id)} prefetch={false} className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] hover:underline">
                    {g.title}
                  </Link>
                  <span className="text-small text-[var(--color-muted-foreground)]">
                    {g.endAt ? (
                      <>
                        {t.ov_ends.replace('{when}', formatRelative(g.endAt, lang, now) ?? '')}
                        {' · '}
                        <time dateTime={isoDate(g.endAt)} className="tabular-nums">{formatDateTime(g.endAt, lang)}</time>
                      </>
                    ) : '–'}
                  </span>
                </div>
                <EntryBar value={g.entryCount} most={most} label={(g.entryCount === 1 ? t.ov_entries_one : t.ov_entries_n).replace('{n}', formatNumber(g.entryCount, lang))} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {d.history && <HistoryCard />}
    </div>
  )
}

/**
 * Entries as a bar against the busiest running giveaway, with the number in
 * words beside it: the bar compares, the number tells (plan 6.5, lists with
 * bars after Plausible).
 */
function EntryBar({ value, most, label }: { value: number; most: number; label: string }) {
  const share = Math.round((value / most) * 100)
  return (
    <div className="flex items-center gap-3">
      <div aria-hidden className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.max(share, value > 0 ? 2 : 0)}%` }} />
      </div>
      <span className="w-32 shrink-0 text-right text-small tabular-nums">{label}</span>
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
