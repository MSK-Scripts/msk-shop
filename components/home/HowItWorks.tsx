import { ArrowRight, KeyRound, PackageSearch, Rocket, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { SITE_CONFIG } from '@/lib/config'
import { homeTranslations, type Lang } from '@/lib/i18n'

/**
 * Erklärt den Kaufablauf in vier Schritten.
 *
 * Die Texte liegen in `homeTranslations.how_steps` (EN + DE), hier stehen nur
 * die Icons. Reihenfolge muss zu den Übersetzungen passen.
 */
const STEP_ICONS = [PackageSearch, KeyRound, ShieldCheck, Rocket]

export function HowItWorks({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]

  return (
    <section id="ablauf" className="scroll-mt-20 border-t border-[var(--color-border)]">
      <div className="container-page py-16 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            {t.how_heading}
          </h2>
          <p className="mt-4 text-base text-[var(--color-muted-foreground)]">
            {t.how_subtitle}
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.how_steps.map((step, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <li
                key={step.title}
                className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
              >
                {/* Rein dekorativ, die Reihenfolge trägt bereits das <ol>. */}
                <span
                  aria-hidden="true"
                  className="absolute right-4 top-4 font-mono text-3xl font-bold leading-none text-[var(--color-border)]"
                >
                  {i + 1}
                </span>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mb-1.5 pr-8 font-bold tracking-tight">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {step.text}
                </p>
              </li>
            )
          })}
        </ol>

        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-xs text-[var(--color-muted-foreground)]">{t.how_note}</p>
          <Button asChild variant="ghost" size="sm">
            <a href={SITE_CONFIG.docs} target="_blank" rel="noopener noreferrer">
              {t.how_btn_docs}
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
