import { Copyright } from 'lucide-react'

import { imagesTranslations, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * The rights notice for our own brand assets.
 *
 * The gallery overview states that the depicted content belongs to Rockstar and
 * that MSK Scripts claims no rights to it. For five of the six categories that
 * is true. For `brand` it is the opposite: logos and banners are our own works,
 * and the page hands out a CDN address plus a copy button for each of them.
 * Without this box that reads as a release into the public domain.
 *
 * It therefore sits in both places where somebody has a brand image in front of
 * them: the category page and the detail page. On the listing alone it would be
 * missing exactly where the address is copied.
 *
 * Pure server component, no state, no JavaScript in the browser.
 */

/**
 * The slug of the category holding our own works.
 *
 * A constant, not a column: whether a category contains foreign game material
 * or our own work is not a maintenance setting somebody should be able to flip
 * in the dashboard. If a second in-house collection ever appears, this becomes
 * a list.
 */
export const OWN_WORK_CATEGORY = 'brand'

export function BrandNotice({ lang, className }: { lang: Lang; className?: string }) {
  const t = imagesTranslations[lang]
  // The year moves along. A frozen year in a copyright notice makes the page
  // look like nobody maintains it.
  const year = new Date().getFullYear()

  return (
    <aside
      aria-labelledby="brand-notice-heading"
      className={cn(
        'rounded-xl border border-[var(--color-warning)]/40 bg-[var(--color-card)] p-5 md:p-6',
        className ?? 'mb-8',
      )}
    >
      <h2
        id="brand-notice-heading"
        className="flex items-center gap-2 text-base font-bold tracking-tight"
      >
        <Copyright className="h-4 w-4 text-[var(--color-warning)]" aria-hidden="true" />
        {t.brand_notice_title}
      </h2>

      <div className="mt-3 space-y-2 text-sm text-[var(--color-muted-foreground)]">
        {/*
          Permission first, limit second. The notice exists to stop the images
          being taken as somebody's own, not to stop people advertising for us,
          and a wall of prohibitions reads as "do not touch" even when it is not
          meant that way.
        */}
        <p>{t.brand_notice_owner.replace('{year}', String(year))}</p>
        <p>{t.brand_notice_allowed}</p>
        <p>{t.brand_notice_limits}</p>
      </div>

      {/*
        Its own block, in the foreground colour rather than the muted one. This
        is the one line that is not a matter of degree: everything above draws a
        line around attribution, this one is an outright ban and must not read
        like the third bullet of a licence paragraph.
      */}
      <p className="mt-3 text-sm font-medium text-[var(--color-foreground)]">
        {t.brand_notice_prohibited}
      </p>

      <p className="mt-3 text-sm">
        <a
          href="mailto:info@msk-scripts.de"
          className="text-[var(--color-primary)] hover:underline"
        >
          {t.brand_notice_contact}
        </a>
      </p>
    </aside>
  )
}
