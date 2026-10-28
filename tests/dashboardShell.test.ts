import { createElement, type ComponentProps, type FunctionComponent, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', async importOriginal => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: () => {}, refresh: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => null,
}))

import { LangProvider } from '@/components/i18n/LangProvider'
import { TicketBotShell } from '@/app/[lang]/dashboard/ticket-bot/TicketBotShell'
import { GiveawayShell } from '@/app/[lang]/dashboard/giveaway-bot/GiveawayShell'
import { AdminShell } from '@/app/[lang]/admin/AdminShell'
import type { AdminPermission, AdminTeamMember } from '@/lib/adminPerms'
import { ALL_TABS } from '@/lib/adminTabs'
import type { Lang } from '@/lib/i18n'

/**
 * The app shell of the three dashboards, rendered on the server with fixture
 * data (Phase 7; the dashboards need Discord and the database, which a test
 * run does not have).
 *
 * Checked: the landmarks a screen reader and the skip link rely on, and that
 * each shell offers the entries of the person's role and no others. The
 * rules themselves are in tests/dashboardNav.test.ts; this ties the drawn
 * sidebar to them.
 */

const OWN_A = '111111111111111111'
const OWN_B = '222222222222222222'

function html(lang: Lang, path: string, node: ReactNode): string {
  return renderToStaticMarkup(
    createElement(LangProvider, { lang, path } as ComponentProps<typeof LangProvider>, node),
  )
}

/** The hrefs of the links inside the sidebar navigation landmark. */
function sidebarLinks(markup: string, label: string): string[] {
  const start = markup.indexOf(`<nav aria-label="${label}"`)
  if (start === -1) return []
  const end = markup.indexOf('</nav>', start)
  return [...markup.slice(start, end).matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(m => m[1])
}

function landmarks(markup: string) {
  expect(markup.match(/<main id="main"/g)).toHaveLength(1)
  expect(markup).toMatch(/<header\b/)
}

const content = createElement('p', null, 'content')

/**
 * A shell with `content` inside. The cast only tells createElement that
 * `children` comes as its third argument, as in the other render tests.
 */
function withContent<P extends { children: ReactNode }>(shell: FunctionComponent<P>, props: Omit<P, 'children'>): ReactElement {
  return createElement(shell, props as P, content)
}

describe('ticket bot shell', () => {
  const servers = [
    { id: OWN_A, name: 'Atlas Roleplay', tier: 'premium_plus' as const },
    { id: OWN_B, name: 'Second Home',    tier: 'basic' as const },
  ]

  it('has the landmarks and the four areas of a server with hosting', () => {
    const markup = html('en', `/dashboard/ticket-bot/${OWN_A}`, withContent(TicketBotShell, { servers, currentId: OWN_A }))
    landmarks(markup)
    expect(sidebarLinks(markup, 'Dashboard')).toEqual([
      `/en/dashboard/ticket-bot/${OWN_A}`,
      `/en/dashboard/ticket-bot/${OWN_A}/domains`,
      `/en/dashboard/ticket-bot/${OWN_A}/transcripts`,
      `/en/dashboard/ticket-bot/${OWN_A}/hosting`,
    ])
    expect(markup).toContain('aria-current="page"')
    expect(markup).toContain('<nav aria-label="Main areas"')
  })

  it('offers no hosting for a server whose plan has none', () => {
    const markup = html('de', `/dashboard/ticket-bot/${OWN_B}`, withContent(TicketBotShell, { servers, currentId: OWN_B }))
    const links = sidebarLinks(markup, 'Dashboard')
    expect(links).toHaveLength(3)
    expect(links.some(href => href.endsWith('/hosting'))).toBe(false)
    expect(links[0]).toBe(`/de/dashboard/ticket-bot/${OWN_B}`)
  })

  it('lists only the servers it was given in the switcher', () => {
    const markup = html('en', `/dashboard/ticket-bot/${OWN_A}/hosting`, withContent(TicketBotShell, { servers, currentId: OWN_A }))
    const switcher = [...markup.matchAll(/href="\/en\/dashboard\/ticket-bot\/(\d+)[^"]*"/g)].map(m => m[1])
    expect(new Set(switcher)).toEqual(new Set([OWN_A, OWN_B]))
    // The same area on the other server only where its plan has it.
    expect(markup).toContain(`href="/en/dashboard/ticket-bot/${OWN_B}"`)
    expect(markup).not.toContain(`href="/en/dashboard/ticket-bot/${OWN_B}/hosting"`)
  })

  it('is the signed-out frame without navigation on the sign-in page', () => {
    const markup = html('en', '/dashboard/ticket-bot/verify', withContent(TicketBotShell, { servers: [], currentId: null }))
    landmarks(markup)
    expect(sidebarLinks(markup, 'Dashboard')).toEqual([])
    expect(markup).toContain('content')
  })
})

describe('giveaway shell', () => {
  it('offers the Tebex store to the owner', () => {
    const markup = html('en', '/dashboard/giveaway-bot', withContent(GiveawayShell, { session: { guildId: OWN_A, owner: true } }))
    landmarks(markup)
    expect(sidebarLinks(markup, 'Dashboard')).toEqual([
      '/en/dashboard/giveaway-bot',
      '/en/dashboard/giveaway-bot/giveaways',
      '/en/dashboard/giveaway-bot/templates',
      '/en/dashboard/giveaway-bot/settings',
      '/en/dashboard/giveaway-bot/store',
    ])
  })

  it('offers no store to anyone else', () => {
    const markup = html('de', '/dashboard/giveaway-bot', withContent(GiveawayShell, { session: { guildId: OWN_A, owner: false } }))
    expect(sidebarLinks(markup, 'Dashboard')).not.toContain('/de/dashboard/giveaway-bot/store')
    expect(sidebarLinks(markup, 'Dashboard')).toHaveLength(4)
  })

  it('is the signed-out frame without navigation on the sign-in page', () => {
    const markup = html('en', '/dashboard/giveaway-bot/verify', withContent(GiveawayShell, { session: null }))
    landmarks(markup)
    expect(sidebarLinks(markup, 'Dashboard')).toEqual([])
  })
})

describe('admin shell', () => {
  const member = (isOwner: boolean, ...permissions: AdminPermission[]): AdminTeamMember => ({
    discordUserId: '2', displayName: 'Musiker15', isOwner, permissions, active: true,
  })

  it('offers a member the tabs of their permissions only', () => {
    const markup = html('en', '/admin', withContent(AdminShell, { member: member(false, 'payments.view'), active: 'overview', onSignOut: () => {} }))
    landmarks(markup)
    expect(sidebarLinks(markup, 'Admin')).toEqual(['/en/admin', '/en/admin?tab=payments', '/en/admin?tab=lookup'])
  })

  it('offers the owner every tab, in the language of the address', () => {
    const markup = html('de', '/admin', withContent(AdminShell, { member: member(true), active: 'overview', onSignOut: () => {} }))
    const links = sidebarLinks(markup, 'Admin')
    expect(links).toHaveLength(ALL_TABS.length)
    expect(links.every(href => href.startsWith('/de/admin'))).toBe(true)
  })

  it('is the signed-out frame without navigation on the sign-in page', () => {
    const markup = html('en', '/admin', withContent(AdminShell, {}))
    landmarks(markup)
    expect(sidebarLinks(markup, 'Admin')).toEqual([])
  })
})
