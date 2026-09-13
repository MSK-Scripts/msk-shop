import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getRequestLang } from '@/lib/serverLang'
import { cartTranslations } from '@/lib/i18n'
import type { Metadata } from 'next'
import { pageSeo } from '@/lib/pageSeo'

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

export default async function LoginPage() {
  const { lang } = await getRequestLang()
  const t = cartTranslations[lang]

  return (
    <div className="container-page py-20 md:py-24">
      <div className="mx-auto max-w-lg text-center">
        {/* No eyebrow any more: one card, one section, and "Account" above
            "Sign in" said nothing the heading does not already say. */}
        <Card className="p-8">
          <h1 className="mb-3 text-2xl font-bold tracking-tight">{t.login_title}</h1>
          <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
            {t.login_body}
          </p>
          <Button asChild>
            <Link href="/packages">{t.browse}</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
