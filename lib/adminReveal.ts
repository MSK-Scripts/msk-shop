import type { AdminPermission } from './adminPerms'

/**
 * What `POST /api/admin/reveal` may hand out in full, and to whom.
 *
 * Every other route of the admin sends email and IP addresses masked (see
 * lib/adminMask.ts) and ticket bot API keys shortened. This allow-list is the
 * only way to the full value: one field of one record per request, with the
 * permission of the area the record is shown in, and an audit entry for each
 * reveal. A kind or a field that is not listed here does not exist for the
 * route, whatever the request says.
 *
 * Pure data and validation, so the rules are testable without the route.
 */

export const REVEAL_KINDS = ['payment', 'ban', 'apikey'] as const
export type RevealKind = (typeof REVEAL_KINDS)[number]

export const REVEAL_FIELDS = ['email', 'ip', 'apiKey'] as const
export type RevealField = (typeof REVEAL_FIELDS)[number]

interface RevealRule {
  /** Any one of them is enough, as on the route that lists the records. */
  perms: AdminPermission[]
  fields: readonly RevealField[]
  /** The shape of a record id of this kind. */
  id: RegExp
}

export const REVEAL_RULES: Record<RevealKind, RevealRule> = {
  // Tebex transaction ids arrive as numbers; `tbx-…` strings are allowed in case
  // the Plugin API starts sending those.
  payment: { perms: ['payments.view'], fields: ['email'], id: /^[A-Za-z0-9-]{1,64}$/ },
  ban:     { perms: ['bans.manage'], fields: ['ip', 'email'], id: /^\d{1,20}$/ },
  apikey:  { perms: ['api_key.view', 'api_key.change'], fields: ['apiKey'], id: /^\d{5,32}$/ },
}

/** Every permission that can reveal anything; the route lets no one else in. */
export const REVEAL_PERMISSIONS: AdminPermission[] = [...new Set(Object.values(REVEAL_RULES).flatMap(r => r.perms))]

export interface RevealRequest {
  kind: RevealKind
  id: string
  field: RevealField
}

/** The request if kind, field and id are on the allow-list; null otherwise. */
export function parseRevealRequest(body: unknown): RevealRequest | null {
  if (!body || typeof body !== 'object') return null
  const { kind, id, field } = body as Record<string, unknown>
  if (typeof kind !== 'string' || !(REVEAL_KINDS as readonly string[]).includes(kind)) return null
  const rule = REVEAL_RULES[kind as RevealKind]
  if (typeof field !== 'string' || !(rule.fields as readonly string[]).includes(field)) return null
  if (typeof id !== 'string' || !rule.id.test(id)) return null
  return { kind: kind as RevealKind, id, field: field as RevealField }
}

/** Calls to the reveal route per admin and window, on top of the general admin limit. */
export const REVEAL_LIMIT = { limit: 20, windowMs: 10 * 60_000 } as const
