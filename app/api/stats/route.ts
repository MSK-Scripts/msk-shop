import { NextResponse }        from 'next/server'
import { loadTicketbotStats } from '@/lib/ticketbotStats'

export const dynamic = 'force-dynamic' // always recompute — no caching of live stats

/**
 * The 60 s poll behind /ticketbot/stats.
 *
 * The queries live in `lib/ticketbotStats.ts`, shared with the page's first
 * render. Until 19.09.2026 both carried their own copy of the same sixteen
 * queries, which meant the first paint and the refresh one minute later could
 * disagree after any edit to one of them.
 */
export async function GET() {
  const stats = await loadTicketbotStats()

  // `available: false` is the loader's way of saying the database did not
  // answer. Kept as a 503 rather than zeroes, so the client's poll leaves the
  // numbers it already has on screen instead of blanking them.
  if (!stats.available) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  return NextResponse.json(stats)
}
