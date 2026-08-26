import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { adminImageStats } from '@/lib/adminImages'

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
 */
export const GET = adminRoute(['images.view', 'images.manage', 'images.moderate'], async () => {
  const stats = await adminImageStats()
  return NextResponse.json({ stats }, { headers: { 'Cache-Control': 'no-store' } })
})
