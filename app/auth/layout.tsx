import { headers } from 'next/headers'

import '@fontsource-variable/archivo/standard.css'
import '@fontsource-variable/source-sans-3'

import '../globals.css'

import { ThemeProvider } from '@/components/theme/ThemeProvider'

/**
 * Root layout of `/auth/...`, the one page tree outside `app/[lang]/`.
 *
 * `/auth/discord` is the return address registered with Tebex' Discord
 * login, so it keeps its language-less address. It only shows a spinner and
 * sends the visitor back to the page they came from, so it gets a bare frame
 * without header and footer instead of the shop layout of a language.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // headers() makes the layout dynamic, which Next needs to put the nonce
  // from proxy.ts on its own scripts.
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange nonce={nonce}>
          <main id="main" className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
