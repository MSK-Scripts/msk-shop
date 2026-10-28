'use client'

import type { MouseEvent, ReactNode } from 'react'

import { AppShell, type ShellNavGroup } from '@/components/dashboard/AppShell'
import { useLang } from '@/components/i18n/LangProvider'
import {
  CreditCard, Gift, ImageSquare, Key, ListChecks, MagnifyingGlass, Megaphone, Package,
  Prohibit, ShieldCheck, SquaresFour, Tag, UploadSimple, Users, type IconComponent,
} from '@/components/icons'
import type { AdminTeamMember } from '@/lib/adminPerms'
import { adminNavSections, tabHref, visibleTabs, type AdminTabId } from '@/lib/adminTabs'
import { adminCopy } from '@/lib/i18n'

const ICONS: Record<AdminTabId, IconComponent> = {
  overview:  SquaresFour,
  payments:  CreditCard,
  lookup:    MagnifyingGlass,
  coupons:   Tag,
  giftcards: Gift,
  packages:  Package,
  bans:      Prohibit,
  apikeys:   Key,
  images:    ImageSquare,
  uploads:   UploadSimple,
  newspopup: Megaphone,
  team:      Users,
  audit:     ListChecks,
}

/**
 * The admin inside the shared app shell. English only (decision E3), every
 * string from `adminCopy`, so the language of the address (`/de/admin`)
 * changes nothing but the links.
 *
 * The sidebar offers exactly the tabs `visibleTabs` gives the member, in the
 * groups of plan 6.6. Without `member` it is the sign-in frame.
 */
export function AdminShell({ member, active, onSelect, onSignOut, children }: {
  member?: AdminTeamMember
  /** The open tab; the sidebar marks it. */
  active?: string
  /** Switches the tab in place, see AdminClient. */
  onSelect?: (id: string) => void
  onSignOut?: () => void
  children: ReactNode
}) {
  const { lang } = useLang()
  const c = adminCopy(lang)

  const tabs = member ? visibleTabs(member) : []
  const nav: ShellNavGroup[] | undefined = member
    ? adminNavSections(member).map(section => ({
        id: section.group,
        label: c.groups[section.group] || undefined,
        items: section.tabs.map(tab => ({
          id: tab.id,
          label: c.tabs[tab.id],
          icon: ICONS[tab.id],
          href: tabHref(tabs, tab.id),
        })),
      }))
    : undefined

  // A plain click switches in place; a middle click, Ctrl or Cmd click still
  // opens the tab's own address in a new browser tab.
  function handleNavigate(id: string, event: MouseEvent<HTMLAnchorElement>) {
    if (!onSelect || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onSelect(id)
  }

  return (
    <AppShell
      productName={c.product}
      productIcon={ShieldCheck}
      homeHref="/admin"
      nav={nav}
      currentId={active}
      onNavigate={handleNavigate}
      pageTitle={member && active ? c.tabs[active as AdminTabId] : undefined}
      account={member && onSignOut ? {
        name: member.displayName ?? member.discordUserId,
        detail: member.isOwner ? c.owner : c.member,
        onSignOut,
      } : undefined}
      showLanguage={false}
      copy={{
        nav:        c.nav,
        mobileNav:  c.nav,
        menuOpen:   c.menu_open,
        menuClose:  c.menu_close,
        backToSite: c.back_to_site,
        signOut:    c.sign_out,
        language:   c.language,
        theme:      c.theme,
      }}
    >
      {children}
    </AppShell>
  )
}
