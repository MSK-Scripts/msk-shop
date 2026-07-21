import { NextRequest, NextResponse } from 'next/server'
import { getTebexAuth, TEBEX_BASE, TEBEX_HEADERS } from '../../../auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!

// DELETE /api/basket/[ident]/coupons/[code]
// Uses the correct Tebex Headless endpoint: POST /coupons/remove
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ident: string; code: string }> }
) {
  try {
    // Rate limit: max 30 coupon mutations per IP per minute (route-namespaced).
    if (!rateLimit(`basket-coupon-remove:${getClientIp(req)}`, { limit: 30, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { ident, code } = await params

    const res = await fetch(
      `${TEBEX_BASE}/accounts/${PUBLIC_TOKEN}/baskets/${encodeURIComponent(ident)}/coupons/remove`,
      {
        method: 'POST',
        headers: { ...TEBEX_HEADERS, Authorization: getTebexAuth() },
        body: JSON.stringify({ coupon_code: code }),
      }
    )

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = {} }
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
