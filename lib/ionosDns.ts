// =============================================================================
// IONOS DNS API — create and remove the A/AAAA pair for a hosted bot subdomain
// =============================================================================
// msk-scripts.de has NO wildcard DNS record: every subdomain is an explicit A
// (and AAAA) entry in the IONOS zone. So when a customer activates bot hosting
// we have to mint `tickets-<id>.msk-scripts.de` here before Apache can serve it.
//
// What we deliberately do NOT need is a certificate run. The zone already has a
// wildcard cert (`*.msk-scripts.de`, acme.sh + IONOS DNS-01, deployed to
// /etc/apache2/ssl/msk-scripts.de/), so a fresh subdomain is served the moment
// its vhost exists. That is the whole reason provisioning can be fast and can
// never fail on the Let's Encrypt rate limit — see scripts/bot-vhost-create.sh.
//
// Auth is a single API key that covers every zone of the IONOS account, which is
// exactly why this module refuses to touch a name outside DNS_ZONE: a bug in a
// caller must not be able to delete records for musiker15.de or msk-solutions.de.
// =============================================================================

const API_BASE = 'https://api.hosting.ionos.com/dns/v1'

/** The single zone this module is allowed to write to. */
export const DNS_ZONE = (process.env.IONOS_DNS_ZONE || 'msk-scripts.de').toLowerCase()

/** TTL for the records we create. Matches every existing record in the zone. */
const RECORD_TTL = 3600

export interface DnsRecord {
  id:      string
  name:    string
  type:    string
  content: string
}

export class IonosDnsError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'IonosDnsError'
  }
}

/**
 * `<prefix>.<secret>` as IONOS expects it in X-API-Key. Returns null when either
 * half is missing, which every caller treats as "DNS automation is not
 * configured" rather than guessing.
 */
export function ionosApiKey(): string | null {
  const prefix = (process.env.IONOS_API_PREFIX || '').trim()
  const secret = (process.env.IONOS_API_SECRET || '').trim()
  if (!prefix || !secret) return null
  return `${prefix}.${secret}`
}

/** The addresses the subdomains point at. IPv6 is optional: a zone without AAAA
 *  is valid, and creating an AAAA for an address the server does not answer on
 *  would be worse than having none at all. */
export function serverAddresses(): { ipv4: string; ipv6: string | null } {
  const ipv4 = (process.env.SERVER_PUBLIC_IP || '').trim()
  const ipv6 = (process.env.SERVER_PUBLIC_IPV6 || '').trim()
  return { ipv4, ipv6: ipv6 || null }
}

/**
 * Guard for every name this module handles. A host must sit directly under the
 * zone — one label, nothing deeper. Two reasons, and the second is the load
 * bearing one:
 *
 *   • The wildcard certificate covers `*.msk-scripts.de` and NOT
 *     `a.b.msk-scripts.de`, so a deeper name would be served with a cert error.
 *   • It pins every write to the one zone we own the risk for.
 */
export function isManagedHost(host: string): boolean {
  const h = (host || '').trim().toLowerCase()
  if (!h.endsWith(`.${DNS_ZONE}`)) return false
  const label = h.slice(0, -(DNS_ZONE.length + 1))
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = ionosApiKey()
  if (!key) throw new IonosDnsError('IONOS DNS API is not configured')

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'X-API-Key':    key,
        'accept':       'application/json',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
      cache: 'no-store',
    })
  } catch (err) {
    throw new IonosDnsError(`IONOS DNS API unreachable: ${err instanceof Error ? err.message : 'network error'}`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new IonosDnsError(`IONOS DNS API ${res.status}: ${body.slice(0, 200)}`, res.status)
  }

  // DELETE answers 200 with an empty body; JSON.parse('') would throw.
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new IonosDnsError('IONOS DNS API returned a malformed response')
  }
}

let zoneIdCache: string | null = null

/** Zone id of DNS_ZONE. Cached for the life of the process — the zone is created
 *  once by hand and its id never changes. */
export async function zoneId(): Promise<string> {
  if (zoneIdCache) return zoneIdCache

  const zones = await call<Array<{ id: string; name: string }>>('/zones')
  const zone = Array.isArray(zones)
    ? zones.find(z => (z.name || '').toLowerCase() === DNS_ZONE)
    : undefined
  if (!zone?.id) throw new IonosDnsError(`Zone ${DNS_ZONE} not found in this IONOS account`)

  zoneIdCache = zone.id
  return zone.id
}

/** Every A/AAAA record currently held for exactly this host. */
export async function recordsForHost(host: string): Promise<DnsRecord[]> {
  if (!isManagedHost(host)) throw new IonosDnsError(`Refusing to read records outside ${DNS_ZONE}: ${host}`)

  const id  = await zoneId()
  const zone = await call<{ records?: DnsRecord[] }>(`/zones/${id}?recordType=A,AAAA`)
  const want = host.toLowerCase()

  return (zone.records ?? []).filter(r => (r.name || '').toLowerCase() === want)
}

/**
 * Point `host` at this server. Idempotent: existing records for the host are
 * removed first, so a retry after a half-finished run converges instead of
 * stacking a second A record with the same content.
 */
export async function createHostRecords(host: string): Promise<void> {
  if (!isManagedHost(host)) throw new IonosDnsError(`Refusing to write records outside ${DNS_ZONE}: ${host}`)

  const { ipv4, ipv6 } = serverAddresses()
  if (!ipv4) throw new IonosDnsError('SERVER_PUBLIC_IP is not set')

  await deleteHostRecords(host)

  const body = [
    { name: host, type: 'A', content: ipv4, ttl: RECORD_TTL, disabled: false },
    ...(ipv6 ? [{ name: host, type: 'AAAA', content: ipv6, ttl: RECORD_TTL, disabled: false }] : []),
  ]

  const id = await zoneId()
  await call(`/zones/${id}/records`, { method: 'POST', body: JSON.stringify(body) })
}

/**
 * Remove every A/AAAA record for `host`. Missing records are not an error — this
 * runs in teardown paths (hosting removed, subscription cancelled) where the
 * caller must be able to finish cleaning up whatever else is left over.
 */
export async function deleteHostRecords(host: string): Promise<number> {
  if (!isManagedHost(host)) throw new IonosDnsError(`Refusing to delete records outside ${DNS_ZONE}: ${host}`)

  const id      = await zoneId()
  const records = await recordsForHost(host)

  for (const r of records) {
    await call(`/zones/${id}/records/${encodeURIComponent(r.id)}`, { method: 'DELETE' })
  }
  return records.length
}

/** Test seam: drop the memoised zone id. */
export function resetZoneCache(): void {
  zoneIdCache = null
}
