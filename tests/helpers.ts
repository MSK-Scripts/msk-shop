import { NextRequest } from 'next/server'
import type { Mock } from 'vitest'
import { signAdminSession } from '@/lib/adminSession'

let ipCounter = 0

/**
 * Build an authenticated admin NextRequest. Each call uses a fresh IP so the
 * per-IP rate limiter in adminRoute never collides across tests.
 */
export function adminReq(
  path: string,
  opts: { method?: string; userId?: string; body?: unknown; origin?: string } = {},
): NextRequest {
  const { method = 'GET', userId = '1', body, origin } = opts
  const headers: Record<string, string> = {
    cookie: `msk_admin_session=${signAdminSession({ discordUserId: userId })}`,
    'x-forwarded-for': `10.0.${Math.floor(ipCounter / 250)}.${ipCounter++ % 250}`,
  }
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (origin) headers['origin'] = origin
  return new NextRequest(new URL(path, 'https://www.msk-scripts.de'), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

/**
 * Second-arg context for invoking a static (non-dynamic) route handler in tests.
 * adminRoute types its handler with a required context, but non-dynamic routes
 * ignore it at runtime.
 */
export const staticCtx = { params: Promise.resolve({} as Record<string, string>) }

export interface DbMember {
  discord_user_id: string
  display_name?: string | null
  is_owner?: number
  permissions?: string
  active?: number
}

/**
 * Wire a mocked `queryOne` to serve msk_admin_team rows from an in-memory map,
 * distinguishing loadAdminMember (selects display_name, filters active=1) from
 * the ownerFlag lookup (selects is_owner only).
 */
export function serveAdminTeam(queryOne: Mock, members: DbMember[]): void {
  const map = new Map(members.map(m => [m.discord_user_id, {
    discord_user_id: m.discord_user_id,
    display_name:    m.display_name ?? null,
    is_owner:        m.is_owner ?? 0,
    permissions:     m.permissions ?? '[]',
    active:          m.active ?? 1,
  }]))
  queryOne.mockImplementation(async (sql: string, params: unknown[]) => {
    const row = map.get(String(params[0]))
    if (!row) return null
    if (sql.includes('display_name')) return row.active === 1 ? row : null   // loadAdminMember
    return { is_owner: row.is_owner }                                        // ownerFlag
  })
}
