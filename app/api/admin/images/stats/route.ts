import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { adminImageStats } from '@/lib/adminImages'
import { countPendingUploads } from '@/lib/imageUploads'

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic'

/**
 * Per-category figures: how much there is, how much is hidden, how much is
 * waiting for review, and how much still has no label or no tags.
 *
 * The last two are the point of this endpoint. A missing label is invisible in
 * the gallery — the tile still renders, it just cannot be found by the name a
 * player would actually type. Nothing surfaces that except a counter.
 *
 * Non-public categories are included (`brand` is `is_public = 0`): they are
 * served from the CDN like every other image and belong in the inventory.
 *
 * `uploadQueue` comes from a different table on purpose. A community
 * submission lives in `msk_image_uploads` and never touches `msk_images`
 * until it is approved, so the per-category `pending` count above can never
 * see it. The tile that says "community uploads" was reading that count and
 * therefore sat at 0 while a submission was in fact waiting in the Uploads
 * tab — the one number on this screen that must not be wrong, because nobody
 * goes looking for a queue a counter says is empty.
 */
export const GET = adminRoute(['images.view', 'images.manage', 'images.moderate'], async () => {
  const [categories, uploadQueue] = await Promise.all([
    adminImageStats(),
    countPendingUploads(),
  ])

  return NextResponse.json(
    { figures: { categories, uploadQueue } },
    { headers: { 'Cache-Control': 'no-store' } },
  )
})
