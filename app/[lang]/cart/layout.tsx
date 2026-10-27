import type { Metadata } from 'next'
import { getRequestLang } from '@/lib/serverLang'
import { pageSeo } from '@/lib/pageSeo'

/**
 * The cart is a client component and cannot export metadata itself.
 * That is why the title hangs on the segment layout here.
 *
 * No `alternates`: the page is noindex and is also listed in robots.txt;
 * a canonical or hreflang on it would be a signal for something that is
 * not meant to be in the index at all.
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
