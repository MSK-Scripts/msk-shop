import type { Metadata } from 'next'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { notFound } from 'next/navigation'

import { CopyUrlButton } from '@/components/images/CopyUrlButton'
import { BrandNotice, OWN_WORK_CATEGORY } from '@/components/images/BrandNotice'
import { ReportLink } from '@/components/legal/ReportLink'
import { JsonLd } from '@/components/JsonLd'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { alternatesFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { imagesTranslations, type Lang } from '@/lib/i18n'
import { getImage, getNeighbours, listCategories } from '@/lib/images'
import { absoluteUrl } from '@/lib/siteUrl'

export const revalidate = 300

type Params = Promise<{ category: string; name: string }>

function formatBytes(bytes: number, lang: Lang): string {
  const kb = bytes / 1024
  const nf = new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 1 })
  return kb < 1024 ? `${nf.format(kb)} KB` : `${nf.format(kb / 1024)} MB`
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, name } = await params
  const { lang } = await getRequestLang()
  const image = await getImage(category, name.toLowerCase())
  if (!image) return {}

  const display = image.label || image.name
  const title = lang === 'de'
    ? `${display} Bild, freigestellt (PNG)`
    : `${display} image, transparent PNG`
  const description = lang === 'de'
    ? `Freigestelltes ${display}-Bild aus GTA V, ${image.width} mal ${image.height} Pixel, kostenlos für FiveM-Scripts. Direkt über die CDN-URL nutzbar.`
    : `Transparent ${display} image from GTA V, ${image.width} by ${image.height} pixels, free for FiveM scripts. Use the CDN URL directly.`

  return {
    title,
    description,
    alternates: alternatesFor(lang, `/images/${category}/${image.name}`),
    openGraph: { images: [{ url: image.url, width: image.width, height: image.height }] },
  }
}

export default async function ImageDetailPage({ params }: { params: Params }) {
  const { category: slug, name: rawName } = await params
  const { lang } = await getRequestLang()
  const t = imagesTranslations[lang]

  const name  = rawName.toLowerCase()
  const image = await getImage(slug, name)
  if (!image) notFound()

  const [categories, neighbours] = await Promise.all([
    listCategories(lang),
    getNeighbours(slug, name),
  ])
  const category = categories.find(c => c.slug === slug)
  const display  = image.label || image.name

  return (
    <div className="container-page py-10 md:py-14">
      <JsonLd
        data={{
          '@context':   'https://schema.org',
          '@type':      'ImageObject',
          name:         display,
          contentUrl:   image.url,
          thumbnailUrl: image.thumb,
          width:        image.width,
          height:       image.height,
          encodingFormat: 'image/png',
          url:          absoluteUrl(`/images/${slug}/${image.name}`),
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 font-mono text-xs text-[var(--color-muted-foreground)]">
        <Link href="/images" className="hover:text-[var(--color-primary)]">{t.title}</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link href={`/images/${slug}`} className="hover:text-[var(--color-primary)]">
          {category?.name ?? slug}
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-[var(--color-foreground)]">{image.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <Card className="checker-bg flex min-h-[20rem] items-center justify-center overflow-hidden p-6">
            {/* eslint-disable-next-line @next/next/no-img-element --
                Siehe components/images/ImageCard.tsx: die CDN-Datei ist bereits
                die fertige Fassung, next/image haette hier nichts zu tun. */}
            <img
              src={image.url}
              alt={display}
              width={image.width}
              height={image.height}
              className="max-h-[32rem] w-auto max-w-full object-contain"
            />
          </Card>

          {(neighbours.prev || neighbours.next) && (
            <nav className="mt-4 flex items-center justify-between" aria-label={t.gallery_title}>
              {neighbours.prev ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/images/${slug}/${neighbours.prev}`}>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span className="font-mono">{neighbours.prev}</span>
                  </Link>
                </Button>
              ) : <span />}

              {neighbours.next && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/images/${slug}/${neighbours.next}`}>
                    <span className="font-mono">{neighbours.next}</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </nav>
          )}
        </div>

        <aside>
          <h1 className="text-2xl font-bold tracking-tight">{display}</h1>
          <p className="mt-1 font-mono text-sm text-[var(--color-muted-foreground)]">
            {image.name}
          </p>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-muted-foreground)]">{t.meta_category}</dt>
              <dd>{category?.name ?? slug}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-muted-foreground)]">{t.meta_dimensions}</dt>
              <dd className="font-mono">{image.width} × {image.height}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-muted-foreground)]">{t.meta_size}</dt>
              <dd className="font-mono">{formatBytes(image.bytes, lang)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-muted-foreground)]">{t.meta_formats}</dt>
              <dd className="font-mono">PNG, WebP</dd>
            </div>
          </dl>

          {/* Die URL steht sichtbar da und nicht nur hinter dem Knopf: wer sie
              braucht, will sie oft auch lesen und von Hand anpassen. */}
          {/* Above the copy button and not below it: whoever takes the address
              should have read what they may do with it first. */}
          {slug === OWN_WORK_CATEGORY && <BrandNotice lang={lang} className="mt-6" />}

          <div className="mt-6">
            <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              URL
            </p>
            <code className="block overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-3 font-mono text-xs">
              {image.card}
            </code>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <CopyUrlButton url={image.card} lang={lang} />
            <Button asChild variant="ghost" size="sm">
              {/* Kein `download`-Attribut: die Datei liegt auf einem anderen
                  Host, und cross-origin ignoriert der Browser es ohnehin. Ein
                  Link, der etwas anderes verspricht als er tut, ist schlechter
                  als einer, der das Bild einfach oeffnet. */}
              <a href={image.url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" aria-hidden="true" />
                {t.open_original}
              </a>
            </Button>
          </div>

          <section className="mt-8">
            <h2 className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              {t.usage_title}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {t.usage_body}
            </p>
          </section>

          <Button asChild variant="outline" size="sm" className="mt-8">
            <Link href={`/images/${slug}`}>
              {t.back_to.replace('{category}', category?.name ?? slug)}
            </Link>
          </Button>

          {/* Meldeweg nach Art. 16 DSA. Die Galerie enthaelt von Nutzern
              eingereichte Bilder; ein Meldeformular, das nur im Fusszeilen-Menue
              steht, ist nicht "leicht zugaenglich" im Sinne der Norm. */}
          <div className="mt-4">
            <ReportLink path={`/images/${slug}/${image.name}`} />
          </div>
        </aside>
      </div>
    </div>
  )
}
