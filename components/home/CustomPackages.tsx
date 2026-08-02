import { CustomPackageCard } from '@/components/home/CustomPackageCard'
import { CUSTOM_PACKAGES } from '@/content/custom-packages'
import { homeTranslations, type Lang } from '@/lib/i18n'

/**
 * Web tools shown on the homepage.
 *
 * The section used to render all nine entries of CUSTOM_PACKAGES and took 31 %
 * of the desktop page and 39 % of mobile — more than twice the paid catalogue,
 * positioned between the purchase explanation and the closing call to action.
 *
 * The two Discord bots now have their own section, the free FiveM scripts have
 * theirs, and what is left here are the three web tools.
 *
 * Die Ids müssen zu `content/custom-packages.ts` passen. Wird dort eine Id
 * umbenannt, verschwindet der Eintrag hier **still** — genau das ist am
 * 02.08.2026 mit `forms` → `msk-forms` passiert.
 */
const HOMEPAGE_TOOL_IDS = ['msk-forms', 'msk-paste', 'msk-shortener'] as const

export function CustomPackages({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]
  const tools = CUSTOM_PACKAGES.filter(p =>
    (HOMEPAGE_TOOL_IDS as readonly string[]).includes(p.id),
  )
  if (tools.length === 0) {
    return null
  }

  return (
    <section className="border-t border-[var(--color-border)]">
      <div className="container-page py-14 md:py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t.custom_title}
          </h2>
          <p className="mt-2 max-w-[68ch] text-sm text-[var(--color-muted-foreground)]">
            {t.tools_subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map(pkg => (
            <CustomPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  )
}
