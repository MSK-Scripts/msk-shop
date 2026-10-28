'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell, type ShellNavGroup } from '@/components/dashboard/AppShell'
import { ServerSwitcher } from '@/components/dashboard/ServerSwitcher'
import { useLang } from '@/components/i18n/LangProvider'
import { FileText, Globe, HardDrives, SquaresFour, Ticket, type IconComponent } from '@/components/icons'
import { dashboardShellTranslations, dashboardTranslations } from '@/lib/i18n'
import { ticketBotHref, ticketBotSectionOf, ticketBotSections, type TicketBotSection } from '@/lib/dashboardNav'
import type { Tier } from '@/lib/tiers'

export interface ShellServer {
  id:   string
  name: string | null
  tier: Tier
}

const ICONS: Record<TicketBotSection, IconComponent> = {
  overview:    SquaresFour,
  domains:     Globe,
  transcripts: FileText,
  hosting:     HardDrives,
}

/**
 * The ticket bot dashboard inside the shared app shell.
 *
 * Everything it gets is already filtered by the server: `servers` are the
 * servers of the session's Discord user, `currentId` is one of them or null.
 * It draws them, it decides nothing.
 */
export function TicketBotShell({ servers, currentId, children }: {
  /** Empty when signed out: the shell then shows no navigation. */
  servers: ShellServer[]
  currentId: string | null
  children: ReactNode
}) {
  const { lang, path, localize } = useLang()
  const s = dashboardShellTranslations[lang]
  const d = dashboardTranslations[lang]
  const router = useRouter()

  const signedIn = servers.length > 0
  const current = servers.find(sv => sv.id === currentId) ?? null
  const section = ticketBotSectionOf(path) ?? 'overview'

  const labels: Record<TicketBotSection, string> = {
    overview:    s.nav_overview,
    domains:     s.tb_nav_domains,
    transcripts: s.tb_nav_transcripts,
    hosting:     s.tb_nav_hosting,
  }

  const nav: ShellNavGroup[] | undefined = signedIn
    ? [{
        id: 'server',
        items: current
          ? ticketBotSections(current.tier).map(id => ({
              id, label: labels[id], icon: ICONS[id], href: ticketBotHref(current.id, id), mobile: true,
            }))
          : [],
      }]
    : undefined

  const tierLabel = (tier: Tier) => d[`tier_${tier}` as 'tier_basic' | 'tier_premium' | 'tier_premium_plus']

  async function signOut() {
    try {
      await fetch('/api/dashboard/logout', { method: 'POST' })
    } catch { /* leave even on network error */ }
    // refresh() after push(): the verify page reads the session cookie
    // server-side, and that has just been deleted.
    router.push(localize('/dashboard/ticket-bot/verify'))
    router.refresh()
  }

  return (
    <AppShell
      productName={s.tb_product}
      productIcon={Ticket}
      homeHref={current ? ticketBotHref(current.id, 'overview') : signedIn ? '/dashboard/ticket-bot' : '/dashboard/ticket-bot/verify'}
      nav={nav}
      pageTitle={signedIn && current ? labels[section] : undefined}
      switcher={signedIn && (
        <ServerSwitcher
          servers={servers.map(sv => ({
            id: sv.id,
            name: sv.name,
            detail: tierLabel(sv.tier),
            // Same area on the other server where its plan has it.
            href: ticketBotHref(sv.id, ticketBotSections(sv.tier).includes(section) ? section : 'overview'),
          }))}
          currentId={current?.id ?? null}
          addHref="/dashboard/ticket-bot/verify"
          copy={{
            label:       s.switcher_label,
            switchLabel: s.switcher_switch,
            none:        s.switcher_none,
            add:         s.tb_add_server,
            missing:     s.tb_missing_server,
          }}
        />
      )}
      account={signedIn ? { name: s.signed_in_discord, onSignOut: signOut } : undefined}
      copy={{
        nav:        s.nav,
        mobileNav:  s.mobile_nav,
        menuOpen:   s.menu_open,
        menuClose:  s.menu_close,
        backToSite: s.back_to_site,
        signOut:    s.sign_out,
        language:   s.language,
      }}
    >
      {children}
    </AppShell>
  )
}
