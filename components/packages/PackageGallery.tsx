'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight, MagnifyingGlassPlus as ZoomIn, X } from '@/components/icons'
import { cn } from '@/lib/utils'
import { packagesTranslations, type Lang } from '@/lib/i18n'

interface PackageGalleryProps {
  /** Language of the control labels. */
  lang: Lang
  /**
   * Image URLs in display order. The product page puts the screenshots first
   * and the Tebex banner last (lib/productView.ts, `productImages`).
   */
  images: string[]
  /** Alt text / placeholder source (usually the product name). */
  alt: string
  className?: string
}

// A fixed ratio instead of a fixed height: the frame grows with its column
// from a phone to UWQHD, and the page does not jump when the image arrives.
// `object-contain` on a sunken ground, because the screenshots come in every
// ratio (1280 × 840 for the garage, 1176 × 1263 for the key menu) and a crop
// would cut off exactly the part of a UI someone wants to see.
const FRAME = 'relative aspect-[16/10] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]'
// A single image is the Tebex banner, the product has no screenshot. It keeps
// its own ratio: the subscription banner is 2000 x 476 and would float in a
// 16:10 frame with two thirds of it empty.
const FRAME_SINGLE = 'relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]'

// 44 px drawn, not through `tap-target`: that utility sets `position: relative`
// and would pull the absolutely placed arrows back into the flow.
const CONTROL = 'absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--color-primary)]'

export function PackageGallery({ lang, images, alt, className }: PackageGalleryProps) {
  const t = packagesTranslations[lang]
  const count = images.length
  const [rawIndex, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const touchStartX = useRef<number | null>(null)

  // Keep the index valid if the image set ever changes. Derived rather than
  // corrected in an effect, so a shrinking gallery never renders a missing
  // slide first.
  const index = rawIndex < count ? rawIndex : 0

  // Clamp the previous value the same way `index` does — it can still be out of
  // range when the image set just shrank.
  const go = useCallback(
    (dir: number) => setIndex(i => ((i < count ? i : 0) + dir + count) % count),
    [count],
  )

  // Lightbox: lock body scroll + keyboard controls (Esc to close, arrows to navigate).
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [zoomed, go])

  // ── No image → placeholder ────────────────────────────────────────────────
  if (count === 0) {
    return (
      <div className={cn(FRAME, 'grid place-items-center', className)}>
        <span className="font-display text-h3 font-semibold text-[var(--color-muted-foreground)]">{alt}</span>
      </div>
    )
  }

  const multiple = count > 1

  return (
    <div className={cn('@container', className)}>
      <div
        className={multiple ? FRAME : FRAME_SINGLE}
        role={multiple ? 'group' : undefined}
        aria-roledescription={multiple ? 'carousel' : undefined}
        aria-label={multiple ? t.gallery_of.replace('{alt}', alt) : undefined}
        tabIndex={multiple ? 0 : undefined}
        onKeyDown={
          multiple
            ? e => {
                if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
                else if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
              }
            : undefined
        }
        onTouchStart={multiple ? e => { touchStartX.current = e.touches[0].clientX } : undefined}
        onTouchEnd={
          multiple
            ? e => {
                if (touchStartX.current === null) return
                const dx = e.changedTouches[0].clientX - touchStartX.current
                if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
                touchStartX.current = null
              }
            : undefined
        }
      >
        {/* Only the active slide is rendered; the first one is the largest
            image of the page and is fetched eagerly. */}
        {multiple ? (
          <Image
            key={images[index]}
            src={images[index]}
            alt={`${alt} (${index + 1}/${count})`}
            fill
            loading={index === 0 ? 'eager' : undefined}
            fetchPriority={index === 0 ? 'high' : undefined}
            sizes="(max-width: 896px) 100vw, 60vw"
            className="animate-fade-in object-contain"
          />
        ) : (
          // 16:9 reserves the space until the image knows its own ratio.
          <Image
            src={images[0]}
            alt={alt}
            width={1600}
            height={900}
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 896px) 100vw, 60vw"
            className="block h-auto w-full"
          />
        )}
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={t.gallery_enlarge}
          className="group absolute inset-0 z-10 cursor-zoom-in"
        >
          <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <ZoomIn className="h-4 w-4" />
          </span>
        </button>

        {multiple && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t.gallery_prev} className={cn(CONTROL, 'left-3')}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t.gallery_next} className={cn(CONTROL, 'right-3')}>
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-3 z-20 rounded-sm border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-0.5 text-label font-semibold tabular-nums text-[var(--color-foreground)]">
              {index + 1} / {count}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails instead of dots: a dot is a 6 px target, a thumbnail
          shows where it leads. Hidden in a narrow column, where they would
          push price and cart button out of the first screen; arrows, swipe
          and the counter remain there. */}
      {multiple && (
        <ul className="mt-3 hidden flex-wrap gap-2 @min-[36rem]:flex">
          {images.map((url, i) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t.gallery_goto.replace('{n}', String(i + 1))}
                aria-current={i === index}
                className={cn(
                  'relative block aspect-[16/10] w-[clamp(4.5rem,3.5rem+2vw,6.5rem)] overflow-hidden rounded-md border-2 bg-[var(--color-muted)] transition-colors',
                  i === index
                    ? 'border-[var(--color-primary)]'
                    : 'border-transparent hover:border-[var(--color-input)]',
                )}
              >
                <Image src={url} alt="" fill sizes="104px" className="object-cover object-top" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.gallery_enlarged.replace('{alt}', alt)}
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[color-mix(in_oklab,#000_88%,transparent)] p-4 md:p-10"
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label={t.detail_close}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Enlarged image — stop propagation so clicks on it don't close */}
          <div className="relative h-full w-full" onClick={e => e.stopPropagation()}>
            <Image
              src={images[index]}
              alt={multiple ? `${alt} (${index + 1}/${count})` : alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {multiple && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); go(-1) }}
                aria-label={t.gallery_prev}
                className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); go(1) }}
                aria-label={t.gallery_next}
                className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-small font-semibold tabular-nums text-white">
                {index + 1} / {count}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
