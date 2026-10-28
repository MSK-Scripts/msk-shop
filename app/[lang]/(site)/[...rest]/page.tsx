import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { NotFoundContent } from '@/components/layout/NotFoundContent'
import { NOT_FOUND_HEADER } from '@/lib/lang'
import { getRequestLang } from '@/lib/serverLang'

/**
 * Catch-all below the language segment: an unknown address gets the 404 page
 * inside the shop layout of its language.
 *
 * The proxy marks an address the route table does not know with
 * `NOT_FOUND_HEADER` and answers it with the status 404 itself. This page
 * then renders the 404 content directly. It must not throw `notFound()` for
 * it: Next answers a thrown `notFound()` with an empty error shell, `<html
 * id="__next_error__">` without `lang` and without content, and renders the
 * page only in the browser.
 *
 * Without the mark (an address the table knows but no page exists for yet)
 * it falls back to `notFound()`, so the status is 404 in every case. Title
 * and robots come from the layout's `generateMetadata`.
 */
export default async function UnknownPage() {
  const h = await headers()
  if (h.get(NOT_FOUND_HEADER) !== '1') notFound()
  const { lang } = await getRequestLang()
  return <NotFoundContent lang={lang} />
}
