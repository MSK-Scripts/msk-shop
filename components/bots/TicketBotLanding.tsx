import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight, ShieldCheck, Translate as Languages } from '@/components/icons'

import { BotCrossLink } from '@/components/bots/BotCrossLink'
import { TicketBotTiers } from '@/components/bots/TicketBotTiers'
import { Section, TextLink } from '@/components/home/Section'
import { FactList } from '@/components/page/FactList'
import { Accent, HeroFacts, PageHero } from '@/components/page/PageHero'
import { Button } from '@/components/ui/Button'
import { TICKETBOT_COPY } from '@/content/ticketbot-copy'
import { BOT_DOCS, SITE_CONFIG } from '@/lib/config'
import { homeTranslations, layoutTranslations, packagesTranslations, type Lang } from '@/lib/i18n'
import { TRIAL_DAYS } from '@/lib/stripe'
import { cheapestPaidTier, formatTierPrice } from '@/lib/tiers'

/**
 * The ticket bot landing page, built once, rendered twice: `/en/discord/ticket-bot`
 * with `lang="en"`, `/de/discord/ticket-bot` with `lang="de"`. The language
 * comes from the path, never from a cookie: two addresses with the same text
 * would be duplicate content and the hreflang pair a lie.
 *
 * Layout per plan 5.7 since Phase 5 of the redesign (28.10.2026): the head on
 * the anthracite band with the price beside it, then function by function,
 * the plans as a table with the price statement under it, and requirements
 * plus documentation where the FAQ used to be (decision E4). The rows of
 * equal icon cards are gone (exclusion list 4.2).
 *
 * Every visible string comes from `content/ticketbot-copy.ts`, every price
 * and limit from lib/tiers.ts.
 */

/** Targets of the three `hubCards`, in their order. */
const HUB_HREFS = ['/dashboard/ticket-bot/verify', '/dashboard/ticket-bot', '/discord/ticket-bot/stats'] as const

/** Verify and the dashboard depend on the session: never prefetched. */
const prefetch = (href: string) => (href.startsWith('/dashboard') ? false : undefined)

const code = 'rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.875em] text-[var(--color-foreground)]'

export function TicketBotLanding({ lang }: { lang: Lang }) {
  const t = TICKETBOT_COPY[lang]
  const home = homeTranslations[lang]
  const nav = layoutTranslations[lang]
  const crumbs = packagesTranslations[lang]
  const newTab = { newTab: nav.nav_new_tab }
  const from = formatTierPrice(cheapestPaidTier(), lang)

  return (
    <>
      <PageHero
        id="ticketbot-title"
        crumbs={[
          { label: crumbs.breadcrumb_home, href: '/' },
          { label: nav.nav_discord, href: '/discord' },
          { label: 'Ticket Bot' },
        ]}
        kicker={t.badge}
        // The keyword stands in the h1, not only in the kicker and the <title>.
        title={<>{t.headline.lead} <Accent>{t.headline.accent}</Accent>{t.headline.tail}</>}
        lead={t.heroText}
        actions={
          <>
            <Button asChild size="lg" variant="band">
              <Link href="/dashboard/ticket-bot/verify" prefetch={false}>
                {t.heroCtaKey}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="band-outline">
              <a href={BOT_DOCS.ticketbot} target="_blank" rel="noopener noreferrer">
                {t.heroCtaDocs}
                <span className="sr-only"> {nav.nav_new_tab}</span>
              </a>
            </Button>
            <TextLink href={SITE_CONFIG.discord} external={newTab} tone="band">{t.heroCtaDiscord}</TextLink>
          </>
        }
        aside={
          <HeroFacts
            label={t.badge}
            lead={home.bot_price_ticket.replace('{price}', from)}
            items={t.highlights}
          />
        }
      >
        {/* A link to the live figures instead of a number nobody can check. */}
        <p className="max-w-[46ch] text-small text-[var(--color-band-muted)]">
          {t.heroProof}{' '}
          <Link href="/discord/ticket-bot/stats" className="font-semibold text-[var(--color-band-accent)] underline underline-offset-4 hover:text-[var(--color-band-foreground)]">
            {t.heroProofCta}
          </Link>
        </p>
        {/* A plain <a>: both addresses rewrite to the same route tree, so the
            client router would see no segment change and keep the text, and
            LocaleLink would prefix the partner address a second time. */}
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

      <Section id="problem-title" kicker={t.problemEyebrow} title={t.problemHeading}>
        <div className="grid gap-5">
          <FactList items={t.problems} wide />
          <p className="max-w-[34rem] text-[var(--color-muted-foreground)]">{t.switchText}</p>
          <div>
            <TextLink href="/discord/ticket-bot/compare">{t.compareCta}</TextLink>
          </div>
        </div>
      </Section>

      <Section id="hub-title" kicker={t.hubEyebrow} title={t.hubHeading} intro={t.hubSub}>
        <ul className="grid gap-x-[clamp(2rem,4cqi,5rem)] @3xl:grid-cols-2 @6xl:grid-cols-3">
          {t.hubCards.map((card, i) => (
            <li key={HUB_HREFS[i]} className="grid content-start gap-1.5 border-t border-[var(--color-border)] py-5">
              <span className="kicker">{card.eyebrow}</span>
              <h3 className="font-display text-lead font-[650]">{card.title}</h3>
              <p className="max-w-[34rem] text-[var(--color-muted-foreground)]">{card.text}</p>
              <div>
                <TextLink href={HUB_HREFS[i]} prefetch={prefetch(HUB_HREFS[i])}>{card.cta}</TextLink>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="verify-title" kicker={t.verifyEyebrow} title={t.verifyHeading}>
        <div className="grid gap-5">
          <FactList items={t.verifySteps} numbered />
          <div>
            <Button asChild size="lg">
              <Link href="/dashboard/ticket-bot/verify" prefetch={false}>
                {t.verifyCta}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section id="features-title" kicker={t.featuresEyebrow} title={t.featuresHeading} intro={t.featuresSub}>
        <FactList items={t.features} wide />
      </Section>

      {/* A screenshot of the bot's own web dashboard belongs here once one
          exists; the section reads without it. */}
      <Section
        id="dashboard-title"
        kicker={t.dashboardEyebrow}
        title={t.dashboardHeading}
        intro={
          <>
            {t.dashboardIntroA} <code className={code}>npm run dashboard</code> {t.dashboardIntroB}{' '}
            <code className={code}>npm start</code> {t.dashboardIntroC}
          </>
        }
        action={<TextLink href={BOT_DOCS.ticketbotDashboard} external={newTab}>{t.dashboardDocsCta}</TextLink>}
      >
        <div className="grid gap-5">
          <p className="flex max-w-[40rem] items-start gap-2.5 text-[var(--color-muted-foreground)]">
            <ShieldCheck className="mt-[0.25em] h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <span>{t.dashboardSecure}</span>
          </p>
          <FactList items={t.dashboardItems} />
        </div>
      </Section>

      <Section id="hosted-title" kicker={t.hostedEyebrow} title={t.hostedHeading} intro={t.hostedText}>
        <div className="grid gap-5">
          <FactList items={t.hostedItems} />
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/dashboard/ticket-bot" prefetch={false}>{t.hostedCtaDashboard}</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={SITE_CONFIG.discord} target="_blank" rel="noopener noreferrer">
                {t.hostedCtaDiscord}
                <span className="sr-only"> {nav.nav_new_tab}</span>
              </a>
            </Button>
          </div>
        </div>
      </Section>

      <Section
        id="plans-title"
        className="scroll-mt-[var(--header-height)]"
        kicker={t.tiersEyebrow}
        title={t.tiersHeading}
        intro={
          <>
            {t.tiersSubLead}{' '}
            <strong className="font-semibold text-[var(--color-foreground)]">
              {t.tiersSubTrial.replace('{n}', String(TRIAL_DAYS))}
            </strong>
            {t.tiersSubTail}
          </>
        }
      >
        <TicketBotTiers lang={lang} />
      </Section>

      <Section id="requirements-title" kicker={t.reqKicker} title={t.ctaHeading} intro={t.ctaText}>
        <div className="grid gap-5">
          <FactList items={t.requirements} />
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard/ticket-bot/verify" prefetch={false}>
                {t.ctaKey}
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
          <BotCrossLink lang={lang} current="ticketbot" />
        </div>
      </Section>
    </>
  )
}
