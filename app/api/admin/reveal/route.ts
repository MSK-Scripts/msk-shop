import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { writeAudit }   from '@/lib/adminAudit'
import { memberHasPermission } from '@/lib/adminPerms'
import { REVEAL_LIMIT, REVEAL_PERMISSIONS, REVEAL_RULES, parseRevealRequest, type RevealRequest } from '@/lib/adminReveal'
import { queryOne }     from '@/lib/db'
import { rateLimit }    from '@/lib/rateLimit'
import { tebexPlugin, unwrapList, type TebexPayment } from '@/lib/tebexPlugin'

// Personal data in the response → never cache.
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * Reveal one masked value: the email of a payment, the IP or email of a ban,
 * the API key of a ticket bot server (plan 7, Art. 5 (1) c and 25 GDPR).
 *
 * The pipeline, in this order:
 *   1. `adminRoute`: session, membership, any permission that can reveal at
 *      all, the Origin check of every mutation and the general admin limit.
 *   2. A limit of its own per admin, because a reveal is the one admin call
 *      whose purpose is to hand out personal data.
 *   3. Kind, field and id against the allow-list in lib/adminReveal.ts.
 *   4. The permission of the area the record is shown in.
 *   5. The record itself. An unknown record answers exactly like a missing
 *      permission, so the route tells nobody whether a payment or a ban
 *      exists.
 *   6. The audit entry: who (the session), when (the row), which record and
 *      which field. Never the value. If the entry cannot be written, the
 *      value is not sent.
 *
 * POST, not GET: it writes the audit row, and a GET could be prefetched,
 * cached or logged with the record in its address.
 */
export const POST = adminRoute(REVEAL_PERMISSIONS, async ({ req, member }) => {
  if (!rateLimit(`admin-reveal:${member.discordUserId}`, REVEAL_LIMIT)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429, headers: NO_STORE })
  }

  const request = parseRevealRequest(await req.json().catch(() => null))
  if (!request) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: NO_STORE })
  }

  const refused = () => NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE })

  if (!REVEAL_RULES[request.kind].perms.some(p => memberHasPermission(member, p))) return refused()

  const value = await loadValue(request)
  if (!value) return refused()

  const recorded = await writeAudit(member.discordUserId, 'data.reveal', `${request.kind}:${request.id}`, { field: request.field })
  if (!recorded) {
    return NextResponse.json({ error: 'The reveal could not be recorded, so nothing was revealed.' }, { status: 503, headers: NO_STORE })
  }

  return NextResponse.json({ value }, { headers: NO_STORE })
})

/** The full value of the one field, or null for an unknown record or an empty field. */
async function loadValue({ kind, id, field }: RevealRequest): Promise<string | null> {
  if (kind === 'payment') {
    // The same list the payments area shows. `GET /payments/{numeric id}`
    // answers with an empty list, see the admin dashboard note.
    const payment = unwrapList<TebexPayment>(await tebexPlugin.payments.list(100)).find(p => String(p.id) === id)
    return text(payment?.email)
  }
  if (kind === 'ban') {
    const ban = unwrapList<Record<string, unknown>>(await tebexPlugin.bans.list()).find(b => String(b.id) === id)
    return text(field === 'ip' ? ban?.ip : ban?.payment_email)
  }
  const row = await queryOne<{ api_key: string }>('SELECT api_key FROM ticketbot_guilds WHERE guild_id = ?', [id])
  return text(row?.api_key)
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
