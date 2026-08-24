import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
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
        {/* Kein Eyebrow mehr: eine Karte, ein Abschnitt, und "Account" über
            "Anmelden" sagte nichts, was die Überschrift nicht schon sagt. */}
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
