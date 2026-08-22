'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps, ReactNode } from 'react'

type NextThemesProviderProps = ComponentProps<typeof NextThemesProvider>

interface Props extends NextThemesProviderProps {
  children?: ReactNode
  /**
   * CSP-Nonce für die beiden Dinge, die next-themes selbst in die Seite
   * schreibt: das Inline-Script im <head> (setzt das Theme vor dem ersten
   * Paint, verhindert also das Flackern) und das <style>, das
   * `disableTransitionOnChange` beim Themenwechsel kurz einhängt.
   *
   * Der Nonce muss als **eigene Prop** durchgereicht werden, nicht über
   * `scriptProps`. next-themes schreibt `nonce` im Script-Element **nach**
   * dem Spread von `scriptProps` (`{...scriptProps, nonce: …}`), ein Nonce
   * aus `scriptProps` wird also mit `undefined` überschrieben; und das
   * Transition-<style> liest ausschliesslich diese Prop. Genau daran hing
   * das Flackern beim Laden, und beide Elemente wurden von der CSP geblockt.
   */
  nonce?: string
}

export function ThemeProvider({ nonce, children, ...props }: Props) {
  return (
    <NextThemesProvider nonce={nonce} {...props}>
      {children}
    </NextThemesProvider>
  )
}
