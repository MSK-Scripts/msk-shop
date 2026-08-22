import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang'
import { cartTranslations } from '@/lib/i18n'

export default async function LoginPage() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const lang = resolveLang(cookieStore.get(LANG_COOKIE_NAME)?.value, headerStore.get('accept-language'))
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
