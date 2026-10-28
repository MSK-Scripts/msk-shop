'use client'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { LanguageLinks } from '@/components/i18n/LanguageDropdown'
import { useLang } from '@/components/i18n/LangProvider'
import { AccountSections, type AccountState } from '@/components/layout/AccountMenu'
import { PanelLink } from '@/components/layout/MainNav'
import { aboutLink, isWithin, prefetchFor, productLines } from '@/components/layout/navigation'
import { layoutTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export const MOBILE_MENU_ID = 'mobile-menu'

/**
 * The menu below 1280 px: the three product lines as the top level with
 * their pages below (plan 5.3), then account, language and appearance. Cart
 * and the menu button stay in the bar.
 *
 * A disclosure below the bar, not a modal: the page stays where it is, the
 * panel scrolls on its own, and the button that opened it closes it again.
 */
export function MobileMenu({
  open, account, onNavigate, className,
}: {
  open: boolean
  account: AccountState
  onNavigate: () => void
  className?: string
}) {
  const { lang, path } = useLang()
  const t = layoutTranslations[lang]
  const about = aboutLink(lang)

  return (
    <div
      id={MOBILE_MENU_ID}
      hidden={!open}
      className={cn(
        'max-h-[calc(100dvh-var(--header-height)-5px)] overflow-y-auto overscroll-contain border-t border-[var(--color-border)] bg-[var(--color-card)]',
        className,
      )}
    >
      <div className="container-page grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-12">
        <nav aria-label={t.nav_main} className="@container">
          <ul className="grid gap-6 @lg:grid-cols-2 @lg:gap-x-8">
            {productLines(lang).map(line => (
              <li key={line.id} className="grid content-start gap-1">
                <Link
                  href={line.href}
                  prefetch={prefetchFor(line.href)}
                  onClick={onNavigate}
                  aria-current={path === line.href ? 'page' : isWithin(path, line.matches) ? 'true' : undefined}
                  className="inline-flex min-h-11 items-center self-start font-display text-h3 font-[650] text-[var(--color-foreground)] aria-[current]:shadow-[inset_0_-3px_0_var(--color-primary)]"
                >
                  {line.label}
                </Link>
                <ul className="grid gap-0.5">
                  {line.links.map(link => (
                    <li key={link.href}>
                      <PanelLink link={link} newTab={t.nav_new_tab} onNavigate={onNavigate} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            <li>
              <Link
                href={about.href}
                prefetch={prefetchFor(about.href)}
                onClick={onNavigate}
                aria-current={path === about.href ? 'page' : undefined}
                className="inline-flex min-h-11 items-center font-display text-h3 font-[650] text-[var(--color-foreground)] aria-[current]:shadow-[inset_0_-3px_0_var(--color-primary)]"
              >
                {about.label}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="grid content-start gap-6 border-t border-[var(--color-border)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <AccountSections account={account} onNavigate={onNavigate} />
          <div className="grid gap-2">
            <p className="kicker">{t.action_language}</p>
            <LanguageLinks className="grid" />
          </div>
        </div>
      </div>
    </div>
  )
}
