import { NextRequest, NextResponse } from 'next/server'
import { getTebexAuth, TEBEX_BASE, TEBEX_HEADERS } from '../../../auth'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!

// DELETE /api/basket/[ident]/coupons/[code]
// Tebex Headless API does NOT have a coupon remove endpoint.
// Workaround: try several possible endpoints and handle gracefully.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ident: string; code: string }> }
) {
  try {
    const { ident, code } = await params

    // Try 1: DELETE /accounts/{token}/baskets/{ident}/coupons (remove all coupons)
    const r1 = await fetch(
      `${TEBEX_BASE}/accounts/${PUBLIC_TOKEN}/baskets/${ident}/coupons`,
      { method: 'DELETE', headers: { ...TEBEX_HEADERS, Authorization: getTebexAuth() } }
    )
    if (r1.ok || r1.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Try 2: DELETE /baskets/{ident}/coupons/{code}
    const r2 = await fetch(
      `${TEBEX_BASE}/baskets/${ident}/coupons/${encodeURIComponent(code)}`,
      { method: 'DELETE', headers: { ...TEBEX_HEADERS, Authorization: getTebexAuth() } }
    )
    if (r2.ok || r2.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Try 3: DELETE /accounts/{token}/baskets/{ident}/coupons/{code}
    const r3 = await fetch(
      `${TEBEX_BASE}/accounts/${PUBLIC_TOKEN}/baskets/${ident}/coupons/${encodeURIComponent(code)}`,
      { method: 'DELETE', headers: { ...TEBEX_HEADERS, Authorization: getTebexAuth() } }
    )
    const text3 = await r3.text()
    if (r3.ok || r3.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // All failed — return the last error but don't throw (we handle gracefully in client)
    return NextResponse.json({ error: 'Coupon removal not supported by Tebex Headless API', detail: text3 }, { status: 422 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
