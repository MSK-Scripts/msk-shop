import Image from 'next/image'
import { ArrowSquareOut } from '@/components/icons'
import { Section } from '@/components/home/Section'
import { CUSTOM_PACKAGES, WEB_TOOL_IDS } from '@/content/custom-packages'
import { homeTranslations, layoutTranslations, type Lang } from '@/lib/i18n'

/**
 * The three web tools as a compact row (plan 5.4): screenshot, name, one
 * line, the tool itself and its source. Grouped by spacing, not boxes.
 *
 * The ids must match `content/custom-packages.ts`. A renamed id drops the
 * entry here silently, as happened on 02.08.2026 with `forms` -> `msk-forms`.
 * The one line comes from the navigation texts, which exist in both
 * languages; the content file only has English.
 */
const TOOL_IDS = WEB_TOOL_IDS

function imageSrc(src: string): string {
  return src.startsWith('/') || /^https?:\/\//i.test(src) ? src : `/${src}`
}

export function WebTools({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]
  const nav = layoutTranslations[lang]
  const line: Record<(typeof TOOL_IDS)[number], string> = {
    'msk-forms':     nav.nav_forms_desc,
    'msk-paste':     nav.nav_paste_desc,
    'msk-shortener': nav.nav_shortener_desc,
  }
  const tools = TOOL_IDS.flatMap(id => {
    const pkg = CUSTOM_PACKAGES.find(p => p.id === id)
    return pkg ? [{ ...pkg, id, line: line[id] }] : []
  })
  if (tools.length === 0) return null

  return (
    <Section id="tools-title" kicker={t.tools_kicker} title={t.tools_heading} intro={t.tools_subtitle}>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-x-[clamp(1.5rem,3cqi,3rem)] gap-y-10">
        {tools.map(tool => (
          <li key={tool.id} className="grid content-start gap-3">
            {tool.image && (
              <div className="relative aspect-video overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]">
                <Image src={imageSrc(tool.image)} alt="" fill sizes="(max-width: 767px) 100vw, 33vw" className="object-cover" />
              </div>
            )}
            <h3 className="font-display text-h3 font-[650]">{tool.name}</h3>
            <p className="text-[var(--color-muted-foreground)]">{tool.line}</p>
            <div className="flex flex-wrap gap-x-5">
              <a
                href={tool.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline"
              >
                {tool.name}
                <ArrowSquareOut className="h-4 w-4" />
                <span className="sr-only"> {nav.nav_new_tab}</span>
              </a>
              {tool.secondaryLink && (
                <a
                  href={tool.secondaryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--color-foreground)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
                >
                  {t.tools_source}
                  <ArrowSquareOut className="h-4 w-4" />
                  <span className="sr-only"> {nav.nav_new_tab}</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
