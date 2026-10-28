import { ArrowSquareOut } from '@/components/icons'
import { Section, TextLink } from '@/components/home/Section'
import { Badge } from '@/components/ui/Badge'
import { FREE_SCRIPT_IDS, packagesById } from '@/content/custom-packages'
import { homeTranslations, layoutTranslations, type Lang } from '@/lib/i18n'

/**
 * The free FiveM scripts as a list, not as big cards (plan 5.4): in the
 * August audit the free part took 31 % of the page, more than the paid one.
 * Which entries count as free scripts is `FREE_SCRIPT_IDS` in the content
 * file, shared with the free scripts page.
 */

export function FreeScripts({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]
  const nav = layoutTranslations[lang]

  const scripts = packagesById(FREE_SCRIPT_IDS)
  if (scripts.length === 0) return null

  return (
    <Section
      id="free-title"
      kicker={t.free_kicker}
      title={t.free_scripts_heading}
      intro={t.free_scripts_subtitle}
      action={
        <>
          <TextLink href="/fivem/free">{t.free_all}</TextLink>
          <TextLink href="/stats">{t.free_scripts_stats}</TextLink>
        </>
      }
    >
      <ul className="grid border-t border-[var(--color-border)] @4xl:grid-cols-2 @4xl:gap-x-[clamp(2rem,4cqi,5rem)]">
        {scripts.map(pkg => (
          <li key={pkg.id} className="grid gap-2 border-b border-[var(--color-border)] py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-display text-h3 font-[650]">{pkg.name}</h3>
              <a
                href={pkg.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline"
              >
                GitHub
                <ArrowSquareOut className="h-4 w-4" />
                <span className="sr-only"> {pkg.name}, {nav.nav_new_tab}</span>
              </a>
            </div>
            <p className="max-w-[40rem] text-[var(--color-muted-foreground)]">
              {lang === 'de' && pkg.descriptionDe ? pkg.descriptionDe : pkg.description}
            </p>
            {pkg.badges.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {pkg.badges.map(b => (
                  <li key={b.label}><Badge>{b.label}</Badge></li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}
