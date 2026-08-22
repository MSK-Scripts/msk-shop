'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useLang } from '@/components/i18n/LangProvider'
import { cartTranslations } from '@/lib/i18n'

export default function CheckoutContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const { clearBasket } = useCartStore()
  const { lang } = useLang()
  const t = cartTranslations[lang]

  useEffect(() => {
    if (status === 'complete') {
      clearBasket()
    }
  }, [status, clearBasket])

  if (status === 'complete') {
    return (
      <div className="container-page py-20 md:py-24">
        <div className="mx-auto max-w-lg text-center">
          <Card className="p-8">
            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-[var(--color-primary)]" />
            <h1 className="mb-3 text-2xl font-bold tracking-tight">{t.success_title}</h1>
            <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
              {t.success_body}
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                {t.back_to_shop}
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="container-page py-20 md:py-24">
        <div className="mx-auto max-w-lg text-center">
          <Card className="p-8">
            <XCircle className="mx-auto mb-4 h-14 w-14 text-[var(--color-danger)]" />
            <h1 className="mb-3 text-2xl font-bold tracking-tight">{t.cancelled_title}</h1>
            <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
              {t.cancelled_body}
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/cart">{t.back_to_cart}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/packages">{t.browse}</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-20 md:py-24">
      <div className="mx-auto max-w-lg text-center">
        <Card className="p-8">
          <h1 className="mb-3 text-2xl font-bold tracking-tight">{t.checkout_title}</h1>
          <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
            {t.checkout_body}
          </p>
          <Button asChild>
            <Link href="/cart">{t.view_cart}</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
