import type { Metadata } from 'next'

import { ShopSignIn } from '@/components/account/ShopSignIn'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight } from '@/components/icons'
import { PageHead } from '@/components/page/PageHead'
import { accountTranslations, layoutTranslations, packagesTranslations } from '@/lib/i18n'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'

/**
 * Own title instead of the default from the root layout. No `alternates`:
 * the page is noindex; a canonical or hreflang on it would be a signal
 * for something that is not meant to be in the index at all.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/login', lang)
  return {
    title:       seo.title,
    description: seo.description,
    robots:      { index: false, follow: false },
  }
}

/**
 * `/en/login`, `/de/anmelden`: the two sign-ins side by side, as in the
 * account menu (plan 5.3). The shop button is the menu's own (CFX.re through
 * Tebex); the bot links lead to the dashboards, which start their Discord
 * sign-in themselves.
 *
 * Decision E9: Tebex fills no basket before the CFX.re sign-in, so it stays
 * in front of the cart, and the shop block says why in one sentence.
 */
export default async function LoginPage() {
  const { lang } = await getRequestLang()
  const t = accountTranslations[lang]
  const tl = layoutTranslations[lang]
  const tp = packagesTranslations[lang]

  const block = 'grid content-start gap-4 border-t-2 border-[var(--color-primary)] pt-[clamp(1rem,0.75rem+0.75vw,1.75rem)]'
  const link = 'flex min-h-11 items-center justify-between gap-3 border-b border-[var(--color-border)] py-2 font-semibold hover:text-[var(--color-primary)]'

  return (
    <div className="container-page grid gap-[var(--space-section)] pb-[var(--space-section)] pt-[clamp(1rem,0.5rem+1.5vw,3rem)]">
      <PageHead
        id="login-title"
        crumbs={[{ label: tp.breadcrumb_home, href: '/' }, { label: t.login_title }]}
        title={t.login_title}
        lead={t.login_lead}
      />

      <div className="@container">
        <div className="grid gap-[var(--space-section)] @4xl:grid-cols-2 @4xl:gap-x-[clamp(2rem,4cqi,6rem)]">
          <section aria-labelledby="login-shop" className={block}>
            <h2 id="login-shop" className="font-display text-h3 font-[650]">{t.login_shop_title}</h2>
            <p className="max-w-[34rem] text-[var(--color-muted-foreground)]">{t.login_shop_text} {tp.detail_login_hint}</p>
            <ShopSignIn />
          </section>

          <section aria-labelledby="login-bots" className={block}>
            <h2 id="login-bots" className="font-display text-h3 font-[650]">{t.login_bots_title}</h2>
            <p className="max-w-[34rem] text-[var(--color-muted-foreground)]">{t.login_bots_text}</p>
            <ul className="grid max-w-[34rem] border-t border-[var(--color-border)]">
              {[
                { href: '/dashboard/ticket-bot', label: tl.account_ticket_dashboard },
                { href: '/dashboard/giveaway-bot', label: tl.account_giveaway_dashboard },
              ].map(l => (
                <li key={l.href}>
                  {/* Session-dependent: not prefetched, see AccountSections. */}
                  <Link href={l.href} prefetch={false} className={link}>
                    {l.label}
                    <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
