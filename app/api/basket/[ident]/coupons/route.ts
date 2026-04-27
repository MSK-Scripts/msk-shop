import { NextRequest, NextResponse } from 'next/server'
import { getTebexAuth, TEBEX_BASE, TEBEX_HEADERS } from '../../auth'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    const { ident } = await params
    const body = await req.json()
    const res = await fetch(`${TEBEX_BASE}/accounts/${PUBLIC_TOKEN}/baskets/${ident}/coupons`, {
      method: 'POST',
      headers: { ...TEBEX_HEADERS, Authorization: getTebexAuth() },
      body: JSON.stringify({ coupon_code: body.coupon_code }),
    })
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = { error: text } }
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
