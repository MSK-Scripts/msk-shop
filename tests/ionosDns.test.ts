import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isManagedHost, ionosApiKey, serverAddresses, zoneId, recordsForHost,
  createHostRecords, deleteHostRecords, resetZoneCache, IonosDnsError, isInOwnZone,
} from '@/lib/ionosDns'
import { generateDashboardHost, isGeneratedHost, dashboardRedirectUri } from '@/lib/dashboardHost'

const ZONE_ID = '56742e62-f8bb-11ec-85e2-0a586444968b'

/** Minimal stand-in for the two IONOS endpoints this module talks to. */
function stubApi(records: Array<{ id: string; name: string; type: string; content: string }> = []) {
  const calls: Array<{ url: string; method: string; body?: unknown }> = []
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({
      url,
      method: init.method ?? 'GET',
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    })
    if (url.endsWith('/zones')) {
      return { ok: true, status: 200, text: async () => JSON.stringify([{ id: ZONE_ID, name: 'msk-scripts.de' }]) }
    }
    if (url.includes(`/zones/${ZONE_ID}?`)) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ name: 'msk-scripts.de', records }) }
    }
    // POST /records and DELETE /records/<id> both answer with an empty body.
    return { ok: true, status: 200, text: async () => '' }
  })
  vi.stubGlobal('fetch', fetchMock)
  return calls
}

beforeEach(() => {
  process.env.IONOS_API_PREFIX = 'prefix'
  process.env.IONOS_API_SECRET = 'secret'
  process.env.SERVER_PUBLIC_IP = '152.53.132.58'
  process.env.SERVER_PUBLIC_IPV6 = '2a0a:4cc0:c0:1060:0:0:0:1'
  resetZoneCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.SERVER_PUBLIC_IPV6
})

describe('isManagedHost', () => {
  it('accepts a single label under the zone', () => {
    expect(isManagedHost('tickets-a1b2c3d4e5f6.msk-scripts.de')).toBe(true)
    expect(isManagedHost('TICKETS-A1B2.MSK-SCRIPTS.DE')).toBe(true)
  })

  // The wildcard certificate covers *.msk-scripts.de and NOT a.b.msk-scripts.de,
  // so a deeper name would be served with a certificate error.
  it('rejects a deeper name, the apex and foreign zones', () => {
    expect(isManagedHost('a.b.msk-scripts.de')).toBe(false)
    expect(isManagedHost('msk-scripts.de')).toBe(false)
    expect(isManagedHost('tickets-abc.musiker15.de')).toBe(false)
    expect(isManagedHost('evil.com')).toBe(false)
    expect(isManagedHost('')).toBe(false)
  })

  it('rejects a label that is not a valid DNS label', () => {
    expect(isManagedHost('-lead.msk-scripts.de')).toBe(false)
    expect(isManagedHost('trail-.msk-scripts.de')).toBe(false)
    expect(isManagedHost('under_score.msk-scripts.de')).toBe(false)
  })
})

describe('configuration helpers', () => {
  it('builds the X-API-Key as prefix.secret', () => {
    expect(ionosApiKey()).toBe('prefix.secret')
  })

  it('returns null when either half is missing', () => {
    process.env.IONOS_API_SECRET = ''
    expect(ionosApiKey()).toBeNull()
  })

  it('treats an empty IPv6 as absent rather than as an empty record', () => {
    process.env.SERVER_PUBLIC_IPV6 = ''
    expect(serverAddresses()).toEqual({ ipv4: '152.53.132.58', ipv6: null })
  })
})

describe('zoneId', () => {
  it('resolves the configured zone and memoises it', async () => {
    const calls = stubApi()
    expect(await zoneId()).toBe(ZONE_ID)
    expect(await zoneId()).toBe(ZONE_ID)
    expect(calls.filter(c => c.url.endsWith('/zones'))).toHaveLength(1)
  })

  it('throws when the account does not hold the zone', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true, status: 200, text: async () => JSON.stringify([{ id: 'x', name: 'other.de' }]),
    })))
    await expect(zoneId()).rejects.toBeInstanceOf(IonosDnsError)
  })

  it('surfaces an API error with its status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, text: async () => 'unauthorized' })))
    await expect(zoneId()).rejects.toMatchObject({ status: 401 })
  })
})

describe('createHostRecords', () => {
  it('creates an A and an AAAA record for the host', async () => {
    const calls = stubApi()
    await createHostRecords('tickets-aabbccddeeff.msk-scripts.de')

    const post = calls.find(c => c.method === 'POST')!
    expect(post.url).toBe(`https://api.hosting.ionos.com/dns/v1/zones/${ZONE_ID}/records`)
    expect(post.body).toEqual([
      { name: 'tickets-aabbccddeeff.msk-scripts.de', type: 'A',    content: '152.53.132.58',            ttl: 3600, disabled: false },
      { name: 'tickets-aabbccddeeff.msk-scripts.de', type: 'AAAA', content: '2a0a:4cc0:c0:1060:0:0:0:1', ttl: 3600, disabled: false },
    ])
  })

  it('omits the AAAA record when no IPv6 is configured', async () => {
    process.env.SERVER_PUBLIC_IPV6 = ''
    const calls = stubApi()
    await createHostRecords('tickets-aabbccddeeff.msk-scripts.de')
    const post = calls.find(c => c.method === 'POST')!
    expect(post.body).toHaveLength(1)
  })

  // A retry after a half-finished run must converge, not stack a second A record
  // with the same content.
  it('removes pre-existing records for the host first', async () => {
    const calls = stubApi([
      { id: 'old-a', name: 'tickets-aabbccddeeff.msk-scripts.de', type: 'A', content: '1.2.3.4' },
    ])
    await createHostRecords('tickets-aabbccddeeff.msk-scripts.de')

    const del = calls.filter(c => c.method === 'DELETE')
    expect(del).toHaveLength(1)
    expect(del[0].url).toContain('/records/old-a')
    expect(calls.findIndex(c => c.method === 'DELETE')).toBeLessThan(calls.findIndex(c => c.method === 'POST'))
  })

  it('refuses a host outside the zone without calling the API', async () => {
    const calls = stubApi()
    await expect(createHostRecords('evil.com')).rejects.toBeInstanceOf(IonosDnsError)
    expect(calls).toHaveLength(0)
  })

  it('fails loudly when SERVER_PUBLIC_IP is unset', async () => {
    process.env.SERVER_PUBLIC_IP = ''
    stubApi()
    await expect(createHostRecords('tickets-aabbccddeeff.msk-scripts.de')).rejects.toThrow(/SERVER_PUBLIC_IP/)
  })
})

describe('deleteHostRecords', () => {
  it('deletes every A/AAAA record of the host and reports the count', async () => {
    const calls = stubApi([
      { id: 'a1', name: 'tickets-aabbccddeeff.msk-scripts.de', type: 'A',    content: '152.53.132.58' },
      { id: 'a2', name: 'tickets-aabbccddeeff.msk-scripts.de', type: 'AAAA', content: '::1' },
      { id: 'a3', name: 'cdn.msk-scripts.de',                  type: 'A',    content: '152.53.132.58' },
    ])
    await expect(deleteHostRecords('tickets-aabbccddeeff.msk-scripts.de')).resolves.toBe(2)

    const deleted = calls.filter(c => c.method === 'DELETE').map(c => c.url)
    expect(deleted.some(u => u.includes('/records/a1'))).toBe(true)
    expect(deleted.some(u => u.includes('/records/a2'))).toBe(true)
    // The unrelated cdn record must survive — the filter is on the exact name.
    expect(deleted.some(u => u.includes('/records/a3'))).toBe(false)
  })

  it('is a no-op when the host has no records', async () => {
    stubApi()
    await expect(deleteHostRecords('tickets-aabbccddeeff.msk-scripts.de')).resolves.toBe(0)
  })

  // The single API key is valid for every zone of the account, so this guard is
  // the only thing standing between a caller bug and musiker15.de losing records.
  it('refuses to delete outside the zone', async () => {
    const calls = stubApi()
    await expect(deleteHostRecords('musiker15.de')).rejects.toBeInstanceOf(IonosDnsError)
    expect(calls).toHaveLength(0)
  })
})

describe('recordsForHost', () => {
  it('returns only the records matching the exact name', async () => {
    stubApi([
      { id: 'a1', name: 'tickets-aabbccddeeff.msk-scripts.de', type: 'A', content: '152.53.132.58' },
      { id: 'a2', name: 'www.msk-scripts.de',                  type: 'A', content: '152.53.132.58' },
    ])
    const recs = await recordsForHost('tickets-aabbccddeeff.msk-scripts.de')
    expect(recs.map(r => r.id)).toEqual(['a1'])
  })
})

describe('generateDashboardHost', () => {
  it('mints a valid, managed host', () => {
    const host = generateDashboardHost()
    expect(host).toMatch(/^tickets-[0-9a-f]{12}\.msk-scripts\.de$/)
    expect(isManagedHost(host)).toBe(true)
    expect(isGeneratedHost(host)).toBe(true)
  })

  it('does not repeat itself', () => {
    const hosts = new Set(Array.from({ length: 50 }, generateDashboardHost))
    expect(hosts.size).toBe(50)
  })

  it('does not mistake a customer domain for a generated host', () => {
    expect(isGeneratedHost('tickets.example.com')).toBe(false)
    expect(isGeneratedHost('cdn.msk-scripts.de')).toBe(false)
    expect(isGeneratedHost(null)).toBe(false)
  })

  it('builds the redirect URI the Discord portal has to hold', () => {
    expect(dashboardRedirectUri('tickets-aabbccddeeff.msk-scripts.de'))
      .toBe('https://tickets-aabbccddeeff.msk-scripts.de/auth/callback')
  })
})

describe('isInOwnZone', () => {
  // The guard that stops a customer from entering one of OUR names as their own
  // custom domain. Broader than isManagedHost on purpose: that one asks whether
  // we may create the record, this one whether the name belongs to us at all.
  it('claims the apex and every depth beneath it', () => {
    for (const d of [
      'msk-scripts.de', 'www.msk-scripts.de', 'cdn.msk-scripts.de',
      'tickets-aabbccddeeff.msk-scripts.de', 'a.b.msk-scripts.de',
      'MSK-SCRIPTS.DE', 'www.msk-scripts.de.',
    ]) {
      expect(isInOwnZone(d)).toBe(true)
    }
  })

  it('leaves a customer domain alone', () => {
    for (const d of ['tickets.example.com', 'msk-scripts.de.evil.com', 'notmsk-scripts.de', '']) {
      expect(isInOwnZone(d)).toBe(false)
    }
  })
})
