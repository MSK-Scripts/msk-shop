'use client'

import NextLink from 'next/link'
import type { ComponentProps } from 'react'

import { useLang } from './LangProvider'

/**
 * Ersatz für `next/link`, der in der Sprache der laufenden Seite bleibt.
 *
 * Ohne ihn landet ein deutscher Besucher beim ersten Klick wieder auf der
 * englischen Fassung, weil `/packages` nun einmal die englische Adresse ist.
 *
 * Die Aufrufstellen ändern nur ihre Import-Zeile und heissen weiterhin `Link`.
 * Ein Umbenennen der Elemente hätte jedes `</Link>` mitziehen müssen, und
 * genau daran scheitert eine Suchen-und-Ersetzen-Runde still.
 *
 * Client-Komponente mit Absicht: dadurch funktioniert sie auch innerhalb von
 * Server-Komponenten, die die Sprache gar nicht kennen, und liest sie beim
 * Rendern aus dem Context.
 */

/** Adressen, die es nur einmal gibt und die kein Sprachpräfix vertragen. */
function istSprachlos(href: string): boolean {
  return !href.startsWith('/')
    || href.startsWith('/api/')
    || href.startsWith('/auth/')
    || href.startsWith('/botproxy')
}

export function LocaleLink({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { localize } = useLang()
  const ziel = typeof href === 'string' && !istSprachlos(href) ? localize(href) : href
  return <NextLink href={ziel} {...props} />
}
