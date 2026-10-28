import { NotFoundContent } from '@/components/layout/NotFoundContent'
import { getRequestLang } from '@/lib/serverLang'

/**
 * Shown when a page calls `notFound()`, an unknown package id for example.
 *
 * Next answers such a call with an empty error shell and renders this page
 * in the browser only. Unknown addresses do not come this way: the proxy
 * marks them and the catch-all renders `NotFoundContent` on the server (see
 * `app/[lang]/[...rest]/page.tsx`).
 */
export default async function NotFound() {
  const { lang } = await getRequestLang()
  return <NotFoundContent lang={lang} />
}
