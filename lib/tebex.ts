import type { TebexCategory, TebexPackage, TebexBasket } from '@/types/tebex'

const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!
const BASE = 'https://headless.tebex.io/api'
const H = { 'Content-Type': 'application/json', 'Accept': 'application/json' }

export async function getCategories(): Promise<TebexCategory[]> {
  const res = await fetch(`${BASE}/accounts/${PUBLIC_TOKEN}/categories?includePackages=1`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`getCategories: ${res.status}`)
  return (await res.json()).data
}

export async function getPackages(): Promise<TebexPackage[]> {
  const res = await fetch(`${BASE}/accounts/${PUBLIC_TOKEN}/packages`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`getPackages: ${res.status}`)
  return (await res.json()).data
}

export async function getPackage(id: string | number): Promise<TebexPackage> {
  const res = await fetch(`${BASE}/accounts/${PUBLIC_TOKEN}/packages/${id}`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`getPackage: ${res.status}`)
  return (await res.json()).data
}

export async function getCategory(id: string | number): Promise<TebexCategory> {
  const res = await fetch(`${BASE}/accounts/${PUBLIC_TOKEN}/categories/${id}?includePackages=1`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`getCategory: ${res.status}`)
  return (await res.json()).data
}

export async function createBasket(): Promise<TebexBasket> {
  const res = await fetch('/api/basket', {
    method: 'POST', headers: H,
    body: JSON.stringify({}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`createBasket: ${res.status}`)
  return data.data
}

export async function getBasket(ident: string): Promise<TebexBasket> {
  const res = await fetch(`${BASE}/accounts/${PUBLIC_TOKEN}/baskets/${ident}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`getBasket: ${res.status}`)
  return (await res.json()).data
}

export async function getAllAuthUrls(
  ident: string,
  returnUrl: string
): Promise<Array<{ name: string; url: string }>> {
  const res = await fetch(
    `/api/basket/${ident}/auth?returnUrl=${encodeURIComponent(returnUrl)}`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`getAllAuthUrls: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function addToBasket(
  ident: string,
  packageId: number,
  packageType: string = 'single',
  quantity = 1,
  usernameId?: string | null,
  variableData?: Record<string, string>
): Promise<TebexBasket> {
  const mergedVarData = {
    ...(usernameId ? { username_id: usernameId } : {}),
    ...(variableData ?? {}),
  }
  const body: Record<string, unknown> = {
    package_id: String(packageId),
    quantity,
    ...(Object.keys(mergedVarData).length > 0 ? { variable_data: mergedVarData } : {}),
  }
  const res = await fetch(`/api/basket/${ident}/packages`, {
    method: 'POST', headers: H, body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`addToBasket: ${res.status} — ${JSON.stringify(data)}`)
  return data.data
}

export async function addGiftToBasket(
  ident: string,
  packageId: number,
  packageType: string = 'single',
  giftUsername: string,
  usernameId?: string | null,
  discordId?: string | null,
  recipientDiscordId?: string
): Promise<TebexBasket> {
  const varData: Record<string, string> = {}
  if (usernameId) varData.username_id = usernameId
  if (discordId) varData.discord_id = discordId
  // Recipient's Discord ID for role assignment
  if (recipientDiscordId) varData.gift_discord_id = recipientDiscordId

  const body: Record<string, unknown> = {
    package_id: String(packageId),
    quantity: 1,
    gift_username: giftUsername,
    ...(Object.keys(varData).length > 0 ? { variable_data: varData } : {}),
  }
  const res = await fetch(`/api/basket/${ident}/packages`, {
    method: 'POST', headers: H, body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`addGiftToBasket: ${res.status} — ${JSON.stringify(data)}`)
  return data.data
}

export async function removeFromBasket(ident: string, packageId: number): Promise<TebexBasket> {
  const res = await fetch(`/api/basket/${ident}/packages/remove`, {
    method: 'POST', headers: H, body: JSON.stringify({ package_id: String(packageId) }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`removeFromBasket: ${res.status}`)
  return data.data
}

export async function applyCoupon(ident: string, couponCode: string): Promise<void> {
  const res = await fetch(`/api/basket/${ident}/coupons`, {
    method: 'POST', headers: H, body: JSON.stringify({ coupon_code: couponCode }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`applyCoupon: ${res.status} — ${JSON.stringify(data)}`)
  }
}

export async function removeCoupon(ident: string, couponCode: string): Promise<void> {
  const res = await fetch(`/api/basket/${ident}/coupons/${encodeURIComponent(couponCode)}`, {
    method: 'DELETE', headers: H,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(`removeCoupon: ${res.status} — ${JSON.stringify(data)}`)
  }
}
