import { getRequestLang } from '@/lib/serverLang'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { SalePriceFetcher } from '@/components/SalePriceFetcher'
import { NewsPopup } from '@/components/ui/NewsPopup'
import { JsonLd } from '@/components/JsonLd'
import { organizationJsonLd } from '@/lib/jsonLd'
import { loadNewsPopup } from '@/lib/siteSettings'
import { isBotPath } from '@/lib/routes'

/**
 * The frame of the public site: header, cart drawer, news popup, footer.
 *
 * A route group of its own since Phase 7 of the redesign (plan 6.3). Until
 * then this sat in the root layout, and the three dashboards ran inside the
 * marketing frame with header, footer and news popup. The dashboards and the
 * admin now live next to this group with their own app shell; the root
 * layout keeps only what both share (document, theme, language, skip link).
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Announcement popup. Editable in /admin since 19.09.2026, so switching a
  // two-day banner on no longer costs a commit, a CI run and a deploy. Cached
  // for 30 s in lib/siteSettings.ts and fail-soft: a database blip returns the
  // disabled default rather than taking the layout down.
  const newsPopup = await loadNewsPopup()

  // On the two bot landing pages the Organization markup carries no
  // industry description. The site-wide line names FiveM first, and exactly
  // from that language models concluded that the ticket bot was a
  // FiveM extension. Omitted rather than replaced, see organizationJsonLd().
  const { path } = await getRequestLang()
  const botLanding = isBotPath(path)

  return (
    <>
      <JsonLd data={organizationJsonLd({ describe: !botLanding })} />
      <Header />
      <CartDrawer />
      <SalePriceFetcher />
      <NewsPopup settings={newsPopup} />
      <main id="main" tabIndex={-1} className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
