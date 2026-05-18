import { cookies, headers } from 'next/headers'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang'

export const metadata = { title: 'Terms & Conditions — MSK Scripts' }

export default async function TermsPage() {
  const cookieStore  = await cookies()
  const headerStore  = await headers()
  const initialLang  = resolveLang(
    cookieStore.get(LANG_COOKIE_NAME)?.value,
    headerStore.get('accept-language'),
  )

  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('terms'))}
      htmlDe={renderMarkdown(getLegalContent('terms-de'))}
      breadcrumb="Terms & Conditions"
      href="/terms"
      initialLang={initialLang}
    />
  )
}
