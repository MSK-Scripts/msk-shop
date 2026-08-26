import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { readQuarantine } from '@/lib/imageUploads'

// Reads a quarantined file → never cache.
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Show a quarantined submission to a moderator.
 *
 * A pending file lies outside every DocumentRoot, so there is no URL that
 * serves it — which is the point. Without this route a moderator would have to
 * decide about an image they cannot see, and that is not moderation.
 *
 * Three things keep it boring: the id must be a UUID, so nothing composes a
 * path; the bytes were produced by sharp at upload time, so this is a real PNG
 * and not whatever the submitter sent; and `nosniff` plus a fixed Content-Type
 * mean the browser will not reinterpret it.
 */
export const GET = adminRoute<{ id: string }>(
  ['images.view', 'images.manage', 'images.moderate'],
  async ({ params }) => {
    const { id } = params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid upload id.' }, { status: 400 })
    }

    const file = await readQuarantine(id)
    if (!file) {
      return NextResponse.json({ error: 'No quarantined file for this upload.' }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type':           'image/png',
        'Content-Disposition':    'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control':          'no-store',
      },
    })
  },
)
