import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'

// Fonts are loaded 100% locally via @fontsource-variable.
// No communication with fonts.googleapis.com, not even at build time.
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
import { loadNewsPopup } from '@/lib/siteSettings'
import { layoutTranslations } from '@/lib/i18n'
import { siteUrl } from '@/lib/siteUrl'
import { JsonLd } from '@/components/JsonLd'
import { organizationJsonLd } from '@/lib/jsonLd'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    // Must match --color-background from app/globals.css, otherwise the
    // browser bar on a phone shows a different tone than the page below it.
    { media: '(prefers-color-scheme: light)', color: '#f3f3f4' },
    { media: '(prefers-color-scheme: dark)',  color: '#161a20' },
  ],
  colorScheme: 'light dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    // Pure emergency brake. Since 24.08.2026 every page sets its own
    // title, including the five of the purchase path. Before, this held the
    // bare brand name, which the SEO pass of 22.08. had removed from the
    // home page because it says nothing; the pages without their own
    // metadata inherited it and were all named the same live.
    default: "FiveM Scripts, Tools & Discord Bots | MSK Scripts",
    // Subpages only set their own name and get the suffix from
    // here. Anyone who deliberately wants a completely custom title (landing pages)
    // uses `title: { absolute: '…' }`.
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
  // Deliberately NO `alternates.canonical` and no `openGraph.url` here: both
  // would be inherited by every subpage that sets nothing of its own, and there
  // point to the home page. Canonicals are set per page.
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
  // headers() opts in to dynamic rendering: a precondition for Next.js
  // injecting the nonce from proxy.ts into its internal hydration scripts.
  // Without this call the root layout would stay static and the CSP would block
  // all Next.js scripts.
  const hdrs = await headers()
  const nonce = hdrs.get('x-nonce') ?? undefined

  // Announcement popup. Editable in /admin since 19.09.2026, so switching a
  // two-day banner on no longer costs a commit, a CI run and a deploy. Cached
  // for 30 s in lib/siteSettings.ts and fail-soft: a database blip returns the
  // disabled default rather than taking the layout down.
  const newsPopup = await loadNewsPopup()

  // Language and language-less path come from proxy.ts. Server Components do
  // not see the address otherwise, and the switcher needs the path to navigate
  // to the counterpart URL.
  const lang = langFromHeader(hdrs.get(LANG_HEADER))
  const path = hdrs.get(PATH_HEADER) || '/'
  const t = layoutTranslations[lang]

  // On the two bot landing pages the Organization markup carries no
  // industry description. The site-wide line names FiveM first, and exactly
  // from that language models concluded that the ticket bot was a
  // FiveM extension. Omitted rather than replaced, see organizationJsonLd().
  const botLanding = path.startsWith('/ticketbot') || path.startsWith('/giveaway')

  return (
    // `data-scroll-behavior="smooth"` is not decoration but a requirement
    // of Next: its router only switches off `scroll-behavior: smooth` during a
    // route change if this attribute is set
    // (disable-smooth-scroll.js checks `htmlElement.dataset.scrollBehavior`).
    // Without it the browser animates Next's `scrollTop = 0` over half a
    // second, and that looks as if the page scrolls by itself on a page
    // change. Smooth scrolling is kept for anchor jumps.
    <html lang={lang} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
        {/*
          Skip link, WCAG 2.4.1 (Level A). Deliberately here and not in the header:
          that sits behind a <Suspense> boundary (HeaderInner uses
          useSearchParams), so it would at times be missing from the streamed markup,
          and a skip link that only appears later is not one.
          Server-rendered so that it works without JavaScript.

          The styling lives entirely in `.skip-link` (app/globals.css) and
          not in utility classes. The reason is given there.
        */}
        <a href="#main" className="skip-link">
          {t.skip_to_content}
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <LangProvider lang={lang} path={path}>
            <JsonLd data={organizationJsonLd({ describe: !botLanding })} />
            <Header />
            <CartDrawer />
            <SalePriceFetcher />
            <NewsPopup settings={newsPopup} />
            <main id="main" tabIndex={-1} className="flex-1">{children}</main>
            <Footer />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
