/**
 * The admin sits outside the `(site)` group: no marketing header, footer or
 * news popup (plan 6.3). The page renders the shared app shell
 * (`AdminShell`) with the one `<main>` landmark the skip link points to,
 * for the sign-in as much as for the dashboard.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
