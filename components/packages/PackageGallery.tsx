'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TebexPackage } from '@/types/tebex'

interface PackageGalleryProps {
  /** Tebex `media` array — may contain several images. */
  media?: TebexPackage['media']
  /** Fallback single image (Tebex `image`) when `media` is empty. */
  image?: string
  /** Alt text / placeholder source (usually the package name). */
  alt: string
  /** Optional overlay rendered on top of the current slide (e.g. badges). */
  overlay?: React.ReactNode
  className?: string
}

/**
 * Build an ordered, de-duplicated list of image URLs from the Tebex media
 * array: the primary image comes first, the remaining images follow in their
 * original order. Falls back to the single `image` field if no media exists.
 */
function resolveImages(media: PackageGalleryProps['media'], image?: string): string[] {
  const urls: string[] = []
  const push = (u?: string | null) => {
    if (u && !urls.includes(u)) urls.push(u)
  }

  const imageMedia = (media ?? []).filter(m => m.type === 'image' && m.url)
  imageMedia.filter(m => m.primary).forEach(m => push(m.url))
  imageMedia.filter(m => !m.primary).forEach(m => push(m.url))

  if (urls.length === 0) push(image)
  return urls
}

const FRAME = 'relative h-64 overflow-hidden bg-gradient-to-br from-[color-mix(in_oklab,var(--color-primary)_8%,var(--color-card))] to-[color-mix(in_oklab,var(--color-primary)_2%,var(--color-card))] md:h-80'

export function PackageGallery({ media, image, alt, overlay, className }: PackageGalleryProps) {
  const images = resolveImages(media, image)
  const count = images.length
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  // Keep the index valid if the image set ever changes.
  useEffect(() => {
    if (index > count - 1) setIndex(0)
  }, [count, index])

  const go = useCallback(
    (dir: number) => setIndex(i => (i + dir + count) % count),
    [count],
  )

  // ── No image → placeholder ────────────────────────────────────────────────
  if (count === 0) {
    return (
      <div className={cn(FRAME, className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl font-semibold tracking-wider text-[color-mix(in_oklab,var(--color-foreground)_18%,transparent)]">
            {alt.toLowerCase().replace(/\s+/g, '_')}
          </span>
        </div>
        {overlay}
      </div>
    )
  }

  const multiple = count > 1

  return (
    <div
      className={cn(FRAME, className)}
      role={multiple ? 'group' : undefined}
      aria-roledescription={multiple ? 'carousel' : undefined}
      aria-label={multiple ? `${alt} — image gallery` : undefined}
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
      {/* Slides — only the active one is rendered; cross-faded via key */}
      <Image
        key={images[index]}
        src={images[index]}
        alt={multiple ? `${alt} (${index + 1}/${count})` : alt}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 66vw"
        className="animate-fade-in object-cover"
      />

      {multiple && (
        <>
          {/* Prev / Next */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-background)_70%,transparent)] text-[var(--color-foreground)] backdrop-blur-sm transition-colors hover:bg-[var(--color-background)]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-background)_70%,transparent)] text-[var(--color-foreground)] backdrop-blur-sm transition-colors hover:bg-[var(--color-background)]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Counter — top right */}
          <div className="absolute right-3 top-3 z-20 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-background)_70%,transparent)] px-2 py-0.5 font-mono text-[0.625rem] font-bold tabular-nums text-[var(--color-foreground)] backdrop-blur-sm">
            {index + 1} / {count}
          </div>

          {/* Dots — bottom center */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index
                    ? 'w-5 bg-[var(--color-primary)]'
                    : 'w-1.5 bg-[color-mix(in_oklab,var(--color-foreground)_35%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-foreground)_55%,transparent)]',
                )}
              />
            ))}
          </div>
        </>
      )}

      {overlay}
    </div>
  )
}
