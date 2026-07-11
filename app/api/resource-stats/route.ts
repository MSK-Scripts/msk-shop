import { NextResponse }        from 'next/server'
import { loadResourceStats }  from '@/lib/fivestats'

export const dynamic = 'force-dynamic' // key stays server-side; upstream caching handled in the client

export async function GET() {
  const stats = await loadResourceStats()
  if (!stats.available) {
    return NextResponse.json({ error: 'fivestats unavailable' }, { status: 503 })
  }
  return NextResponse.json(stats)
}
