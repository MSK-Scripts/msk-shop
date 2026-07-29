import type { Metadata, Viewport } from 'next'
import { cookies, headers } from 'next/headers'

// Fonts werden 100% lokal über @fontsource-variable geladen.
// Keine Kommunikation zu fonts.googleapis.com — auch nicht zur Build-Zeit.
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'

import './globals.css'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { SalePriceFetcher } from '@/components/SalePriceFetcher'
import { NewsPopup } from '@/components/ui/NewsPopup'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { LangProvider } from '@/components/i18n/LangProvider'
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0d1117' },
  ],
  colorScheme: 'light dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.msk-scripts.de",
  ),
  title: {
    default: "MSK Scripts – Website & Shop",
    template: "%s",
  },
  description:
    "High quality FiveM resources, Tools & Discord bots for your server",
  applicationName: "MSK Scripts",
  authors: [
    { name: "Musiker15", url: "https://www.musiker15.de" },
    { name: "MSK Scripts", url: "https://www.msk-scripts.de" },
  ],
  keywords: [
    "FiveM",
    "fivem",
    "FiveM Resources",
    "FiveM Scripts",
    "FiveM Mods",
    "FiveM Vehicles",
    "FiveM Scripts Shop",
    "FiveM Resources Shop",

    "Discord Bots",
    "Discord Ticket Bot",
    "Ticket Bot",
    "Ticketbot",
    "Discord Ticket Bot",
    "Discord Giveaway Bot",
    "Giveawaybot",

    "Tools",
    
    "MSK",
    "MSK Scripts",
    "msk-scripts.de",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "MSK Scripts",
    title: "MSK Scripts – Website & Shop",
    description:
      "High quality FiveM resources, Tools & Discord bots for your server",
    images: ["/msk-scripts-server-banner.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // headers() opt-in zu Dynamic Rendering — Voraussetzung dafür, dass Next.js
  // den Nonce aus middleware.ts in seine internen Hydration-Scripts injiziert.
  // Ohne diesen Aufruf bliebe das Root-Layout statisch und die CSP würde alle
  // Next.js-Scripts blockieren.
  const [hdrs, cookieStore] = await Promise.all([headers(), cookies()])
  const nonce = hdrs.get('x-nonce') ?? undefined
  const lang = resolveLang(cookieStore.get(LANG_COOKIE_NAME)?.value, hdrs.get('accept-language'))

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <LangProvider initial={lang}>
            <Header />
            <CartDrawer />
            <SalePriceFetcher />
            <NewsPopup />
            <main className="flex-1">{children}</main>
            <Footer />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
