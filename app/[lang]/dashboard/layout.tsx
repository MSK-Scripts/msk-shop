import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * The two bot dashboards sit outside the `(site)` group: no marketing header,
 * footer or news popup (plan 6.3). Each renders the shared app shell
 * (components/dashboard/AppShell.tsx) with the one `<main>` landmark the skip
 * link points to, signed in as well as on its sign-in page.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
