import type { Metadata } from 'next'

import UploadClient from './UploadClient'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'

/**
 * Submission page for community uploads.
 *
 * `force-dynamic`, because the page depends on the submitter's session:
 * signed in, it shows the form and the user's own submissions; without
 * signing in, the Discord button. A cached intermediate state would be
 * worse here than one extra query.
 *
 * It is deliberately **not** set to noindex. The page explains what the inventory
 * needs and is therefore an entry point itself; whoever searches for "fivem prop image"
 * is exactly the person who could contribute one.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/images/upload', lang)
  return {
    title:       seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/images/upload'),
  }
}

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { lang } = await getRequestLang()
  const { error } = await searchParams

  // The OAuth return channel appends its failure reason to the address. It comes
  // from our own redirect, but it is still not displayed raw; instead it is
  // resolved in the client against the known keys.
  return <UploadClient lang={lang} initialError={typeof error === 'string' ? error : undefined} />
}
