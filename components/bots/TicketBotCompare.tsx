import { ArrowRight, CaretDown, Check, Info, Translate as Languages } from '@/components/icons'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Section } from '@/components/home/Section'
import { PageHero } from '@/components/page/PageHero'
import { Button } from '@/components/ui/Button'
import { ticketBotCompareCopy, COMPARE_DATA_DATE, type CompareRow } from '@/content/ticketbot-compare-copy'
import { BOT_DOCS } from '@/lib/config'
import { layoutTranslations, packagesTranslations, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * The comparison page of the ticket bots.
 *
 * Deliberately without a hero image and without sales talk: it should read
 * like a reference, not like a second landing page, which is why "when our
 * bot is the wrong choice" stands before the call to action and not in small
 * print below it. Its questions and answers stay as they are: they are what
 * this page is for, and the FAQPage markup in the route reads them.
 *
 * Restyled in Phase 5 of the redesign (28.10.2026): head on the anthracite
 * band, lists instead of rows of icon cards (exclusion list 4.2), the table
 * in the style of the sample page. It scrolls in itself on a narrow screen;
 * without that it pushes the whole page sideways at 375 px.
 */
export function TicketBotCompare({ lang }: { lang: Lang }) {
  const t = ticketBotCompareCopy(lang)
  const nav = layoutTranslations[lang]
  const crumbs = packagesTranslations[lang]

  const cells = (row: CompareRow) => [row.msk, row.tickets, row.sayrix, row.tickettool]
  const cell = 'border-b border-[var(--color-border)] px-3.5 py-3 text-left align-top'

  return (
    <>
      <PageHero
        id="compare-title"
        crumbs={[
          { label: crumbs.breadcrumb_home, href: '/' },
          { label: nav.nav_discord, href: '/discord' },
          { label: 'Ticket Bot', href: '/discord/ticket-bot' },
          { label: t.badge },
        ]}
        kicker={t.badge}
        title={t.headline}
        lead={t.intro}
      >
        {/* A plain <a>: the partner address already carries its prefix, and
            LocaleLink would set it a second time. Same reason as on the
            landing page. */}
        <p className="text-small">
          <a
            href={t.altHref}
            hrefLang={lang === 'en' ? 'de' : 'en'}
            className="inline-flex min-h-11 items-center gap-1.5 text-[var(--color-band-muted)] underline-offset-4 hover:text-[var(--color-band-foreground)] hover:underline"
          >
            <Languages className="h-4 w-4" />
            {t.altLabel}
          </a>
        </p>
      </PageHero>

      <Section id="short-title" title={t.shortAnswerHeading}>
        <ul className="grid gap-x-[clamp(2rem,4cqi,5rem)] @3xl:grid-cols-2 @6xl:grid-cols-3">
          {t.shortAnswer.map(item => (
            <li key={item} className="flex gap-3 border-t border-[var(--color-border)] py-5">
              <Check className="mt-[0.25em] h-5 w-5 shrink-0 text-[var(--color-success)]" />
              <p className="max-w-[34rem]">{item}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="table-title" title={t.tableHeading} intro={t.tableNote.replace('{date}', COMPARE_DATA_DATE)}>
        <div
          className="max-w-[72rem] overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
          role="region"
          aria-labelledby="compare-caption"
          tabIndex={0}
        >
          <table className="w-full min-w-[46rem] border-collapse text-small">
            <caption id="compare-caption" className="border-b border-[var(--color-border)] px-3.5 py-3 text-left font-semibold">
              {t.tableHeading}
            </caption>
            <thead className="bg-[var(--color-accent-soft)]">
              <tr>
                <th scope="col" className={cn(cell, 'font-semibold')}>{t.columns.criterion}</th>
                <th scope="col" className={cn(cell, 'font-display font-[650] shadow-[inset_0_3px_0_var(--color-primary)]')}>{t.columns.msk}</th>
                <th scope="col" className={cn(cell, 'font-display font-[650]')}>{t.columns.tickets}</th>
                <th scope="col" className={cn(cell, 'font-display font-[650]')}>{t.columns.sayrix}</th>
                <th scope="col" className={cn(cell, 'font-display font-[650]')}>{t.columns.tickettool}</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>*]:border-b-0">
              {t.rows.map(row => (
                <tr key={row.criterion}>
                  <th scope="row" className={cn(cell, 'font-semibold')}>{row.criterion}</th>
                  {cells(row).map((value, i) => (
                    <td
                      key={`${row.criterion}-${i}`}
                      className={cn(
                        cell,
                        i === 0
                          ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-foreground)]'
                          : 'text-[var(--color-muted-foreground)]',
                      )}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="honest-title" title={t.honestHeading} intro={t.honestIntro}>
        <ul className="grid gap-x-[clamp(2rem,4cqi,5rem)] @3xl:grid-cols-2">
          {t.honest.map(item => (
            <li key={item} className="flex gap-3 border-t border-[var(--color-border)] py-5">
              <Info className="mt-[0.25em] h-5 w-5 shrink-0 text-[var(--color-warning)]" />
              <p className="max-w-[34rem]">{item}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="faq-title" title={t.faqHeading}>
        {/* Questions and answers stand in the rendered HTML, not only in the
            JSON-LD: a condition of the markup, and what a language model
            reads anyway. <details> instead of a stateful accordion: the text
            is in the DOM without JavaScript. */}
        <div className="grid max-w-[56rem] border-b border-[var(--color-border)]">
          {t.faq.map(item => (
            <details key={item.q} className="group border-t border-[var(--color-border)] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lead font-[650]">
                {item.q}
                <CaretDown className="h-5 w-5 shrink-0 text-[var(--color-primary)] transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="max-w-[40rem] pb-5 text-[var(--color-muted-foreground)]">{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section id="cta-title" title={t.ctaHeading} intro={t.ctaText}>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard/ticket-bot/verify" prefetch={false}>
              {t.ctaPrimary}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={BOT_DOCS.ticketbot} target="_blank" rel="noopener noreferrer">
              {t.ctaDocs}
              <span className="sr-only"> {nav.nav_new_tab}</span>
            </a>
          </Button>
        </div>
      </Section>
    </>
  )
}
