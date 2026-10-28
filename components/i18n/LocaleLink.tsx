'use client'

import NextLink from 'next/link'
import type { ComponentProps } from 'react'

import { isExemptPath, splitLangPrefix } from '@/lib/routes'
import { useLang } from './LangProvider'

/**
 * Replacement for `next/link` that stays in the language of the current page.
 *
 * Callers pass the internal path (`/legal/terms`), the route table turns it
 * into the public address of the current language (`/de/rechtliches/agb`).
 * Without this a German visitor would land on the English version with the
 * first click.
 *
 * The call sites only change their import line and keep calling it `Link`.
 * Renaming the element would have had to touch every `</Link>`, and that is
 * exactly where a search-and-replace round fails silently.
 *
 * A client component on purpose: that way it also works inside server
 * components that do not know the language, and reads it from the context
 * while rendering.
 */

/** Addresses that stay as they are: external, exempt, or already public. */
function keepAsIs(href: string): boolean {
  if (!href.startsWith('/') || href.startsWith('//')) return true
  const path = href.split(/[?#]/)[0]
  return isExemptPath(path) || splitLangPrefix(path) !== null
}

export function LocaleLink({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { localize } = useLang()
  const target = typeof href === 'string' && !keepAsIs(href) ? localize(href) : href
  return <NextLink href={target} {...props} />
}
