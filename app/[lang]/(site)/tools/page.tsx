import type { Metadata } from 'next'
import Image from 'next/image'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight, ArrowSquareOut } from '@/components/icons'
import { TextLink } from '@/components/home/Section'
import { HeroLinks, PageHero } from '@/components/page/PageHero'
import { Button } from '@/components/ui/Button'
import { WEB_TOOL_IDS, packagesById, type CustomPackage } from '@/content/custom-packages'
import {
  homeTranslations, imagesTranslations, layoutTranslations, packagesTranslations,
  subscriptionTermsTranslations, toolsPageTranslations, type Lang,
} from '@/lib/i18n'
import { pageSeo } from '@/lib/pageSeo'
import { publicPath } from '@/lib/routes'
import { alternatesFor, openGraphFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { cn } from '@/lib/utils'

/**
 * `/en/tools` and `/de/web-tools`: the web tools, one after the other, each
 * with its real screenshot (plan 4.5), what it does, and the way to the tool,
 * its source and its documentation.
 *
 * Names, descriptions and every address come from content/custom-packages.ts,
 * which the home page reads too. The image gallery is the one tool on this
 * site; it has no screenshot yet and stands without one.
 *
 * MSK Forms is the one tool with paid plans, contracted with MSK Scripts
 * (plan 5.7). Its prices live in the MSK Forms app and on its pricing page;
 * this page links there rather than keeping a copy that could drift, and
 * states contract partner and VAT exemption as the bot pages do.
 */

const FORMS_PRICING = 'https://forms.msk-scripts.de/pricing'
const FORMS_TERMS = 'https://forms.msk-scripts.de/terms'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/tools', lang)
  return {
    title:       seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/tools'),
    openGraph:   openGraphFor({ url: publicPath(lang, '/tools'), title: seo.title, description: seo.description }),
  }
}

function imageSrc(src: string): string {
  return src.startsWith('/') || /^https?:\/\//i.test(src) ? src : `/${src}`
}

function ExternalButton({ href, children, variant, newTab }: {
  href: string
  children: React.ReactNode
  variant: 'primary' | 'outline'
  newTab: string
}) {
  return (
    <Button asChild variant={variant}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <ArrowSquareOut className="h-4 w-4" />
        <span className="sr-only"> {newTab}</span>
      </a>
    </Button>
  )
}

function Tool({ tool, lang, index }: { tool: CustomPackage; lang: Lang; index: number }) {
  const p = toolsPageTranslations[lang]
  const home = homeTranslations[lang]
  const nav = layoutTranslations[lang]
  const terms = subscriptionTermsTranslations[lang]
  const newTab = { newTab: nav.nav_new_tab }
  const forms = tool.id === 'msk-forms'
  const id = `${tool.id}-title`

  return (
    <section id={tool.id} aria-labelledby={id} className="scroll-mt-[var(--header-height)] border-t border-[var(--color-border)] py-[var(--space-section)]">
      <div className="container-page @container">
        <div className="grid items-center gap-x-[clamp(2rem,4cqi,6rem)] gap-y-6 @4xl:grid-cols-2">
          {tool.image && (
            <div
              className={cn(
                'relative aspect-video overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]',
                index % 2 === 1 && '@4xl:order-last',
              )}
            >
              <Image
                src={imageSrc(tool.image)}
                alt={p.screenshot.replace('{name}', tool.name)}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover object-left-top"
              />
            </div>
          )}
          <div className="grid content-center gap-3">
            <h2 id={id} className="font-display text-h2 font-[750] [font-stretch:112%]">{tool.name}</h2>
            <p className="max-w-[34rem] text-lead text-[var(--color-muted-foreground)]">
              {lang === 'de' && tool.descriptionDe ? tool.descriptionDe : tool.description}
            </p>
            {forms ? (
              <div className="grid max-w-[34rem] gap-2">
                <p className="font-semibold">{p.forms_plans}</p>
                <p className="text-small text-[var(--color-muted-foreground)]">
                  {terms.contract_partner} {terms.vat_exempt}{' '}
                  <a href={FORMS_TERMS} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-hover)]">
                    {p.forms_terms}
                    <span className="sr-only"> {nav.nav_new_tab}</span>
                  </a>.
                </p>
              </div>
            ) : (
              <p className="font-semibold">{p.free}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ExternalButton href={tool.link} variant="primary" newTab={nav.nav_new_tab}>
                {p.open.replace('{name}', tool.name)}
              </ExternalButton>
              {tool.secondaryLink && (
                <ExternalButton href={tool.secondaryLink} variant="outline" newTab={nav.nav_new_tab}>
                  {home.tools_source}
                </ExternalButton>
              )}
              {forms && <TextLink href={FORMS_PRICING} external={newTab}>{p.forms_pricing}</TextLink>}
              {tool.docsLink && <TextLink href={tool.docsLink} external={newTab}>{p.docs}</TextLink>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default async function ToolsPage() {
  const { lang } = await getRequestLang()
  const home = homeTranslations[lang]
  const nav = layoutTranslations[lang]
  const p = toolsPageTranslations[lang]
  const gallery = imagesTranslations[lang]
  const tools = packagesById(WEB_TOOL_IDS)
  // The one line per tool the navigation already has, in both languages.
  const line: Record<string, string> = {
    'msk-forms':     nav.nav_forms_desc,
    'msk-paste':     nav.nav_paste_desc,
    'msk-shortener': nav.nav_shortener_desc,
  }

  return (
    <>
      <PageHero
        id="tools-title"
        crumbs={[{ label: packagesTranslations[lang].breadcrumb_home, href: '/' }, { label: nav.nav_tools }]}
        kicker={home.tools_kicker}
        title={home.tools_heading}
        lead={home.tools_subtitle}
        aside={
          <HeroLinks
            label={nav.nav_tools}
            links={[
              ...tools.map(tool => ({ href: `#${tool.id}`, title: tool.name, sub: line[tool.id] })),
              { href: '#gallery', title: nav.nav_images, sub: nav.nav_images_desc },
            ]}
          />
        }
      />

      {tools.map((tool, i) => <Tool key={tool.id} tool={tool} lang={lang} index={i} />)}

      {/* A screenshot of the gallery belongs here once one exists. */}
      <section id="gallery" aria-labelledby="gallery-title" className="scroll-mt-[var(--header-height)] border-t border-[var(--color-border)] py-[var(--space-section)]">
        <div className="container-page grid gap-3">
          <h2 id="gallery-title" className="font-display text-h2 font-[750] [font-stretch:112%]">{gallery.title}</h2>
          <p className="max-w-[34rem] text-lead text-[var(--color-muted-foreground)]">{gallery.subtitle}</p>
          <p className="font-semibold">{p.free}</p>
          <div className="mt-2">
            <Button asChild>
              <Link href="/tools/images">
                {p.images_open}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
