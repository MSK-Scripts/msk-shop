import { NextResponse }      from 'next/server'
import { adminRoute }        from '@/lib/adminApi'
import { adminImageStats }   from '@/lib/adminImages'
import { summarizePayments } from '@/lib/adminPayments'
import { ADMIN_PERMISSIONS, memberHasPermission, type AdminPermission } from '@/lib/adminPerms'
import { queryOne }          from '@/lib/db'
import { countPendingUploads } from '@/lib/imageUploads'
import { tebexPlugin, unwrapList, type TebexPayment } from '@/lib/tebexPlugin'

// Session-dependent → never cache.
export const dynamic = 'force-dynamic'

/** The payments the overview reads: the same latest 100 the payments area lists. */
const PAYMENT_LIMIT = 100

type Section<T> = { ok: true; data: T } | { ok: false }

async function section<T>(load: () => Promise<T>): Promise<Section<T>> {
  try {
    return { ok: true, data: await load() }
  } catch (err) {
    console.error('[admin/overview] section failed:', err)
    return { ok: false }
  }
}

/**
 * The figures of the admin overview (plan 6.6) in one request: sales of the
 * last 30 days, new ticket bot API keys and what the image CDN is waiting
 * for. Only counts and sums leave the server, no single payment, so the
 * overview carries no personal data at all.
 *
 * Every section is computed only for a member who holds the permission of the
 * area it counts, the same permission that area's own route asks for. A
 * section that fails is reported as failed; the others still arrive.
 */
export const GET = adminRoute([...ADMIN_PERMISSIONS], async ({ member }) => {
  const can = (...perms: AdminPermission[]) => perms.some(p => memberHasPermission(member, p))
  const now = Date.now()

  const [sales, apiKeys, images] = await Promise.all([
    can('payments.view')
      ? section(async () => summarizePayments(unwrapList<TebexPayment>(await tebexPlugin.payments.list(PAYMENT_LIMIT)), now, PAYMENT_LIMIT))
      : undefined,
    can('api_key.view', 'api_key.change')
      ? section(async () => {
          const row = await queryOne<{ recent: number | string | null; previous: number | string | null }>(
            `SELECT SUM(created_at >= NOW() - INTERVAL 30 DAY) AS recent,
                    SUM(created_at >= NOW() - INTERVAL 60 DAY AND created_at < NOW() - INTERVAL 30 DAY) AS previous
               FROM ticketbot_guilds`,
          )
          return { recent: Number(row?.recent ?? 0), previous: Number(row?.previous ?? 0) }
        })
      : undefined,
    can('images.view', 'images.manage', 'images.moderate')
      ? section(async () => {
          const [categories, pendingUploads] = await Promise.all([adminImageStats(), countPendingUploads()])
          return { pendingUploads, missingLabel: categories.reduce((sum, c) => sum + c.noLabel, 0) }
        })
      : undefined,
  ])

  return NextResponse.json(
    { overview: { sales: sales ?? null, apiKeys: apiKeys ?? null, images: images ?? null } },
    { headers: { 'Cache-Control': 'no-store' } },
  )
})
