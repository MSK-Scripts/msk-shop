import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CustomPackageCard } from '@/components/home/CustomPackageCard'
import { CUSTOM_PACKAGES } from '@/content/custom-packages'
import { homeTranslations, type Lang } from '@/lib/i18n'

/**
 * Die kostenlosen FiveM-Scripts.
 *
 * Sie standen zwischenzeitlich nur noch auf `/resources`, wo es um Live-Server-
 * zahlen geht, nicht um das Script selbst. Damit war das halbe Angebot von der
 * Startseite verschwunden, obwohl msk_core die Grundlage der bezahlten
 * Resourcen ist und die Zahl im Hero-Badge stellt.
 *
 * Ausgewählt über eine feste Id-Liste statt über ein Feld in der Content-Datei:
 * `CUSTOM_PACKAGES` mischt FiveM-Scripts und Web-Tools, und die Zuordnung ist
 * eine Entscheidung der Startseite, keine Eigenschaft des Eintrags. Eine Id, die
 * es nicht (mehr) gibt, fällt still weg — deshalb steht unten ein Hinweis.
 */
const FIVEM_SCRIPT_IDS = [
  'msk_core',
  'msk_fuel',
  'msk_enginetoggle',
  'msk_givevehicle',
  'msk_jobGPS',
] as const

export function FreeScripts({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]

  // Reihenfolge folgt FIVEM_SCRIPT_IDS, nicht der Reihenfolge in der
  // Content-Datei: msk_core gehört nach vorn, es ist die Abhängigkeit der
  // anderen. `flatMap` statt `filter`, damit auskommentierte oder umbenannte
  // Einträge (z. B. msk_jobGPS) die Sektion nicht mit einer Lücke rendern.
  const scripts = FIVEM_SCRIPT_IDS.flatMap(id => {
    const pkg = CUSTOM_PACKAGES.find(p => p.id === id)
    return pkg ? [pkg] : []
  })

  if (scripts.length === 0) return null

  return (
    <section className="border-t border-[var(--color-border)]">
      <div className="container-page py-14 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t.free_scripts_heading}
            </h2>
            <p className="mt-2 max-w-[68ch] text-sm text-[var(--color-muted-foreground)]">
              {t.free_scripts_subtitle}
            </p>
          </div>
          <Link
            href="/resources"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:underline"
          >
            {t.free_scripts_stats}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {scripts.map(pkg => (
            <CustomPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  )
}
