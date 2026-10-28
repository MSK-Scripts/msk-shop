'use client'

import { useId, useRef, useState } from 'react'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { useDismiss } from '@/components/layout/useDismiss'
import { CaretDown, Check, Plus } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface SwitcherServer {
  id: string
  /** Display name. A server without one shows its id instead. */
  name: string | null
  /** Second line, the plan of the server for instance. */
  detail?: string
  /** Internal path of this server in the dashboard. */
  href: string
}

export interface ServerSwitcherCopy {
  /** Heading above the button ("Server"). */
  label: string
  /** Accessible name of the button, followed by the current server. */
  switchLabel: string
  /** Shown when no server of the list is the current one. */
  none: string
  /** Link to add or choose another server. */
  add: string
  /** Hint below the list: why a server may be missing (Ticket Tool pattern). */
  missing: string
}

function Initials({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-small font-bold uppercase text-[var(--color-primary)]"
    >
      {name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2) || '#'}
    </span>
  )
}

/**
 * The server switcher at the top of the sidebar (plan 6.3, Ticket Tool).
 *
 * It lists only what the server handed it: the servers the signed-in person
 * may manage, already filtered by the session. Choosing one is a plain link
 * to that server's address; the page behind it checks the ownership again,
 * so nothing here is a permission decision.
 *
 * An in-flow disclosure rather than a floating menu: it pushes the
 * navigation down instead of covering it, and works the same in the sidebar
 * and in the drawer on a phone.
 */
export function ServerSwitcher({ servers, currentId, addHref, copy }: {
  servers: SwitcherServer[]
  currentId: string | null
  addHref?: string
  copy: ServerSwitcherCopy
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const current = servers.find(s => s.id === currentId) ?? null
  const currentName = current ? current.name || current.id : copy.none

  useDismiss(open, rootRef, reason => {
    setOpen(false)
    if (reason === 'escape') buttonRef.current?.focus()
  })

  return (
    <div ref={rootRef} className="grid gap-1.5">
      <h2 className="px-1 text-label font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
        {copy.label}
      </h2>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex min-h-12 w-full items-center gap-3 rounded-md border-[1.5px] border-[var(--color-input)] bg-[var(--color-card)] px-2.5 py-1.5 text-left',
          'transition-colors duration-150 hover:border-[var(--color-foreground)]',
        )}
      >
        <Initials name={currentName} />
        <span className="grid min-w-0 flex-1">
          <span className="sr-only">{copy.switchLabel}: </span>
          <span className="truncate font-semibold">{currentName}</span>
          {current?.detail && <span className="truncate text-small text-[var(--color-muted-foreground)]">{current.detail}</span>}
        </span>
        <CaretDown className={cn('h-4 w-4 shrink-0 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      <div id={listId} hidden={!open} className="grid gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-1.5">
        <ul className="grid gap-0.5">
          {servers.map(server => {
            const isCurrent = server.id === currentId
            return (
              <li key={server.id}>
                <Link
                  href={server.href}
                  prefetch={false}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-md px-2 py-1 transition-colors duration-150 hover:bg-[var(--color-muted)]',
                    'aria-[current=page]:font-semibold',
                  )}
                >
                  <Initials name={server.name || server.id} />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate">{server.name || server.id}</span>
                    {server.detail && <span className="truncate text-small text-[var(--color-muted-foreground)]">{server.detail}</span>}
                  </span>
                  {isCurrent && <Check className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />}
                </Link>
              </li>
            )
          })}
        </ul>
        {addHref && (
          <Link
            href={addHref}
            prefetch={false}
            className="flex min-h-11 items-center gap-2 rounded-md px-2 font-semibold text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
          >
            <Plus className="h-4 w-4" />
            {copy.add}
          </Link>
        )}
        <p className="px-2 pb-1 text-small text-[var(--color-muted-foreground)]">{copy.missing}</p>
      </div>
    </div>
  )
}
