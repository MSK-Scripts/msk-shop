import { createElement, type ComponentProps, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

vi.mock('next/navigation', async importOriginal => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: () => {}, refresh: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => null,
}))
vi.mock('@/lib/db', () => ({ queryOne: vi.fn(), query: vi.fn() }))
vi.mock('@/lib/tebexPlugin', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/tebexPlugin')>()
  return { ...actual, tebexPlugin: { payments: { list: vi.fn(async () => ({ data: [] })) } } }
})

import { LangProvider } from '@/components/i18n/LangProvider'
import { AdminShell } from '@/app/[lang]/admin/AdminShell'
import AdminClient from '@/app/[lang]/admin/AdminClient'
import { queryOne } from '@/lib/db'
import { ADMIN_PERMISSIONS, type AdminPermission, type AdminTeamMember } from '@/lib/adminPerms'
import { ALL_TABS, adminNavEntries, resolveArea, visibleTabs, type AdminTabId } from '@/lib/adminTabs'
import { adminTranslations } from '@/lib/i18n'
import { GET as paymentsGET } from '@/app/api/admin/payments/route'
import { GET as couponsGET } from '@/app/api/admin/coupons/route'
import { GET as giftcardsGET } from '@/app/api/admin/giftcards/route'
import { GET as bansGET } from '@/app/api/admin/bans/route'
import { GET as packagesGET } from '@/app/api/admin/packages/route'
import { GET as apiKeysGET } from '@/app/api/admin/api-keys/route'
import { GET as imagesGET } from '@/app/api/admin/images/route'
import { GET as uploadsGET } from '@/app/api/admin/image-uploads/route'
import { GET as newsGET } from '@/app/api/admin/news-popup/route'
import { GET as teamGET } from '@/app/api/admin/team/route'
import { GET as auditGET } from '@/app/api/admin/audit/route'
import { adminReq, staticCtx } from './helpers'

/**
 * Areas without the permission stay in the sidebar and say what they need
 * (plan 6.6), their page shows that note and no data, and the server still
 * refuses every request behind them. A right: who sees what. Counter-checks
 * in the Phase 10 log.
 */

const c = adminTranslations.en
const member = (...permissions: AdminPermission[]): AdminTeamMember => ({
  discordUserId: '2', displayName: 'Lena', isOwner: false, permissions, active: true,
})
const owner: AdminTeamMember = { discordUserId: '1', displayName: 'Musiker15', isOwner: true, permissions: [], active: true }

function html(node: ReactNode): string {
  return renderToStaticMarkup(createElement(LangProvider, { lang: 'en', path: '/admin' } as ComponentProps<typeof LangProvider>, node))
}

/** The sidebar navigation landmark of the admin. */
function sidebar(markup: string): string {
  const start = markup.indexOf('<nav aria-label="Admin"')
  return markup.slice(start, markup.indexOf('</nav>', start))
}

describe('adminNavEntries', () => {
  it('lists every area, and locks the ones the member may not open', () => {
    const entries = adminNavEntries(member('payments.view')).flatMap(g => g.entries)
    expect(entries.map(e => e.tab.id).sort()).toEqual(ALL_TABS.map(t => t.id).sort())
    const open = entries.filter(e => e.lockedBy === null).map(e => e.tab.id)
    expect(open).toEqual(visibleTabs(member('payments.view')).map(t => t.id))
    expect(entries.find(e => e.tab.id === 'coupons')?.lockedBy).toEqual(['coupons.manage'])
    expect(entries.find(e => e.tab.id === 'images')?.lockedBy).toEqual(['images.view', 'images.manage', 'images.moderate'])
  })

  it('locks nothing for the owner', () => {
    expect(adminNavEntries(owner).flatMap(g => g.entries).every(e => e.lockedBy === null)).toBe(true)
  })

  it.each(ADMIN_PERMISSIONS)('opens exactly what visibleTabs allows with %s', perm => {
    const m = member(perm)
    const open = adminNavEntries(m).flatMap(g => g.entries).filter(e => !e.lockedBy).map(e => e.tab.id)
    expect(open.sort()).toEqual(visibleTabs(m).map(t => t.id).sort())
  })
})

describe('resolveArea', () => {
  it('keeps a known area the member may not open, and marks it locked', () => {
    expect(resolveArea(member('payments.view'), 'team')).toEqual({ id: 'team', locked: true })
    expect(resolveArea(member('payments.view'), 'payments')).toEqual({ id: 'payments', locked: false })
  })

  it('falls back to the overview for anything unknown', () => {
    expect(resolveArea(member(), 'nonsense')).toEqual({ id: 'overview', locked: false })
    expect(resolveArea(member(), undefined)).toEqual({ id: 'overview', locked: false })
  })
})

describe('admin sidebar', () => {
  it('shows a locked area as text with the permission it needs, not as a link', () => {
    const nav = sidebar(html(createElement(AdminShell, { member: member('payments.view'), active: 'overview', onSignOut: () => {} } as ComponentProps<typeof AdminShell>, 'x')))
    expect(nav).toContain('Coupons')
    expect(nav).toContain('Needs Manage coupons')
    expect(nav).toContain('Needs View images, Manage images, or Moderate uploads')
    expect(nav).not.toContain('href="/en/admin?tab=coupons"')
    expect(nav).toContain('href="/en/admin?tab=payments"')
    expect([...nav.matchAll(/<a\b/g)]).toHaveLength(3)
  })
})

describe('locked area page', () => {
  it.each(['team', 'coupons', 'audit', 'images'] as AdminTabId[])('%s shows the note and none of the area', id => {
    const markup = html(createElement(AdminClient, { member: member('payments.view'), initialTab: id }))
    const main = markup.slice(markup.indexOf('<main'))
    expect(main).toContain(c.locked_title)
    expect(main).toContain(`<h1 class="font-display text-[clamp(1.625rem,1.3rem+0.9vw,2.5rem)] font-bold leading-tight tracking-[-0.01em]">${c.tabs[id]}</h1>`)
    // Nothing of the area itself: no loading state that would fetch, no form, no table.
    expect(main).not.toContain('aria-busy')
    expect(main).not.toContain('<form')
    expect(main).not.toContain('<table')
  })

  it('opens an area the member may open', () => {
    const markup = html(createElement(AdminClient, { member: member('payments.view'), initialTab: 'lookup' }))
    expect(markup).not.toContain(c.locked_title)
    expect(markup).toContain(c.lookup.start_title)
  })
})

describe('locked areas on the server', () => {
  beforeAll(() => { process.env.SESSION_SECRET = 'test-secret' })
  beforeEach(() => {
    ;(queryOne as Mock).mockImplementation(async (sql: string) => sql.includes('msk_admin_team')
      ? { discord_user_id: '2', display_name: 'Lena', is_owner: 0, permissions: JSON.stringify(['payments.view']), active: 1 }
      : null)
  })

  it.each([
    ['coupons', couponsGET], ['gift cards', giftcardsGET], ['bans', bansGET], ['packages', packagesGET],
    ['api keys', apiKeysGET], ['images', imagesGET], ['uploads', uploadsGET], ['news popup', newsGET],
    ['team', teamGET], ['audit', auditGET],
  ] as const)('still refuse %s to a member without its permission', async (_name, handler) => {
    const res = await (handler as (req: unknown, ctx: unknown) => Promise<Response>)(adminReq('/api/admin/x', { userId: '2' }), staticCtx)
    expect(res.status).toBe(403)
  })

  it('still serve the areas the member may open', async () => {
    const res = await paymentsGET(adminReq('/api/admin/payments', { userId: '2' }), staticCtx)
    expect(res.status).toBe(200)
  })
})
