import { NextResponse } from 'next/server'

// Fetches online member count from Discord invite API (no auth needed)
export async function GET() {
  try {
    const res = await fetch(
      'https://discord.com/api/v10/invites/5hHSBRHvJE?with_counts=true',
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 }, // cache for 60 seconds
      }
    )
    if (!res.ok) throw new Error(`Discord API: ${res.status}`)
    const data = await res.json()
    return NextResponse.json({
      online: data.approximate_presence_count ?? 0,
      total: data.approximate_member_count ?? 0,
    })
  } catch {
    return NextResponse.json({ online: 0, total: 0 })
  }
}
