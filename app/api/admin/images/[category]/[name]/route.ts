import { NextResponse } from 'next/server'
import { adminRoute }   from '@/lib/adminApi'
import { writeAudit }   from '@/lib/adminAudit'
import { memberHasPermission } from '@/lib/adminPerms'
import {
  getAdminImage,
  updateAdminImage,
  normalizeLabel,
  normalizeTags,
  isImageStatus,
  permissionForStatusChange,
  type AdminImagePatch,
} from '@/lib/adminImages'

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic'

/** Category slugs and image names are normalized at ingest — mirror that here. */
const SLUG_RE = /^[a-z0-9_-]{1,32}$/
const NAME_RE = /^[a-z0-9_-]{1,128}$/

/**
 * Edit one image row: label, tags, visibility.
 *
 * Only those three columns. Everything else (`width`, `bytes`, `sha256`,
 * `version`) describes the file on disk, which nobody can touch from here — an
 * editable `bytes` would be a lie about the inventory, and that exact kind of
 * drift is what `image-sync-check.js` reports as a finding.
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

    if (!Object.keys(changed).length) {
      return NextResponse.json({ image: existing }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const image = await updateAdminImage(category, name, patch)

    // A moderation decision gets its own verb so the audit log reads as what it
    // is, instead of hiding among label fixes.
    const action = existing.status === 'pending' && patch.status !== undefined
      ? 'image.moderate'
      : 'image.update'
    await writeAudit(member.discordUserId, action, `${category}/${name}`, changed)

    return NextResponse.json({ image }, { headers: { 'Cache-Control': 'no-store' } })
  },
)
