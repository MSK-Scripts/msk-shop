/**
 * The admin sits outside the `(site)` group: no marketing header, footer or
 * news popup (plan 6.3). Until it renders its own app shell, this keeps the
 * one `<main>` landmark the skip link points to.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <main id="main" tabIndex={-1} className="flex-1">{children}</main>
}
