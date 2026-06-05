import { NextResponse }       from 'next/server'
import { loadGiveawayStats } from '@/lib/giveawayStats'

export const dynamic = 'force-dynamic' // always recompute — no caching of live stats

export async function GET() {
  const stats = await loadGiveawayStats()
  if (!stats.available) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
  return NextResponse.json(stats)
}
