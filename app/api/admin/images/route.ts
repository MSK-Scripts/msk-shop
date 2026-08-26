import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { listAdminImages, isAdminImageFilter } from '@/lib/adminImages'
import { DEFAULT_PER_PAGE } from '@/lib/images'

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic'

/**
 * The image inventory, including hidden and pending rows.
 *
 * Deliberately NOT the public `/api/images`: that one hard-filters
 * `status = 'published'`, which is exactly the guarantee the gallery rests on.
 * The two share their search clause (`searchClause` in lib/images.ts) so an
 * admin looking for an image finds what a visitor finds — this is the screen
 * where labels and tags get fixed, and searching differently here would mean
 * fixing the wrong thing.
 *
 * Visible to anyone who may view, manage or moderate images
 * (adminRoute array = "any of these").
 */
export const GET = adminRoute(['images.view', 'images.manage', 'images.moderate'], async ({ req }) => {
  const sp = req.nextUrl.searchParams

  const filterRaw = sp.get('filter')
  const result = await listAdminImages({
    category: sp.get('category')?.trim() || undefined,
    q:        sp.get('q') ?? undefined,
    filter:   isAdminImageFilter(filterRaw) ? filterRaw : 'all',
    page:     Number(sp.get('page') ?? 1),
    per:      Number(sp.get('per') ?? DEFAULT_PER_PAGE),
  })

  return NextResponse.json({ result }, { headers: { 'Cache-Control': 'no-store' } })
})
