'use client'

import { useRef, useState } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowSquareOut, CaretDown } from '@/components/icons'
import { useLang } from '@/components/i18n/LangProvider'
import { useDismiss } from '@/components/layout/useDismiss'
import { aboutLink, isWithin, prefetchFor, productLines, type NavLink } from '@/components/layout/navigation'
import { layoutTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/** `aria-current` for a top-level item: `page` on the page itself, `true` below it. */
function currentFor(path: string, href: string, matches: string[]): 'page' | 'true' | undefined {
  if (path === href) return 'page'
  return isWithin(path, matches) ? 'true' : undefined
}

// The active product line gets the green underline (plan 4.4).
const topLinkClass =
  'inline-flex min-h-11 items-center font-medium text-[var(--color-foreground)] transition-colors duration-150 ' +
  'hover:text-[var(--color-primary)] aria-[current]:font-semibold aria-[current]:shadow-[inset_0_-3px_0_var(--color-primary)]'

/** One entry of a product line's panel: name, one line of description. */
export function PanelLink({ link, onNavigate, newTab }: { link: NavLink; onNavigate?: () => void; newTab: string }) {
  const inner = (
    <>
      <span className="flex items-center gap-1.5 font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
        {link.label}
        {link.external && <ArrowSquareOut className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />}
      </span>
      {link.description && (
        <span className="text-small text-[var(--color-muted-foreground)]">{link.description}</span>
      )}
      {link.external && <span className="sr-only"> {newTab}</span>}
    </>
  )
  const cls = 'group grid min-h-11 content-center gap-0.5 rounded-md px-3 py-2 transition-colors duration-150 hover:bg-[var(--color-muted)]'
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={cls}>{inner}</a>
  ) : (
    <Link href={link.href} prefetch={prefetchFor(link.href)} onClick={onNavigate} className={cls}>{inner}</Link>
  )
}

/**
 * Main navigation from 1280 px: the three product lines and the about page,
 * visible at the top rather than behind a collective menu (plan 5.3).
 *
 * Each product line is a link to its overview plus a small button that opens
 * a panel with its pages, the disclosure pattern for navigation: the link
 * still navigates, the button is reachable by keyboard, Escape closes and
 * returns the focus. With a mouse, hovering the entry opens the panel too,
 * which did best in desktop tests (Baymard).
 */
export function MainNav({ className }: { className?: string }) {
  const { lang, path } = useLang()
  const t = layoutTranslations[lang]
  const lines = productLines(lang)
  const about = aboutLink(lang)
  const [open, setOpen] = useState<string | null>(null)
  const ref = useRef<HTMLUListElement>(null)

  useDismiss(open !== null, ref, reason => {
    if (reason === 'escape' && open) document.getElementById(`nav-toggle-${open}`)?.focus()
    setOpen(null)
  })

  return (
    <nav aria-label={t.nav_main} className={className}>
      <ul ref={ref} className="flex items-center gap-[clamp(0.75rem,1.6vw,2.25rem)]">
        {lines.map(line => {
          const isOpen = open === line.id
          const panelId = `nav-panel-${line.id}`
          return (
            <li
              key={line.id}
              className="relative flex items-center"
              onMouseEnter={() => setOpen(line.id)}
              onMouseLeave={() => setOpen(current => (current === line.id ? null : current))}
              onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setOpen(current => (current === line.id ? null : current))
                }
              }}
            >
              <Link
                href={line.href}
                prefetch={prefetchFor(line.href)}
                aria-current={currentFor(path, line.href, line.matches)}
                className={topLinkClass}
              >
                {line.label}
              </Link>
              <button
                id={`nav-toggle-${line.id}`}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-label={t.nav_submenu.replace('{name}', line.label)}
                onClick={() => setOpen(isOpen ? null : line.id)}
                className="-ml-1 inline-flex min-h-11 w-11 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors duration-150 hover:text-[var(--color-primary)]"
              >
                <CaretDown className={cn('h-4 w-4 transition-transform duration-150', isOpen && 'rotate-180')} />
              </button>

              {/* `pt-2` bridges the gap to the panel inside the entry, so the
                  pointer can travel down without leaving it. */}
              <div id={panelId} hidden={!isOpen} className="absolute left-0 top-full z-[60] pt-2">
                <ul className="grid w-[24rem] gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-[var(--shadow-card-hover)]">
                  {line.links.map(link => (
                    <li key={link.href}>
                      <PanelLink link={link} newTab={t.nav_new_tab} onNavigate={() => setOpen(null)} />
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )
        })}
        <li>
          <Link
            href={about.href}
            prefetch={prefetchFor(about.href)}
            aria-current={currentFor(path, about.href, [about.href])}
            className={topLinkClass}
          >
            {about.label}
          </Link>
        </li>
      </ul>
    </nav>
  )
}
