import { NextRequest, NextResponse } from 'next/server'
import { getBasketCreateAuth, TEBEX_BASE, TEBEX_HEADERS } from './auth'
import { rateLimit } from '@/lib/rateLimit'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!
const ALLOWED_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de'

// Only allow redirect URLs pointing to our own domain (prevents open redirect / SSRF)
function isAllowedUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    const allowed = new URL(ALLOWED_BASE_URL)
    return parsed.hostname === allowed.hostname
  } catch { return false }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 10 basket creations per IP per minute
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip') || '127.0.0.1'
    const ip = rawIp.replace(/^::ffff:/, '')
    if (!rateLimit(ip, { limit: 10, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()

    // Validate redirect URLs — prevents open redirect / SSRF
    if (!isAllowedUrl(body.complete_url) || !isAllowedUrl(body.cancel_url)) {
      return NextResponse.json({ error: 'Invalid redirect URL' }, { status: 400 })
    }

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
