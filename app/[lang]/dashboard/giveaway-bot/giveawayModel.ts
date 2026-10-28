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
export type GiveawayStatus = 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED'

export interface GiveawayWinner { userId: string; prizeIndex: number | null }

export interface Giveaway {
  id: string; channelId: string; title: string; description: string;
  prizes: string[]; prizeMode: PrizeMode; winnerMode: WinnerMode;
  winnersCount: number; status: GiveawayStatus;
  endAt: string | null; createdAt: string | null; endedAt: string | null;
  entryCount: number; winnerIds?: string[]; winners?: GiveawayWinner[]; resultUrl?: string;
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
export type StatusFilter = 'all' | 'running' | 'paused' | 'ended'

export function matchesFilter(g: Giveaway, filter: StatusFilter): boolean {
  switch (filter) {
    case 'all':     return true
    case 'running': return g.status === 'ACTIVE'
    case 'paused':  return g.status === 'PAUSED'
    case 'ended':   return g.status === 'ENDED' || g.status === 'CANCELLED'
  }
}

/** Still open for entries or about to be again: these can be edited. */
export function isOpen(g: Giveaway): boolean {
  return g.status === 'ACTIVE' || g.status === 'PAUSED'
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
  if (g.status === 'ACTIVE') return g.endAt
  if (g.status === 'PAUSED') return null
  return g.endedAt ?? g.endAt
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

// ── Forms ────────────────────────────────────────────────────────────────────

/** Everything the create and edit form holds. */
export interface GiveawayDraft {
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
    channelId: '', title: '', description: '', prizes: '',
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
 * The form of a running giveaway. A condition the giveaway inherits (null)
 * shows the server setting, which is what applies right now; empty would
 * simply be wrong.
 */
export function draftOf(g: Giveaway, settings: Settings | null): GiveawayDraft {
  return {
    channelId: g.channelId,
    title: g.title,
    description: g.description,
    prizes: (g.prizes ?? []).join('\n'),
    prizeMode: g.prizeMode ?? 'ALL',
    winnerMode: g.winnerMode ?? 'RANDOM',
    winnersCount: String(g.winnersCount),
    duration: { amount: '1', unit: 'd' },
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

/** The body of `create`, without the action name. Title and text trimmed, as before. */
export function createBody(d: GiveawayDraft) {
  return {
    channelId: d.channelId, title: d.title.trim(), description: d.description.trim(), duration: durationText(d.duration),
    winnerMode: d.winnerMode,
    ...prizePayload(d.prizes, d.prizeMode, Number(d.winnersCount)),
    ...couponAndConditions(d),
  }
}

/** The body of `edit`, without action and id. Title and text go as typed, as before. */
export function editBody(d: GiveawayDraft) {
  return {
    title: d.title, description: d.description, winnerMode: d.winnerMode,
    ...prizePayload(d.prizes, d.prizeMode, Number(d.winnersCount)),
    ...couponAndConditions(d),
  }
}

export type DraftField =
  | 'channel' | 'title' | 'description' | 'prizes' | 'winners' | 'duration' | 'drawMode'
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
 */
export function validateDraft(d: GiveawayDraft, mode: 'create' | 'edit' | 'template'): Partial<Record<DraftField, true>> {
  const errors: Partial<Record<DraftField, true>> = {}
  if (mode === 'create' && !d.channelId) errors.channel = true
  if (!d.title.trim()) errors.title = true
  if (!d.description.trim()) errors.description = true
  const individual = d.prizeMode === 'INDIVIDUAL' && splitPrizes(d.prizes).length > 0
  if (!individual && !inRange(d.winnersCount, 1, 100)) errors.winners = true
  if (mode !== 'edit' && !durationValid(d.duration)) errors.duration = true
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
