import { Section, TextLink } from '@/components/home/Section'
import { prefetchFor } from '@/components/layout/navigation'
import { SITE_CONFIG } from '@/lib/config'
import { homeTranslations, layoutTranslations, type Lang } from '@/lib/i18n'

/**
 * Who is behind the shop, in three sentences: who, since when, what (plan
 * 5.4). No photo of Moritz, by his decision: the person shows through text,
 * numbers and links (plan 4.5).
 */
export function About({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]
  const newTab = { newTab: layoutTranslations[lang].nav_new_tab }

  return (
    <Section id="about-title" kicker={t.about_kicker} title={t.about_heading}>
      <div className="grid gap-4">
        <p className="max-w-[34rem] text-lead">{t.about_text}</p>
        <div className="flex flex-wrap gap-x-6">
          <TextLink href="/about" prefetch={prefetchFor('/about')}>{t.about_more}</TextLink>
          <TextLink href={SITE_CONFIG.discord} external={newTab}>Discord</TextLink>
          <TextLink href={SITE_CONFIG.github} external={newTab}>GitHub</TextLink>
        </div>
      </div>
    </Section>
  )
}
