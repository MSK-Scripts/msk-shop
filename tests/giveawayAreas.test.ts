import { createElement, isValidElement, type ComponentProps, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The areas of the giveaway dashboard after Phase 9 of the redesign,
 * rendered on the server with fixture data. The live dashboard needs the
 * giveaway bot, which a test run does not have.
 *
 * What is checked is what can go wrong without a type error:
 *   - the store stays the owner's: the area, the Tebex prompt in the form
 *     and the hint on the overview;
 *   - every action the bot cannot undo asks first, and only the
 *     confirmation sends the request, with the body the route passes on;
 *   - each state offers only what the bot accepts in it, as the old cards did;
 *   - dates and numbers come out in the format of the page language.
 *
 * There is no DOM here. Buttons are recorded while the tree renders and
 * their handlers called afterwards: what a click would run. A state update
 * on a server-rendered component is dropped, so a handler that only opens a
 * dialog does nothing observable, and one that sends reaches the stub.
 */

const registry = vi.hoisted(() => ({
  buttons: [] as Array<{ text: string; onClick?: () => unknown; disabled?: boolean }>,
  dialogs: [] as Array<{ title: unknown; confirmLabel: string; onConfirm: (typed: string) => unknown; open: boolean }>,
}))

/** Every string inside a node, the text a button shows. */
function textOf(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: unknown }).children)
  return ''
}

vi.mock('@/components/ui/Button', async () => {
  const React = await import('react')
  const Button = React.forwardRef<HTMLButtonElement, Record<string, unknown>>(function Button(
    { asChild, variant: _variant, size: _size, children, ...props }, ref,
  ) {
    if (asChild) return children as React.ReactElement
    registry.buttons.push({
      text: textOf(children).trim(),
      onClick: props.onClick as (() => unknown) | undefined,
      disabled: props.disabled as boolean | undefined,
    })
    return React.createElement('button', { ...props, ref }, children as ReactNode)
  })
  return { Button }
})

vi.mock('@/components/dashboard/ConfirmDialog', () => ({
  ConfirmDialog: (props: (typeof registry.dialogs)[number]) => { registry.dialogs.push(props); return null },
}))

vi.mock('next/navigation', async importOriginal => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: () => {}, refresh: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => null,
}))

import { LangProvider } from '@/components/i18n/LangProvider'
import { GiveawayDetail, NewGiveawayPage } from '@/app/[lang]/dashboard/giveaway-bot/GiveawayDetail'
import { GiveawayDataContext, type GiveawayData } from '@/app/[lang]/dashboard/giveaway-bot/GiveawayProvider'
import { GiveawaySection } from '@/app/[lang]/dashboard/giveaway-bot/GiveawaySection'
import { giveawayColumns } from '@/app/[lang]/dashboard/giveaway-bot/GiveawaysArea'
import type { Giveaway, Settings, TebexStatus, Template } from '@/app/[lang]/dashboard/giveaway-bot/giveawayModel'
import { TemplateEditor } from '@/app/[lang]/dashboard/giveaway-bot/TemplatesArea'
import { giveawayDashboardTranslations, type Lang } from '@/lib/i18n'

const LANGS: Lang[] = ['en', 'de']
const NOW = Date.parse('2026-10-28T12:00:00.000Z')

function gw(id: string, status: Giveaway['status'], extra: Partial<Giveaway> = {}): Giveaway {
  return {
    id, channelId: '800000000000000102', title: `Giveaway ${id}`, description: 'Join', prizes: ['Nitro'], prizeMode: 'ALL',
    winnerMode: 'RANDOM', winnersCount: 1, status, endAt: '2026-10-28T18:58:00.000Z', createdAt: '2026-10-26T12:00:00.000Z',
    endedAt: null, entryCount: 1234, couponPercent: null, couponPackages: [], couponValidDays: null,
    blacklistRoles: null, whitelistRoles: null, bonusRoles: null, winnerIds: [], winners: [], ...extra,
  }
}

const GIVEAWAYS: Giveaway[] = [
  gw('ACTIVE', 'ACTIVE', { couponPercent: 20 }),
  gw('PAUSED', 'PAUSED'),
  gw('ENDED', 'ENDED', {
    endedAt: '2026-10-27T10:00:00.000Z', winnerIds: ['700000000000000001', '700000000000000002'],
    winners: [{ userId: '700000000000000001', prizeIndex: null }, { userId: '700000000000000002', prizeIndex: null }],
    resultUrl: 'https://www.msk-scripts.de/en/discord/giveaway-bot/g/abc',
  }),
  gw('CANCELLED', 'CANCELLED', { endedAt: '2026-10-20T10:00:00.000Z' }),
]

const SETTINGS: Settings = {
  lang: 'en', embedColor: '#27762e', buttonEmoji: '🎉', buttonStyle: 'PRIMARY', minAccountDays: 0, minMemberDays: 0,
  reminderMinutes: 0, managerRole: null, notifyRole: null, logChannel: null, claimMessage: null,
  blacklist: [], whitelist: [], bonusRoles: {},
}

const TEMPLATES: Template[] = [{
  id: 7, name: 'weekly', title: 'Weekly', description: 'Join', duration: '1d', winnersCount: 1, prizes: [],
  prizeMode: 'ALL', winnerMode: 'RANDOM', blacklistRoles: null, whitelistRoles: null, bonusRoles: null,
}]

const STORE: TebexStatus = { configured: true, hint: '18d6', setAt: '2026-08-15T10:00:00.000Z', publicToken: null, storeUrl: null, encryptionReady: true }

function data(extra: Partial<GiveawayData> = {}): GiveawayData {
  return {
    owner: true, loading: false, error: null, giveaways: GIVEAWAYS, templates: TEMPLATES, settings: SETTINGS,
    setSettings: () => {}, roles: [{ id: '1', name: 'Member', color: '#000000' }],
    channels: [{ id: '800000000000000101', name: 'rules' }, { id: '800000000000000102', name: 'giveaways' }],
    tebex: STORE, setTebex: () => {}, packages: [], loadedAt: NOW, loadAll: async () => {},
    reloadGiveaways: async () => {}, reloadTemplates: async () => {}, flash: null, setFlash: () => {},
    ...extra,
  }
}

function render(lang: Lang, node: ReactNode, value: GiveawayData = data()): string {
  registry.buttons = []
  registry.dialogs = []
  return renderToStaticMarkup(
    createElement(LangProvider, { lang, path: '/dashboard/giveaway-bot' } as ComponentProps<typeof LangProvider>,
      createElement(GiveawayDataContext.Provider, { value }, node)),
  )
}

const buttons = (text: string) => registry.buttons.filter(b => b.text === text)

function dialog(confirmLabel: string, title: string) {
  const found = registry.dialogs.filter(d => d.confirmLabel === confirmLabel && d.title === title)
  expect(found, `dialog "${confirmLabel}" / ${title}`).toHaveLength(1)
  return found[0]
}

let calls: Array<{ url: string; method: string; body: unknown }>

beforeEach(() => {
  calls = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined })
    return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } })
  }))
})

afterEach(() => { vi.unstubAllGlobals() })

const post = (body: Record<string, unknown>) => ({ url: '/api/giveaway/action', method: 'POST', body })
const t = giveawayDashboardTranslations.en

// ── The store is the owner's ─────────────────────────────────────────────────

describe('the Tebex store is the owner\'s', () => {
  it('renders the store area for the owner and nothing for a manager', () => {
    const owner = render('en', createElement(GiveawaySection, { section: 'store' }))
    expect(owner).toContain(t.store_title)
    expect(owner).toContain('18d6')

    // Even with a store status at hand, as a tampered client could have one,
    // a manager gets no part of the area, not even its error state.
    const manager = render('en', createElement(GiveawaySection, { section: 'store' }), data({ owner: false }))
    expect(manager).toBe('')
    expect(registry.buttons.map(b => b.text)).not.toContain(t.store_reveal)
  })

  it('asks the owner to connect Tebex in the form, and only tells a manager who can', () => {
    const owner = render('en', createElement(NewGiveawayPage, {}), data({ tebex: { ...STORE, configured: false } }))
    expect(owner).toContain(t.c_needs_store)
    expect(owner).toContain('href="/en/dashboard/giveaway-bot/store"')

    const manager = render('en', createElement(NewGiveawayPage, {}), data({ owner: false, tebex: null }))
    expect(manager).toContain(t.c_owner_only)
    expect(manager).not.toContain('href="/en/dashboard/giveaway-bot/store"')
    expect(manager).not.toContain(t.c_percent_hint)

    const ready = render('en', createElement(NewGiveawayPage, {}))
    expect(ready).toContain(t.c_percent_hint)
  })

  it('warns about coupons without a key on the overview, for the owner only', () => {
    const noKey = { ...STORE, configured: false }
    expect(render('en', createElement(GiveawaySection, { section: 'overview' }), data({ tebex: noKey }))).toContain(t.att_coupon_no_store)
    expect(render('en', createElement(GiveawaySection, { section: 'overview' }), data({ owner: false, tebex: noKey }))).not.toContain(t.att_coupon_no_store)
  })
})

// ── Destructive actions ──────────────────────────────────────────────────────

describe('what the bot cannot undo asks first', () => {
  const active = GIVEAWAYS[0]
  const ended = GIVEAWAYS[2]

  it('ends a running giveaway only from the confirmation', async () => {
    render('en', createElement(GiveawaySection, { section: 'giveaways' }))
    const trigger = buttons(t.act_end)
    expect(trigger).toHaveLength(1)
    await trigger[0].onClick?.()
    expect(calls).toEqual([])

    dialog(t.act_end, `End "${active.title}" now?`).onConfirm('')
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'end', id: 'ACTIVE' })]))
  })

  it('cancels a running giveaway only from the confirmation', async () => {
    render('en', createElement(GiveawaySection, { section: 'giveaways' }))
    await buttons(t.act_cancel)[0].onClick?.()
    expect(calls).toEqual([])

    dialog(t.act_cancel, `Cancel "${active.title}"?`).onConfirm('')
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'cancel', id: 'ACTIVE' })]))
  })

  it('draws all winners again only from the confirmation', async () => {
    render('en', createElement(GiveawaySection, { section: 'giveaways' }))
    await buttons(t.act_reroll_all)[0].onClick?.()
    expect(calls).toEqual([])

    dialog(t.act_reroll_all, `Draw new winners for "${ended.title}"?`).onConfirm('')
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'reroll', id: 'ENDED' })]))
  })

  it('replaces one winner only from its dialog, chosen among the winners', async () => {
    const markup = render('en', createElement(GiveawaySection, { section: 'giveaways' }))
    await buttons(t.act_reroll_one)[0].onClick?.()
    expect(calls).toEqual([])
    // The winner is picked from the list, not typed.
    expect(markup).toContain('<option value="700000000000000002">@700000000000000002</option>')

    await buttons(t.dlg_reroll_one_confirm)[0].onClick?.()
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'reroll', id: 'ENDED', winnerId: '700000000000000001' })]))
  })

  it('deletes a template only from the confirmation', async () => {
    render('en', createElement(GiveawaySection, { section: 'templates' }))
    await buttons(t.tpl_delete)[0].onClick?.()
    expect(calls).toEqual([])

    dialog(t.tpl_delete, 'Delete the template "weekly"?').onConfirm('')
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'templateDelete', id: 7 })]))
  })

  it('removes the Tebex key only from the confirmation', async () => {
    render('en', createElement(GiveawaySection, { section: 'store' }))
    await buttons(t.store_clear)[0].onClick?.()
    expect(calls).toEqual([])

    dialog(t.store_clear, t.cf_store_clear_title).onConfirm('')
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'tebexClear' })]))
  })

  it('pauses and resumes without asking, as before: both are undone in one click', async () => {
    render('en', createElement(GiveawaySection, { section: 'giveaways' }))
    await buttons(t.act_pause)[0].onClick?.()
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'pause', id: 'ACTIVE' })]))
    calls = []
    await buttons(t.act_resume)[0].onClick?.()
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'resume', id: 'PAUSED' })]))
  })

  it('extends and saves as a template from their dialogs, with the old bodies', async () => {
    render('en', createElement(GiveawaySection, { section: 'giveaways' }))
    await buttons(t.dlg_extend_confirm)[0].onClick?.()
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'extend', id: 'ACTIVE', duration: '1h' })]))
    calls = []
    // One template dialog per row; the first is the running giveaway's, named after its title.
    await buttons(t.dlg_template_confirm)[0].onClick?.()
    await vi.waitFor(() => expect(calls).toEqual([post({ action: 'templateFrom', id: 'ACTIVE', name: 'Giveaway ACTIVE' })]))
  })
})

// ── What each state offers ───────────────────────────────────────────────────

describe('each state offers what the bot accepts in it', () => {
  function offered(g: Giveaway): string[] {
    render('en', createElement(GiveawayDetail, { id: g.id }), data({ giveaways: [g] }))
    return registry.buttons.map(b => b.text)
  }

  it('a running giveaway can be ended, cancelled, paused and extended, not resumed or drawn again', () => {
    const list = offered(GIVEAWAYS[0])
    expect(list).toEqual(expect.arrayContaining([t.act_end, t.act_cancel, t.act_pause, t.act_extend]))
    expect(list).not.toContain(t.act_resume)
    expect(list).not.toContain(t.act_reroll_all)
  })

  it('a paused one can be resumed, not ended or cancelled', () => {
    const list = offered(GIVEAWAYS[1])
    expect(list).toContain(t.act_resume)
    expect(list).not.toContain(t.act_end)
    expect(list).not.toContain(t.act_cancel)
  })

  it('an ended one can be drawn again, a cancelled one only saved as a template', () => {
    expect(offered(GIVEAWAYS[2])).toEqual(expect.arrayContaining([t.act_reroll_all, t.act_reroll_one, t.act_template]))
    const cancelled = offered(GIVEAWAYS[3])
    expect(cancelled).toContain(t.act_template)
    for (const action of [t.act_end, t.act_cancel, t.act_pause, t.act_resume, t.act_reroll_all, t.act_reroll_one]) {
      expect(cancelled).not.toContain(action)
    }
  })

  it('offers the edit form only while a giveaway is open', () => {
    expect(render('en', createElement(GiveawayDetail, { id: 'ACTIVE' }))).toContain(t.btn_save_changes)
    expect(render('en', createElement(GiveawayDetail, { id: 'ENDED' }))).not.toContain(t.btn_save_changes)
  })

  it('starts a new giveaway with no channel chosen', () => {
    const markup = render('en', createElement(NewGiveawayPage, {}))
    expect(markup).toContain(`<option value="" selected="">${t.f_channel_choose}</option>`)
    expect(markup).not.toMatch(/<option value="800000000000000101" selected/)
  })

  it('starts from the template named in the address', () => {
    const markup = render('en', createElement(NewGiveawayPage, { template: '7' }))
    expect(markup).toContain('<option value="7" selected="">weekly · Weekly</option>')
    expect(markup).toContain('value="Weekly"')
  })
})

// ── Formats per language ─────────────────────────────────────────────────────

describe('dates and numbers in the format of the page language', () => {
  const cells = (lang: Lang, g: Giveaway) =>
    giveawayColumns(lang).map(col => renderToStaticMarkup(
      createElement(LangProvider, { lang, path: '/dashboard/giveaway-bot/giveaways' } as ComponentProps<typeof LangProvider>,
        createElement(GiveawayDataContext.Provider, { value: data() }, createElement('div', null, col.cell(g)))),
    )).join('|')

  it.each([
    ['de', /28\.10\.2026, 19:58/, '1.234', /20\s%/],
    ['en', /Oct 28, 2026, 7:58\sPM/, '1,234', /20%/],
  ] as const)('a giveaway row in %s', (lang, end, entries, percent) => {
    const row = cells(lang, GIVEAWAYS[0])
    expect(row).toMatch(end)
    expect(row).toContain(entries)
    expect(row).toMatch(percent)
    expect(row).toContain('dateTime="2026-10-28T18:58:00.000Z"')
    expect(row).not.toContain('Invalid Date')
  })

  it.each([['de', 'in 7 Stunden'], ['en', 'in 7 hours']] as const)('the next end on the overview in %s', (lang, rel) => {
    expect(render(lang, createElement(GiveawaySection, { section: 'overview' }))).toContain(rel)
  })
})

// ── Every area renders ───────────────────────────────────────────────────────

describe('each area renders in both languages', () => {
  it.each(LANGS)('overview, list, forms, settings and store in %s', lang => {
    const tr = giveawayDashboardTranslations[lang]
    const pages: Array<[ReactNode, string]> = [
      [createElement(GiveawaySection, { section: 'overview' }), tr.ov_now_title],
      [createElement(GiveawaySection, { section: 'giveaways' }), 'Giveaway ACTIVE'],
      [createElement(GiveawaySection, { section: 'templates' }), 'weekly'],
      [createElement(GiveawaySection, { section: 'settings' }), tr.s_sec_roles],
      [createElement(GiveawaySection, { section: 'store' }), tr.store_public_title],
      [createElement(NewGiveawayPage, {}), tr.btn_start],
      [createElement(GiveawayDetail, { id: 'ENDED' }), tr.dt_winners],
      [createElement(TemplateEditor, { id: '7' }), tr.tpl_save],
      [createElement(TemplateEditor, {}), tr.tpl_new],
    ]
    for (const [node, expected] of pages) {
      const markup = render(lang, node)
      expect(markup).toContain(expected)
      expect(markup).not.toContain('undefined')
      expect(markup).not.toContain('Invalid Date')
    }
  })

  it('says so when a giveaway or template of the address is not among the server\'s', () => {
    expect(render('en', createElement(GiveawayDetail, { id: 'NOPE' }))).toContain(t.detail_missing_title)
    expect(render('en', createElement(TemplateEditor, { id: '99' }))).toContain(t.tpl_missing_title)
  })
})
