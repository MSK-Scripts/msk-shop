import { createElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The server in the address of the ticket bot dashboard (Phase 7).
 *
 * Since Phase 7 every server has an address of its own,
 * `/dashboard/ticket-bot/<server>/<area>`. That segment is input from the
 * address bar, and the dashboard is multi-tenant: one process, one database,
 * many foreign Discord servers. The rule this file holds the pages to is the
 * one the API routes already follow (lib/dashboardAuth.ts): the guild comes
 * from the signed session, and the address may only pick among the servers
 * that session owns. A foreign server in the address must get no data at
 * all, and must get the same answer as a server that does not exist, so the
 * answer does not even say whether it exists.
 *
 * The fake database answers the WHERE clause it is given, so a page that
 * looked a server up by its id alone would get the foreign row back here,
 * just as it would from MariaDB.
 */

const ME      = '400000000000000001'
const OTHER   = '400000000000000002'
const OWN_A   = '111111111111111111'
const OWN_B   = '222222222222222222'
const FOREIGN = '333333333333333333'
const MISSING = '444444444444444444'

const state = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  headers: new Headers(),
  queries: [] as Array<{ sql: string; params: unknown[] }>,
  rows: [] as Array<Record<string, unknown>>,
}))

vi.mock('next/headers', () => ({
  headers: async () => state.headers,
  cookies: async () => ({
    get: (name: string) => (state.cookies.has(name) ? { name, value: state.cookies.get(name)! } : undefined),
  }),
}))

class RedirectSignal extends Error {
  constructor(readonly url: string) { super(`REDIRECT ${url}`) }
}

vi.mock('next/navigation', async importOriginal => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  redirect: (url: string) => { throw new RedirectSignal(url) },
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
  useRouter: () => ({ push: () => {}, refresh: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => null,
}))

/** Answers `SELECT <cols> FROM ticketbot_guilds WHERE a = ? AND b = ?` like MariaDB would. */
function fakeQuery(sql: string, params: unknown[] = []): Array<Record<string, unknown>> {
  state.queries.push({ sql, params })
  if (!/FROM\s+ticketbot_guilds/i.test(sql)) return []
  const where = sql.split(/\bWHERE\b/i)[1] ?? ''
  const conditions = [...where.matchAll(/(\w+)\s*=\s*\?/g)].map(m => m[1])
  const columns = (/SELECT([\s\S]*?)FROM/i.exec(sql)?.[1] ?? '').split(',').map(c => c.trim()).filter(Boolean)
  return state.rows
    .filter(row => conditions.every((col, i) => row[col] === params[i]))
    .map(row => Object.fromEntries(columns.map(col => [col, row[col]])))
}

vi.mock('@/lib/db', () => ({
  query:    async (sql: string, params?: unknown[]) => fakeQuery(sql, params),
  queryOne: async (sql: string, params?: unknown[]) => fakeQuery(sql, params)[0] ?? null,
  execute:  async () => ({ affectedRows: 0 }),
}))

import { LangProvider } from '@/components/i18n/LangProvider'
import { signDashboardSession } from '@/lib/dashboardSession'
import { LANG_HEADER, PATH_HEADER } from '@/lib/lang'
import { TICKET_BOT_SECTIONS } from '@/lib/dashboardNav'
import { loadTicketBotServer } from '@/app/[lang]/dashboard/ticket-bot/loadGuilds'
import TicketBotEntry from '@/app/[lang]/dashboard/ticket-bot/page'
import TicketBotServerLayout from '@/app/[lang]/dashboard/ticket-bot/[server]/layout'
import { TicketBotSectionPage } from '@/app/[lang]/dashboard/ticket-bot/[server]/sectionPage'

function guildRow(guild_id: string, discord_user_id: string, extra: Record<string, unknown>): Record<string, unknown> {
  return {
    guild_id, discord_user_id, guild_name: null, tier: 'basic', custom_domain: null, domain_status: 'none',
    is_hosted: 0, stripe_subscription_id: null, stripe_status: null, expires_at: null, bot_port: null,
    dashboard_host: null, dashboard_domain: null, dashboard_domain_status: 'none',
    // Checked a minute ago: no access re-check redirect in these tests.
    access_checked_at: new Date(Date.now() - 60_000), access_lost_at: null,
    created_at: 0,
    ...extra,
  }
}

beforeAll(() => { process.env.SESSION_SECRET = 'test-secret' })

beforeEach(() => {
  state.queries = []
  state.headers = new Headers({ [LANG_HEADER]: 'en', [PATH_HEADER]: '/dashboard/ticket-bot' })
  state.cookies = new Map([['msk_dashboard_session', signDashboardSession({ discordUserId: ME })]])
  state.rows = [
    guildRow(OWN_A, ME, { guild_name: 'Atlas Roleplay', tier: 'premium_plus', created_at: 1 }),
    guildRow(OWN_B, ME, { guild_name: 'Second Home', created_at: 2 }),
    guildRow(FOREIGN, OTHER, {
      guild_name: 'Foreign Secret Server', tier: 'business', custom_domain: 'tickets.foreign-secret.example',
      domain_status: 'active', is_hosted: 1, bot_port: 4123, dashboard_host: 'tickets-foreign.msk-scripts.de',
    }),
  ]
})

const params = (server: string) => Promise.resolve({ lang: 'en', server })

/** Renders a server tree the way the browser gets it, inside the language provider. */
function html(node: ReactNode): string {
  return renderToStaticMarkup(
    createElement(LangProvider, { lang: 'en', path: '/dashboard/ticket-bot' } as ComponentProps<typeof LangProvider>, node),
  )
}

const MARKER = 'page-content-marker'
const child = createElement('p', null, MARKER)

async function layoutFor(server: string): Promise<ReactElement> {
  return TicketBotServerLayout({ children: child, params: params(server) }) as Promise<ReactElement>
}

/** Every string anywhere in an element's props, for "does this tree carry X at all". */
function propText(node: unknown): string {
  const seen: string[] = []
  const walk = (value: unknown): void => {
    if (value == null || typeof value === 'function') return
    if (typeof value === 'string' || typeof value === 'number') { seen.push(String(value)); return }
    if (Array.isArray(value)) { value.forEach(walk); return }
    if (isValidElement(value)) { walk(value.props); return }
    if (typeof value === 'object') Object.values(value as Record<string, unknown>).forEach(walk)
  }
  walk(node)
  return seen.join('\n')
}

const FOREIGN_TRACES = [FOREIGN, 'Foreign Secret Server', 'tickets.foreign-secret.example', 'tickets-foreign.msk-scripts.de', OTHER]

describe('a server in the address', () => {
  it('is only looked up among the servers of the session, never queried', async () => {
    const { guild, guilds } = await loadTicketBotServer(FOREIGN)
    expect(guild).toBeNull()
    expect(guilds.map(g => g.guild_id)).toEqual([OWN_A, OWN_B])
    for (const q of state.queries) {
      expect(q.params, q.sql).not.toContain(FOREIGN)
      expect(q.sql).toMatch(/WHERE discord_user_id = \?/)
    }
  })

  it('finds an own server', async () => {
    const { guild } = await loadTicketBotServer(OWN_B)
    expect(guild?.guild_name).toBe('Second Home')
  })

  it.each(TICKET_BOT_SECTIONS)('renders no %s page for a foreign server', async section => {
    expect(await TicketBotSectionPage({ params: params(FOREIGN), section })).toBeNull()
  })

  it('shows a foreign server nothing of it, only the own servers and the unavailable state', async () => {
    const tree = await layoutFor(FOREIGN)
    const markup = html(tree)
    for (const trace of FOREIGN_TRACES) {
      expect(markup).not.toContain(trace)
      expect(propText(tree)).not.toContain(trace)
    }
    expect(markup).not.toContain(MARKER)
    expect(markup).toContain('Server not available')
    expect(markup).toContain('Atlas Roleplay')
    expect(markup).toContain('Second Home')
  })

  it('answers a foreign server exactly like one that does not exist', async () => {
    const foreign = html(await layoutFor(FOREIGN))
    const missing = html(await layoutFor(MISSING))
    const malformed = html(await layoutFor('not-a-snowflake'))
    expect(foreign).toBe(missing)
    expect(foreign).toBe(malformed)
  })

  it('shows the page of an own server inside the shell', async () => {
    const markup = html(await layoutFor(OWN_A))
    expect(markup).toContain(MARKER)
    expect(markup).not.toContain('Server not available')
    expect(markup).toMatch(/<main id="main"/)
  })

  it('renders the overview of an own server with its data and none of the foreign one', async () => {
    const page = await TicketBotSectionPage({ params: params(OWN_A), section: 'overview' })
    const markup = html(page)
    expect(markup).toContain('Atlas Roleplay')
    for (const trace of FOREIGN_TRACES) expect(markup).not.toContain(trace)
  })

  it('sends an area the plan does not include to the overview of that server', async () => {
    await expect(TicketBotSectionPage({ params: params(OWN_B), section: 'hosting' }))
      .rejects.toMatchObject({ url: `/en/dashboard/ticket-bot/${OWN_B}` })
  })

  it('sends a visitor without a session to the sign-in, whatever server the address names', async () => {
    state.cookies = new Map()
    await expect(layoutFor(OWN_A)).rejects.toMatchObject({ url: '/en/dashboard/ticket-bot/verify' })
    await expect(TicketBotSectionPage({ params: params(FOREIGN), section: 'overview' }))
      .rejects.toMatchObject({ url: '/en/dashboard/ticket-bot/verify' })
  })
})

describe('the old dashboard address', () => {
  it('sends a signed-in visitor to the overview of their first server', async () => {
    await expect(TicketBotEntry()).rejects.toMatchObject({ url: `/en/dashboard/ticket-bot/${OWN_A}` })
  })

  it('stays in the language of the address', async () => {
    state.headers = new Headers({ [LANG_HEADER]: 'de', [PATH_HEADER]: '/dashboard/ticket-bot' })
    await expect(TicketBotEntry()).rejects.toMatchObject({ url: `/de/dashboard/ticket-bot/${OWN_A}` })
  })

  it('sends a visitor without a session to the sign-in', async () => {
    state.cookies = new Map()
    await expect(TicketBotEntry()).rejects.toMatchObject({ url: '/en/dashboard/ticket-bot/verify' })
  })

  it('never sends anyone to a server of somebody else', async () => {
    state.cookies = new Map([['msk_dashboard_session', signDashboardSession({ discordUserId: OTHER })]])
    await expect(TicketBotEntry()).rejects.toMatchObject({ url: `/en/dashboard/ticket-bot/${FOREIGN}` })
    state.cookies = new Map([['msk_dashboard_session', signDashboardSession({ discordUserId: ME })]])
    await expect(TicketBotEntry()).rejects.not.toMatchObject({ url: expect.stringContaining(FOREIGN) })
  })
})
