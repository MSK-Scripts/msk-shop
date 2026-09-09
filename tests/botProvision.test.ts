import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The module reads the database when allocating a port, so the pool is replaced
// before it is imported. Everything else under test is pure.
const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({
  query:    (...args: unknown[]) => queryMock(...args),
  queryOne: vi.fn(),
}))

import { mkdtemp, mkdir, rm, readdir, readFile, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join }   from 'path'
import {
  validateHostingForm, buildBotEnv, tailLines, allocateBotPort,
  findArchives, restoreArchive, discardArchives, checkBotMembership,
} from '@/lib/botProvision'
import { parseEnv } from '@/lib/botEnv'

const FORM = {
  token:        'MTIzNDU2Nzg5MDEyMzQ1Njc4.GaBcDe.ThisIsLongEnoughToPass',
  clientId:     '1512576227490140311',
  clientSecret: 'abcdefghijklmnopqrstuvwxyz012345',
}

const CTX = {
  guildId:     '1512390228546162738',
  apiKey:      'a'.repeat(64),
  port:        3051,
  host:        'tickets-aabbccddeeff.msk-scripts.de',
  proxySecret: 'p'.repeat(64),
  baseUrl:     'https://www.msk-scripts.de',
}

describe('validateHostingForm', () => {
  it('accepts the three values we actually ask for', () => {
    expect(validateHostingForm(FORM)).toBeNull()
  })

  it('names the offending field rather than failing generically', () => {
    expect(validateHostingForm({ ...FORM, token: 'short' })).toBe('invalid_token')
    expect(validateHostingForm({ ...FORM, clientId: '123' })).toBe('invalid_client_id')
    expect(validateHostingForm({ ...FORM, clientSecret: 'tiny' })).toBe('invalid_client_secret')
  })

  // The URLs are ASSEMBLED rather than written out, and that is not decoration:
  // TruffleHog flags any literal `postgres://...` in the repository as a leaked
  // connection string, invented host or not. Composing the scheme keeps the
  // secret scanner scanning everything instead of buying silence with an
  // exclusion that would also hide a real leak in a test file one day.
  it('accepts the three supported database schemes and rejects anything else', () => {
    for (const scheme of ['mysql', 'postgres', 'sqlite']) {
      expect(validateHostingForm({ ...FORM, databaseUrl: `${scheme}://db.example/tickets` })).toBeNull()
    }
    expect(validateHostingForm({ ...FORM, databaseUrl: 'http://example.com' })).toBe('invalid_database_url')
  })

  it('treats an absent database url as "use the bundled file"', () => {
    expect(validateHostingForm({ ...FORM, databaseUrl: '' })).toBeNull()
  })
})

describe('buildBotEnv', () => {
  it('produces a file the bot can actually read back', () => {
    const env = parseEnv(buildBotEnv(FORM, CTX))

    expect(env.TOKEN).toBe(FORM.token)
    expect(env.CLIENT_ID).toBe(FORM.clientId)
    expect(env.CLIENT_SECRET).toBe(FORM.clientSecret)
    expect(env.GUILD_ID).toBe(CTX.guildId)
    expect(env.MSK_API_KEY).toBe(CTX.apiKey)
    expect(env.DASHBOARD_PORT).toBe('3051')
  })

  // The bot is only reachable through the Apache vhost; a public bind would
  // expose an unauthenticated port straight to the internet.
  it('keeps the dashboard bound to loopback', () => {
    const env = parseEnv(buildBotEnv(FORM, CTX))
    expect(env.DASHBOARD_HOST).toBe('127.0.0.1')
    expect(env.DASHBOARD_ENABLED).toBe('true')
    expect(env.DASHBOARD_ALLOW_INSECURE).toBe('false')
  })

  // If this and the Discord developer portal disagree, the login dies on
  // Discord's side with nothing in our logs.
  it('points the public URL at the host we published', () => {
    const env = parseEnv(buildBotEnv(FORM, CTX))
    expect(env.DASHBOARD_PUBLIC_URL).toBe('https://tickets-aabbccddeeff.msk-scripts.de')
  })

  it('mints a fresh session secret per installation', () => {
    const a = parseEnv(buildBotEnv(FORM, CTX)).SESSION_SECRET
    const b = parseEnv(buildBotEnv(FORM, CTX)).SESSION_SECRET
    expect(a).toHaveLength(64)
    expect(a).not.toBe(b)
  })

  // An empty shared secret would let anything reaching the loopback port claim
  // to be an authenticated owner, so no key is better than a blank one.
  it('omits the trusted-proxy secret entirely when we have none', () => {
    const env = parseEnv(buildBotEnv(FORM, { ...CTX, proxySecret: null }))
    expect(env.DASHBOARD_TRUST_PROXY_SECRET).toBeUndefined()
    expect(parseEnv(buildBotEnv(FORM, CTX)).DASHBOARD_TRUST_PROXY_SECRET).toBe(CTX.proxySecret)
  })

  it('defaults the member portal to off', () => {
    expect(parseEnv(buildBotEnv(FORM, CTX)).DASHBOARD_PUBLIC_PORTAL).toBe('false')
    expect(parseEnv(buildBotEnv({ ...FORM, publicPortal: true }, CTX)).DASHBOARD_PUBLIC_PORTAL).toBe('true')
  })

  // A token containing a quote must not be able to close its own value and
  // introduce another key.
  //
  // Asserting on a key that appears NOWHERE else in the file is the whole point:
  // an earlier version of this test injected DASHBOARD_HOST, and because parseEnv
  // keeps the last occurrence while the genuine line comes later, it stayed green
  // with the escaping deliberately broken. It tested nothing.
  it('cannot be escaped out of by a hostile value', () => {
    const hostile = '"' + '\n' + 'EVIL="pwned'
    const text = buildBotEnv({ ...FORM, token: hostile }, CTX)
    expect(parseEnv(text).EVIL).toBeUndefined()
    expect(parseEnv(text).TOKEN).toBe(hostile)
  })
})

describe('tailLines', () => {
  it('keeps the last n non-empty lines', () => {
    expect(tailLines('a\n\nb\nc\n', 2)).toBe('b\nc')
  })

  it('strips ANSI colour codes but keeps the bracketed tags', () => {
    const line = '[90m[2026-08-29][0m [36m[INFO ][0m [Ready] up'
    expect(tailLines(line, 5)).toBe('[2026-08-29] [INFO ] [Ready] up')
  })

  it('caps the total size so a runaway log cannot be stored whole', () => {
    expect(tailLines('x'.repeat(50_000), 5).length).toBeLessThanOrEqual(8000)
  })

  it('survives an empty log', () => {
    expect(tailLines('', 10)).toBe('')
  })
})

describe('allocateBotPort', () => {
  beforeEach(() => { queryMock.mockReset() })
  afterEach(() => { vi.restoreAllMocks() })

  it('skips ports already recorded in the database', async () => {
    queryMock.mockResolvedValue([{ bot_port: 3050 }, { bot_port: 3051 }])
    const port = await allocateBotPort()
    expect(port).toBeGreaterThanOrEqual(3052)
  })

  // A stopped bot's port is free on the machine right now. Handing it to a
  // second bot works until the first one starts again, and then both break.
  it('does not reuse a recorded port merely because nothing is listening', async () => {
    queryMock.mockResolvedValue([{ bot_port: 3050 }])
    expect(await allocateBotPort()).not.toBe(3050)
  })

  it('starts at the bottom of the range when nothing is taken', async () => {
    queryMock.mockResolvedValue([])
    expect(await allocateBotPort()).toBe(3050)
  })
})

describe('archived installations', () => {
  // Real directories in a temp folder: the whole point of these functions is
  // what they do to the filesystem, and a mocked fs would abstract away exactly
  // the part that can destroy a customer's ticket history.
  const GUILD = '1512390228546162738'
  let base: string

  beforeEach(async () => {
    base = await mkdtemp(join(tmpdir(), 'msk-bots-'))
    process.env.BOT_CONFIG_BASE_PATH = base
  })

  afterEach(async () => {
    await rm(base, { recursive: true, force: true })
  })

  const makeDir = (name: string) => mkdir(join(base, name), { recursive: true })

  it('finds archives of this guild, newest first', async () => {
    await makeDir(`${GUILD}_archived_2026-08-01T10-00-00`)
    await makeDir(`${GUILD}_archived_2026-08-29T20-30-15`)

    const found = await findArchives(GUILD)
    expect(found.map(a => a.name)).toEqual([
      `${GUILD}_archived_2026-08-29T20-30-15`,
      `${GUILD}_archived_2026-08-01T10-00-00`,
    ])
    expect(new Date(found[0].archivedAt).getUTCFullYear()).toBe(2026)
  })

  // Deleting another guild's history would be the worst possible bug here.
  it('ignores the live directory and other guilds', async () => {
    await makeDir(GUILD)
    await makeDir('999999999999999999_archived_2026-08-01T10-00-00')
    await makeDir(`${GUILD}_archived_x`)          // not a timestamp
    expect(await findArchives(GUILD)).toEqual([])
  })

  it('returns nothing when the base directory does not exist', async () => {
    process.env.BOT_CONFIG_BASE_PATH = join(base, 'missing')
    expect(await findArchives(GUILD)).toEqual([])
  })

  it('restores an archive under the live name', async () => {
    const name = `${GUILD}_archived_2026-08-29T20-30-15`
    await makeDir(name)
    await writeFile(join(base, name, 'marker'), 'tickets')

    await restoreArchive(GUILD, name)

    expect(await readFile(join(base, GUILD, 'marker'), 'utf8')).toBe('tickets')
    expect(await findArchives(GUILD)).toEqual([])
  })

  // Merging an archive into a live installation would be guesswork with two
  // ticket databases, so it refuses instead.
  it('refuses to restore over a live installation', async () => {
    const name = `${GUILD}_archived_2026-08-29T20-30-15`
    await makeDir(name)
    await makeDir(GUILD)
    await expect(restoreArchive(GUILD, name)).rejects.toThrow(/already exists/)
  })

  it('refuses to restore a directory that is not an archive of this guild', async () => {
    await makeDir('999999999999999999_archived_2026-08-01T10-00-00')
    await expect(restoreArchive(GUILD, '999999999999999999_archived_2026-08-01T10-00-00'))
      .rejects.toThrow(/Not an archive/)
    await expect(restoreArchive(GUILD, '../etc')).rejects.toThrow(/Not an archive/)
  })

  it('discards every archive of this guild and nothing else', async () => {
    await makeDir(`${GUILD}_archived_2026-08-01T10-00-00`)
    await makeDir(`${GUILD}_archived_2026-08-29T20-30-15`)
    await makeDir('999999999999999999_archived_2026-08-01T10-00-00')

    expect(await discardArchives(GUILD)).toBe(2)
    expect(await findArchives(GUILD)).toEqual([])
    expect(await readdir(base)).toEqual(['999999999999999999_archived_2026-08-01T10-00-00'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('checkBotMembership', () => {
  // Regression guard for a dead end reported on 09.09.2026: a bot that was never
  // invited to the guild got cloned, installed and started anyway. Nothing
  // noticed until the health check timed out ninety seconds later, and what the
  // customer was then shown blamed the three form fields, all of which were fine.
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  const answer = (status: number) => fetchMock.mockResolvedValue({ ok: status < 300, status })

  it('accepts a bot that is on the guild', async () => {
    answer(200)
    expect(await checkBotMembership('tok', '1512390228546162738')).toBe('ok')
  })

  it('asks Discord for that guild, with the token as a bot token', async () => {
    answer(200)
    await checkBotMembership('tok', '1512390228546162738')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/guilds/1512390228546162738')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bot tok')
  })

  it('reports a rejected token', async () => {
    answer(401)
    expect(await checkBotMembership('tok', '1512390228546162738')).toBe('invalid_token')
  })

  it('reports a bot that was never invited', async () => {
    answer(404)
    expect(await checkBotMembership('tok', '1512390228546162738')).toBe('bot_not_in_guild')
  })

  // The three below pin down the deliberate fail-open. A Discord outage, a rate
  // limit or a DNS failure on our side must not stop onboarding: this check is
  // here to give a good answer sooner, not to be the only one that exists.
  it('lets a rate limit through rather than blocking the setup', async () => {
    answer(429)
    expect(await checkBotMembership('tok', '1512390228546162738')).toBe('ok')
  })

  it('lets a Discord outage through', async () => {
    answer(503)
    expect(await checkBotMembership('tok', '1512390228546162738')).toBe('ok')
  })

  it('lets a network error through', async () => {
    fetchMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND discord.com'))
    expect(await checkBotMembership('tok', '1512390228546162738')).toBe('ok')
  })
})
