import type { Metadata } from 'next'

import { CategoryCard } from '@/components/images/CategoryCard'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { imagesTranslations } from '@/lib/i18n'
import { listCategories, countPublished, cdnBase } from '@/lib/images'

/**
 * Uebersicht der Bildergalerie.
 *
 * `revalidate` statt `force-dynamic`: der Bestand aendert sich beim Ingest,
 * also selten und nie waehrend eines Besuchs. Fuenf Minuten sind genug, damit
 * ein frisch importierter Schwung zeitnah auftaucht, ohne dass jeder Aufruf
 * die Datenbank fragt.
 */
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/images', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/images'),
  }
}

function formatCount(lang: 'en' | 'de', count: number): string {
  const t = imagesTranslations[lang]
  const n = new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US').format(count)
  return count === 1 ? t.count_one : t.count_many.replace('{count}', n)
}

export default async function ImagesPage() {
  const { lang } = await getRequestLang()
  const t = imagesTranslations[lang]

  const [categories, total] = await Promise.all([
    listCategories(lang),
    countPublished(),
  ])

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-10 max-w-3xl">
        <span className="eyebrow">{t.eyebrow}</span>
        <h1 className="mb-3 mt-2 text-3xl font-bold tracking-tight md:text-4xl">{t.title}</h1>
        <p className="text-base leading-relaxed text-[var(--color-muted-foreground)]">
          {t.subtitle}
        </p>
        <p className="mt-3 font-mono text-xs text-[var(--color-muted-foreground)]">
          {formatCount(lang, total)}
        </p>
      </header>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-2 text-xl font-bold tracking-tight">
          {t.categories_title}
        </h2>
        <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
          {t.categories_intro}
        </p>

        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))]">
          {categories.map(c => (
            <CategoryCard
              key={c.slug}
              category={c}
              lang={lang}
              countLabel={formatCount(lang, c.count)}
            />
          ))}
        </div>
      </section>

      {/* Der Hinweis auf die Herkunft der Assets steht bewusst auf der Seite
          selbst und nicht nur in den AGB: wer die Bilder benutzt, soll ohne
          Suche sehen, woran er ist, und wo eine Entfernung anzufragen waere. */}
      <section aria-labelledby="legal-heading" className="mt-14 max-w-3xl">
        <h2 id="legal-heading" className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {t.legal_title}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {t.legal_body}
        </p>
        <p className="mt-4 font-mono text-xs text-[var(--color-muted-foreground)]">
          {cdnBase()}
        </p>
      </section>
    </div>
  )
}
