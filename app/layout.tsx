import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { SalePriceFetcher } from '@/components/SalePriceFetcher'

// next/font/google automatically self-hosts Inter at build time.
// No requests to fonts.googleapis.com at runtime.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
})

import { NewsPopup } from '@/components/ui/NewsPopup'

export const metadata: Metadata = {
  title: 'MSK Scripts Shop',
  description: 'High quality FiveM resources & Discord bots for your server',
  applicationName: 'MSK Scripts Shop',
  authors: [{ name: 'Musiker15', url: 'https://www.musiker15.de' }, { name: 'MSK Scripts', url: 'https://www.msk-scripts.de' }],
  keywords: ['FiveM Resources', 'Discord Bots', 'MSK', 'msk-scripts.de'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png',    type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple:    '/logo.png',
  },
  robots: {
    index:  true,
    follow: true,
  },
  openGraph: {
    type:        'website',
    siteName:    'MSK Scripts Shop',
    title:       'MSK Scripts Shop – High Quality FiveM Resources',
    description: 'High quality FiveM resources & Discord bots for your server',
    images:      ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <CartDrawer />
        <SalePriceFetcher />
        <NewsPopup />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
