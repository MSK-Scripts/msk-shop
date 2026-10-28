import { createElement, isValidElement, type ComponentProps, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The four areas of the ticket bot dashboard after Phase 8 of the redesign,
 * rendered on the server with fixture data. The live dashboard needs Discord,
 * Stripe and the database, none of which a test run has.
 *
 * What is checked is what can go wrong without a type error:
 *   - the tier gates the areas draw agree with lib/tiers.ts;
 *   - every destructive action asks first, and only the confirmation sends
 *     the request, with the body the route expects;
 *   - dates and prices come out in the format of the page language.
 *
 * There is no DOM in this test run. The buttons are recorded while the tree
 * renders, and their handlers are called afterwards: what a click would run.
 * React drops a state update on a server-rendered component, so a handler
 * that only opens a dialog does nothing observable, and a handler that sends
 * a request reaches the stubbed `fetch`.
 */

const registry = vi.hoisted(() => ({
  buttons: [] as Array<{ text: string; onClick?: () => unknown; disabled?: boolean }>,
  dialogs: [] as Array<{
    title: unknown
    confirmLabel: string
    onConfirm: (typed: string) => unknown
    typeToConfirm?: { expected: string }
  }>,
  resources: new Map<string, unknown>(),
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

vi.mock('@/lib/useAdminResource', () => ({
  useJsonResource: (url: string) => ({
    data: registry.resources.get(url.split('?')[0]) ?? null,
    error: null,
    reload: async () => {},
  }),
}))

vi.mock('next/navigation', async importOriginal => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: () => {}, refresh: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => null,
}))

import { LangProvider } from '@/components/i18n/LangProvider'
import { BotControl } from '@/app/[lang]/dashboard/ticket-bot/BotControl'
import { DomainsArea } from '@/app/[lang]/dashboard/ticket-bot/DomainsArea'
import { HostingArea } from '@/app/[lang]/dashboard/ticket-bot/HostingArea'
import type { DashboardGuild } from '@/app/[lang]/dashboard/ticket-bot/loadGuilds'
import { OverviewArea } from '@/app/[lang]/dashboard/ticket-bot/OverviewArea'
import { TranscriptsArea, transcriptColumns } from '@/app/[lang]/dashboard/ticket-bot/TranscriptsArea'
import type { TranscriptItem } from '@/app/[lang]/dashboard/ticket-bot/ticketBotApi'
import { formatRetention } from '@/lib/format'
import { dashboardTranslations, type Lang } from '@/lib/i18n'
import { TIER_CONFIG, formatTierPrice, type Tier } from '@/lib/tiers'

const GUILD = '111111111111111111'
const TIERS = Object.keys(TIER_CONFIG) as Tier[]
const LANGS: Lang[] = ['en', 'de']

function guild(extra: Partial<DashboardGuild> = {}): DashboardGuild {
  return {
    guild_id: GUILD, guild_name: 'Atlas Roleplay', tier: 'premium_plus',
    custom_domain: 'tickets.atlas.example', domain_status: 'active', is_hosted: 1,
    stripe_subscription_id: 'sub_1', stripe_status: 'active', expires_at: '2026-11-27T10:00:00.000Z',
    bot_port: 4123, dashboard_host: 'tickets-abc.msk-scripts.de',
    dashboard_domain: 'dash.atlas.example', dashboard_domain_status: 'active',
    access_state: 'ok', access_grace_ends_at: null,
    ...extra,
  }
}

function render(lang: Lang, node: ReactNode): string {
  registry.buttons = []
  registry.dialogs = []
  return renderToStaticMarkup(
    createElement(LangProvider, { lang, path: `/dashboard/ticket-bot/${GUILD}` } as ComponentProps<typeof LangProvider>, node),
  )
}

function button(text: string) {
  const found = registry.buttons.filter(b => b.text === text)
  expect(found, `button "${text}"`).toHaveLength(1)
  return found[0]
}

/** The dialog with this confirm button, and this title where two share a button. */
function dialog(confirmLabel: string, title?: string) {
  const found = registry.dialogs.filter(d => d.confirmLabel === confirmLabel && (title === undefined || d.title === title))
  expect(found, `dialog "${confirmLabel}"`).toHaveLength(1)
  return found[0]
}

let calls: Array<{ url: string; method: string; body: unknown }>

beforeEach(() => {
  calls = []
  registry.resources = new Map()
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    })
    return new Response(JSON.stringify({ status: 'none' }), { status: 200, headers: { 'content-type': 'application/json' } })
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// ── Tier gates ───────────────────────────────────────────────────────────────

describe('tier gates in the areas', () => {
  it.each(TIERS)('the overview leads to hosting exactly where the %s plan includes it', tier => {
    const markup = render('en', createElement(OverviewArea, { guild: guild({ tier, is_hosted: 0 }) }))
    const hostingLink = `href="/en/dashboard/ticket-bot/${GUILD}/hosting"`
    expect(markup.includes(hostingLink)).toBe(TIER_CONFIG[tier].botHosting)
    if (!TIER_CONFIG[tier].botHosting) expect(markup).toContain('Not in this plan')
  })

  it.each(TIERS.flatMap(tier => LANGS.map(lang => [tier, lang] as const)))(
    'the %s plan states its own retention (%s)', (tier, lang) => {
      const period = formatRetention(TIER_CONFIG[tier].storageDays, lang)
      const transcripts = render(lang, createElement(TranscriptsArea, { guildId: GUILD, tier }))
      expect(transcripts).toContain(period)
      const overview = render(lang, createElement(OverviewArea, { guild: guild({ tier }) }))
      expect(overview).toContain(period)
    },
  )

  it.each(TIERS)('the %s plan gets the transcript domain field only if custom domains are included', tier => {
    const markup = render('en', createElement(DomainsArea, { guild: guild({ tier, domain_status: 'none', custom_domain: null }), serverIp: '203.0.113.7' }))
    const t = dashboardTranslations.en
    const saveButtons = registry.buttons.filter(b => b.text === t.domain_btn).length
    const expected = (TIER_CONFIG[tier].customDomain ? 1 : 0) + (TIER_CONFIG[tier].botHosting ? 1 : 0)
    expect(saveButtons).toBe(expected)
    expect(markup.includes(t.dom_upgrade.replace('{price}', formatTierPrice('premium', 'en')))).toBe(!TIER_CONFIG[tier].customDomain)
    expect(markup.includes(t.dashdom_needs_plan)).toBe(!TIER_CONFIG[tier].botHosting)
  })

  it('offers no domain for the bot dashboard while the bot is not hosted', () => {
    const markup = render('en', createElement(DomainsArea, { guild: guild({ tier: 'business', is_hosted: 0, bot_port: null }), serverIp: '203.0.113.7' }))
    expect(markup).toContain(dashboardTranslations.en.dashdom_needs_host)
    expect(registry.buttons.filter(b => b.text === dashboardTranslations.en.domain_btn)).toHaveLength(1)
  })
})

// ── Destructive actions ──────────────────────────────────────────────────────

describe('destructive actions ask first', () => {
  const t = dashboardTranslations.en

  it('removes the transcript domain only from the confirmation', async () => {
    render('en', createElement(DomainsArea, { guild: guild({ is_hosted: 0, bot_port: null }), serverIp: '203.0.113.7' }))
    const triggers = registry.buttons.filter(b => b.text === t.remove_title)
    expect(triggers).toHaveLength(1)
    await triggers[0].onClick?.()
    expect(calls).toEqual([])

    await dialog(t.remove_title, 'Remove tickets.atlas.example?').onConfirm('')
    expect(calls).toEqual([{ url: '/api/domain/remove', method: 'POST', body: { guildId: GUILD } }])
  })

  it('removes the bot dashboard domain only from the confirmation', async () => {
    render('en', createElement(DomainsArea, { guild: guild({ custom_domain: null, domain_status: 'none' }), serverIp: '203.0.113.7' }))
    await button(t.remove_title).onClick?.()
    expect(calls).toEqual([])

    await dialog(t.remove_title, 'Remove dash.atlas.example?').onConfirm('')
    expect(calls).toEqual([{ url: `/api/bot-hosting/domain?guildId=${GUILD}`, method: 'DELETE', body: undefined }])
  })

  it('stops the bot only from the confirmation, and restarts it without one', async () => {
    vi.useFakeTimers()
    render('en', createElement(BotControl, { guildId: GUILD, initialStatus: 'online' }))
    // A running bot: the main action restarts, "Start" is not offered at all.
    expect(registry.buttons.some(b => b.text === t.bot_start)).toBe(false)

    await button(t.bot_stop).onClick?.()
    expect(calls).toEqual([])

    await dialog(t.bot_stop).onConfirm('')
    expect(calls).toEqual([{ url: `/api/bot-control?guildId=${GUILD}`, method: 'POST', body: { action: 'stop' } }])

    calls = []
    await button(t.bot_restart).onClick?.()
    expect(calls).toEqual([{ url: `/api/bot-control?guildId=${GUILD}`, method: 'POST', body: { action: 'restart' } }])
  })

  it('offers "Start bot" as the main action of a stopped bot, and no stop', () => {
    render('en', createElement(BotControl, { guildId: GUILD, initialStatus: 'stopped' }))
    expect(button(t.bot_start).disabled).toBe(false)
    expect(registry.buttons.some(b => b.text === t.bot_stop)).toBe(false)
  })

  it('removes hosting only from the confirmation, with the typed server id', async () => {
    registry.resources.set('/api/bot-hosting/status', {
      hosted: true, archives: [], host: null, url: null, redirectUri: null, needsConfig: false, job: null,
    })
    render('en', createElement(HostingArea, { guild: guild() }))
    await button(t.host_remove).onClick?.()
    expect(calls).toEqual([])

    const confirm = dialog(t.host_remove)
    // The id to type is the server's own, and the field is not prefilled with it.
    expect(confirm.typeToConfirm?.expected).toBe(GUILD)
    await confirm.onConfirm(GUILD)
    expect(calls).toEqual([{ url: `/api/bot-hosting/deactivate?guildId=${GUILD}`, method: 'POST', body: { confirm: GUILD } }])
  })

  it('asks before choosing to delete an archived installation', async () => {
    registry.resources.set('/api/bot-hosting/status', {
      hosted: false, archives: [{ name: 'old', archivedAt: '2026-10-01T10:00:00.000Z' }],
      host: null, url: null, redirectUri: null, needsConfig: false, job: null,
    })
    const markup = render('de', createElement(HostingArea, { guild: guild({ is_hosted: 0 }) }))
    const de = dashboardTranslations.de
    expect(registry.buttons.filter(b => b.text === de.host_archive_new)).toHaveLength(1)
    expect(dialog(de.host_archive_new).title).toBe(de.host_archive_discard_title)
    // The date of the archive in the German format, not the browser's.
    expect(markup).toContain('01.10.2026')
    expect(calls).toEqual([])
  })
})

// ── Formats per language ─────────────────────────────────────────────────────

describe('dates and prices in the format of the page language', () => {
  it.each([['de', '27.11.2026'], ['en', 'Nov 27, 2026']] as const)('the trial end in %s', (lang, date) => {
    const markup = render(lang, createElement(OverviewArea, { guild: guild({ stripe_status: 'trialing' }) }))
    expect(markup).toContain(dashboardTranslations[lang].sub_trial_active.replace('{date}', date))
    expect(markup).toContain(`dateTime="2026-11-27T10:00:00.000Z"`)
    expect(markup).not.toContain('Invalid Date')
  })

  // German puts a no-break space between amount and sign.
  it.each([['de', /4,99\u00a0€/], ['en', /€4\.99/]] as const)('the price of custom domains in %s', (lang, price) => {
    const markup = render(lang, createElement(DomainsArea, { guild: guild({ tier: 'basic', custom_domain: null, domain_status: 'none' }), serverIp: '203.0.113.7' }))
    expect(markup).toMatch(price)
    expect(markup).toContain(formatTierPrice('premium', lang))
  })

  it.each([['de', '21.09.2026', '2,5 kB', '19.09.2036'], ['en', 'Sep 21, 2026', '2.5 kB', 'Sep 19, 2036']] as const)(
    'a transcript row in %s', (lang, created, size, expires) => {
      const row: TranscriptItem = {
        id: 'a', ticketId: 1, url: 'https://tickets.atlas.example/1.html', sizeBytes: 2.5 * 1024,
        hasAttachments: false, createdAt: '2026-09-21T10:00:00.000Z', expiresAt: '2036-09-19T10:00:00.000Z',
      }
      const cells = transcriptColumns(lang).map(col => renderToStaticMarkup(createElement('div', null, col.cell(row))))
      expect(cells.join('|')).toContain(created)
      expect(cells.join('|')).toContain(size)
      expect(cells.join('|')).toContain(expires)
    },
  )
})

// ── The areas render in both languages ───────────────────────────────────────

describe('each area renders for an own server', () => {
  it.each(LANGS)('overview, domains, transcripts and hosting in %s', lang => {
    registry.resources.set('/api/bot-hosting/status', {
      hosted: true, archives: [], host: null, url: null, redirectUri: null, needsConfig: true, job: null,
    })
    const t = dashboardTranslations[lang]
    expect(render(lang, createElement(OverviewArea, { guild: guild() }))).toContain(t.ov_sub_title)
    expect(render(lang, createElement(DomainsArea, { guild: guild(), serverIp: '203.0.113.7' }))).toContain(t.dashdom_title)
    expect(render(lang, createElement(TranscriptsArea, { guildId: GUILD, tier: 'premium' }))).toContain(t.tx_filters)
    const hosting = render(lang, createElement(HostingArea, { guild: guild() }))
    expect(hosting).toContain(t.bot_control_title)
    expect(hosting).toContain(t.host_needs_config_title)
  })
})
