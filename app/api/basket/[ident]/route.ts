import { NextRequest, NextResponse } from 'next/server'
import { getTebexAuth, TEBEX_BASE, TEBEX_HEADERS } from '../auth'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    const { ident } = await params
    const res = await fetch(
      `${TEBEX_BASE}/accounts/${PUBLIC_TOKEN}/baskets/${ident}`,
      { headers: { ...TEBEX_HEADERS, Authorization: getTebexAuth() }, cache: 'no-store' }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
