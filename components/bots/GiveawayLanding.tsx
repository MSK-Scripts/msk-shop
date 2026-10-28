import { ArrowRight, Translate as Languages } from '@/components/icons'

import { BotCrossLink } from '@/components/bots/BotCrossLink'
import { Section, TextLink } from '@/components/home/Section'
import { FactList } from '@/components/page/FactList'
import { Accent, HeroFacts, PageHero } from '@/components/page/PageHero'
import { Button } from '@/components/ui/Button'
import { GIVEAWAY_COPY } from '@/content/giveaway-copy'
import { BOT_DOCS, SITE_CONFIG } from '@/lib/config'
import { homeTranslations, layoutTranslations, packagesTranslations, type Lang } from '@/lib/i18n'

/**
 * The giveaway bot landing page, `/en/discord/giveaway-bot` with `lang="en"`,
 * `/de/discord/giveaway-bot` with `lang="de"`. As with the ticket bot the
 * language is fixed per address, never taken from a cookie.
 *
 * Layout per plan 5.7 since Phase 5 of the redesign (28.10.2026): the head on
 * the anthracite band, then function by function, the commands as a table.
 * The bot is free, so there is no price table and no price statement; the
 * price beside the heading says so. Texts in `content/giveaway-copy.ts`.
 */

export const GIVEAWAY_INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1512465732179329065&scope=bot+applications.commands&permissions=478208'
export const GIVEAWAY_GITHUB_URL = 'https://github.com/MSK-Scripts/discord_giveawaybot'

/** The command names are the same in every language, as in the bot. */
const COMMAND_NAMES = [
  '/gcreate', '/gedit <id>', '/gextend <id>', '/gend <id>', '/greroll <id>',
  '/gcancel <id>', '/gpause <id>', '/gresume <id>', '/gtemplate', '/gsettings',
  '/glist', '/ginfo <id>', '/gstats', '/ghelp', '/ginvite',
] as const

const code = 'rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.875em] text-[var(--color-foreground)]'

export function GiveawayLanding({ lang }: { lang: Lang }) {
  const t = GIVEAWAY_COPY[lang]
  const home = homeTranslations[lang]
  const nav = layoutTranslations[lang]
  const crumbs = packagesTranslations[lang]
  const newTab = nav.nav_new_tab

  const invite = (label: string, size: 'md' | 'lg' = 'lg') => (
    <Button asChild size={size}>
      <a href={GIVEAWAY_INVITE_URL} target="_blank" rel="noopener noreferrer">
        {label}
        <ArrowRight className="h-5 w-5" />
        <span className="sr-only"> {newTab}</span>
      </a>
    </Button>
  )
  const cell = 'border-b border-[var(--color-border)] px-3.5 py-3 text-left align-top'

  return (
    <>
      <PageHero
        id="giveaway-title"
        crumbs={[
          { label: crumbs.breadcrumb_home, href: '/' },
          { label: nav.nav_discord, href: '/discord' },
          { label: 'Giveaway Bot' },
        ]}
        kicker={t.badge}
        title={<>{t.headline.lead} <Accent>{t.headline.accent}</Accent>{t.headline.tail}</>}
        lead={t.heroText}
        actions={
          <>
            <Button asChild size="lg" variant="band">
              <a href={GIVEAWAY_INVITE_URL} target="_blank" rel="noopener noreferrer">
                {t.heroCtaInvite}
                <ArrowRight className="h-5 w-5" />
                <span className="sr-only"> {newTab}</span>
              </a>
            </Button>
            <Button asChild size="lg" variant="band-outline">
              <a href={BOT_DOCS.giveaway} target="_blank" rel="noopener noreferrer">
                {t.heroCtaDocs}
                <span className="sr-only"> {newTab}</span>
              </a>
            </Button>
            <TextLink href={SITE_CONFIG.discord} external={{ newTab }} tone="band">{t.heroCtaDiscord}</TextLink>
          </>
        }
        aside={<HeroFacts label={t.badge} lead={home.bot_price_giveaway} items={t.highlights} />}
      >
        {/* A plain <a>, see the ticket bot page for why. */}
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

      {/* Screenshots of a giveaway embed in Discord and of the result page
          belong next to the steps once they exist. */}
      <Section id="steps-title" kicker={t.stepsEyebrow} title={t.stepsHeading} intro={t.stepsSub}>
        <div className="grid gap-5">
          <FactList items={t.steps} numbered wide />
          <div>{invite(t.stepsCta)}</div>
        </div>
      </Section>

      <Section id="features-title" kicker={t.featuresEyebrow} title={t.featuresHeading} intro={t.featuresSub}>
        <FactList items={t.features} wide />
      </Section>

      <Section id="commands-title" kicker={t.commandsEyebrow} title={t.commandsHeading} intro={t.commandsSub}>
        <div
          className="max-w-[72rem] overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
          role="region"
          aria-labelledby="commands-caption"
          tabIndex={0}
        >
          <table className="w-full min-w-[36rem] border-collapse text-small">
            <caption id="commands-caption" className="border-b border-[var(--color-border)] px-3.5 py-3 text-left font-semibold">
              {t.commandsHeading}
            </caption>
            <thead className="bg-[var(--color-accent-soft)]">
              <tr>
                <th scope="col" className={`${cell} font-semibold`}>{t.commandColName}</th>
                <th scope="col" className={`${cell} font-semibold`}>{t.commandColWho}</th>
                <th scope="col" className={`${cell} font-semibold`}>{t.commandColText}</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>*]:border-b-0">
              {COMMAND_NAMES.map((cmd, i) => (
                <tr key={cmd}>
                  <th scope="row" className={`${cell} whitespace-nowrap`}>
                    <code className="font-mono text-[0.9375em] font-semibold text-[var(--color-foreground)]">{cmd}</code>
                  </th>
                  <td className={`${cell} whitespace-nowrap text-[var(--color-muted-foreground)]`}>{t.commandWho[i]}</td>
                  <td className={`${cell} text-[var(--color-muted-foreground)]`}>{t.commandText[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id="settings-title"
        kicker={t.settingsEyebrow}
        title={t.settingsHeading}
        intro={<>{t.settingsIntroA} <code className={code}>/gsettings</code>{t.settingsIntroB}</>}
      >
        <div className="grid gap-5">
          <FactList items={t.settings} wide />
          <div className="flex flex-wrap items-center gap-3">
            {invite(t.settingsCtaInvite, 'md')}
            <Button asChild variant="outline">
              <a href={GIVEAWAY_GITHUB_URL} target="_blank" rel="noopener noreferrer">
                {t.settingsCtaSource}
                <span className="sr-only"> {newTab}</span>
              </a>
            </Button>
          </div>
        </div>
      </Section>

      <Section
        id="coupons-title"
        kicker={t.couponEyebrow}
        title={t.couponHeading}
        intro={<>{t.couponSubA} <strong className="font-semibold text-[var(--color-foreground)]">{t.couponSubStrong}</strong> {t.couponSubB}</>}
      >
        <div className="grid gap-5">
          <FactList items={t.coupons} wide />
          <p className="max-w-[40rem] text-small text-[var(--color-muted-foreground)]">{t.couponNote}</p>
        </div>
      </Section>

      <Section id="trust-title" kicker={t.trustEyebrow} title={t.trustHeading}>
        <div className="grid gap-[var(--space-stack)]">
          <FactList items={t.trust} wide />
          <div className="grid gap-3">
            <h3 className="font-display text-h3 font-[650]">{t.ctaHeading}</h3>
            <p className="max-w-[34rem] text-[var(--color-muted-foreground)]">
              {t.ctaTextA} <code className={code}>/gcreate</code> {t.ctaTextB}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {invite(t.ctaInvite)}
              <Button asChild size="lg" variant="outline">
                <a href={BOT_DOCS.giveaway} target="_blank" rel="noopener noreferrer">
                  {t.ctaDocs}
                  <span className="sr-only"> {newTab}</span>
                </a>
              </Button>
            </div>
          </div>
          <BotCrossLink lang={lang} current="giveaway" />
        </div>
      </Section>
    </>
  )
}
