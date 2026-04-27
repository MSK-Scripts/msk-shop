// Auth helper for server-side API routes
// Basket creation: publicToken:privateKey
// Package mutations: projectId:privateKey (per Tebex "Checkout APIs" docs)

export function getBasketCreateAuth(): string {
  const publicToken = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN!
  const privateKey = process.env.TEBEX_PRIVATE_KEY!
  return 'Basic ' + Buffer.from(`${publicToken}:${privateKey}`).toString('base64')
}

export function getCheckoutAuth(): string {
  const projectId = process.env.NEXT_PUBLIC_TEBEX_PROJECT_ID!
  const privateKey = process.env.TEBEX_PRIVATE_KEY!
  return 'Basic ' + Buffer.from(`${projectId}:${privateKey}`).toString('base64')
}

export const TEBEX_BASE = 'https://headless.tebex.io/api'

export const TEBEX_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

// Backwards compat
export const getTebexAuth = getCheckoutAuth
