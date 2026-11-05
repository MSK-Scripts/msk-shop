// =============================================================================
// GitHub Sponsors: who currently counts as a sponsor
// =============================================================================
// The org has two tiers, both $5: monthly and one-time. Every payment is worth
// 30 days of the "Sponsor" role on the Discord server. GitHub is asked live on
// every check; nothing about a sponsorship is stored in the shop, only which
// GitHub account belongs to which Discord user (msk_sponsor_links).
//
// The token (GITHUB_SPONSORS_TOKEN) is a classic personal access token of an
// owner of the organization with the scope `read:org`. Only an org owner sees
// private sponsorships and the sponsorships of the org as a maintainer at all;
// with a weaker token the list comes back short, not with an error.
// =============================================================================

export const MIN_PRICE_USD = 5
export const ONE_TIME_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

const GRAPHQL_URL = 'https://api.github.com/graphql'
/** 100 per page, so this is room for 5,000 sponsorships before we stop. */
const MAX_PAGES = 50

export const SPONSORSHIPS_QUERY = `query($org: String!, $cursor: String) {
  organization(login: $org) {
    sponsorshipsAsMaintainer(first: 100, after: $cursor, activeOnly: false, includePrivate: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        isActive
        isOneTimePayment
        createdAt
        tierSelectedAt
        tier { monthlyPriceInDollars isOneTime }
        sponsorEntity { __typename ... on User { login databaseId } }
      }
    }
  }
}`

/** One node of `sponsorshipsAsMaintainer`, as GitHub returns it. */
export interface SponsorshipNode {
  isActive?:         boolean | null
  isOneTimePayment?: boolean | null
  createdAt?:        string | null
  tierSelectedAt?:   string | null
  tier?:             { monthlyPriceInDollars?: number | null; isOneTime?: boolean | null } | null
  sponsorEntity?:    { __typename?: string; login?: string | null; databaseId?: number | null } | null
}

export type SponsorKind = 'monthly' | 'one_time'

export interface SponsorGrant {
  githubId:   number
  login:      string
  kind:       SponsorKind
  /** null = open-ended (an active monthly sponsorship). */
  validUntil: Date | null
}

function parseDate(value: string | null | undefined): number | null {
  if (!value) return null
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : t
}

/** True when `a` is the better grant: open-ended beats dated, later beats earlier. */
function better(a: SponsorGrant, b: SponsorGrant): boolean {
  if (a.validUntil === null) return b.validUntil !== null
  if (b.validUntil === null) return false
  return a.validUntil.getTime() > b.validUntil.getTime()
}

/**
 * The validity rule, pure so it can be tested without GitHub.
 *
 *   - Only `User` sponsors count, organizations are ignored.
 *   - The tier must cost at least $5.
 *   - Monthly: counts while GitHub calls it active, open-ended.
 *   - One-time: counts for 30 days from the later of `tierSelectedAt` and
 *     `createdAt`, whatever `isActive` says.
 *   - Several sponsorships of one user: the best one wins.
 *
 * A sponsorship counts as one-time when either GitHub flag says so
 * (`isOneTimePayment` or `tier.isOneTime`). The stricter reading on purpose:
 * a one-time payment mistaken for monthly would grant the role forever.
 *
 * Keyed by the GitHub database id, never by login: logins can be renamed.
 */
export function evaluateSponsorships(nodes: readonly SponsorshipNode[], nowMs: number = Date.now()): Map<number, SponsorGrant> {
  const out = new Map<number, SponsorGrant>()

  for (const node of nodes) {
    const entity = node.sponsorEntity
    if (!entity || entity.__typename !== 'User') continue
    const githubId = entity.databaseId
    if (typeof githubId !== 'number' || !Number.isSafeInteger(githubId) || githubId <= 0) continue
    const login = typeof entity.login === 'string' ? entity.login : ''

    const price = Number(node.tier?.monthlyPriceInDollars ?? 0)
    if (!Number.isFinite(price) || price < MIN_PRICE_USD) continue

    let grant: SponsorGrant | null = null
    if (node.isOneTimePayment || node.tier?.isOneTime) {
      const paidAt = Math.max(parseDate(node.tierSelectedAt) ?? -Infinity, parseDate(node.createdAt) ?? -Infinity)
      if (!Number.isFinite(paidAt)) continue
      const until = paidAt + ONE_TIME_DAYS * DAY_MS
      if (until > nowMs) grant = { githubId, login, kind: 'one_time', validUntil: new Date(until) }
    } else if (node.isActive === true) {
      grant = { githubId, login, kind: 'monthly', validUntil: null }
    }
    if (!grant) continue

    const prev = out.get(githubId)
    if (!prev || better(grant, prev)) out.set(githubId, grant)
  }

  return out
}

interface GraphQlPage {
  data?: {
    organization?: {
      sponsorshipsAsMaintainer?: {
        pageInfo?: { hasNextPage?: boolean; endCursor?: string | null }
        nodes?:    (SponsorshipNode | null)[]
      } | null
    } | null
  }
  errors?: unknown[]
}

/**
 * All sponsorships of the org, every page. Throws on any HTTP, GraphQL or
 * shape problem: a failed query must never read as "nobody sponsors", the bot
 * would then take the role from everyone.
 */
export async function fetchSponsorships(
  opts: { token: string; org: string },
  fetchImpl: typeof fetch = fetch,
): Promise<SponsorshipNode[]> {
  const nodes: SponsorshipNode[] = []
  let cursor: string | null = null

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetchImpl(GRAPHQL_URL, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${opts.token}`,
        'Content-Type': 'application/json',
        'User-Agent':   'msk-shop-sponsors',
      },
      body:   JSON.stringify({ query: SPONSORSHIPS_QUERY, variables: { org: opts.org, cursor } }),
      cache:  'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`GitHub GraphQL HTTP ${res.status}`)

    const json = await res.json() as GraphQlPage
    if (json.errors?.length) throw new Error(`GitHub GraphQL returned ${json.errors.length} error(s)`)
    const conn = json.data?.organization?.sponsorshipsAsMaintainer
    if (!conn || !Array.isArray(conn.nodes)) throw new Error('GitHub GraphQL: unexpected response shape')

    for (const n of conn.nodes) if (n) nodes.push(n)
    if (!conn.pageInfo?.hasNextPage) return nodes
    cursor = conn.pageInfo.endCursor ?? null
    if (!cursor) throw new Error('GitHub GraphQL: hasNextPage without endCursor')
  }

  throw new Error(`GitHub GraphQL: more than ${MAX_PAGES} pages`)
}

/** Current valid sponsors of the org, keyed by GitHub database id. */
export async function currentSponsors(
  opts: { token: string; org: string },
  nowMs: number = Date.now(),
  fetchImpl: typeof fetch = fetch,
): Promise<Map<number, SponsorGrant>> {
  return evaluateSponsorships(await fetchSponsorships(opts, fetchImpl), nowMs)
}
