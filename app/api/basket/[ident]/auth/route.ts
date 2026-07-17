import { NextRequest, NextResponse } from 'next/server'
import { TEBEX_BASE, TEBEX_HEADERS } from '../../auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    // Rate limit: max 30 basket auth lookups per IP per minute — each call hits
    // Tebex, so cap it in line with the other basket routes.
    if (!rateLimit(getClientIp(req), { limit: 30, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { ident } = await params
    const returnUrl = req.nextUrl.searchParams.get('returnUrl') ?? ''
    const res = await fetch(
      `${TEBEX_BASE}/accounts/${PUBLIC_TOKEN}/baskets/${ident}/auth?returnUrl=${encodeURIComponent(returnUrl)}`,
      { headers: TEBEX_HEADERS, cache: 'no-store' }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
