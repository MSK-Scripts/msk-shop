'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowSquareOut, CheckCircle, XCircle } from '@/components/icons'
import { useLang } from '@/components/i18n/LangProvider'
import { PageHead } from '@/components/page/PageHead'
import { Button } from '@/components/ui/Button'
import { accountTranslations, cartTranslations, layoutTranslations, packagesTranslations } from '@/lib/i18n'
import { useCartStore } from '@/store/cart'

/** Where Tebex grants the scripts: the CFX.re portal, which holds the Keymaster. */
const KEYMASTER_URL = 'https://portal.cfx.re/'

/**
 * `/en/checkout`, `/de/kasse`: where Tebex sends the buyer back. The basket
 * itself was created with these return addresses on the server
 * (app/api/basket/route.ts), never from the client.
 *
 * Behaviour as before: `?status=complete` empties the local basket, which
 * Tebex has completed, `?status=cancelled` keeps it.
 */
export default function CheckoutContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const { clearBasket } = useCartStore()
  const { lang } = useLang()
  const t = cartTranslations[lang]
  const ta = accountTranslations[lang]
  const tl = layoutTranslations[lang]
  const home = { label: packagesTranslations[lang].breadcrumb_home, href: '/' }

  useEffect(() => {
    if (status === 'complete') {
      clearBasket()
    }
  }, [status, clearBasket])

  const frame = 'container-page grid gap-[var(--space-stack)] pb-[var(--space-section)] pt-[clamp(1rem,0.5rem+1.5vw,3rem)]'

  if (status === 'complete') {
    return (
      <div className={frame}>
        <PageHead id="checkout-title" crumbs={[home, { label: t.checkout_title }]} kicker={t.success_kicker} title={t.success_title}>
          <p className="flex max-w-[40rem] items-start gap-2.5 text-lead text-[var(--color-muted-foreground)]">
            <CheckCircle className="mt-[0.2em] h-6 w-6 shrink-0 text-[var(--color-success)]" />
            <span>{t.success_body}</span>
          </p>
        </PageHead>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={KEYMASTER_URL} target="_blank" rel="noopener noreferrer">
              {t.success_keymaster}
              <ArrowSquareOut className="h-4 w-4" />
              <span className="sr-only"> {tl.nav_new_tab}</span>
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account">{ta.to_account}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">{t.back_to_shop}</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className={frame}>
        <PageHead id="checkout-title" crumbs={[home, { label: t.checkout_title }]} title={t.cancelled_title}>
          <p className="flex max-w-[40rem] items-start gap-2.5 text-lead text-[var(--color-muted-foreground)]">
            <XCircle className="mt-[0.2em] h-6 w-6 shrink-0 text-[var(--color-danger)]" />
            <span>{t.cancelled_body}</span>
          </p>
        </PageHead>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/cart">{t.back_to_cart}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/fivem">{t.browse}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={frame}>
      <PageHead id="checkout-title" crumbs={[home, { label: t.checkout_title }]} title={t.checkout_title} lead={t.checkout_body} />
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/cart">{t.view_cart}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/fivem">{t.browse}</Link>
        </Button>
      </div>
    </div>
  )
}
