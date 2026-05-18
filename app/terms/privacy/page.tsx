import { cookies, headers } from 'next/headers'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang'

export const metadata = { title: 'Privacy Policy — MSK Scripts' }

export default async function PrivacyPage() {
  const cookieStore  = await cookies()
  const headerStore  = await headers()
  const initialLang  = resolveLang(
    cookieStore.get(LANG_COOKIE_NAME)?.value,
    headerStore.get('accept-language'),
  )

  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('privacy'))}
      htmlDe={renderMarkdown(getLegalContent('privacy-de'))}
      breadcrumb="Privacy Policy"
      href="/terms/privacy"
      initialLang={initialLang}
    />
  )
}
