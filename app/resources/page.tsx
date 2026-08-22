import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { loadResourceStats } from '@/lib/fivestats'
import ResourcesClient       from './ResourcesClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/resources', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/resources'),
  }
}

export default async function ResourcesPage() {
  const stats = await loadResourceStats()
  return <ResourcesClient stats={stats} />
}
