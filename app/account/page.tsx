import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang'
import { cartTranslations } from '@/lib/i18n'

export default async function AccountPage() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const lang = resolveLang(cookieStore.get(LANG_COOKIE_NAME)?.value, headerStore.get('accept-language'))
  const t = cartTranslations[lang]

  return (
    <div className="container-page py-20 md:py-24">
      <div className="mx-auto max-w-lg text-center">
        <Card className="p-8">
          <h1 className="mb-3 text-2xl font-bold tracking-tight">{t.account_title}</h1>
          <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
            {t.account_body}
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <a
                href="https://checkout.tebex.io/payment-history"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.account_history}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                {t.back_to_shop}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
