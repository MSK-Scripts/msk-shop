import { Card } from '@/components/ui/Card'
import { HOME_FEATURE_ICONS } from '@/content/home-features'
import { homeTranslations, type Lang } from '@/lib/i18n'

export function WhyMSK({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]
  return (
    <section className="border-b border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
      <div className="container-page py-16 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="eyebrow mx-auto inline-flex">{t.why_eyebrow}</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            {t.why_heading}
          </h2>
          <p className="mt-4 text-base text-[var(--color-muted-foreground)]">
            {t.why_subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_FEATURE_ICONS.map((Icon, i) => {
            const f = t.why_features[i]
            return (
              <Card key={i} hoverLift className="group p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] transition-transform duration-200 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {f.description}
                </p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
