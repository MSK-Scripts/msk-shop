import type { Metadata } from 'next'
import { getPackages } from '@/lib/tebex'
import { PackagesBrowser } from '@/app/packages/PackagesBrowser'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { packagesTranslations } from '@/lib/i18n'
import { alternatesFor, DEFAULT_OG_IMAGE, openGraphFor } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/packages', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/packages'),
    openGraph:   openGraphFor({ url: '/packages', title: seo.title, description: seo.description }),
    // `twitter` wird genauso flach ersetzt wie `openGraph` und muss darum
    // explizit mitgesetzt werden, sonst bleiben die Root-Layout-Texte stehen.
    twitter: {
      card:        'summary_large_image' as const,
      title:       seo.title,
      description: seo.description,
      images:      [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function PackagesPage() {
  // Die Sprache steckt in einem Cookie, die Seite ist damit ohnehin dynamisch.
  const [{ lang }, packages] = await Promise.all([getRequestLang(), getPackages()])
  const t = packagesTranslations[lang]

  const count = (packages.length === 1 ? t.count_one : t.count_many)
    .replace('{n}', packages.length.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'))

  return (
    <div className="container-page py-10 md:py-12">
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t.heading}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {count} · {t.subtitle}
        </p>
      </header>

      {packages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] py-20 text-center">
          <p className="text-lg font-semibold">{t.none_title}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{t.none_body}</p>
        </div>
      ) : (
        <PackagesBrowser lang={lang} packages={packages} />
      )}
    </div>
  )
}
