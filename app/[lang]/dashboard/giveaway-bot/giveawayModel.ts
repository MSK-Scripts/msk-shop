/**
 * What the giveaway dashboard works with: the shapes the bot's control
 * endpoint answers with (through `/api/giveaway/data`), and the rules that
 * turn the dashboard's forms into the bodies `/api/giveaway/action` passes on.
 *
 * Until Phase 9 of the redesign all of this sat inside one client file of
 * 1,668 lines. It lives here without React, so the forms of every area build
 * their requests the same way and a test can pin them down
 * (tests/giveawayApi.test.ts, tests/giveawayAreas.test.ts).
 *
 * Nothing here decides what anyone may do. The guild comes from the signed
 * session on the server side of every request, and the bot checks the rest.
 */

export interface Role { id: string; name: string; color: string }
export interface Channel { id: string; name: string }
export type PrizeMode = 'ALL' | 'INDIVIDUAL'

/**
 * How the winners are determined. Sits next to the prize mode, not inside it:
 * one says WHO wins, the other WHAT the winners get.
 */
export type WinnerMode = 'RANDOM' | 'FIRST_CLICK'
/**
 * SCHEDULED: created with a start time, not posted yet. Only a bot of the
 * scheduling release (discord_giveawaybot#20) answers with it.
 */
export type GiveawayStatus = 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED'

/**
 * A winner. Name and avatar are what the bot stored when the winner was
 * drawn; winners from before that, and every winner from an older bot, have
 * none, and the dashboard shows the id instead.
 */
export interface GiveawayWinner {
  userId: string; prizeIndex: number | null
  displayName?: string | null; avatarUrl?: string | null; rerolled?: boolean
}

export interface Giveaway {
  id: string; channelId: string; title: string; description: string;
  prizes: string[]; prizeMode: PrizeMode; winnerMode: WinnerMode;
  winnersCount: number; status: GiveawayStatus;
  /**
   * Planned start of a scheduled giveaway, the real one of a giveaway that
   * was scheduled, null for one posted right away. Missing altogether from
   * an older bot, which is how the dashboard tells it cannot schedule.
   */
  startAt?: string | null;
  endAt: string | null; createdAt: string | null; endedAt: string | null;
  entryCount: number; winnerIds?: string[]; winners?: GiveawayWinner[]; resultUrl?: string;
  /** Coupon codes handed out and not revoked; only in the answer for one giveaway (`/giveaway`). */
  couponsIssued?: number;
  couponPercent: number | null; couponPackages: number[]; couponValidDays: number | null;
  /** Package selection per prize slot, indexed the same as `prizes`. */
  couponPackagesPerPrize?: number[][];
  /** Fixed codes entered from a third-party shop. */
  couponManualCode?: string | null;
  couponManualCodesPerPrize?: string[];
  couponManualNote?: string | null;
  /**
   * Conditions of this giveaway. They REPLACE the server-wide ones, each field
   * on its own. `null` means "nothing of its own", then the server setting
   * applies; an empty list, on the other hand, means "none applies to this giveaway".
   */
  blacklistRoles?: string[] | null;
  whitelistRoles?: string[] | null;
  bonusRoles?: Record<string, number> | null;
}

/**
 * A prepared giveaway without a channel and without an end time.
 * Carries the prize list since bot v1.7.0 and the conditions since v1.9.0;
 * without them a template could not represent what makes up a giveaway.
 */
export interface Template {
  id: number; name: string; title: string; description: string;
  duration: string; winnersCount: number; prizes: string[]; prizeMode: PrizeMode; winnerMode: WinnerMode;
  /** null = the template says nothing about it, the giveaway inherits the server setting. */
  blacklistRoles?: string[] | null;
  whitelistRoles?: string[] | null;
  bonusRoles?: Record<string, number> | null;
}

export interface TebexPackage { id: number; name: string; price: number }

export interface TebexStatus {
  configured: boolean; hint: string | null; setAt: string | null;
  publicToken: string | null; storeUrl: string | null; encryptionReady: boolean;
}

export interface Settings {
  lang: string; embedColor: string; buttonEmoji: string; buttonStyle: string;
  minAccountDays: number; minMemberDays: number; reminderMinutes: number;
  managerRole: string | null; notifyRole: string | null; logChannel: string | null;
  claimMessage: string | null; blacklist: string[]; whitelist: string[];
  /** Role ID to additional entries (weighted draw), server-wide. */
  bonusRoles: Record<string, number>;
}

/** The languages the bot speaks (SUPPORTED_LANGS in its src/utils/i18n.js). */
export const BOT_LANGS = ['en', 'de', 'fr', 'es', 'hu', 'pl', 'pt'] as const
/** Discord's button styles the bot maps (STYLE_MAP in its src/utils/embeds.js). */
export const BUTTON_STYLES = ['PRIMARY', 'SECONDARY', 'SUCCESS', 'DANGER'] as const

// ── Status ───────────────────────────────────────────────────────────────────

/** The filter of the list: ended takes the cancelled ones as well. */
export type StatusFilter = 'all' | 'scheduled' | 'running' | 'paused' | 'ended'

export function matchesFilter(g: Giveaway, filter: StatusFilter): boolean {
  switch (filter) {
    case 'all':       return true
    case 'scheduled': return g.status === 'SCHEDULED'
    case 'running':   return g.status === 'ACTIVE'
    case 'paused':    return g.status === 'PAUSED'
    case 'ended':     return g.status === 'ENDED' || g.status === 'CANCELLED'
  }
}

/** Posted and open for entries, or about to be again after a pause. */
export function isOpen(g: Giveaway): boolean {
  return g.status === 'ACTIVE' || g.status === 'PAUSED'
}

/**
 * What the edit form is offered for: an open giveaway, and a scheduled one,
 * which has no message yet and can still change in everything but its channel.
 */
export function isEditable(g: Giveaway): boolean {
  return isOpen(g) || g.status === 'SCHEDULED'
}

/**
 * What the bot deletes (DELETABLE_STATUSES in its controlServer.js). A
 * running or paused giveaway has to be ended or cancelled first.
 */
export const DELETABLE: readonly GiveawayStatus[] = ['ENDED', 'CANCELLED', 'SCHEDULED']

export function canDelete(g: Giveaway): boolean {
  return DELETABLE.includes(g.status)
}

/**
 * Whether the bot can schedule, read from its answers and not from a version
 * number: a bot of the scheduling release puts `startAt` on every giveaway,
 * null or not; an older one leaves the key out. With no giveaway at all the
 * list says nothing, and the preview answer decides (GiveawayForm).
 */
export function listKnowsSchedule(giveaways: Giveaway[]): boolean {
  return giveaways.some(g => Object.prototype.hasOwnProperty.call(g, 'startAt'))
}

/**
 * How many won, or will: drawn winners once it ended, the planned number
 * before. A cancelled giveaway has none and never will, so it has no number.
 */
export function winnerCount(g: Giveaway): number | null {
  if (g.status === 'CANCELLED') return null
  return g.status === 'ENDED' ? (g.winnerIds?.length ?? 0) : g.winnersCount
}

/** The instant the list shows in its "End" column, or null where there is none. */
export function endOf(g: Giveaway): string | null {
  if (g.status === 'ACTIVE' || g.status === 'SCHEDULED') return g.endAt
  if (g.status === 'PAUSED') return null
  return g.endedAt ?? g.endAt
}

// ── Winners ──────────────────────────────────────────────────────────────────

/**
 * An image address the dashboard shows: Discord's CDN only, over https. The
 * page's CSP allows that one host for images (proxy.ts); anything else the
 * bot might hand over is dropped and the initials or the id stand in.
 */
export function discordImage(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'cdn.discordapp.com' ? u.toString() : null
  } catch {
    return null
  }
}

/** A winner as a person reads it: the stored name, else the id as before. */
export function winnerLabel(w: Pick<GiveawayWinner, 'userId' | 'displayName'>): string {
  const name = w.displayName?.trim()
  return name ? name : `@${w.userId}`
}

// ── Guild and history (bot of the scheduling release) ───────────────────────

export interface GuildInfo { id: string; name: string | null; iconUrl: string | null; memberCount: number | null }

export interface HistoryDay { date: string; created: number; ended: number; entries: number }

export interface GuildHistory { days: number; history: HistoryDay[] }

/** The ranges the overview offers; the data route passes on nothing else. */
export const HISTORY_RANGES = [30, 90] as const
export type HistoryRange = typeof HISTORY_RANGES[number]

/** A guild answer the dashboard can use, or null: an older bot has no `/guild` and answers 404. */
export function asGuild(value: unknown): GuildInfo | null {
  const g = value as Partial<GuildInfo> | null | undefined
  if (!g || typeof g.id !== 'string') return null
  return {
    id: g.id,
    name: typeof g.name === 'string' && g.name.trim() ? g.name : null,
    iconUrl: discordImage(g.iconUrl),
    memberCount: typeof g.memberCount === 'number' ? g.memberCount : null,
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** A history answer the dashboard can use, or null (older bot, or anything malformed). */
export function asHistory(value: unknown): GuildHistory | null {
  const h = value as { days?: unknown; history?: unknown } | null | undefined
  if (!h || typeof h.days !== 'number' || !Array.isArray(h.history)) return null
  const count = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.round(n) : 0)
  const days = h.history
    .filter((r): r is HistoryDay => !!r && typeof (r as HistoryDay).date === 'string' && DAY.test((r as HistoryDay).date))
    .map(r => ({ date: r.date, created: count(r.created), ended: count(r.ended), entries: count(r.entries) }))
  return { days: h.days, history: days }
}

// ── Prizes ───────────────────────────────────────────────────────────────────

/** One prize per line, same rule as in the bot (src/utils/prizes.js). */
export const MAX_PRIZES = 20

export function splitPrizes(text: string): string[] {
  return text.split(/\r?\n|\|/).map((p) => p.trim()).filter(Boolean).slice(0, MAX_PRIZES)
}

/** Bring prize inputs into the format of the control endpoint. */
export function prizePayload(prizes: string, mode: PrizeMode, winnersCount: number) {
  const list = splitPrizes(prizes)
  return {
    prizes: list,
    prizeMode: list.length ? mode : 'ALL', // without prizes the mode is meaningless
    winnersCount: mode === 'INDIVIDUAL' && list.length ? list.length : winnersCount,
  }
}

// ── Bonus entries and conditions ─────────────────────────────────────────────

/** Bonus entries per role, as the bot accepts them (integer from 1 to 100). */
export const MIN_BONUS = 1
export const MAX_BONUS = 100

export function clampBonus(value: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [id, raw] of Object.entries(value ?? {})) {
    const n = Math.round(Number(raw))
    if (Number.isFinite(n)) out[id] = Math.min(MAX_BONUS, Math.max(MIN_BONUS, n))
  }
  return out
}

/** Bring condition inputs into the format of the control endpoint. */
export function eligibilityPayload(blacklist: string[], whitelist: string[], bonus: Record<string, number>) {
  return {
    blacklistRoles: blacklist,
    whitelistRoles: whitelist,
    // The bot rejects anything outside 1 to 100. While typing, the field may
    // still briefly hold something else, which is why clamping only happens here.
    bonusRoles: clampBonus(bonus),
  }
}

// ── Coupons ──────────────────────────────────────────────────────────────────

export interface ManualCodes { code: string; perPrize: string[]; note: string }

/**
 * Bring coupon inputs into the format of the control endpoint.
 *
 * The selection per winner is trimmed to the number of prizes: if someone
 * removes a prize, its package selection should not live on as a dead entry
 * and reappear the next time one is added.
 */
export function couponPayload(
  percent: string, validDays: string, selected: number[], perPrize: number[][], prizeCount: number,
  manual: ManualCodes,
) {
  return {
    couponPercent:   percent.trim() === '' ? null : Number(percent),
    couponValidDays: validDays.trim() === '' ? null : Number(validDays),
    couponPackages:  selected,
    couponPackagesPerPrize: Array.from({ length: prizeCount }, (_, i) => perPrize[i] ?? []),
    couponManualCode: manual.code.trim(),
    couponManualCodesPerPrize: Array.from({ length: prizeCount }, (_, i) => (manual.perPrize[i] ?? '').trim()),
    couponManualNote: manual.note.trim(),
  }
}

// ── Duration ─────────────────────────────────────────────────────────────────

/**
 * A duration as the form shows it: a number and a unit (plan 6.5). The bot
 * reads strings such as `1d2h30m` (src/utils/duration.js, units d, h, m, s,
 * from 10 seconds to 365 days).
 *
 * `original` is the string the giveaway or template came with. While the two
 * fields still say what it said, that string goes back unchanged, so editing
 * a template of `23h59m` without touching its duration sends `23h59m` again
 * and not `1439m`.
 */
export type DurationUnit = 'm' | 'h' | 'd'
export const DURATION_UNITS: readonly DurationUnit[] = ['m', 'h', 'd']
export interface DurationInput { amount: string; unit: DurationUnit; original?: string }

const UNIT_SECONDS: Record<'s' | DurationUnit, number> = { s: 1, m: 60, h: 3600, d: 86400 }
export const MAX_DURATION_SECONDS = 365 * UNIT_SECONDS.d

/** Seconds of a duration string by the bot's own rule, or null if it would refuse it. */
export function durationSeconds(text: string): number | null {
  const str = text.trim().toLowerCase()
  if (!str) return null
  let seconds = 0
  let consumed = 0
  for (const m of str.matchAll(/(\d+)\s*(d|h|m|s)/g)) {
    seconds += parseInt(m[1], 10) * UNIT_SECONDS[m[2] as 's' | DurationUnit]
    consumed += m[0].length
  }
  if (consumed === 0 || consumed < str.replace(/\s+/g, '').length) return null
  return seconds
}

/** The form fields for a stored duration: the largest unit that divides it. */
export function durationInput(text: string | undefined, fallback: DurationInput = { amount: '1', unit: 'd' }): DurationInput {
  const seconds = text ? durationSeconds(text) : null
  if (seconds === null || seconds <= 0) return { ...fallback, original: text || undefined }
  // Seconds left over only come from a template of less than a minute; the
  // form rounds them up to whole minutes.
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  const unit: DurationUnit = minutes % 1440 === 0 ? 'd' : minutes % 60 === 0 ? 'h' : 'm'
  const amount = unit === 'd' ? minutes / 1440 : unit === 'h' ? minutes / 60 : minutes
  return { amount: String(amount), unit, original: text }
}

/** The string sent to the bot. */
export function durationText(input: DurationInput): string {
  const composed = `${input.amount.trim()}${input.unit}`
  if (input.original) {
    const back = durationInput(input.original)
    if (back.amount === input.amount.trim() && back.unit === input.unit) return input.original
  }
  return composed
}

/** Whole number of units, and the total between one minute and 365 days. */
export function durationValid(input: DurationInput): boolean {
  if (!/^\d+$/.test(input.amount.trim())) return false
  const seconds = Number(input.amount.trim()) * UNIT_SECONDS[input.unit]
  return seconds >= 60 && seconds <= MAX_DURATION_SECONDS
}

// ── Start time ───────────────────────────────────────────────────────────────

/**
 * The value of a native `datetime-local` field. It carries no zone: the
 * person means the time on their own clock, so it is read in the browser's
 * zone and sent with that zone's offset, which the bot requires
 * (src/utils/schedule.js, ISO 8601 with offset).
 */
const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?$/
const pad = (n: number) => String(n).padStart(2, '0')

/** `2026-11-01T19:00` to `2026-11-01T19:00:00+01:00` in the browser's zone; null for an impossible date. */
export function localInputToIso(value: string): string | null {
  const m = LOCAL_INPUT.exec(value.trim())
  if (!m) return null
  const [y, mo, d, h, mi] = m.slice(1, 6).map(Number)
  const date = new Date(y, mo - 1, d, h, mi, 0, 0)
  // 31 November rolls over into December; the bot refuses such a date as
  // well, so it is refused here before it reaches the bot.
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  // A time inside the hour skipped when clocks go forward is moved on by the
  // browser; the fields below are that moved time, and the offset is its own.
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
    + `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/** An instant as the value of a `datetime-local` field, in the browser's zone. Empty when there is none. */
export function isoToLocalInput(value: string | null | undefined): string {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** What is wrong with a start time by the bot's rules, or null. Empty is fine: it means "post now". */
export function startProblem(value: string, now: number): 'invalid' | 'past' | 'far' | null {
  if (!value.trim()) return null
  const iso = localInputToIso(value)
  if (!iso) return 'invalid'
  const at = Date.parse(iso)
  if (at <= now) return 'past'
  if (at - now > MAX_DURATION_SECONDS * 1000) return 'far'
  return null
}

/** The duration a scheduled giveaway was stored with: its end minus its start. */
function scheduledDuration(g: Giveaway): DurationInput {
  const start = Date.parse(g.startAt ?? '')
  const end = Date.parse(g.endAt ?? '')
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return { amount: '1', unit: 'd' }
  return durationInput(`${Math.round((end - start) / 1000)}s`)
}

// ── Forms ────────────────────────────────────────────────────────────────────

/** Everything the create and edit form holds. */
export interface GiveawayDraft {
  /** `datetime-local` value of the start; empty posts right away. */
  startAt: string
  channelId: string
  title: string
  description: string
  prizes: string
  prizeMode: PrizeMode
  winnerMode: WinnerMode
  winnersCount: string
  duration: DurationInput
  couponPercent: string
  couponValidDays: string
  couponPackages: number[]
  couponPackagesPerPrize: number[][]
  manualCode: string
  manualPerPrize: string[]
  manualNote: string
  blacklist: string[]
  whitelist: string[]
  bonus: Record<string, number>
}

/**
 * A new giveaway. The conditions replace the server-wide ones, which is why
 * they are in here from the start: whatever is in the form then applies to
 * this giveaway. Prefilled empty, creating it would silently switch off
 * every server setting. The channel is not preselected (plan 6.5): posting
 * into the first channel of the list was how a giveaway landed in
 * `# legal-rechtliches`.
 */
export function newDraft(settings: Settings | null): GiveawayDraft {
  return {
    startAt: '', channelId: '', title: '', description: '', prizes: '',
    prizeMode: 'ALL', winnerMode: 'RANDOM', winnersCount: '1',
    duration: { amount: '1', unit: 'd' },
    couponPercent: '', couponValidDays: '', couponPackages: [], couponPackagesPerPrize: [],
    manualCode: '', manualPerPrize: [], manualNote: '',
    blacklist: settings?.blacklist ?? [], whitelist: settings?.whitelist ?? [], bonus: settings?.bonusRoles ?? {},
  }
}

/**
 * Apply a template: the fields are FILLED, not locked.
 *
 * A template is a starting point, not a contract. Whoever picks it and then
 * changes the title means it that way (and the channel is never in it anyway).
 * Coupons stay untouched: a template deliberately does not carry them, they
 * depend on package IDs of a specific store and would quickly be outdated.
 * Conditions the template says nothing about (null) fall back to the server
 * settings: the same prefill as without a template.
 */
export function applyTemplate(draft: GiveawayDraft, tpl: Template, settings: Settings | null): GiveawayDraft {
  return {
    ...draft,
    title: tpl.title,
    description: tpl.description,
    prizes: tpl.prizes.join('\n'),
    prizeMode: tpl.prizeMode,
    winnerMode: tpl.winnerMode ?? 'RANDOM',
    winnersCount: String(tpl.winnersCount),
    duration: durationInput(tpl.duration),
    blacklist: tpl.blacklistRoles ?? settings?.blacklist ?? [],
    whitelist: tpl.whitelistRoles ?? settings?.whitelist ?? [],
    bonus: tpl.bonusRoles ?? settings?.bonusRoles ?? {},
  }
}

/**
 * The form of a running or scheduled giveaway. A condition the giveaway
 * inherits (null) shows the server setting, which is what applies right now;
 * empty would simply be wrong. A scheduled one also brings its start and its
 * duration, the two things only it can still change.
 */
export function draftOf(g: Giveaway, settings: Settings | null): GiveawayDraft {
  const scheduled = g.status === 'SCHEDULED'
  return {
    startAt: scheduled ? isoToLocalInput(g.startAt) : '',
    channelId: g.channelId,
    title: g.title,
    description: g.description,
    prizes: (g.prizes ?? []).join('\n'),
    prizeMode: g.prizeMode ?? 'ALL',
    winnerMode: g.winnerMode ?? 'RANDOM',
    winnersCount: String(g.winnersCount),
    duration: scheduled ? scheduledDuration(g) : { amount: '1', unit: 'd' },
    couponPercent: g.couponPercent == null ? '' : String(g.couponPercent),
    couponValidDays: g.couponValidDays == null ? '' : String(g.couponValidDays),
    couponPackages: g.couponPackages ?? [],
    couponPackagesPerPrize: g.couponPackagesPerPrize ?? [],
    manualCode: g.couponManualCode ?? '',
    manualPerPrize: g.couponManualCodesPerPrize ?? [],
    manualNote: g.couponManualNote ?? '',
    blacklist: g.blacklistRoles ?? settings?.blacklist ?? [],
    whitelist: g.whitelistRoles ?? settings?.whitelist ?? [],
    bonus: g.bonusRoles ?? settings?.bonusRoles ?? {},
  }
}

function couponAndConditions(d: GiveawayDraft) {
  const prizeList = splitPrizes(d.prizes)
  return {
    ...couponPayload(d.couponPercent, d.couponValidDays, d.couponPackages, d.couponPackagesPerPrize, prizeList.length,
      { code: d.manualCode, perPrize: d.manualPerPrize, note: d.manualNote }),
    ...eligibilityPayload(d.blacklist, d.whitelist, d.bonus),
  }
}

/**
 * The body of `create`, without the action name. Title and text trimmed, as
 * before. A start goes along only when one is set: without it the bot posts
 * right away, as it always did, and an older bot gets the body it knows.
 */
export function createBody(d: GiveawayDraft) {
  const startAt = d.startAt.trim() ? localInputToIso(d.startAt) : null
  return {
    channelId: d.channelId, title: d.title.trim(), description: d.description.trim(), duration: durationText(d.duration),
    winnerMode: d.winnerMode,
    ...prizePayload(d.prizes, d.prizeMode, Number(d.winnersCount)),
    ...couponAndConditions(d),
    ...(startAt ? { startAt } : {}),
  }
}

/**
 * The body of `edit`, without action and id. Title and text go as typed, as
 * before.
 *
 * `scheduledFrom` is the form a scheduled giveaway started with. Start and
 * duration go along only when they differ from it: the bot refuses both once
 * the giveaway has started, and a title fixed a minute before the start
 * should not fail over a start nobody touched.
 */
export function editBody(d: GiveawayDraft, scheduledFrom?: GiveawayDraft) {
  const body = {
    title: d.title, description: d.description, winnerMode: d.winnerMode,
    ...prizePayload(d.prizes, d.prizeMode, Number(d.winnersCount)),
    ...couponAndConditions(d),
  }
  if (!scheduledFrom) return body
  const schedule: { startAt?: string; duration?: string } = {}
  const startAt = d.startAt !== scheduledFrom.startAt ? localInputToIso(d.startAt) : null
  if (startAt) schedule.startAt = startAt
  if (durationText(d.duration) !== durationText(scheduledFrom.duration)) schedule.duration = durationText(d.duration)
  return { ...body, ...schedule }
}

/**
 * The body of `preview`: what a create with this form would post.
 *
 * An empty channel is left out (the preview needs none, an empty one it
 * refuses), and so is a start the bot would refuse, so the message still
 * shows while that field is being fixed. For a giveaway that is already
 * posted the end stays where it is: the time left is sent as its duration.
 */
export function previewBody(d: GiveawayDraft, g: Pick<Giveaway, 'status' | 'endAt'> | undefined, now: number): Record<string, unknown> {
  const { channelId, startAt, ...rest } = createBody(d) as ReturnType<typeof createBody> & { startAt?: string }
  const body: Record<string, unknown> = { ...rest }
  if (channelId) body.channelId = channelId
  if (startAt && startProblem(d.startAt, now) === null && (!g || g.status === 'SCHEDULED')) body.startAt = startAt
  if (g && g.status !== 'SCHEDULED') {
    const left = Math.round(((Date.parse(g.endAt ?? '') || now) - now) / 1000)
    body.duration = `${Math.max(60, left)}s`
  }
  return body
}

export type DraftField =
  | 'channel' | 'title' | 'description' | 'prizes' | 'winners' | 'duration' | 'drawMode' | 'startAt'
  | 'couponPercent' | 'couponValidDays' | 'couponPackages' | 'manualCode' | 'name' | 'form'

const WHOLE = /^\d+$/

function inRange(value: string, min: number, max: number): boolean {
  const v = value.trim()
  return WHOLE.test(v) && Number(v) >= min && Number(v) <= max
}

/**
 * What is wrong with a giveaway form, field by field. Empty when it may go out.
 * The same rules the bot applies, so a mistake shows at its field before the
 * request instead of as a code afterwards.
 *
 * `scheduledFrom` marks the edit of a scheduled giveaway (see editBody): its
 * duration counts again, its start is needed, and checked only when changed.
 */
export function validateDraft(
  d: GiveawayDraft, mode: 'create' | 'edit' | 'template',
  { now = Date.now(), scheduledFrom }: { now?: number; scheduledFrom?: GiveawayDraft } = {},
): Partial<Record<DraftField, true>> {
  const errors: Partial<Record<DraftField, true>> = {}
  if (mode === 'create' && !d.channelId) errors.channel = true
  if (!d.title.trim()) errors.title = true
  if (!d.description.trim()) errors.description = true
  const individual = d.prizeMode === 'INDIVIDUAL' && splitPrizes(d.prizes).length > 0
  if (!individual && !inRange(d.winnersCount, 1, 100)) errors.winners = true
  if ((mode !== 'edit' || scheduledFrom) && !durationValid(d.duration)) errors.duration = true
  if (mode === 'create' && startProblem(d.startAt, now)) errors.startAt = true
  if (mode === 'edit' && scheduledFrom) {
    if (!d.startAt.trim()) errors.startAt = true
    else if (d.startAt !== scheduledFrom.startAt && startProblem(d.startAt, now)) errors.startAt = true
  }
  if (mode !== 'template') {
    if (d.couponPercent.trim() !== '' && !inRange(d.couponPercent, 1, 100)) errors.couponPercent = true
    if (d.couponValidDays.trim() !== '' && !inRange(d.couponValidDays, 1, 3650)) errors.couponValidDays = true
  }
  return errors
}

/** The field a refusal of the bot belongs to; `form` for everything else. */
export function fieldOfError(code: string | undefined): DraftField {
  switch (code) {
    case 'invalid_channel':     return 'channel'
    case 'missing_fields':      return 'title'
    case 'invalid_duration':    return 'duration'
    case 'invalid_start':
    case 'start_in_past':
    case 'start_too_far':       return 'startAt'
    case 'invalid_winners':
    case 'winners_locked':      return 'winners'
    case 'too_many_prizes':     return 'prizes'
    case 'invalid_winner_mode': return 'drawMode'
    case 'invalid_percent':     return 'couponPercent'
    case 'invalid_validity':    return 'couponValidDays'
    case 'invalid_packages':
    case 'too_many_packages':   return 'couponPackages'
    case 'invalid_codes':       return 'manualCode'
    case 'invalid_name':
    case 'name_taken':          return 'name'
    default:                    return 'form'
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

/** The body of `templateSave`, without the action name and id. */
export function templateBody(name: string, d: GiveawayDraft, ownConditions: boolean) {
  return {
    name: name.trim(), title: d.title.trim(), description: d.description.trim(), duration: durationText(d.duration).trim(),
    winnerMode: d.winnerMode,
    ...prizePayload(d.prizes, d.prizeMode, Number(d.winnersCount)),
    // Switched off means null, not an empty list: empty would be a condition
    // of its own ("none applies here"), null lets the server setting apply.
    ...(ownConditions
      ? eligibilityPayload(d.blacklist, d.whitelist, d.bonus)
      : { blacklistRoles: null, whitelistRoles: null, bonusRoles: null }),
  }
}

/**
 * The form of a template. Unlike for the giveaway, "inherit" is the default:
 * a template lives for months, and freezing the server settings into it would
 * make every giveaway created from it miss a later change to them. Whoever
 * wants their own conditions switches them on.
 */
export function templateDraft(tpl: Template | undefined, settings: Settings | null): { name: string; own: boolean; draft: GiveawayDraft } {
  const base = newDraft(settings)
  if (!tpl) return { name: '', own: false, draft: base }
  return {
    name: tpl.name,
    own: Boolean(tpl.blacklistRoles || tpl.whitelistRoles || tpl.bonusRoles),
    draft: applyTemplate(base, tpl, settings),
  }
}

/** Does a template carry conditions of its own? */
export function hasOwnConditions(tpl: Template): boolean {
  return Boolean(tpl.blacklistRoles || tpl.whitelistRoles || tpl.bonusRoles)
}

// ── Settings ─────────────────────────────────────────────────────────────────

/** The body of `settings`, without the action name: exactly the old form's. */
export function settingsBody(form: Settings) {
  return {
    lang: form.lang, embedColor: form.embedColor, buttonEmoji: form.buttonEmoji, buttonStyle: form.buttonStyle,
    minAccountDays: Number(form.minAccountDays) || 0, minMemberDays: Number(form.minMemberDays) || 0,
    reminderMinutes: Number(form.reminderMinutes) || 0,
    managerRole: form.managerRole || null, notifyRole: form.notifyRole || null, logChannel: form.logChannel || null,
    claimMessage: form.claimMessage || null, blacklist: form.blacklist, whitelist: form.whitelist,
    bonusRoles: clampBonus(form.bonusRoles),
  }
}

export const HEX_COLOR = /^#[0-9a-f]{6}$/i
