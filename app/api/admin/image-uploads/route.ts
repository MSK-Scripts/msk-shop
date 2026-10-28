import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { maskPersonalData } from '@/lib/adminMask'
import { listUploads, type UploadStatus } from '@/lib/imageUploads'

// Session-dependent → never cache.
export const dynamic = 'force-dynamic'

const STATUSES: Array<UploadStatus | 'all'> = ['pending', 'approved', 'rejected', 'all']

/**
 * The moderation queue.
 *
 * Readable by anyone who may view images; acting on an entry needs
 * `images.moderate`, which the decision route enforces. Splitting it that way
 * means a person who only maintains labels can still see what is coming in
 * without being able to wave it through.
 */
export const GET = adminRoute(['images.view', 'images.manage', 'images.moderate'], async ({ req }) => {
  const raw = req.nextUrl.searchParams.get('status')
  const status = (STATUSES as string[]).includes(raw ?? '') ? (raw as UploadStatus | 'all') : 'pending'

  // The submitter's note is free text; an address in it leaves masked.
  const uploads = await listUploads(status)
  return NextResponse.json({ uploads: maskPersonalData(uploads) }, { headers: { 'Cache-Control': 'no-store' } })
})
