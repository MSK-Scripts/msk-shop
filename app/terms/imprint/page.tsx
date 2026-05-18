import { cookies, headers } from 'next/headers'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang'

export const metadata = { title: 'Imprint — MSK Scripts' }

export default async function ImprintPage() {
  const cookieStore  = await cookies()
  const headerStore  = await headers()
  const initialLang  = resolveLang(
    cookieStore.get(LANG_COOKIE_NAME)?.value,
    headerStore.get('accept-language'),
  )

  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('imprint'))}
      htmlDe={renderMarkdown(getLegalContent('imprint-de'))}
      breadcrumb="Imprint"
      href="/terms/imprint"
      initialLang={initialLang}
    />
  )
}
