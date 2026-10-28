import { botLandingEntries } from '@/lib/botSeo'
import { SITE_CONFIG } from '@/lib/config'
import { pageSeo } from '@/lib/pageSeo'
import { groupProducts } from '@/lib/products'
import { productSnippet } from '@/lib/productView'
import { absoluteUrl } from '@/lib/siteUrl'
import { publicPath } from '@/lib/routes'
import type { TebexPackage } from '@/types/tebex'

/**
 * `/llms.txt`: the short map of the site for language models. What the shop
 * sells, which pages there are and what each one answers.
 *
 * Every title and every description comes from the place the page itself
 * takes it from: `PAGE_SEO` for the fixed pages, `productSnippet` for the
 * products, `botLandingEntries` for the bot landing pages. A second wording
 * kept here would drift from the first, and this file is exactly the one a
 * model quotes from.
 *
 * English only, the default language, with one pointer to `/de`. Listing both
 * would have doubled every line without telling a reader anything new.
 *
 * It names no prices. They change with every sale, and the product page with
 * its `Offer` markup is the place that keeps them current.
 *
 * One line per product, not per Tebex package: Encrypted and Source are two
 * choices on one page since Phase 4 of the redesign.
 */

const LANG = 'en' as const

function entry(title: string, url: string, note?: string): string {
  return note ? `- [${title}](${url}): ${note}` : `- [${title}](${url})`
}

/** A fixed page, with the title and description from `PAGE_SEO`. */
function page(path: string): string {
  const seo = pageSeo(path, LANG)
  return entry(seo.title, absoluteUrl(publicPath(LANG, path)), seo.description)
}

function section(heading: string, lines: string[]): string[] {
  return lines.length > 0 ? [`## ${heading}`, '', ...lines, ''] : []
}

/**
 * Takes the packages as an argument rather than loading them: the route
 * decides what to do when Tebex does not answer, and a test can call this
 * without a network.
 */
export function renderLlmsTxt(packages: TebexPackage[]): string {
  const home = pageSeo('/', LANG)

  const lines = [
    '# MSK Scripts',
    '',
    `> ${home.description}`,
    '',
    `Every page also exists in German under ${absoluteUrl('/de')}. The documentation for the scripts lives at ${SITE_CONFIG.docs}.`,
    '',
    ...section('FiveM scripts', [
      page('/fivem'),
      ...groupProducts(packages).map(product => {
        const { title, description } = productSnippet(product, LANG)
        return entry(title, absoluteUrl(publicPath(LANG, product.path)), description)
      }),
    ]),
    ...section(
      'Discord bots',
      botLandingEntries(LANG).map(bot => entry(bot.title, absoluteUrl(bot.path), bot.description)),
    ),
    ...section('Free resources', [
      page('/stats'),
      page('/tools/images'),
    ]),
    ...section('Optional', [
      entry('Documentation', SITE_CONFIG.docs),
      entry('GitHub', SITE_CONFIG.github),
      page('/discord/ticket-bot/stats'),
      page('/discord/giveaway-bot/stats'),
      page('/legal/terms'),
      page('/legal/imprint'),
      page('/legal/privacy'),
      page('/legal/withdrawal'),
    ]),
  ]

  return lines.join('\n').trimEnd() + '\n'
}
