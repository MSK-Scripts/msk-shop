import { NextRequest, NextResponse } from 'next/server'
import { getBasketCreateAuth, TEBEX_BASE, TEBEX_HEADERS } from './auth'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip') || '127.0.0.1'
    const ip = rawIp.replace(/^::ffff:/, '')

    const basketBody: Record<string, unknown> = {
      complete_url: body.complete_url,
      cancel_url: body.cancel_url,
      complete_auto_redirect: false,
      ip_address: ip,
    }
    if (body.username) basketBody.username = body.username

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
