import type { Metadata } from 'next'
import { getRequestLang } from '@/lib/serverLang'
import { pageSeo } from '@/lib/pageSeo'

/**
 * Der Warenkorb ist eine Client-Komponente und kann selbst keine Metadaten
 * exportieren. Deshalb hängt der Titel hier am Segment-Layout.
 *
 * Kein `alternates`: die Seite ist noindex und steht zusätzlich in der
 * robots.txt, ein Canonical oder hreflang darauf wäre ein Signal für etwas,
 * das gar nicht in den Index soll.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/cart', lang)
  return {
    title:       seo.title,
    description: seo.description,
    robots:      { index: false, follow: false },
  }
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
