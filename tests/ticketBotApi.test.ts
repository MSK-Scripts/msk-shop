import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  botAction, botLogStreamUrl, dashboardDomain, fetchBotLogs, fetchBotStatus, fetchTranscripts,
  hostingEnvUrl, hostingStatusUrl, openBillingPortal, openOwnerDashboard, removeHosting,
  removeTranscriptDomain, saveHosting, setTranscriptDomain, setupDashboardHost, startCheckout,
  transcriptsUrl, validateTranscriptDomain,
} from '@/app/[lang]/dashboard/ticket-bot/ticketBotApi'

/**
 * The requests of the ticket bot dashboard, byte for byte.
 *
 * Phase 8 of the redesign rebuilt every area of the dashboard and moved the
 * requests into one module. The API routes behind them did not change, and
 * they must keep receiving exactly what the old components sent: a renamed
 * key in a body reaches a route as `undefined` and fails there, often only
 * in a branch nobody clicks in a test run (removing hosting, a yearly order).
 *
 * The expected values below are copied from the components before the
 * rebuild, not derived from the module under test.
 */

const GUILD = '111111111111111111'

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
    cache: init?.cache,
    body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body,
  }
}

describe('subscription requests', () => {
  it('starts the checkout with guild, tier and interval', async () => {
    await startCheckout(GUILD, 'premium_plus', 'yearly')
    expect(sent()).toEqual({
      url: '/api/stripe/checkout', method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: undefined,
      body: { guildId: GUILD, tier: 'premium_plus', interval: 'yearly' },
    })
  })

  it('opens the customer portal with the guild only', async () => {
    await openBillingPortal(GUILD)
    expect(sent()).toEqual({
      url: '/api/stripe/portal', method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: undefined,
      body: { guildId: GUILD },
    })
  })
})

describe('transcript domain requests', () => {
  it('sets a domain, trimmed', async () => {
    await setTranscriptDomain(GUILD, '  tickets.atlas.example ')
    expect(sent()).toMatchObject({ url: '/api/domain/set', method: 'POST', body: { guildId: GUILD, domain: 'tickets.atlas.example' } })
  })

  it('checks DNS and removes with the guild only', async () => {
    await validateTranscriptDomain(GUILD)
    expect(sent()).toMatchObject({ url: '/api/domain/validate', method: 'POST', body: { guildId: GUILD } })
    calls = []
    await removeTranscriptDomain(GUILD)
    expect(sent()).toEqual({
      url: '/api/domain/remove', method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: undefined,
      body: { guildId: GUILD },
    })
  })
})

describe('bot dashboard domain requests', () => {
  it('sets with POST and the domain in the body, the guild in the query', async () => {
    await dashboardDomain(GUILD, 'POST', { domain: 'dash.atlas.example' })
    expect(sent()).toEqual({
      url: `/api/bot-hosting/domain?guildId=${GUILD}`, method: 'POST', headers: { 'content-type': 'application/json' },
      cache: undefined, body: { domain: 'dash.atlas.example' },
    })
  })

  it('checks with PATCH and removes with DELETE, both without a body', async () => {
    await dashboardDomain(GUILD, 'PATCH')
    expect(sent()).toMatchObject({ url: `/api/bot-hosting/domain?guildId=${GUILD}`, method: 'PATCH', body: undefined })
    calls = []
    await dashboardDomain(GUILD, 'DELETE')
    expect(sent()).toMatchObject({ url: `/api/bot-hosting/domain?guildId=${GUILD}`, method: 'DELETE', body: undefined })
  })
})

describe('hosted bot requests', () => {
  it('controls the process with the action in the body', async () => {
    for (const action of ['start', 'stop', 'restart', 'update'] as const) {
      calls = []
      await botAction(GUILD, action)
      expect(sent()).toEqual({
        url: `/api/bot-control?guildId=${GUILD}`, method: 'POST', headers: { 'Content-Type': 'application/json' },
        cache: undefined, body: { action },
      })
    }
  })

  it('reads status and logs with a plain GET', async () => {
    await fetchBotStatus(GUILD)
    expect(sent()).toMatchObject({ url: `/api/bot-control?guildId=${GUILD}`, method: 'GET', body: undefined })
    calls = []
    await fetchBotLogs(GUILD)
    expect(sent()).toMatchObject({ url: `/api/bot-logs?guildId=${GUILD}`, method: 'GET', body: undefined })
    expect(botLogStreamUrl(GUILD)).toBe(`/api/bot-logs-stream?guildId=${GUILD}`)
  })

  it('sets the address up and opens the owner access without caching', async () => {
    await setupDashboardHost(GUILD)
    expect(sent()).toEqual({
      url: `/api/bot-hosting/dashboard-host?guildId=${GUILD}`, method: 'POST', headers: undefined, cache: 'no-store', body: undefined,
    })
    calls = []
    await openOwnerDashboard(GUILD)
    expect(sent()).toEqual({
      url: `/api/bot-dashboard/open?guildId=${GUILD}`, method: 'GET', headers: undefined, cache: 'no-store', body: undefined,
    })
  })

  it('reads status and .env from the addresses useJsonResource fetches', () => {
    expect(hostingStatusUrl(GUILD)).toBe(`/api/bot-hosting/status?guildId=${GUILD}`)
    expect(hostingEnvUrl(GUILD)).toBe(`/api/bot-hosting/env?guildId=${GUILD}`)
  })
})

describe('hosting set-up requests', () => {
  const values = { token: 'tok', clientId: '123456789012345678', clientSecret: 'sec', databaseUrl: '', publicPortal: true }

  it('installs through provision, with the agreement and the archive answer', async () => {
    await saveHosting(GUILD, { hosted: false, values, dpaAccepted: true, archive: 'restore' })
    expect(sent()).toEqual({
      url: `/api/bot-hosting/provision?guildId=${GUILD}`, method: 'POST', headers: { 'content-type': 'application/json' },
      cache: undefined,
      body: { token: 'tok', clientId: '123456789012345678', clientSecret: 'sec', databaseUrl: '', publicPortal: true, dpaAccepted: true, archive: 'restore' },
    })
  })

  it('leaves the archive answer out when there is none', async () => {
    await saveHosting(GUILD, { hosted: false, values, dpaAccepted: true })
    expect(sent().body).not.toHaveProperty('archive')
  })

  it('rewrites the .env of a hosted bot without asking for the agreement again', async () => {
    await saveHosting(GUILD, { hosted: true, values, dpaAccepted: false })
    const request = sent()
    expect(request.url).toBe(`/api/bot-hosting/env?guildId=${GUILD}`)
    expect(request.body).toEqual({ token: 'tok', clientId: '123456789012345678', clientSecret: 'sec', databaseUrl: '', publicPortal: true })
  })

  it('removes hosting with the typed server id as the confirmation', async () => {
    await removeHosting(GUILD, GUILD)
    expect(sent()).toEqual({
      url: `/api/bot-hosting/deactivate?guildId=${GUILD}`, method: 'POST', headers: { 'content-type': 'application/json' },
      cache: undefined, body: { confirm: GUILD },
    })
  })
})

describe('transcript list requests', () => {
  const none = { ticketId: '', from: '', to: '', attachmentsOnly: false, page: 1 }

  it('asks for one page of twenty without empty filters', () => {
    expect(transcriptsUrl(GUILD, none)).toBe(`/api/transcripts?guildId=${GUILD}&page=1&pageSize=20`)
  })

  it('passes every filter under the name the route reads', () => {
    expect(transcriptsUrl(GUILD, { ticketId: ' 42 ', from: '2026-10-01', to: '2026-10-27', attachmentsOnly: true, page: 3 }))
      .toBe(`/api/transcripts?guildId=${GUILD}&page=3&pageSize=20&ticketId=42&from=2026-10-01&to=2026-10-27&attachments=1`)
  })

  it('fetches without caching', async () => {
    await fetchTranscripts(GUILD, none, 1)
    expect(sent()).toMatchObject({ url: `/api/transcripts?guildId=${GUILD}&page=1&pageSize=1`, method: 'GET', cache: 'no-store' })
  })
})

describe('answers', () => {
  it('turns a body that is not JSON into an empty object instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Too many requests', { status: 429 })))
    const result = await botAction(GUILD, 'restart')
    expect(result).toEqual({ ok: false, status: 429, data: {} })
  })
})
