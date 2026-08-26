import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { writeAudit }   from '@/lib/adminAudit'
import { approveUpload, getUpload, rejectUpload } from '@/lib/imageUploads'

// Writes files and database rows → never cache.
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Approve or reject one submission.
 *
 * `images.moderate` and nothing weaker. Approving is the single action in this
 * whole project that puts a file into the publicly served directory, and it is
 * deliberately the only one a human triggers by hand.
 *
 * POST rather than PATCH because this is not a field edit: it runs the image
 * pipeline, writes three files and creates an inventory row.
 */
export const POST = adminRoute<{ id: string }>('images.moderate', async ({ req, member, params }) => {
  const { id } = params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid upload id.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const decision = body?.decision

  if (decision !== 'approve' && decision !== 'reject') {
    return NextResponse.json({ error: 'Decision must be approve or reject.' }, { status: 400 })
  }

  const before = await getUpload(id)
  if (!before) return NextResponse.json({ error: 'Upload not found.' }, { status: 404 })

  if (decision === 'reject') {
    const reason = typeof body.reason === 'string' ? body.reason : ''
    // A rejection without a reason is a silent disappearance for the submitter,
    // who then has nothing to fix. Cheap to ask for, so it is required.
    if (!reason.trim()) {
      return NextResponse.json({ error: 'A reason is required.' }, { status: 400 })
    }

    const result = await rejectUpload(id, member.discordUserId, reason)
    if (!result.ok) return failureResponse(result.reason)

    await writeAudit(member.discordUserId, 'image_upload.reject', id, {
      category: before.category, name: before.name,
      submittedBy: before.submittedBy, reason: reason.trim().slice(0, 255),
    })
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const result = await approveUpload(id, member.discordUserId)
  if (!result.ok) return failureResponse(result.reason)

  await writeAudit(member.discordUserId, 'image_upload.approve', id, {
    category: before.category, name: before.name, submittedBy: before.submittedBy,
  })
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
})

function failureResponse(reason: string): NextResponse {
  switch (reason) {
    case 'not_found':
      return NextResponse.json({ error: 'Upload not found.' }, { status: 404 })
    case 'not_pending':
      return NextResponse.json({ error: 'This submission has already been decided.' }, { status: 409 })
    case 'name_taken':
      // Weeks can pass between submission and review, and a regular ingest may
      // have taken the name meanwhile. Approving anyway would overwrite a
      // maintained image.
      return NextResponse.json({ error: 'That name now exists in the inventory. Reject this one.' }, { status: 409 })
    case 'file_gone':
      return NextResponse.json({ error: 'The quarantined file is gone. Ask for a new submission.' }, { status: 410 })
    default:
      return NextResponse.json({ error: 'Decision failed.' }, { status: 500 })
  }
}
