import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getRequestLang } from '@/lib/serverLang'
import { cartTranslations } from '@/lib/i18n'
import type { Metadata } from 'next'
import { pageSeo } from '@/lib/pageSeo'

/**
 * Eigener Titel statt des Vorgabewerts aus dem Root-Layout. Kein `alternates`:
 * die Seite ist noindex, ein Canonical oder hreflang darauf wäre ein Signal
 * für etwas, das gar nicht in den Index soll.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/account', lang)
  return {
    title:       seo.title,
    description: seo.description,
    robots:      { index: false, follow: false },
  }
}

export default async function AccountPage() {
  const { lang } = await getRequestLang()
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
