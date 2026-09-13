import type { Metadata } from 'next'
import { getRequestLang } from '@/lib/serverLang'
import { pageSeo } from '@/lib/pageSeo'

/**
 * The Discord callback page is a client component and cannot export
 * metadata itself, so the title hangs on the segment layout.
 *
 * No `alternates`: the page is noindex and is also listed in
 * robots.txt.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/auth/discord', lang)
  return {
    title:       seo.title,
    description: seo.description,
    robots:      { index: false, follow: false },
  }
}

export default function DiscordAuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
