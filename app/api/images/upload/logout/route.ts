import { NextResponse } from 'next/server'
import { UPLOAD_SESSION_COOKIE } from '@/lib/uploadSession'

export const dynamic = 'force-dynamic'

/** Drop the upload session cookie. POST only, so a link cannot log someone out. */
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(UPLOAD_SESSION_COOKIE)
  return res
}
