import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { loadResourceStats } from '@/lib/fivestats'
import ResourcesClient       from './ResourcesClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return {
  title:       'Resource Statistics',
  alternates:  alternatesFor(lang, '/resources'),
  description: 'Live adoption statistics of MSK Scripts FiveM resources across all servers, powered by fivestats.io.',
}
}

export default async function ResourcesPage() {
  const stats = await loadResourceStats()
  return <ResourcesClient stats={stats} />
}
