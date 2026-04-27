import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { SalePriceFetcher } from '@/components/SalePriceFetcher'

export const metadata: Metadata = {
  title: 'MSK Scripts Shop',
  description: 'High quality FiveM resources & Discord bots for your server',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        {/* Navbar has its own Suspense boundary for useSearchParams */}
        <Navbar />
        <CartDrawer />
        <SalePriceFetcher />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
