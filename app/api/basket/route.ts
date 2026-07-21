import { NextRequest, NextResponse } from 'next/server'
import { getBasketCreateAuth, TEBEX_BASE, TEBEX_HEADERS } from './auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!
// Always use server-side BASE_URL for redirect URLs — client cannot inject arbitrary URLs
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 10 basket creations per IP per minute (route-namespaced so
    // it is enforced independently of the mutation routes' shared counter).
    const ip = getClientIp(req)
    if (!rateLimit(`basket-create:${ip}`, { limit: 10, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const basketBody: Record<string, unknown> = {
      // Redirect URLs always come from server ENV — never from client body
      complete_url: `${BASE_URL}/checkout?status=complete`,
      cancel_url: `${BASE_URL}/cart`,
      complete_auto_redirect: false,
      ip_address: ip,
    }

    const res = await fetch(`${TEBEX_BASE}/accounts/${PUBLIC_TOKEN}/baskets`, {
      method: 'POST',
      headers: { ...TEBEX_HEADERS, Authorization: getBasketCreateAuth() },
      body: JSON.stringify(basketBody),
    })

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = { error: text } }
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
