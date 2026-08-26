import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { runSyncCheck } from '@/lib/imageSyncCheck'

// Reads the live filesystem → never cache.
export const dynamic = 'force-dynamic'

/**
 * Compare the CDN directory against `msk_images` and report the mismatches.
 *
 * GET even though it does real work: it is strictly read-only, and the
 * expensive part (a `stat` per row) is deliberately left to the CLI script.
 * Here it is one `readdir` per category — six calls for the whole inventory.
 *
 * Runs only on an explicit click, never on tab mount. There is no reason to
 * touch the filesystem just because someone opened the images tab.
 */
export const GET = adminRoute(['images.view', 'images.manage', 'images.moderate'], async () => {
  const report = await runSyncCheck()
  return NextResponse.json({ report }, { headers: { 'Cache-Control': 'no-store' } })
})
