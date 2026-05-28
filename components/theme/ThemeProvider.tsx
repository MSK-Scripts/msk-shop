'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps, ReactNode } from 'react'

type NextThemesProviderProps = ComponentProps<typeof NextThemesProvider>

interface Props extends NextThemesProviderProps {
  children?: ReactNode
  /**
   * CSP-Nonce — wird an das von next-themes injizierte Inline-Script
   * weitergereicht (verhindert FOUC + bleibt CSP-konform).
   */
  nonce?: string
}

export function ThemeProvider({ nonce, children, ...props }: Props) {
  return (
    <NextThemesProvider scriptProps={{ nonce }} {...props}>
      {children}
    </NextThemesProvider>
  )
}
