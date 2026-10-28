import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  changeGiveaway, clearTebexSecret, createGiveaway, deleteGiveaway, deleteTemplate, editGiveaway, extendGiveaway,
  fetchData, fetchGiveaway, fetchHistory, loadDashboard, loadExtras, previewGiveaway, rerollGiveaway,
  revealTebexSecret, saveGiveawayAsTemplate, saveSettings, saveTebexSecret, saveTebexStore, saveTemplate,
  type DataKind,
} from '@/app/[lang]/dashboard/giveaway-bot/giveawayApi'
import {
  applyTemplate, createBody, draftOf, durationInput, durationText, editBody, fieldOfError, isoToLocalInput,
  listKnowsSchedule, localInputToIso, newDraft, previewBody, templateBody, templateDraft, validateDraft,
  type Giveaway, type GiveawayDraft, type Settings, type Template,
} from '@/app/[lang]/dashboard/giveaway-bot/giveawayModel'

/**
 * The requests of the giveaway dashboard, byte for byte.
 *
 * Phase 9 of the redesign split the old 1,668-line client file into one
 * module per area and moved every request into giveawayApi.ts. The two API
 * routes behind them did not change and pass the body on to the bot, so they
 * must keep receiving exactly what the old components sent: a renamed key
 * reaches the bot as missing and is refused there, or worse, ignored.
 *
 * The expected values below are written out from the old components (create
 * form, EditButton, TemplateForm, SettingsTab, StoreTab), not derived from
 * the modules under test.
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' }
let calls: Array<{ url: string; init: RequestInit | undefined }>

beforeEach(() => {
  calls = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
  }))
})

afterEach(() => { vi.unstubAllGlobals() })

/** The one request a call sent, with its body parsed. */
function sent() {
  expect(calls).toHaveLength(1)
  const { url, init } = calls[0]
  return {
    url,
    method: init?.method ?? 'GET',
    headers: init?.headers,
    body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body,
  }
}

const action = (body: Record<string, unknown>) => ({ url: '/api/giveaway/action', method: 'POST', headers: JSON_HEADERS, body })

const SETTINGS: Settings = {
  lang: 'de', embedColor: '#27762e', buttonEmoji: '🎉', buttonStyle: 'SUCCESS',
  minAccountDays: 30, minMemberDays: 1, reminderMinutes: 0,
  managerRole: '', notifyRole: '222', logChannel: null, claimMessage: '',
  blacklist: ['111'], whitelist: [], bonusRoles: { '333': 150, '444': 2.4 },
}

function draft(extra: Partial<GiveawayDraft> = {}): GiveawayDraft {
  return {
    ...newDraft(SETTINGS),
    channelId: '900000000000000001', title: '  Weekend  ', description: ' Join now ',
    prizes: 'Steam card\nNitro', prizeMode: 'INDIVIDUAL', winnerMode: 'FIRST_CLICK', winnersCount: '5',
    duration: { amount: '2', unit: 'h' },
    couponPercent: '20', couponValidDays: '', couponPackages: [7], couponPackagesPerPrize: [[8], [9], [10]],
    manualCode: ' CODE ', manualPerPrize: ['A ', ' B', 'C'], manualNote: ' redeem at shop ',
    ...extra,
  }
}

describe('reading', () => {
  it('asks the data route for one kind, never cached', async () => {
    await fetchData('templates')
    expect(sent()).toEqual({ url: '/api/giveaway/data?kind=templates', method: 'GET', headers: undefined, body: undefined })
    expect(calls[0].init?.cache).toBe('no-store')
  })

  it('loads the Tebex status only for the owner, and packages only with a public token', async () => {
    const asked: DataKind[] = []
    const get = (tebex: Record<string, unknown> | null) => async (kind: DataKind) => {
      asked.push(kind)
      if (kind === 'tebex') return tebex ? { tebex } : null
      if (kind === 'tebexPackages') return { packages: [{ id: 1, name: 'P', price: 1 }] }
      return {}
    }

    await loadDashboard(get({ configured: true, publicToken: 'tok' }), false)
    expect(asked.sort()).toEqual(['channels', 'giveaways', 'roles', 'settings', 'templates'])

    asked.length = 0
    const owner = await loadDashboard(get({ configured: true, publicToken: 'tok' }), true)
    expect(asked).toContain('tebex')
    expect(asked).toContain('tebexPackages')
    expect(owner.packages).toEqual([{ id: 1, name: 'P', price: 1 }])

    asked.length = 0
    await loadDashboard(get({ configured: true, publicToken: null }), true)
    expect(asked).toContain('tebex')
    expect(asked).not.toContain('tebexPackages')
  })
})

describe('giveaway requests', () => {
  it('creates with the trimmed title and text, prizes, coupon and conditions', async () => {
    await createGiveaway(createBody(draft()))
    expect(sent()).toEqual(action({
      action: 'create',
      channelId: '900000000000000001', title: 'Weekend', description: 'Join now', duration: '2h',
      winnerMode: 'FIRST_CLICK',
      prizes: ['Steam card', 'Nitro'], prizeMode: 'INDIVIDUAL', winnersCount: 2,
      couponPercent: 20, couponValidDays: null, couponPackages: [7],
      couponPackagesPerPrize: [[8], [9]],
      couponManualCode: 'CODE', couponManualCodesPerPrize: ['A', 'B'], couponManualNote: 'redeem at shop',
      blacklistRoles: ['111'], whitelistRoles: [], bonusRoles: { '333': 100, '444': 2 },
    }))
  })

  it('creates without prizes: the mode falls back to ALL and the number of winners stays', async () => {
    await createGiveaway(createBody(draft({ prizes: '', winnersCount: '5', duration: { amount: '1', unit: 'd' } })))
    expect(sent().body).toMatchObject({ prizes: [], prizeMode: 'ALL', winnersCount: 5, duration: '1d', couponPackagesPerPrize: [] })
  })

  it('edits with title and text as typed, without channel and duration', async () => {
    await editGiveaway('ABC123', editBody(draft({ prizeMode: 'ALL', couponPercent: '', couponValidDays: '30' })))
    expect(sent()).toEqual(action({
      action: 'edit', id: 'ABC123',
      title: '  Weekend  ', description: ' Join now ', winnerMode: 'FIRST_CLICK',
      prizes: ['Steam card', 'Nitro'], prizeMode: 'ALL', winnersCount: 5,
      couponPercent: null, couponValidDays: 30, couponPackages: [7],
      couponPackagesPerPrize: [[8], [9]],
      couponManualCode: 'CODE', couponManualCodesPerPrize: ['A', 'B'], couponManualNote: 'redeem at shop',
      blacklistRoles: ['111'], whitelistRoles: [], bonusRoles: { '333': 100, '444': 2 },
    }))
  })

  it.each(['pause', 'resume', 'end', 'cancel'] as const)('%s sends the id only', async which => {
    await changeGiveaway(which, 'ABC123')
    expect(sent()).toEqual(action({ action: which, id: 'ABC123' }))
  })

  it('extends by the duration string', async () => {
    await extendGiveaway('ABC123', '1h')
    expect(sent()).toEqual(action({ action: 'extend', id: 'ABC123', duration: '1h' }))
  })

  it('rerolls all, or one winner by id', async () => {
    await rerollGiveaway('ABC123')
    expect(sent()).toEqual(action({ action: 'reroll', id: 'ABC123' }))
    calls = []
    await rerollGiveaway('ABC123', '700000000000000001')
    expect(sent()).toEqual(action({ action: 'reroll', id: 'ABC123', winnerId: '700000000000000001' }))
  })

  it('saves a giveaway as a template by id and name, the title when the name is empty', async () => {
    await saveGiveawayAsTemplate('ABC123', '  weekly ', 'Weekend')
    expect(sent()).toEqual(action({ action: 'templateFrom', id: 'ABC123', name: 'weekly' }))
    calls = []
    await saveGiveawayAsTemplate('ABC123', '   ', 'Weekend')
    expect(sent().body).toEqual({ action: 'templateFrom', id: 'ABC123', name: 'Weekend' })
  })
})

describe('template requests', () => {
  const tpl: Template = {
    id: 4, name: 'weekly', title: 'Weekend', description: 'Join', duration: '23h59m', winnersCount: 2,
    prizes: ['A', 'B'], prizeMode: 'INDIVIDUAL', winnerMode: 'RANDOM', blacklistRoles: ['111'], whitelistRoles: null, bonusRoles: null,
  }

  it('saves a new one with conditions switched off as nulls', async () => {
    const d = { ...newDraft(SETTINGS), title: ' T ', description: ' D ', prizes: 'A', duration: { amount: '3', unit: 'd' as const } }
    await saveTemplate(templateBody(' weekly ', d, false))
    expect(sent()).toEqual(action({
      action: 'templateSave', name: 'weekly', title: 'T', description: 'D', duration: '3d', winnerMode: 'RANDOM',
      prizes: ['A'], prizeMode: 'ALL', winnersCount: 1,
      blacklistRoles: null, whitelistRoles: null, bonusRoles: null,
    }))
  })

  it('saves a change with its id, its own conditions and its untouched duration', async () => {
    const { name, own, draft: d } = templateDraft(tpl, SETTINGS)
    expect(own).toBe(true)
    await saveTemplate(templateBody(name, d, own), tpl.id)
    expect(sent()).toEqual(action({
      action: 'templateSave', id: 4, name: 'weekly', title: 'Weekend', description: 'Join', duration: '23h59m', winnerMode: 'RANDOM',
      prizes: ['A', 'B'], prizeMode: 'INDIVIDUAL', winnersCount: 2,
      // The template excluded a role of its own; the rest it inherits shows the server's.
      blacklistRoles: ['111'], whitelistRoles: [], bonusRoles: { '333': 100, '444': 2 },
    }))
  })

  it('deletes by id', async () => {
    await deleteTemplate(4)
    expect(sent()).toEqual(action({ action: 'templateDelete', id: 4 }))
  })
})

describe('settings and store requests', () => {
  it('saves the settings as the old form did', async () => {
    await saveSettings({ ...SETTINGS, minAccountDays: Number('') })
    expect(sent()).toEqual(action({
      action: 'settings',
      lang: 'de', embedColor: '#27762e', buttonEmoji: '🎉', buttonStyle: 'SUCCESS',
      minAccountDays: 0, minMemberDays: 1, reminderMinutes: 0,
      managerRole: null, notifyRole: '222', logChannel: null,
      claimMessage: null, blacklist: ['111'], whitelist: [],
      bonusRoles: { '333': 100, '444': 2 },
    }))
  })

  it('sends the plugin secret trimmed, and nothing else with reveal and clear', async () => {
    await saveTebexSecret('  secret-value  ')
    expect(sent()).toEqual(action({ action: 'tebexSecret', secret: 'secret-value' }))
    calls = []
    await revealTebexSecret()
    expect(sent()).toEqual(action({ action: 'tebexReveal' }))
    calls = []
    await clearTebexSecret()
    expect(sent()).toEqual(action({ action: 'tebexClear' }))
  })

  it('saves token and address trimmed', async () => {
    await saveTebexStore(' tok ', ' https://shop.example ')
    expect(sent()).toEqual(action({ action: 'tebexStore', publicToken: 'tok', storeUrl: 'https://shop.example' }))
  })

  it('never puts a guild or user id into a body', async () => {
    await createGiveaway(createBody(draft()))
    await saveSettings(SETTINGS)
    await saveTebexSecret('x'.repeat(30))
    for (const c of calls) {
      const body = JSON.parse(String(c.init?.body))
      expect(body).not.toHaveProperty('guildId')
      expect(body).not.toHaveProperty('userId')
    }
  })
})

describe('form rules', () => {
  it('reads a stored duration as number and unit, and sends it back unchanged when untouched', () => {
    expect(durationInput('1d')).toMatchObject({ amount: '1', unit: 'd' })
    expect(durationInput('2h')).toMatchObject({ amount: '2', unit: 'h' })
    expect(durationInput('23h59m')).toMatchObject({ amount: '1439', unit: 'm' })
    expect(durationText(durationInput('23h59m'))).toBe('23h59m')
    expect(durationText({ ...durationInput('23h59m'), amount: '30' })).toBe('30m')
  })

  it('stops a form with a missing channel, title, text or a bad number before any request', () => {
    expect(validateDraft(draft(), 'create')).toEqual({})
    expect(Object.keys(validateDraft(draft({ channelId: '', title: ' ', description: '' }), 'create')).sort())
      .toEqual(['channel', 'description', 'title'])
    expect(validateDraft(draft({ prizeMode: 'ALL', winnersCount: '0' }), 'create')).toHaveProperty('winners')
    expect(validateDraft(draft({ prizeMode: 'ALL', winnersCount: '101' }), 'create')).toHaveProperty('winners')
    expect(validateDraft(draft({ couponPercent: '0' }), 'create')).toHaveProperty('couponPercent')
    expect(validateDraft(draft({ couponValidDays: '3651' }), 'create')).toHaveProperty('couponValidDays')
    expect(validateDraft(draft({ duration: { amount: '366', unit: 'd' } }), 'create')).toHaveProperty('duration')
    expect(validateDraft(draft({ duration: { amount: '1.5', unit: 'h' } }), 'create')).toHaveProperty('duration')
    // Editing has neither channel nor duration.
    expect(validateDraft(draft({ channelId: '', duration: { amount: '', unit: 'd' } }), 'edit')).toEqual({})
  })

  it('starts a new giveaway without a channel and with the server conditions', () => {
    const d = newDraft(SETTINGS)
    expect(d.channelId).toBe('')
    expect(d.blacklist).toEqual(['111'])
    expect(d.bonus).toEqual(SETTINGS.bonusRoles)
  })

  it('fills from a template but keeps coupons and channel', () => {
    const start = draft()
    const tpl: Template = {
      id: 1, name: 'n', title: 'From template', description: 'x', duration: '3d', winnersCount: 4,
      prizes: [], prizeMode: 'ALL', winnerMode: 'RANDOM', blacklistRoles: null, whitelistRoles: ['555'], bonusRoles: null,
    }
    const d = applyTemplate(start, tpl, SETTINGS)
    expect(d).toMatchObject({ channelId: start.channelId, couponPercent: '20', title: 'From template', winnersCount: '4', whitelist: ['555'], blacklist: ['111'] })
    expect(durationText(d.duration)).toBe('3d')
  })

  it('shows an inheriting giveaway with the server conditions', () => {
    const g = { id: 'A', channelId: 'c', title: 't', description: 'd', prizes: [], prizeMode: 'ALL', winnerMode: 'RANDOM',
      winnersCount: 1, status: 'ACTIVE', endAt: null, createdAt: null, endedAt: null, entryCount: 0,
      couponPercent: null, couponPackages: [], couponValidDays: null, blacklistRoles: null, whitelistRoles: [], bonusRoles: null } as Giveaway
    const d = draftOf(g, SETTINGS)
    expect(d.blacklist).toEqual(['111'])
    expect(d.whitelist).toEqual([])
  })
})

// ── The scheduling release of the bot (discord_giveawaybot#20) ──────────────

describe('requests of the scheduling release', () => {
  it('asks for one giveaway, the history and the guild through the data route', async () => {
    await fetchGiveaway('AB12CD')
    expect(sent().url).toBe('/api/giveaway/data?kind=giveaway&id=AB12CD')
    calls = []
    await fetchHistory(90)
    expect(sent().url).toBe('/api/giveaway/data?kind=history&days=90')
  })

  it('deletes by id only, and previews with the create body and nothing else', async () => {
    await deleteGiveaway('AB12CD')
    expect(sent()).toEqual(action({ action: 'delete', id: 'AB12CD' }))
    calls = []
    const ctrl = new AbortController()
    await previewGiveaway({ title: 'T', description: 'D', duration: '1d' }, ctrl.signal)
    expect(sent()).toEqual(action({ action: 'preview', title: 'T', description: 'D', duration: '1d' }))
    expect(calls[0].init?.signal).toBe(ctrl.signal)
  })

  it('creates with a start in the browser\'s zone, sent with its offset', async () => {
    await createGiveaway(createBody(draft({ startAt: '2026-11-01T19:00' })))
    const { startAt } = sent().body as { startAt: string }
    expect(startAt).toMatch(/^2026-11-01T19:00:00[+-]\d{2}:\d{2}$/)
    expect(Date.parse(startAt)).toBe(new Date(2026, 10, 1, 19, 0).getTime())
  })

  it('sends no start at all when none is set, so an older bot gets the body it knows', () => {
    expect(createBody(draft())).not.toHaveProperty('startAt')
    expect(createBody(draft({ startAt: '   ' }))).not.toHaveProperty('startAt')
  })

  it('reads impossible dates as none', () => {
    expect(localInputToIso('2026-02-30T10:00')).toBeNull()
    expect(localInputToIso('2026-11-31T10:00')).toBeNull()
    expect(localInputToIso('tomorrow')).toBeNull()
    expect(localInputToIso('2026-11-01T19:00:30')).toMatch(/^2026-11-01T19:00:00/)
  })

  it('edits a scheduled giveaway with start and duration only when they changed', async () => {
    const g = {
      id: 'S1', channelId: 'c', title: 't', description: 'd', prizes: [], prizeMode: 'ALL', winnerMode: 'RANDOM',
      winnersCount: 1, status: 'SCHEDULED', startAt: '2026-11-01T18:00:00.000Z', endAt: '2026-11-03T18:00:00.000Z',
      createdAt: null, endedAt: null, entryCount: 0, couponPercent: null, couponPackages: [], couponValidDays: null,
      blacklistRoles: null, whitelistRoles: null, bonusRoles: null,
    } as Giveaway
    const from = draftOf(g, SETTINGS)
    expect(durationText(from.duration)).toBe('172800s')
    expect(from.duration).toMatchObject({ amount: '2', unit: 'd' })

    expect(editBody(from, from)).not.toHaveProperty('startAt')
    expect(editBody(from, from)).not.toHaveProperty('duration')

    const moved = editBody({ ...from, startAt: '2026-11-05T20:30' }, from)
    expect(Date.parse((moved as unknown as { startAt: string }).startAt)).toBe(new Date(2026, 10, 5, 20, 30).getTime())
    expect(moved).not.toHaveProperty('duration')

    const longer = editBody({ ...from, duration: { ...from.duration, amount: '3' } }, from)
    expect(longer).toMatchObject({ duration: '3d' })
    expect(longer).not.toHaveProperty('startAt')
  })

  it('stops a start in the past, beyond a year or without a date before any request', () => {
    const now = Date.parse('2026-10-28T12:00:00.000Z')
    const at = (ms: number) => isoToLocalInput(new Date(ms).toISOString())
    expect(validateDraft(draft({ startAt: at(now + 3600_000) }), 'create', { now })).toEqual({})
    expect(validateDraft(draft({ startAt: at(now - 3600_000) }), 'create', { now })).toHaveProperty('startAt')
    expect(validateDraft(draft({ startAt: at(now + 366 * 86400_000) }), 'create', { now })).toHaveProperty('startAt')
    expect(validateDraft(draft({ startAt: '2026-02-30T10:00' }), 'create', { now })).toHaveProperty('startAt')

    // A scheduled giveaway needs a start; one nobody touched is not checked
    // again, so a title fix right before the start still goes out.
    const from = draft({ startAt: at(now - 60_000) })
    expect(validateDraft(from, 'edit', { now, scheduledFrom: from })).toEqual({})
    expect(validateDraft({ ...from, startAt: '' }, 'edit', { now, scheduledFrom: from })).toHaveProperty('startAt')
    expect(validateDraft({ ...from, duration: { amount: '0', unit: 'd' } }, 'edit', { now, scheduledFrom: from })).toHaveProperty('duration')
  })

  it('previews without an empty channel, and a posted giveaway with the time it has left', () => {
    const now = Date.parse('2026-10-28T12:00:00.000Z')
    expect(previewBody(draft({ channelId: '' }), undefined, now)).not.toHaveProperty('channelId')
    expect(previewBody(draft(), undefined, now)).toMatchObject({ channelId: '900000000000000001', duration: '2h' })

    const running = previewBody(draft({ startAt: '2026-11-01T19:00' }), { status: 'ACTIVE', endAt: '2026-10-28T13:30:00.000Z' }, now)
    expect(running).toMatchObject({ duration: '5400s' })
    expect(running).not.toHaveProperty('startAt')
  })

  it('maps the refusals of a start to its field', () => {
    for (const code of ['invalid_start', 'start_in_past', 'start_too_far']) expect(fieldOfError(code)).toBe('startAt')
    expect(fieldOfError('not_scheduled')).toBe('form')
  })
})

describe('an older bot without the new routes', () => {
  it('leaves guild and history out when they answer 404', async () => {
    const asked: string[] = []
    const extras = await loadExtras(async (kind, params) => {
      asked.push(params ? `${kind}:${JSON.stringify(params)}` : kind)
      return { error: 'not_found' }
    })
    expect(extras).toEqual({ guild: null, history: null })
    expect(asked.sort()).toEqual(['guild', 'history:{"days":"30"}'])
  })

  it('takes them from a newer bot, and only an icon from Discord\'s CDN', async () => {
    const answer = (icon: string) => loadExtras(async kind => kind === 'guild'
      ? { guild: { id: '111111111111111111', name: 'MSK', iconUrl: icon, memberCount: 12 } }
      : { days: 30, history: [{ date: '2026-10-28', created: 1, ended: 0, entries: 14 }, { date: 'bad' }] })
    const good = await answer('https://cdn.discordapp.com/icons/1/a.png?size=128')
    expect(good.guild).toEqual({ id: '111111111111111111', name: 'MSK', iconUrl: 'https://cdn.discordapp.com/icons/1/a.png?size=128', memberCount: 12 })
    expect(good.history).toEqual({ days: 30, history: [{ date: '2026-10-28', created: 1, ended: 0, entries: 14 }] })
    expect((await answer('https://evil.example/a.png')).guild?.iconUrl).toBeNull()
    expect((await answer('http://cdn.discordapp.com/icons/1/a.png')).guild?.iconUrl).toBeNull()
  })

  it('cannot schedule until a giveaway carries the key the newer bot always sends', () => {
    const old = { id: 'A', status: 'ACTIVE' } as Giveaway
    expect(listKnowsSchedule([])).toBe(false)
    expect(listKnowsSchedule([old])).toBe(false)
    expect(listKnowsSchedule([old, { ...old, startAt: null }])).toBe(true)
  })

  it('answers no history for a 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"not_found"}', { status: 404 })))
    expect((await fetchHistory(30)).history).toBeNull()
    expect((await fetchGiveaway('AB12CD')).giveaway).toBeNull()
  })
})
