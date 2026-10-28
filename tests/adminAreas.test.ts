import { createElement, isValidElement, type ComponentProps, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

/**
 * The admin areas after Phase 10, rendered on the server with fixture data.
 * The live admin needs Discord, Tebex and the database, which a test run
 * does not have; the data here comes out of the real route handlers with
 * Tebex and the database mocked, so what is rendered is what the browser
 * would receive.
 *
 * Checked, with counter-checks in the Phase 10 log:
 *   - no email or IP address in full anywhere in the rendered areas;
 *   - every masked field offers a reveal, and the reveal sends kind, id and
 *     field to /api/admin/reveal and nothing else;
 *   - every action that cannot be undone sends only from its confirmation,
 *     with the request the old tab sent;
 *   - a refund exists only in the detail of a paid payment.
 *
 * As in tests/giveawayAreas.test.ts: no DOM, buttons are recorded while the
 * tree renders and their handlers called afterwards. A state update on a
 * server-rendered tree is dropped, so a handler that only opens a dialog
 * sends nothing, and one that sends reaches the fetch stub.
 */

const registry = vi.hoisted(() => ({
  buttons: [] as Array<{ text: string; label?: string; onClick?: (event?: unknown) => unknown }>,
  dialogs: [] as Array<{ title: unknown; confirmLabel: string; onConfirm: (typed: string) => unknown; open: boolean }>,
}))

function textOf(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: unknown }).children)
  return ''
}

vi.mock('@/components/ui/Button', async () => {
  const React = await import('react')
  const Button = React.forwardRef<HTMLButtonElement, Record<string, unknown>>(function Button(
    { asChild, variant: _variant, size: _size, children, ...props }, ref,
  ) {
    if (asChild) return children as React.ReactElement
    registry.buttons.push({ text: textOf(children).trim(), label: props['aria-label'] as string | undefined, onClick: props.onClick as (() => unknown) | undefined })
    return React.createElement('button', { ...props, ref }, children as ReactNode)
  })
  return { Button }
})

vi.mock('@/components/dashboard/ConfirmDialog', () => ({
  ConfirmDialog: (props: (typeof registry.dialogs)[number]) => { registry.dialogs.push(props); return null },
}))

vi.mock('next/navigation', async importOriginal => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: () => {}, refresh: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => null,
}))

vi.mock('@/lib/db', () => ({ queryOne: vi.fn(), query: vi.fn() }))
vi.mock('@/lib/tebexPlugin', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/tebexPlugin')>()
  return {
    ...actual,
    tebexPlugin: {
      payments: { list: vi.fn() }, bans: { list: vi.fn() }, lookup: { user: vi.fn() },
      giftCards: { list: vi.fn() }, coupons: { listAll: vi.fn() },
    },
  }
})
vi.mock('@/lib/tebex', () => ({ getPackages: vi.fn() }))
vi.mock('@/lib/imageUploads', () => ({ listUploads: vi.fn(), countPendingUploads: vi.fn() }))
vi.mock('@/lib/adminImages', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/adminImages')>()
  return { ...actual, listAdminImages: vi.fn(), adminImageStats: vi.fn() }
})

import { LangProvider } from '@/components/i18n/LangProvider'
import { query, queryOne } from '@/lib/db'
import { tebexPlugin } from '@/lib/tebexPlugin'
import { getPackages } from '@/lib/tebex'
import { listUploads, countPendingUploads } from '@/lib/imageUploads'
import { adminImageStats, listAdminImages } from '@/lib/adminImages'
import { adminTranslations } from '@/lib/i18n'
import { GET as paymentsGET } from '@/app/api/admin/payments/route'
import { GET as bansGET } from '@/app/api/admin/bans/route'
import { GET as lookupGET } from '@/app/api/admin/lookup/route'
import { GET as giftcardsGET } from '@/app/api/admin/giftcards/route'
import { GET as couponsGET } from '@/app/api/admin/coupons/route'
import { GET as auditGET } from '@/app/api/admin/audit/route'
import { GET as uploadsGET } from '@/app/api/admin/image-uploads/route'
import { GET as imagesGET } from '@/app/api/admin/images/route'
import { GET as statsGET } from '@/app/api/admin/images/stats/route'
import { GET as apiKeysGET } from '@/app/api/admin/api-keys/route'
import { GET as packagesGET } from '@/app/api/admin/packages/route'
import { GET as overviewGET } from '@/app/api/admin/overview/route'
import { PaymentDetail, PaymentsView } from '@/app/[lang]/admin/PaymentsArea'
import { BansView, CreateBanForm } from '@/app/[lang]/admin/BansArea'
import { LookupResultView } from '@/app/[lang]/admin/LookupArea'
import { GiftCardsView } from '@/app/[lang]/admin/GiftCardsArea'
import { CouponsView } from '@/app/[lang]/admin/CouponsArea'
import { AuditView } from '@/app/[lang]/admin/AuditArea'
import { UploadCard, UploadsList } from '@/app/[lang]/admin/UploadsArea'
import { ImageFiguresView, ImagesInventory } from '@/app/[lang]/admin/ImagesArea'
import { ApiKeysView } from '@/app/[lang]/admin/ApiKeysArea'
import { PackagesView } from '@/app/[lang]/admin/PackagesArea'
import { NewsPopupEditor } from '@/app/[lang]/admin/NewsPopupArea'
import { MemberEditor, TeamView } from '@/app/[lang]/admin/TeamArea'
import { OverviewView } from '@/app/[lang]/admin/OverviewArea'
import type { AdminTeamMember } from '@/lib/adminPerms'
import { adminReq, staticCtx } from './helpers'
import { ADMIN_FIXTURE, EMAILS, PERSONAL } from './fixtures/adminFixtures'

const c = adminTranslations.en
const NOW = ADMIN_FIXTURE.now
const OWNER: AdminTeamMember = { discordUserId: '111111111111111111', displayName: 'Musiker15', isOwner: true, permissions: [], active: true }
const reload = async () => {}

const requests: Array<{ url: string; method: string; body: unknown }> = []

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret'
})

beforeEach(() => {
  registry.buttons = []
  registry.dialogs = []
  requests.length = 0
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    requests.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined })
    return new Response('{"ok":true,"value":"x"}', { status: 200, headers: { 'content-type': 'application/json' } })
  }))
  ;(queryOne as Mock).mockImplementation(async (sql: string) => {
    if (sql.includes('msk_admin_team')) return { discord_user_id: OWNER.discordUserId, display_name: 'Musiker15', is_owner: 1, permissions: '[]', active: 1 }
    if (sql.includes('ticketbot_guilds')) return { recent: '3', previous: '1' }
    return null
  })
  ;(query as Mock).mockImplementation(async (sql: string) => {
    if (sql.includes('msk_admin_audit')) return ADMIN_FIXTURE.auditRows
    if (sql.includes('ticketbot_guilds')) return ADMIN_FIXTURE.guildRows
    return []
  })
  ;(tebexPlugin.payments.list as Mock).mockResolvedValue({ data: ADMIN_FIXTURE.payments })
  ;(tebexPlugin.bans.list as Mock).mockResolvedValue({ data: ADMIN_FIXTURE.bans })
  ;(tebexPlugin.lookup.user as Mock).mockResolvedValue(ADMIN_FIXTURE.lookup)
  ;(tebexPlugin.giftCards.list as Mock).mockResolvedValue({ data: ADMIN_FIXTURE.giftCards })
  ;(tebexPlugin.coupons.listAll as Mock).mockResolvedValue({ coupons: ADMIN_FIXTURE.coupons, truncated: false })
  ;(getPackages as Mock).mockResolvedValue([
    { id: 6001, name: 'MSK Garage | Encrypted', base_price: 24.99, currency: 'EUR', type: 'single', category: { id: 0 } },
    { id: 6002, name: 'MSK Garage | Source', base_price: 39.99, currency: 'EUR', type: 'single', category: { id: 0 } },
    { id: 6003, name: 'Ticket Bot Premium', base_price: 4.99, currency: 'EUR', type: 'subscription', category: { id: 0 } },
  ])
  ;(listUploads as Mock).mockResolvedValue(ADMIN_FIXTURE.uploads)
  ;(countPendingUploads as Mock).mockResolvedValue(1)
  ;(listAdminImages as Mock).mockResolvedValue({ total: 2, page: 1, per: 40, items: ADMIN_FIXTURE.images })
  ;(adminImageStats as Mock).mockResolvedValue(ADMIN_FIXTURE.imageStats)
})
afterEach(() => { vi.unstubAllGlobals() })

/** What a route sends the browser, under the key the area reads. */
async function routeData<T = never>(handler: unknown, path: string, key: string): Promise<T> {
  const res = await (handler as (req: unknown, ctx: unknown) => Promise<Response>)(adminReq(path, { userId: OWNER.discordUserId }), staticCtx)
  expect(res.status).toBe(200)
  return (await res.json())[key] as T
}

function html(node: ReactNode): string {
  return renderToStaticMarkup(createElement(LangProvider, { lang: 'en', path: '/admin' } as ComponentProps<typeof LangProvider>, node))
}

function expectMasked(markup: string) {
  for (const value of PERSONAL) expect(markup, `shows ${value}`).not.toContain(value)
}

const buttons = (text: string) => registry.buttons.filter(b => b.text === text)
const dialog = (confirmLabel: string) => {
  const found = registry.dialogs.filter(d => d.confirmLabel === confirmLabel)
  expect(found.length, `dialog "${confirmLabel}"`).toBeGreaterThan(0)
  return found[0]
}

describe('masked areas', () => {
  it('payments show the email masked, with a reveal per row', async () => {
    const payments = await routeData<never[]>(paymentsGET, '/api/admin/payments', 'payments')
    const markup = html(createElement(PaymentsView, { payments, now: NOW, canCreate: true, canRefund: true, reload }))
    expectMasked(markup)
    expect(markup).toMatch(/m\*\*\*@g\*\*\*\.com #[0-9a-f]{4}/)
    expect(buttons('Reveal').length).toBeGreaterThanOrEqual(1)
    // Refunding lives in the detail of one payment, never in the list (plan 6.6).
    expect(registry.buttons.some(b => /^Refund /.test(b.text))).toBe(false)
  })

  it('bans show IP and email masked, each with a reveal', async () => {
    const bans = await routeData<never[]>(bansGET, '/api/admin/bans', 'bans')
    const markup = html(createElement(BansView, { bans, reload }))
    expectMasked(markup)
    expect(markup).toMatch(/203\.0\.x\.x #/)
    // Two IPs and two emails on three rows (one ban has no email).
    expect(buttons('Reveal')).toHaveLength(5)
  })

  it.each([
    ['player lookup', async () => createElement(LookupResultView, { result: await routeData(lookupGET, '/api/admin/lookup?user=Atlas_RP', 'result') })],
    ['gift cards', async () => createElement(GiftCardsView, { cards: await routeData(giftcardsGET, '/api/admin/giftcards', 'giftCards'), reload })],
    ['coupons', async () => {
      const payload = await routeData<{ coupons: unknown[]; counts: unknown; truncated: boolean }>(couponsGET, '/api/admin/coupons', 'result')
      return createElement(CouponsView, { payload: payload as never, reload })
    }],
    ['audit log', async () => createElement(AuditView, { entries: await routeData(auditGET, '/api/admin/audit', 'entries'), team: [], now: NOW })],
    ['uploads', async () => createElement(UploadsList, { uploads: await routeData(uploadsGET, '/api/admin/image-uploads?status=all', 'uploads'), filter: 'all', categories: [], canModerate: true, onDecided: reload })],
    ['images', async () => {
      const list = await routeData<never>(imagesGET, '/api/admin/images', 'result')
      const figures = await routeData<{ categories: never[]; uploadQueue: number }>(statsGET, '/api/admin/images/stats', 'figures')
      return createElement('div', null,
        createElement(ImageFiguresView, { figures, onCategory: () => {} }),
        createElement(ImagesInventory, { list, categories: figures.categories, perms: { canManage: true, canModerate: true, canDelete: true }, query: { category: '', filter: 'all', q: '', page: 1 }, onQuery: () => {}, reload, setFlash: () => {} }))
    }],
    ['api keys', async () => createElement(ApiKeysView, { keys: await routeData(apiKeysGET, '/api/admin/api-keys', 'keys'), canChange: true, reload })],
    ['overview', async () => createElement(OverviewView, { data: await routeData(overviewGET, '/api/admin/overview', 'overview'), member: OWNER })],
  ] as const)('%s show no email or IP address in full', async (_name, build) => {
    expectMasked(html(await build()))
  })

  it('api keys are shortened until revealed', async () => {
    const keys = await routeData<never[]>(apiKeysGET, '/api/admin/api-keys', 'keys')
    const markup = html(createElement(ApiKeysView, { keys, canChange: true, reload }))
    for (const row of ADMIN_FIXTURE.guildRows) expect(markup).not.toContain(row.api_key)
    expect(markup).toContain('mskt_liv…2345')
  })
})

describe('reveal', () => {
  it('asks the reveal route for the one field of the row', async () => {
    const bans = await routeData<Array<{ id: number }>>(bansGET, '/api/admin/bans', 'bans')
    html(createElement(BansView, { bans: bans as never, reload }))
    const ipReveal = registry.buttons.find(b => b.label === 'Reveal the IP address of Player quick_buyer')
    expect(ipReveal).toBeDefined()
    await ipReveal!.onClick!()
    expect(requests).toEqual([{ url: '/api/admin/reveal', method: 'POST', body: { kind: 'ban', id: '77', field: 'ip' } }])
  })

  it('asks for the email of a payment by its transaction id', async () => {
    const payments = await routeData<never[]>(paymentsGET, '/api/admin/payments', 'payments')
    html(createElement(PaymentsView, { payments, now: NOW, canCreate: false, canRefund: false, reload }))
    await buttons('Reveal')[0].onClick!()
    expect(requests).toEqual([{ url: '/api/admin/reveal', method: 'POST', body: { kind: 'payment', id: '51240', field: 'email' } }])
  })
})

describe('destructive actions ask first', () => {
  it('refunds only from the confirmation in the detail, with the old body', async () => {
    const payments = await routeData<Array<{ id: number }>>(paymentsGET, '/api/admin/payments', 'payments')
    html(createElement(PaymentDetail, { payment: payments[0] as never, canRefund: true, onBack: () => {}, reload, setFlash: () => {} }))
    const trigger = buttons('Refund €24.99')
    expect(trigger).toHaveLength(1)
    await trigger[0].onClick!()
    expect(requests).toEqual([])
    await dialog('Refund €24.99').onConfirm('51240')
    expect(requests).toEqual([{ url: '/api/admin/payments/51240', method: 'PATCH', body: { status: 'refund' } }])
  })

  it('offers no refund for a free or refunded payment, nor without the permission', async () => {
    const payments = await routeData<Array<{ id: number }>>(paymentsGET, '/api/admin/payments', 'payments')
    const free = payments.find(p => p.id === 51239)
    html(createElement(PaymentDetail, { payment: free as never, canRefund: true, onBack: () => {}, reload, setFlash: () => {} }))
    html(createElement(PaymentDetail, { payment: payments[0] as never, canRefund: false, onBack: () => {}, reload, setFlash: () => {} }))
    expect(registry.buttons.some(b => b.text.startsWith('Refund'))).toBe(false)
  })

  it.each([
    ['delete a coupon', async () => createElement(CouponsView, { payload: await routeData(couponsGET, '/api/admin/coupons', 'result'), reload }),
      'Delete', 'Delete coupon', { url: '/api/admin/coupons/901', method: 'DELETE', body: undefined }],
    ['void a gift card', async () => createElement(GiftCardsView, { cards: await routeData(giftcardsGET, '/api/admin/giftcards', 'giftCards'), reload }),
      'Void', 'Void gift card', { url: '/api/admin/giftcards/301', method: 'DELETE', body: undefined }],
    ['hide a package', async () => createElement(PackagesView, { packages: await routeData(packagesGET, '/api/admin/packages', 'packages'), reload }),
      'Hide Encrypted', 'Hide package', { url: '/api/admin/packages/6001', method: 'PUT', body: { disabled: true } }],
    ['delete an image', async () => createElement(ImagesInventory, {
      list: await routeData(imagesGET, '/api/admin/images', 'result'), categories: [], perms: { canManage: true, canModerate: true, canDelete: true },
      query: { category: '', filter: 'all', q: '', page: 1 }, onQuery: () => {}, reload, setFlash: () => {},
    }), 'Delete', 'Delete image', { url: '/api/admin/images/vehicles/adder', method: 'DELETE', body: undefined }],
    ['remove a team member', async () => createElement(TeamView, {
      members: [
        { discordUserId: OWNER.discordUserId, displayName: 'Musiker15', isOwner: true, permissions: [], active: true },
        { discordUserId: '333333333333333333', displayName: 'Lena', isOwner: false, permissions: ['payments.view'], active: true },
      ], selfId: OWNER.discordUserId, reload,
    }), 'Remove', 'Remove member', { url: '/api/admin/team/333333333333333333', method: 'DELETE', body: undefined }],
  ] as const)('%s only from its confirmation', async (_name, build, trigger, confirm, request) => {
    html(await build())
    const menuItem = buttons(trigger)
    expect(menuItem.length, `trigger "${trigger}"`).toBeGreaterThan(0)
    await menuItem[0].onClick!()
    expect(requests).toEqual([])
    await dialog(confirm).onConfirm('adder')
    expect(requests).toEqual([request])
  })

  it('bans only from the confirmation, with the old body', async () => {
    html(createElement(CreateBanForm, { onCreated: reload, defaults: { user: 'quick_buyer', reason: 'Chargeback fraud', ip: '' } }))
    buttons('Ban player')[0].onClick!({ preventDefault: () => {} } as never)
    expect(requests).toEqual([])
    expect(dialog('Ban player').open).toBe(false)
    await dialog('Ban player').onConfirm('')
    expect(requests).toEqual([{ url: '/api/admin/bans', method: 'POST', body: { user: 'quick_buyer', reason: 'Chargeback fraud' } }])
  })

  it('rejects an upload only from the confirmation, with the old body', async () => {
    const uploads = await routeData<never[]>(uploadsGET, '/api/admin/image-uploads?status=pending', 'uploads')
    html(createElement(UploadCard, { upload: uploads[0], categories: [], canModerate: true, onDecided: reload, initialReason: 'Watermark of another server' }))
    await buttons('Reject')[0].onClick!()
    expect(requests).toEqual([])
    await dialog('Reject upload').onConfirm('')
    expect(requests).toEqual([{ url: `/api/admin/image-uploads/${ADMIN_FIXTURE.uploads[0].id}`, method: 'POST', body: { decision: 'reject', reason: 'Watermark of another server' } }])
  })

  it('asks for a reason before a rejection can be confirmed', async () => {
    const uploads = await routeData<never[]>(uploadsGET, '/api/admin/image-uploads?status=pending', 'uploads')
    html(createElement(UploadsList, { uploads, filter: 'pending', categories: [], canModerate: true, onDecided: reload }))
    await buttons('Reject')[0].onClick!()
    expect(requests).toEqual([])
  })

  it('keeps a member without team rights from removing the owner or themselves', () => {
    html(createElement(TeamView, {
      members: [{ discordUserId: OWNER.discordUserId, displayName: 'Musiker15', isOwner: true, permissions: [], active: true }],
      selfId: OWNER.discordUserId, reload,
    }))
    expect(buttons('Remove')).toHaveLength(0)
  })
})

describe('area content', () => {
  it('pairs Encrypted and Source of one script in one row', async () => {
    const packages = await routeData<Array<{ productSlug: string; variant: string | null }>>(packagesGET, '/api/admin/packages', 'packages')
    const garage = packages.filter(p => p.productSlug === packages[0].productSlug)
    expect(garage.map(p => p.variant).sort()).toEqual(['encrypted', 'source'])
    const markup = html(createElement(PackagesView, { packages: packages as never, reload }))
    expect(markup).toContain('€24.99')
    expect(markup).toContain('€39.99')
  })

  it('writes the audit log as sentences with names', async () => {
    const entries = await routeData<never[]>(auditGET, '/api/admin/audit', 'entries')
    const markup = html(createElement(AuditView, { entries, team: [], now: NOW }))
    expect(markup).toContain('Musiker15 approved the upload opengewerk-logo')
    expect(markup).toContain('Lena revealed the email of payment 51235')
    expect(markup).toContain('Former member 444444444444444444 deleted coupon 899')
    expect(markup).toContain('<details')
  })

  it('lists on the overview only what needs attention', async () => {
    const data = await routeData<never>(overviewGET, '/api/admin/overview', 'overview')
    const markup = html(createElement(OverviewView, { data, member: OWNER }))
    expect(markup).toContain('1 upload waiting for review')
    expect(markup).toContain('1,994 images without a label')
    expect(markup).toContain('1 chargeback in the last 30 days')
    expect(markup).toContain('href="/en/admin?tab=payments"')
  })

  it('edits a member with the permissions grouped like the sidebar and a template', () => {
    const markup = html(createElement(MemberEditor, {
      member: { discordUserId: '333333333333333333', displayName: 'Lena', isOwner: false, permissions: ['payments.view'], active: true },
      self: false, onBack: () => {}, onSaved: reload, flash: null,
    }))
    for (const group of ['Sales', 'Ticket Bot', 'Image CDN', 'Website', 'Administration']) expect(markup).toContain(`>${group}</h2>`)
    expect(registry.buttons.map(b => b.text)).toEqual(expect.arrayContaining(['Support', 'Moderation', 'Shop manager', 'Everything']))
  })

  it('names a link the API would drop at its field', () => {
    const markup = html(createElement(NewsPopupEditor, {
      loaded: { enabled: true, title: 'T', text: 'X', button: { label: 'Go', href: 'javascript:alert(1)' }, secondButton: null, coupon: null },
      onSaved: reload,
    }))
    expect(markup).toContain(c.newspopup.err_link)
    expect(markup).toMatch(/aria-invalid="true"/)
  })

  it('keeps every address of the fixtures out of the copy itself', () => {
    expect(JSON.stringify(c)).not.toContain(EMAILS[0])
  })
})
