import { NextRequest, NextResponse } from 'next/server'
import { TEBEX_HEADERS } from '../basket/auth'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!
const BASE = 'https://headless.tebex.io/api'

// Fetch packages optionally with basket context to get sale/discounted prices
export async function GET(req: NextRequest) {
  try {
    const ident = req.nextUrl.searchParams.get('ident')

    // With basket ident Tebex applies user-specific/global sale pricing
    const url = ident
      ? `${BASE}/accounts/${PUBLIC_TOKEN}/packages?basketIdent=${ident}`
      : `${BASE}/accounts/${PUBLIC_TOKEN}/packages`

    const res = await fetch(url, { headers: TEBEX_HEADERS, cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
