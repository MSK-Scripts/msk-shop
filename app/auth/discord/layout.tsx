import type { Metadata } from 'next'
import { getRequestLang } from '@/lib/serverLang'
import { pageSeo } from '@/lib/pageSeo'

/**
 * Die Discord-Callback-Seite ist eine Client-Komponente und kann selbst keine
 * Metadaten exportieren, deshalb hängt der Titel am Segment-Layout.
 *
 * Kein `alternates`: die Seite ist noindex und steht zusätzlich in der
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
