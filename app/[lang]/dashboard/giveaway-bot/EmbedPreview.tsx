'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { Notice } from '@/components/dashboard/Notice'
import { formatDateTime, formatRelative, isoDate } from '@/lib/format'
import type { Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { previewGiveaway, type ActionResult, type PreviewAnswer, type PreviewButton } from './giveawayApi'
import { previewBody, type Channel, type Giveaway, type GiveawayDraft, type Role } from './giveawayModel'
import { embedColor, parseMarkup, type MarkupNode } from './discordMarkup'
import { useGiveawayCopy, useGiveawayData, type GiveawayCopy } from './GiveawayProvider'
import { errorText } from './useGiveawayAction'

/** What the preview knows for turning ids into names. */
export interface MarkupContext {
  lang: Lang
  /** The moment relative timestamps count from: when the answer came. */
  now: number
  roles: Role[]
  channels: Channel[]
  t: GiveawayCopy
}

const MENTION = 'rounded-sm bg-[var(--color-accent-soft)] px-1 font-semibold text-[var(--color-primary)]'

function renderNode(node: MarkupNode, key: number, ctx: MarkupContext): ReactNode {
  switch (node.kind) {
    case 'text':
      return node.text
    case 'bold':
      return <strong key={key}>{node.children.map((c, i) => renderNode(c, i, ctx))}</strong>
    case 'time': {
      const text = node.style === 'R' ? formatRelative(node.at, ctx.lang, ctx.now) : formatDateTime(node.at, ctx.lang)
      return <time key={key} dateTime={isoDate(node.at)} className="rounded-sm bg-[var(--color-muted)] px-1">{text}</time>
    }
    case 'user':
      return <span key={key} className={MENTION}>@{node.id}</span>
    case 'role': {
      const role = ctx.roles.find(r => r.id === node.id)
      return <span key={key} className={MENTION}>@{role ? role.name : ctx.t.pv_role_unknown}</span>
    }
    case 'channel': {
      const channel = ctx.channels.find(c => c.id === node.id)
      return <span key={key} className={MENTION}>#{channel ? channel.name : ctx.t.pv_channel_unknown}</span>
    }
    case 'emoji':
      return `:${node.name}:`
  }
}

/**
 * Discord markup as text: mentions as names where the dashboard knows them,
 * timestamps in the page's language, custom emoji by name. Every string goes
 * through React as a child, so nothing from the embed becomes markup.
 */
export function DiscordText({ text, ctx }: { text: string | null | undefined; ctx: MarkupContext }) {
  return <>{parseMarkup(text).map((node, i) => renderNode(node, i, ctx))}</>
}

const BUTTON_STYLE: Record<number, string> = {
  1: 'bg-[var(--color-discord)] text-white',
  2: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
  3: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
  4: 'bg-[var(--color-danger)] text-[var(--color-danger-foreground)]',
}

function JoinButton({ button, ctx }: { button: PreviewButton; ctx: MarkupContext }) {
  const emoji = button.emoji?.id ? `:${button.emoji.name ?? ''}:` : button.emoji?.name ?? ''
  return (
    <span className={cn('inline-flex min-h-9 items-center gap-1.5 rounded-md px-4 text-small font-semibold', BUTTON_STYLE[button.style ?? 1] ?? BUTTON_STYLE[1])}>
      <span className="sr-only">{ctx.t.pv_button}: </span>
      {emoji && <span aria-hidden>{emoji}</span>}
      {button.label}
    </span>
  )
}

/**
 * The message as Discord shows it, from the bot's own embed JSON: colour bar,
 * title, text, fields (inline ones side by side), footer with the end, and
 * the join button. A picture of the post, not a control: the button is text.
 */
export function EmbedCard({ answer, ctx }: { answer: PreviewAnswer; ctx: MarkupContext }) {
  const { embed } = answer
  const color = embedColor(embed.color)
  const buttons = answer.components.flatMap(row => row.components ?? [])
  const stamp = embed.timestamp ? formatDateTime(embed.timestamp, ctx.lang) : null
  return (
    <div className="@container grid gap-2">
      <article
        className="grid min-w-0 gap-2 rounded-md border-l-4 border-[var(--color-input)] bg-[var(--color-card)] p-3.5"
        // The embed colour is the server's own setting; a value from data has
        // no class, and style-src-attr allows the attribute (proxy.ts).
        style={color ? { borderLeftColor: color } : undefined}
      >
        {embed.title && <h3 className="font-semibold break-words"><DiscordText text={embed.title} ctx={ctx} /></h3>}
        {embed.description && (
          <p className="whitespace-pre-line break-words text-small"><DiscordText text={embed.description} ctx={ctx} /></p>
        )}
        {(embed.fields?.length ?? 0) > 0 && (
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 @xs:grid-cols-2 @md:grid-cols-3">
            {embed.fields!.map((f, i) => (
              <div key={i} className={cn('min-w-0', !f.inline && '@xs:col-span-full')}>
                <dt className="text-small font-semibold"><DiscordText text={f.name} ctx={ctx} /></dt>
                <dd className="whitespace-pre-line break-words text-small"><DiscordText text={f.value} ctx={ctx} /></dd>
              </div>
            ))}
          </dl>
        )}
        {(embed.footer?.text || stamp) && (
          <p className="text-label text-[var(--color-muted-foreground)]">
            <DiscordText text={embed.footer?.text} ctx={ctx} />
            {embed.footer?.text && stamp && ' · '}
            {stamp && <time dateTime={isoDate(embed.timestamp)}>{stamp}</time>}
          </p>
        )}
      </article>
      {buttons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {buttons.map((b, i) => <JoinButton key={i} button={b} ctx={ctx} />)}
        </div>
      )}
    </div>
  )
}

export type PreviewState =
  | { kind: 'waiting' }
  | { kind: 'ready'; answer: PreviewAnswer; at: number; loading: boolean }
  | { kind: 'incomplete'; loading: boolean }
  | { kind: 'invalid'; reason: string; loading: boolean }
  | { kind: 'failed'; loading: boolean }

/**
 * What one answer of the preview route means. A 404 can only come from a bot
 * without the route: the bot of the scheduling release answers a body it
 * refuses with 400, never 404. Any other failure (unreachable, rate limited)
 * says nothing about the route and keeps the form as it is.
 */
export function previewOutcome(
  res: ActionResult<PreviewAnswer>, t: GiveawayCopy, at: number,
): { route: 'available' | 'missing' | null; state: PreviewState | null } {
  if (res.status === 404) return { route: 'missing', state: null }
  if (res.ok && res.data.embed) {
    return { route: 'available', state: { kind: 'ready', answer: res.data as PreviewAnswer, at, loading: false } }
  }
  if (res.status === 400) {
    return {
      route: 'available',
      state: res.data.error === 'missing_fields'
        ? { kind: 'incomplete', loading: false }
        : { kind: 'invalid', reason: errorText(t, res), loading: false },
    }
  }
  return { route: null, state: { kind: 'failed', loading: false } }
}

/** Wait this long after the last keystroke before asking the bot. */
export const PREVIEW_DELAY_MS = 450

/**
 * Asks the bot for the message of this form, a moment after the last change,
 * and cancels the request still out when the form changes again. Nothing is
 * asked once the bot answered 404: an older bot has no preview, and the form
 * then goes without one (the provider remembers it for the visit).
 */
export function useGiveawayPreview(draft: GiveawayDraft, giveaway: Giveaway | undefined): PreviewState {
  const { t } = useGiveawayCopy()
  const d = useGiveawayData()
  const [state, setState] = useState<PreviewState>({ kind: 'waiting' })
  const missing = d.preview === 'missing'
  const { setPreview } = d
  // The form as a string: the request depends on its content, not on the
  // object, which is new after every keystroke.
  const draftKey = JSON.stringify(draft)
  const status = giveaway?.status
  const endAt = giveaway?.endAt ?? null

  useEffect(() => {
    if (missing) return
    const ctrl = new AbortController()
    const timer = window.setTimeout(async () => {
      setState(s => (s.kind === 'waiting' ? s : { ...s, loading: true }))
      try {
        const body = previewBody(JSON.parse(draftKey) as GiveawayDraft, status ? { status, endAt } : undefined, Date.now())
        const res = await previewGiveaway(body, ctrl.signal)
        if (ctrl.signal.aborted) return
        const outcome = previewOutcome(res, t, Date.now())
        if (outcome.route) setPreview(outcome.route)
        if (outcome.state) setState(outcome.state)
      } catch {
        if (!ctrl.signal.aborted) setState({ kind: 'failed', loading: false })
      }
    }, PREVIEW_DELAY_MS)
    return () => { window.clearTimeout(timer); ctrl.abort() }
  }, [draftKey, status, endAt, missing, setPreview, t])

  return state
}

/**
 * The preview beside or below the form. Nothing until the bot answered once,
 * and nothing at all from a bot without a preview: the form is complete
 * without it.
 */
export function PreviewPanel({ state, editingPosted }: { state: PreviewState; editingPosted: boolean }) {
  const { t, lang } = useGiveawayCopy()
  const d = useGiveawayData()
  if (d.preview === 'missing' || state.kind === 'waiting') return null
  const ctx: MarkupContext = { lang, now: state.kind === 'ready' ? state.at : d.loadedAt, roles: d.roles, channels: d.channels, t }
  const loading = state.loading

  return (
    <section aria-labelledby="giveaway-preview" aria-busy={loading || undefined} className="grid content-start gap-3">
      <div className="grid gap-1">
        <h2 id="giveaway-preview" className="font-display text-h3 font-[650]">{t.pv_title}</h2>
        <p className="max-w-[45ch] text-small text-[var(--color-muted-foreground)]">{t.pv_desc}</p>
      </div>
      <div className={cn('grid gap-3 rounded-lg bg-[var(--color-muted)] p-3 transition-opacity duration-150', loading && 'opacity-60')}>
        {state.kind === 'ready' && (
          <>
            {state.answer.status === 'SCHEDULED' && state.answer.startAt && (
              <p className="text-small font-semibold">
                {t.pv_scheduled.replace('{date}', formatDateTime(state.answer.startAt, lang) ?? '')}
              </p>
            )}
            <EmbedCard answer={state.answer} ctx={ctx} />
            {editingPosted && <p className="text-small text-[var(--color-muted-foreground)]">{t.pv_no_entries}</p>}
          </>
        )}
        {state.kind === 'incomplete' && <p className="text-small text-[var(--color-muted-foreground)]">{t.pv_incomplete}</p>}
        {state.kind === 'invalid' && <p className="text-small text-[var(--color-muted-foreground)]">{t.pv_invalid.replace('{reason}', state.reason)}</p>}
        {state.kind === 'failed' && <Notice tone="info">{t.pv_failed}</Notice>}
        {loading && <span className="sr-only">{t.pv_loading}</span>}
      </div>
    </section>
  )
}
