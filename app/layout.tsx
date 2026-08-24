import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'

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
import { LANG_HEADER, PATH_HEADER, langFromHeader } from '@/lib/lang'
import { siteUrl } from '@/lib/siteUrl'
import { JsonLd } from '@/components/JsonLd'
import { organizationJsonLd } from '@/lib/jsonLd'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    // Muss --color-background aus app/globals.css entsprechen, sonst zeigt die
    // Browserleiste am Telefon einen anderen Ton als die Seite darunter.
    { media: '(prefers-color-scheme: light)', color: '#f3f3f4' },
    { media: '(prefers-color-scheme: dark)',  color: '#161a20' },
  ],
  colorScheme: 'light dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    // Reine Notbremse. Seit dem 24.08.2026 setzt jede Seite ihren eigenen
    // Titel, auch die fünf des Kaufpfads. Vorher stand hier der blosse
    // Markenname, den der SEO-Durchgang vom 22.08. auf der Startseite
    // abgeschafft hatte, weil er nichts aussagt; die Seiten ohne eigene
    // Metadaten erbten ihn und hiessen live alle gleich.
    default: "FiveM Scripts, Tools & Discord Bots | MSK Scripts",
    // Unterseiten setzen nur ihren eigenen Namen und bekommen das Suffix von
    // hier. Wer bewusst einen komplett eigenen Titel will (Landingpages),
    // nutzt `title: { absolute: '…' }`.
    template: "%s | MSK Scripts",
  },
  description:
    "High quality FiveM resources, Tools & Discord bots for your server",
  applicationName: "MSK Scripts",
  authors: [
    { name: "Musiker15", url: "https://www.musiker15.de" },
    { name: "MSK Scripts", url: "https://www.msk-scripts.de" },
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
  // Bewusst KEIN `alternates.canonical` und kein `openGraph.url` hier: Beides
  // würde an jede Unterseite vererbt, die nichts eigenes setzt, und dort auf
  // die Startseite zeigen. Canonicals werden pro Seite gesetzt.
  openGraph: {
    type: "website",
    siteName: "MSK Scripts",
    locale: "en_US",
    alternateLocale: ["de_DE"],
    title: "FiveM Scripts, Tools & Discord Bots | MSK Scripts",
    description:
      "High quality FiveM resources, Tools & Discord bots for your server",
    images: [
      {
        url: "/msk-scripts-server-banner.webp",
        width: 1920,
        height: 1080,
        alt: "MSK Scripts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FiveM Scripts, Tools & Discord Bots | MSK Scripts",
    description:
      "High quality FiveM resources, Tools & Discord bots for your server",
    images: ["/msk-scripts-server-banner.webp"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // headers() opt-in zu Dynamic Rendering — Voraussetzung dafür, dass Next.js
  // den Nonce aus proxy.ts in seine internen Hydration-Scripts injiziert.
  // Ohne diesen Aufruf bliebe das Root-Layout statisch und die CSP würde alle
  // Next.js-Scripts blockieren.
  const hdrs = await headers()
  const nonce = hdrs.get('x-nonce') ?? undefined

  // Sprache und sprachloser Pfad kommen aus proxy.ts. Server Components sehen
  // die Adresse sonst nicht, und der Umschalter braucht den Pfad, um zur
  // Gegenstück-URL zu navigieren.
  const lang = langFromHeader(hdrs.get(LANG_HEADER))
  const path = hdrs.get(PATH_HEADER) || '/'

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
          <LangProvider lang={lang} path={path}>
            <JsonLd data={organizationJsonLd()} />
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
