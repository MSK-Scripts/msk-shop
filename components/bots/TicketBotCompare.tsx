import { ArrowRight, BookOpen, Check, Info, Languages } from 'lucide-react'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'

import { ticketBotCompareCopy, COMPARE_DATA_DATE, type CompareRow } from '@/content/ticketbot-compare-copy'
import type { Lang } from '@/lib/i18n'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/**
 * Vergleichsseite der Ticket-Bots.
 *
 * Bewusst ohne Hero-Bild und ohne Verkaufsrhetorik. Die Seite soll wie ein
 * Nachschlagewerk lesen, nicht wie eine zweite Landingpage: der Abschnitt
 * „wann unser Bot die falsche Wahl ist" steht deshalb VOR dem Call to Action
 * und nicht kleingedruckt darunter.
 *
 * Die Tabelle scrollt auf schmalen Displays in einem eigenen Container. Ohne
 * das schiebt sie bei 375 px die ganze Seite horizontal, und das ist der
 * häufigste Layoutfehler bei Vergleichstabellen.
 */
export function TicketBotCompare({ lang }: { lang: Lang }) {
  const t = ticketBotCompareCopy(lang)

  const cells = (row: CompareRow) => [row.msk, row.tickets, row.sayrix, row.tickettool]

  return (
    <div>
      {/* ── Kopf ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--color-border)]">
        <div className="container-page py-14 md:py-20">
          <span className="eyebrow">{t.badge}</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
            {t.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
            {t.intro}
          </p>
          {/* Sprachwechsel bewusst als <a>, nicht als LocaleLink: die
              Gegenstueck-Adresse traegt ihr Praefix bereits, LocaleLink wuerde
              es ein zweites Mal setzen. Gleiche Begruendung wie auf der
              Landingpage. */}
          <p className="mt-6">
            <a
              href={t.altHref}
              hrefLang={lang === 'en' ? 'de' : 'en'}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              <Languages className="h-4 w-4" />
              {t.altLabel}
            </a>
          </p>
        </div>
      </section>

      {/* ── Kurze Antwort ─────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
        <div className="container-page py-14 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.shortAnswerHeading}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {t.shortAnswer.map(item => (
              <li key={item}>
                <Card className="h-full p-5">
                  <Check className="mb-3 h-5 w-5 text-[var(--color-primary)]" />
                  <p className="text-sm leading-relaxed">{item}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Tabelle ───────────────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.tableHeading}</h2>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          {t.tableNote.replace('{date}', COMPARE_DATA_DATE)}
        </p>

        <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--color-card)] text-left">
                <th scope="col" className="border-b border-[var(--color-border)] p-4 font-bold">
                  {t.columns.criterion}
                </th>
                <th scope="col" className="border-b border-[var(--color-border)] p-4 font-bold text-[var(--color-primary)]">
                  {t.columns.msk}
                </th>
                <th scope="col" className="border-b border-[var(--color-border)] p-4 font-bold">
                  {t.columns.tickets}
                </th>
                <th scope="col" className="border-b border-[var(--color-border)] p-4 font-bold">
                  {t.columns.sayrix}
                </th>
                <th scope="col" className="border-b border-[var(--color-border)] p-4 font-bold">
                  {t.columns.tickettool}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map(row => (
                <tr key={row.criterion} className="align-top">
                  <th scope="row" className="border-b border-[var(--color-border)] p-4 text-left font-semibold">
                    {row.criterion}
                  </th>
                  {cells(row).map((value, i) => (
                    <td
                      key={`${row.criterion}-${i}`}
                      className={
                        i === 0
                          ? 'border-b border-[var(--color-border)] p-4 font-medium'
                          : 'border-b border-[var(--color-border)] p-4 text-[var(--color-muted-foreground)]'
                      }
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Gegenargumente ────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
        <div className="container-page py-14 md:py-20">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.honestHeading}</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            {t.honestIntro}
          </p>
          <ul className="mt-8 space-y-4">
            {t.honest.map(item => (
              <li key={item}>
                <Card className="flex gap-4 p-5">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" />
                  <p className="text-sm leading-relaxed">{item}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.faqHeading}</h2>
        {/*
          Fragen und Antworten stehen im gerenderten HTML, nicht nur im JSON-LD.
          Das ist Bedingung für die Auszeichnung und ohnehin das, was ein
          Sprachmodell liest. <details> statt eines Akkordeons mit State: der
          Inhalt ist auch ohne JavaScript im DOM und damit indizierbar.
        */}
        <div className="mt-8 space-y-3">
          {t.faq.map(item => (
            <details
              key={item.q}
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
            >
              <summary className="cursor-pointer list-none text-sm font-bold tracking-tight marker:content-['']">
                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)]">
        <div className="container-page py-14 text-center md:py-20">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted-foreground)] md:text-base">
            {t.ctaText}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/ticketbot/verify" prefetch={false}>
                {t.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a
                href="https://docu.msk-scripts.de/discord/discord_ticketbot/getting-started/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="h-4 w-4" />
                {t.ctaDocs}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
