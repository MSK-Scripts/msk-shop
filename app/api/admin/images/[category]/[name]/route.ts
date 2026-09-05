import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { writeAudit }   from '@/lib/adminAudit'
import { memberHasPermission } from '@/lib/adminPerms'
import {
  getAdminImage,
  updateAdminImage,
  moveAdminImage,
  deleteAdminImage,
  normalizeLabel,
  normalizeTags,
  isImageStatus,
  permissionForStatusChange,
  type AdminImage,
  type AdminImagePatch,
  type MoveFailure,
} from '@/lib/adminImages'

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic'

/** Category slugs and image names are normalized at ingest — mirror that here. */
const SLUG_RE = /^[a-z0-9_-]{1,32}$/
const NAME_RE = /^[a-z0-9_-]{1,128}$/

/**
 * Edit one image row: label, tags, visibility, and the category it sits in.
 *
 * The first three are columns. Everything else that describes the file on disk
 * (`width`, `bytes`, `sha256`, `version`) stays read-only — an editable `bytes`
 * would be a lie about the inventory, and that exact kind of drift is what
 * `image-sync-check.js` reports as a finding.
 *
 * `category` is the odd one out: it is a column AND the directory the three
 * files live in, so changing it moves them and changes the public URL. It needs
 * `images.manage` like any other maintenance, but the UI warns before saving,
 * because a stale link in somebody's script is not something we can fix later.
 *
 * Two permissions, not one. Label and tags are maintenance on our own
 * inventory (`images.manage`). Resolving a `pending` row is a moderation
 * decision about somebody else's material (`images.moderate`), and it is the
 * row's CURRENT status that decides which of the two applies — see
 * `permissionForStatusChange`. Without that split, anyone who may fix a typo
 * could also wave a community upload through.
 */
export const PATCH = adminRoute<{ category: string; name: string }>(
  ['images.manage', 'images.moderate'],
  async ({ req, member, params }) => {
    const { category, name } = params
    if (!SLUG_RE.test(category) || !NAME_RE.test(name)) {
      return NextResponse.json({ error: 'Invalid image reference.' }, { status: 400 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })
    }

    const existing = await getAdminImage(category, name)
    if (!existing) {
      return NextResponse.json({ error: 'Image not found.' }, { status: 404 })
    }

    const patch:   AdminImagePatch          = {}
    const changed: Record<string, unknown>  = {}

    let target = existing.category
    if ('category' in body) {
      if (typeof body.category !== 'string' || !SLUG_RE.test(body.category)) {
        return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
      }
      target = body.category
    }
    const moving = target !== existing.category

    if ('label' in body) {
      if (typeof body.label !== 'string') {
        return NextResponse.json({ error: 'Label must be a string.' }, { status: 400 })
      }
      const label = normalizeLabel(body.label)
      if (label !== existing.label) {
        patch.label = label
        changed.label = { from: existing.label, to: label }
      }
    }

    if ('tags' in body) {
      if (typeof body.tags !== 'string') {
        return NextResponse.json({ error: 'Tags must be a comma separated string.' }, { status: 400 })
      }
      const tags = normalizeTags(body.tags)
      const before = existing.tags.length ? existing.tags.join(',') : null
      if (tags !== before) {
        patch.tags = tags
        changed.tags = { from: before, to: tags }
      }
    }

    if ('status' in body) {
      if (!isImageStatus(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
      if (body.status !== existing.status) {
        patch.status = body.status
        changed.status = { from: existing.status, to: body.status }
      }
    }

    // Field-level permission check. The route-level gate above only proves the
    // member has one of the two rights; which one they need depends on what
    // they are actually changing.
    if ((patch.label !== undefined || patch.tags !== undefined)
        && !memberHasPermission(member, 'images.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (patch.status !== undefined
        && !memberHasPermission(member, permissionForStatusChange(existing.status))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (moving && !memberHasPermission(member, 'images.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!Object.keys(changed).length && !moving) {
      return NextResponse.json({ image: existing }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // The move runs first, so the column patch below lands on the row at its
    // new address. The other order would write label and tags and then fail on
    // a name collision, leaving a half-applied edit behind.
    let current: AdminImage = existing
    if (moving) {
      const moved = await moveAdminImage(existing.category, name, target)
      if (!moved.ok) return moveFailure(moved.reason)
      current = moved.image
      changed.category = { from: existing.category, to: target }
    }

    const image = Object.keys(patch).length
      ? await updateAdminImage(current.category, name, patch)
      : current

    // A moderation decision gets its own verb so the audit log reads as what it
    // is, instead of hiding among label fixes.
    const action = existing.status === 'pending' && patch.status !== undefined
      ? 'image.moderate'
      : 'image.update'
    await writeAudit(member.discordUserId, action, `${current.category}/${name}`, changed)

    return NextResponse.json({ image }, { headers: { 'Cache-Control': 'no-store' } })
  },
)
function moveFailure(reason: MoveFailure): NextResponse {
  switch (reason) {
    case 'not_found':
      return NextResponse.json({ error: 'Image not found.' }, { status: 404 })
    case 'category_unknown':
      return NextResponse.json({ error: 'That category does not exist.' }, { status: 400 })
    case 'name_taken':
      return NextResponse.json(
        { error: 'That category already has an image with this name. Rename one of them first.' },
        { status: 409 },
      )
    case 'no_files':
      // The row points at nothing. Moving it would carry the problem into
      // another category instead of showing it, so say what it is.
      return NextResponse.json(
        { error: 'No files found for this image. Run the filesystem check before moving it.' },
        { status: 409 },
      )
    default:
      return NextResponse.json(
        { error: 'Could not move the files. The app user needs write access to CDN_ROOT_PATH.' },
        { status: 500 },
      )
  }
}

/**
 * Delete one image: the row and its three files.
 *
 * Its own permission, not `images.manage`. Hiding an image is one click away
 * from being undone; this is not undoable at all, and the file cannot come back
 * from a database backup because the row only ever described it. Somebody who
 * fixes labels should not also be able to empty the inventory a row at a time.
 *
 * A `pending` row is somebody else's submission. Deleting it here would throw
 * away the record the Uploads tab needs to tell the submitter what happened, so
 * it is refused: that queue is resolved with approve or reject.
 */
export const DELETE = adminRoute<{ category: string; name: string }>(
  'images.delete',
  async ({ member, params }) => {
    const { category, name } = params
    if (!SLUG_RE.test(category) || !NAME_RE.test(name)) {
      return NextResponse.json({ error: 'Invalid image reference.' }, { status: 400 })
    }

    const existing = await getAdminImage(category, name)
    if (!existing) {
      return NextResponse.json({ error: 'Image not found.' }, { status: 404 })
    }
    if (existing.status === 'pending') {
      return NextResponse.json(
        { error: 'Resolve this submission in the Uploads tab instead of deleting the row.' },
        { status: 409 },
      )
    }

    const result = await deleteAdminImage(category, name)
    if (!result.ok) {
      return NextResponse.json({ error: 'Image not found.' }, { status: 404 })
    }

    await writeAudit(member.discordUserId, 'image.delete', `${category}/${name}`, {
      label: existing.label, bytes: existing.bytes, source: existing.source,
      status: existing.status, filesRemoved: result.filesRemoved,
    })

    // The row is gone either way. Saying so is the point: an image removed for a
    // legal reason whose file is still being served is not deleted, and only
    // this flag sends anyone to look.
    return NextResponse.json(
      {
        ok: true,
        filesRemoved: result.filesRemoved,
        ...(result.filesRemoved
          ? {}
          : { warning: 'The row is gone, but the files could not be removed and are still served. Check CDN_ROOT_PATH.' }),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  },
)
