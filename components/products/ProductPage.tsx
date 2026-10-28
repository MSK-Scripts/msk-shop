import type { ReactNode } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowSquareOut, CaretRight } from '@/components/icons'
import { JsonLd } from '@/components/JsonLd'
import { PackageGallery } from '@/components/packages/PackageGallery'
import { Badge } from '@/components/ui/Badge'
import { packagesTranslations, type Lang } from '@/lib/i18n'
import { buyOptions } from '@/lib/buyOptions'
import { breadcrumbJsonLd, productJsonLd } from '@/lib/jsonLd'
import { chooseVariant, type Product } from '@/lib/products'
import {
  formatDate, productCopy, productDescription, productDocsUrl, productFrameworks, productImages,
  productName, productSummary, variantViews,
} from '@/lib/productView'
import type { ProductRelease } from '@/lib/releases'
import { publicPath } from '@/lib/routes'
import { ProductBuyBox } from './ProductBuyBox'
import { VariantComparison } from './VariantComparison'

interface Props {
  product: Product
  lang: Lang
  /** `?variant=` of the address; the canonical address has none. */
  requestedVariant?: unknown
  /** Newest first, at most three; empty when the product has no release feed. */
  releases: ProductRelease[]
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="font-display text-h3 font-[650]">
      {children}
    </h2>
  )
}

/**
 * The page of one product (plan 5.6). Two columns from a wide enough
 * container: gallery and the sections on the left, the buy box on the right,
 * staying in view while the left column scrolls. In one column the order is
 * gallery, buy box, sections, so on a phone name, price, choice and cart
 * button follow the gallery in the first screen.
 *
 * Shared by `/fivem/[slug]` and `/fivem/all-access`.
 */
export function ProductPage({ product, lang, requestedVariant, releases }: Props) {
  const t = packagesTranslations[lang]
  const name = productName(product, lang)
  const summary = productSummary(product, lang)
  const frameworks = productFrameworks(product)
  const copy = productCopy(product)
  const images = productImages(product)
  const description = productDescription(product, lang)
  const views = variantViews(product)
  const subscription = product.kind === 'subscription'
  const initial = chooseVariant(product, requestedVariant).variant

  // Only what the cart button needs travels to the browser, not the descriptions.
  const options = buyOptions(product)

  const encrypted = views.find(v => v.variant === 'encrypted')
  const source = views.find(v => v.variant === 'source')
  const hasRequirements = !!(copy?.requires?.length || copy?.optional?.length || frameworks.length > 0)
  const docsUrl = productDocsUrl(product)
  const newest = releases[0]

  return (
    <div className="container-page py-[clamp(1.25rem,0.75rem+1.5vw,3.5rem)]">
      {/* The breadcrumb values match the visible navigation below, in the
          language of the page. */}
      <JsonLd
        data={[
          productJsonLd(
            {
              name,
              path: product.path,
              image: images.hero,
              description: summary?.text,
              offers: views.map(v => ({
                name: v.variant === 'source' ? t.variant_source : v.variant === 'encrypted' ? t.variant_encrypted : undefined,
                price: v.totalPrice,
                currency: v.currency,
              })),
            },
            lang,
          ),
          breadcrumbJsonLd([
            { name: t.breadcrumb_home,  path: publicPath(lang, '/') },
            { name: t.breadcrumb_fivem, path: publicPath(lang, '/fivem') },
            { name },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-[clamp(0.75rem,0.5rem+0.75vw,1.75rem)] text-small text-[var(--color-muted-foreground)]">
        <ol className="flex flex-wrap items-center gap-x-1.5">
          <li><Link href="/" className="inline-flex min-h-6 items-center hover:text-[var(--color-foreground)] hover:underline">{t.breadcrumb_home}</Link></li>
          <li aria-hidden><CaretRight className="h-3 w-3" /></li>
          <li><Link href="/fivem" className="inline-flex min-h-6 items-center hover:text-[var(--color-foreground)] hover:underline">{t.breadcrumb_fivem}</Link></li>
          <li aria-hidden><CaretRight className="h-3 w-3" /></li>
          <li aria-current="page" className="text-[var(--color-foreground)]">{name}</li>
        </ol>
      </nav>

      <div className="@container/product">
        {/* The gallery column stops at 100rem: the screenshots are 1280 to
            1920 px wide, and on UWQHD a column reaching to the buy box made
            the first image 2300 x 1440 px, larger than the screen (measured
            28.10.2026 at 3440 x 1440). */}
        <div className="grid gap-x-[clamp(2rem,1rem+2vw,4.5rem)] gap-y-[var(--space-stack)] @min-[56rem]/product:grid-cols-[minmax(0,100rem)_clamp(21rem,32cqi,32rem)]">
          <div className="min-w-0 @min-[56rem]/product:col-start-1 @min-[56rem]/product:row-start-1">
            <PackageGallery lang={lang} images={images.gallery} alt={name} />
          </div>

          <div className="min-w-0 @min-[56rem]/product:col-start-2 @min-[56rem]/product:row-span-2 @min-[56rem]/product:row-start-1">
            <div className="@min-[56rem]/product:sticky @min-[56rem]/product:top-[calc(var(--header-height)+1.5rem)]">
              <ProductBuyBox
                lang={lang}
                options={options}
                initial={initial}
                subscription={subscription}
                requirementsHref={hasRequirements ? '#requirements' : undefined}
                heading={
                  <div className="grid gap-1">
                    <h1 className="font-display text-product font-[750] leading-tight [font-stretch:112%]">{name}</h1>
                    {newest && (
                      <p className="text-small text-[var(--color-muted-foreground)]">
                        {newest.date
                          ? t.release_line.replace('{version}', newest.version).replace('{date}', formatDate(newest.date, lang))
                          : t.release_line_nodate.replace('{version}', newest.version)}
                      </p>
                    )}
                  </div>
                }
                details={summary || frameworks.length > 0 ? (
                  <div className="grid gap-2">
                  {summary && (
                    <p lang={summary.lang !== lang ? summary.lang : undefined} className="text-small text-[var(--color-muted-foreground)]">
                      {summary.text}
                    </p>
                  )}
                  {frameworks.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label={t.facet_framework}>
                      {frameworks.map(f => (
                        <li key={f}><Badge variant="tag" className="text-label normal-case tracking-normal">{f}</Badge></li>
                      ))}
                    </ul>
                  )}
                  </div>
                ) : undefined}
              />
            </div>
          </div>

          <div className="grid min-w-0 content-start gap-[clamp(2rem,1.5rem+1.5vw,3.5rem)] @min-[56rem]/product:col-start-1 @min-[56rem]/product:row-start-2">
            {encrypted && source && (
              <section aria-labelledby="compare-title" className="grid gap-3">
                <SectionHeading id="compare-title">{t.compare_heading}</SectionHeading>
                <p className="max-w-[34rem] text-body text-[var(--color-muted-foreground)]">{t.compare_intro}</p>
                <VariantComparison
                  id="compare-caption"
                  lang={lang}
                  prices={{ encrypted, source }}
                  subscription={subscription}
                />
              </section>
            )}

            {hasRequirements && (
              <section id="requirements" aria-labelledby="requirements-title" className="grid scroll-mt-[calc(var(--header-height)+1rem)] gap-3">
                <SectionHeading id="requirements-title">{t.req_heading}</SectionHeading>
                <dl className="grid max-w-[48rem] gap-x-6 gap-y-2 text-body sm:grid-cols-[max-content_minmax(0,1fr)]">
                  {frameworks.length > 0 && (
                    <>
                      <dt className="font-semibold">{t.req_framework}</dt>
                      <dd className="text-[var(--color-muted-foreground)]">{frameworks.join(', ')}</dd>
                    </>
                  )}
                  {copy?.requires && copy.requires.length > 0 && (
                    <>
                      <dt className="font-semibold">{t.req_required}</dt>
                      <dd className="text-[var(--color-muted-foreground)]">{copy.requires.join(', ')}</dd>
                    </>
                  )}
                  {copy?.optional && copy.optional.length > 0 && (
                    <>
                      <dt className="font-semibold">{t.req_optional}</dt>
                      <dd className="text-[var(--color-muted-foreground)]">{copy.optional.join(', ')}</dd>
                    </>
                  )}
                </dl>
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-11 items-center gap-1.5 justify-self-start font-semibold text-[var(--color-primary)] hover:underline"
                >
                  {t.req_docs}
                  <ArrowSquareOut className="h-4 w-4" />
                </a>
              </section>
            )}

            {releases.length > 0 && (
              <section aria-labelledby="updates-title" className="grid gap-3">
                <SectionHeading id="updates-title">{t.updates_heading}</SectionHeading>
                {/* The changelogs of the VERSIONS repository are English. */}
                <ol className="grid max-w-[48rem] gap-4" lang={lang === 'en' ? undefined : 'en'}>
                  {releases.map(r => (
                    <li key={r.version} className="grid gap-0.5 border-l-2 border-[var(--color-border)] pl-4">
                      <p className="font-semibold">
                        {t.release_line_nodate.replace('{version}', r.version)}
                        {r.date ? (
                          <>
                            {' · '}
                            <time dateTime={r.date} className="font-normal text-[var(--color-muted-foreground)]" lang={lang}>
                              {formatDate(r.date, lang)}
                            </time>
                          </>
                        ) : null}
                      </p>
                      {r.summary && <p className="text-body text-[var(--color-muted-foreground)]">{r.summary}</p>}
                    </li>
                  ))}
                </ol>
                {lang !== 'en' && <p className="text-small text-[var(--color-muted-foreground)]">{t.english_only}</p>}
              </section>
            )}

            {description.html && (
              <section aria-labelledby="description-title" className="grid gap-3">
                <SectionHeading id="description-title">{t.description_heading}</SectionHeading>
                {description.lang !== lang && (
                  <p className="text-small text-[var(--color-muted-foreground)]">{t.english_only}</p>
                )}
                <div
                  lang={description.lang !== lang ? description.lang : undefined}
                  className="tebex-description min-w-0"
                  dangerouslySetInnerHTML={{ __html: description.html }}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
