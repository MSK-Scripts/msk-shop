'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { AppShell, type ShellNavGroup } from '@/components/dashboard/AppShell'
import { ServerSwitcher } from '@/components/dashboard/ServerSwitcher'
import { useLang } from '@/components/i18n/LangProvider'
import { GearSix, Gift, Layout, SquaresFour, Storefront, type IconComponent } from '@/components/icons'
import { dashboardShellTranslations } from '@/lib/i18n'
import { giveawayHref, giveawaySections, type GiveawaySection } from '@/lib/dashboardNav'

const ICONS: Record<GiveawaySection, IconComponent> = {
  overview:  SquaresFour,
  giveaways: Gift,
  templates: Layout,
  settings:  GearSix,
  store:     Storefront,
}

/**
 * The giveaway dashboard inside the shared app shell.
 *
 * A giveaway session is bound to exactly one server, so the switcher shows
 * that one and offers the way back to the server choice; it lists nothing
 * the session does not already carry. `session` is null on the sign-in page.
 */
export function GiveawayShell({ session, children }: {
  session: { guildId: string; owner: boolean } | null
  children: ReactNode
}) {
  const { lang, path, localize } = useLang()
  const s = dashboardShellTranslations[lang]
  const router = useRouter()

  const labels: Record<GiveawaySection, string> = {
    overview:  s.nav_overview,
    giveaways: s.gw_nav_giveaways,
    templates: s.gw_nav_templates,
    settings:  s.gw_nav_settings,
    store:     s.gw_nav_store,
  }

  const sections = session ? giveawaySections(session.owner) : []
  const nav: ShellNavGroup[] | undefined = session
    ? [{
        id: 'server',
        items: sections.map((id, i) => ({
          // The bar at the bottom of a phone holds four: the store, used
          // once to connect Tebex, stays in the menu.
          id, label: labels[id], icon: ICONS[id], href: giveawayHref(id), mobile: i < 4,
        })),
      }]
    : undefined
  const current = sections.find(id => giveawayHref(id) === path)

  async function signOut() {
    await fetch('/api/giveaway/logout', { method: 'POST' })
    router.push(localize('/dashboard/giveaway-bot/verify'))
  }

  return (
    <AppShell
      productName={s.gw_product}
      productIcon={Gift}
      homeHref={session ? giveawayHref('overview') : '/dashboard/giveaway-bot/verify'}
      nav={nav}
      pageTitle={current ? labels[current] : undefined}
      switcher={session && (
        <ServerSwitcher
          servers={[{
            id: session.guildId,
            name: s.gw_server_name.replace('{id}', session.guildId),
            detail: session.owner ? s.gw_owner : undefined,
            href: giveawayHref('overview'),
          }]}
          currentId={session.guildId}
          addHref="/dashboard/giveaway-bot/verify"
          copy={{
            label:       s.switcher_label,
            switchLabel: s.switcher_switch,
            none:        s.switcher_none,
            add:         s.gw_switch_server,
            missing:     s.gw_missing_server,
          }}
        />
      )}
      account={session ? { name: s.signed_in_discord, onSignOut: signOut } : undefined}
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
