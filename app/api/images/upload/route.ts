import { NextResponse, type NextRequest } from 'next/server'

import {
  MAX_UPLOAD_BYTES,
  UPLOADS_PER_DAY,
  listUploadsBySubmitter,
  recentUploadCount,
  submitUpload,
  uploadCategories,
} from '@/lib/imageUploads'
import { parseUploadSession, UPLOAD_SESSION_COOKIE } from '@/lib/uploadSession'
import { isLang, DEFAULT_LANG } from '@/lib/lang'

// Session-dependent and writes files → never cache.
export const dynamic = 'force-dynamic'

/**
 * The state of the upload form: who is signed in, which categories accept
 * submissions, and what this person has submitted so far.
 *
 * The own-submissions list is not decoration. Without it a rejection is a
 * silent disappearance, and the submitter has no way to learn why — which is
 * exactly how a contributor stops contributing.
 */
export async function GET(req: NextRequest) {
  const session = parseUploadSession(req.cookies.get(UPLOAD_SESSION_COOKIE)?.value)
  const langRaw = req.nextUrl.searchParams.get('lang')
  const lang    = isLang(langRaw) ? langRaw : DEFAULT_LANG

  const categories = await uploadCategories(lang)

  if (!session) {
    return NextResponse.json(
      { state: { signedIn: false, categories, limits: { maxBytes: MAX_UPLOAD_BYTES, perDay: UPLOADS_PER_DAY } } },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const [mine, usedToday] = await Promise.all([
    listUploadsBySubmitter(session.discordUserId),
    recentUploadCount(session.discordUserId),
  ])

  return NextResponse.json({
    state: {
      signedIn:    true,
      displayName: session.displayName,
      categories,
      limits:      { maxBytes: MAX_UPLOAD_BYTES, perDay: UPLOADS_PER_DAY, usedToday },
      mine,
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Accept one submission.
 *
 * Everything this handler does with the request is bounded before the file is
 * touched: the proxy rejects an oversized Content-Length, the session must
 * exist, and `submitUpload` runs the cheap checks before it lets sharp near
 * foreign bytes.
 *
 * The Origin check mirrors `adminRoute`: browsers always send Origin on POST,
 * and a cross-site attacker cannot forge it. A missing Origin is allowed (a
 * same-origin server call), the SameSite=Lax cookie covers that case.
 */
export async function POST(req: NextRequest) {
  const session = parseUploadSession(req.cookies.get(UPLOAD_SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ error: 'not_signed_in' }, { status: 401 })
  }

  const origin  = req.headers.get('origin')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de'
  if (origin && origin !== baseUrl) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const declared = Number(req.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'file_unreadable' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file_missing' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
  }

  const str = (key: string) => {
    const v = form.get(key)
    return typeof v === 'string' ? v : ''
  }

  const result = await submitUpload({
    category:      str('category'),
    rawName:       str('name'),
    label:         str('label'),
    tags:          str('tags'),
    note:          str('note'),
    licenseOk:     str('license') === 'true',
    // Only ever shown to a moderator, never used to build a path.
    fileName:      file.name || null,
    file:          Buffer.from(await file.arrayBuffer()),
    submittedBy:   session.discordUserId,
    submittedName: session.displayName,
  })

  if (!result.ok) {
    // 429 for the daily cap, 400 for everything the submitter can fix by
    // changing the form. Both carry the machine-readable reason so the client
    // can show a translated sentence instead of an English server string.
    const status = result.reason === 'rate_limited' ? 429
      : result.reason === 'file_too_large' ? 413
      : 400
    return NextResponse.json({ error: result.reason }, { status })
  }

  return NextResponse.json({ upload: result.upload }, { headers: { 'Cache-Control': 'no-store' } })
}
