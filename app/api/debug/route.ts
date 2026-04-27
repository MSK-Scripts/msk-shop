import { NextResponse } from 'next/server'
import { getBasketCreateAuth } from '../basket/auth'

const PRIVATE_KEY = process.env.TEBEX_PRIVATE_KEY!
const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!

export async function GET() {
  const results: Record<string, unknown> = {}

  // 1. Creator API with secret header
  try {
    const r = await fetch('https://plugin.tebex.io/packages/5732587', {
      headers: { 'X-Tebex-Secret': PRIVATE_KEY, 'Accept': 'application/json' },
      cache: 'no-store',
    })
    const data = await r.json()
    console.log('[debug] plugin.tebex.io status:', r.status)
    console.log('[debug] plugin.tebex.io response:', JSON.stringify(data, null, 2))
    results.pluginApi = { status: r.status, data }
  } catch (e) { results.pluginApi = { error: String(e) } }

  // 2. Fresh basket — log full JSON to see ALL fields including discord URLs
  try {
    const r = await fetch(`https://headless.tebex.io/api/accounts/${PUBLIC_TOKEN}/baskets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: getBasketCreateAuth() },
      body: JSON.stringify({ complete_url: 'https://msk-scripts.de', cancel_url: 'https://msk-scripts.de', ip_address: '1.2.3.4' }),
      cache: 'no-store',
    })
    const data = await r.json()
    console.log('[debug] fresh basket full:', JSON.stringify(data?.data, null, 2))
    results.basket = { status: r.status, keys: Object.keys(data?.data ?? {}), data: data?.data }
  } catch (e) { results.basket = { error: String(e) } }

  return NextResponse.json(results)
}
