import { NextRequest, NextResponse } from 'next/server'
import { getTebexAuth, TEBEX_BASE, TEBEX_HEADERS } from '../../../auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    // Rate limit: max 30 basket mutations per IP per minute
    if (!rateLimit(getClientIp(req), { limit: 30, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { ident } = await params
    const body = await req.json()
    const res = await fetch(`${TEBEX_BASE}/baskets/${ident}/packages/remove`, {
      method: 'POST',
      headers: { ...TEBEX_HEADERS, Authorization: getTebexAuth() },
      body: JSON.stringify({ package_id: String(body.package_id) }),
    })
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = { error: text } }
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
