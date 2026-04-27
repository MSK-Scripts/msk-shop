// Route all auth URL fetching through server so we can log it
export async function getAllAuthUrls(
  ident: string,
  returnUrl: string
): Promise<Array<{ name: string; url: string }>> {
  const res = await fetch(
    `/api/basket/${ident}/auth?returnUrl=${encodeURIComponent(returnUrl)}`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`getAuthUrl: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function getAuthUrl(ident: string, returnUrl: string): Promise<string> {
  const urls = await getAllAuthUrls(ident, returnUrl)
  return urls[0]?.url ?? ''
}
